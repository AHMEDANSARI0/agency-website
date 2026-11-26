import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { lookupEdgeRedirect, normalizeRedirectPath } from "@/lib/security/edge-redirect-cache";
import { canonicalHostDestination } from "@/lib/security/canonical-host";
import { safeRedirectDestination } from "@/lib/security/redirect-safety";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
const PUBLIC_ADMIN_PREFIXES = ["/admin/login", "/admin/setup", "/admin/recover"];

const BUILTIN_ROUTE_ALIASES: Record<string, string> = {
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/our-work": "/case-studies",
  // Redirect before React starts streaming so the response is an actual 308.
  "/work": "/case-studies",
  "/insights": "/blog",
  "/pricing-plans": "/pricing",
};

function isPlaceholderSecret(value: string): boolean {
  if (!value) return true;
  return (
    value.startsWith("replace-with-") ||
    value.startsWith("replace_") ||
    value.includes("changeme") ||
    value.includes("example")
  );
}

function getEdgeSigningSecret(): string | null {
  const envSecret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "";

  if (envSecret.length >= 32 && !isPlaceholderSecret(envSecret)) {
    return envSecret;
  }

  const strictProd =
    process.env.OMNIFLOW_STRICT_PRODUCTION === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.OMNIFLOW_ALLOW_LOCAL_DEV_DB !== "true");

  if (strictProd) {
    return null;
  }

  return "dev-only-omniflow-ephemeral-secret-key-do-not-use-in-prod-2026";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hasValidEdgeAdminSession(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, providedSignature] = parts;
  if (!encodedPayload || !providedSignature) return false;

  const secret = getEdgeSigningSecret();
  if (!secret) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(encodedPayload)
    );
    const expectedSignature = bytesToBase64Url(new Uint8Array(sigBuf));
    if (!constantTimeStringEqual(providedSignature, expectedSignature)) {
      return false;
    }

    const parsed = JSON.parse(base64UrlToUtf8(encodedPayload)) as {
      userId?: unknown;
      role?: unknown;
      expiresAt?: unknown;
    };
    if (
      typeof parsed.userId !== "string" ||
      !parsed.userId ||
      typeof parsed.role !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isProtectedAdminPath(pathname: string): boolean {
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return false;
  }
  return !PUBLIC_ADMIN_PREFIXES.some(
    (pub) => pathname === pub || pathname.startsWith(`${pub}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const canonical = canonicalHostDestination(
    request.nextUrl,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV === "production" && process.env.OMNIFLOW_CANONICAL_REDIRECT === "true",
    process.env.VERCEL_ENV,
    request.headers.get("host")
  );
  if (canonical) {
    const response = NextResponse.redirect(canonical, 308);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isProtectedAdminPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const valid = await hasValidEdgeAdminSession(token);
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      const redirectResponse = NextResponse.redirect(loginUrl, { status: 307 });
      redirectResponse.headers.set("Cache-Control", "no-store, max-age=0");
      redirectResponse.headers.set(
        "X-Robots-Tag",
        "noindex, nofollow, noarchive"
      );
      return redirectResponse;
    }
  }

  // Fast Edge redirect handling (moves redirect lookup completely out of RSC layout render)
  if (!isAdminRoute && pathname !== "/") {
    const normalizedPath = normalizeRedirectPath(pathname);
    const aliasDest = BUILTIN_ROUTE_ALIASES[normalizedPath];
    if (aliasDest) {
      return NextResponse.redirect(new URL(aliasDest, request.url), 308);
    }

    const customRule = Boolean(process.env.VITEST) || process.env.NODE_ENV === "test"
      ? null
      : await lookupEdgeRedirect(request.nextUrl.origin, pathname);
    const safeDestination = customRule ? safeRedirectDestination(customRule.destinationPath) : null;
    if (customRule && safeDestination) {
      const redirect = NextResponse.redirect(
        new URL(safeDestination, request.url),
        customRule.permanent ? 308 : 307
      );
      // Do not create new browser/CDN caches of editable redirect responses.
      redirect.headers.set("Cache-Control", "no-store, max-age=0");
      return redirect;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-omniflow-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isAdminRoute) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  // One-time automatic browser HTTP cache purge in local `next dev` to evict any
  // previously `immutable`-cached `/_next/static/chunks/*` dev bundles on localhost.
  if (
    process.env.NODE_ENV === "development" &&
    request.cookies.get("of_dev_cache_v9")?.value !== "1"
  ) {
    response.headers.set("Clear-Site-Data", '"cache"');
    response.cookies.set("of_dev_cache_v9", "1", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|uploads/|api/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|woff2?|ttf|txt|xml|webmanifest)$).*)",
  ],
};
