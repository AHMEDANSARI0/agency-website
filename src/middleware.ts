import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "omniflow_session";
const PUBLIC_ADMIN_PREFIXES = ["/admin/login", "/admin/setup", "/admin/recover"];

const BUILTIN_ROUTE_ALIASES: Record<string, string> = {
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/our-work": "/work",
  "/insights": "/blog",
  "/pricing-plans": "/pricing",
};

interface CachedEdgeRedirect {
  destinationPath: string;
  permanent: boolean;
}

let edgeRedirectCache: {
  expiresAt: number;
  map: Map<string, CachedEdgeRedirect>;
} | null = null;

function normalizeRedirectPath(pathname: string): string {
  const trimmed = pathname.trim().replace(/\/+$/, "");
  return (trimmed || "/").toLowerCase();
}

async function lookupCachedRedirect(
  origin: string,
  pathname: string
): Promise<CachedEdgeRedirect | null> {
  if (
    pathname === "/" ||
    Boolean(process.env.VITEST) ||
    process.env.NODE_ENV === "test"
  ) {
    return null;
  }

  const now = Date.now();
  if (!edgeRedirectCache || now >= edgeRedirectCache.expiresAt) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 600);
      const res = await fetch(`${origin}/api/redirects`, {
        signal: controller.signal,
        headers: { "x-omniflow-edge-internal": "1" },
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as {
          rules?: Array<{
            sourcePath: string;
            destinationPath: string;
            permanent: boolean;
          }>;
        };
        const nextMap = new Map<string, CachedEdgeRedirect>();
        for (const rule of data.rules || []) {
          nextMap.set(normalizeRedirectPath(rule.sourcePath), {
            destinationPath: rule.destinationPath,
            permanent: Boolean(rule.permanent),
          });
        }
        edgeRedirectCache = {
          expiresAt: now + 60_000,
          map: nextMap,
        };
      }
    } catch {
      edgeRedirectCache = {
        expiresAt: now + 15_000,
        map: edgeRedirectCache?.map ?? new Map(),
      };
    }
  }

  return edgeRedirectCache?.map.get(normalizeRedirectPath(pathname)) ?? null;
}

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

    const customRule = await lookupCachedRedirect(
      request.nextUrl.origin,
      pathname
    );
    if (customRule) {
      const targetUrl = /^https?:\/\//i.test(customRule.destinationPath)
        ? customRule.destinationPath
        : new URL(customRule.destinationPath, request.url);
      return NextResponse.redirect(
        targetUrl,
        customRule.permanent ? 308 : 307
      );
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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|uploads/|api/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|woff2?|ttf|txt|xml|webmanifest)$).*)",
  ],
};
