import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { PermissionAction, SafeUser } from "@/types/auth";
import type { SiteSettings } from "@/types/content";
import { db, toSafeUser } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { checkDistributedRateLimit } from "@/lib/security/rate-limit";
import { hasPermission } from "./rbac";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export function extractSessionTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const rawPair of pairs) {
    const eqIdx = rawPair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = rawPair.slice(0, eqIdx).trim();
    if (key === SESSION_COOKIE_NAME) {
      return decodeURIComponent(rawPair.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

export async function resolveAdminUserFromToken(
  token: string | undefined | null
): Promise<SafeUser | null> {
  const session = verifySessionToken(token);
  if (!session) return null;

  // Verify against live DB record so deactivated accounts, role changes, and revoked sessionVersions take effect immediately
  const liveUser = await db.findUserById(session.userId);
  if (!liveUser || !liveUser.isActive) {
    return null;
  }

  const liveVersion = liveUser.sessionVersion ?? 1;
  if (session.sessionVersion !== liveVersion) {
    return null;
  }

  return toSafeUser(liveUser);
}

export async function getCurrentAdminUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return resolveAdminUserFromToken(token);
}

export async function requireAdminPageAuth(
  requiredAction?: PermissionAction,
  options?: { allowUnchangedBootstrapPassword?: boolean }
): Promise<{
  user: SafeUser;
  settings: SiteSettings;
  allowed: boolean;
}> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.mustChangePassword && !options?.allowUnchangedBootstrapPassword) {
    redirect("/admin/account?forcePasswordChange=1");
  }
  const settings = await db.getSiteSettings();
  const allowed = requiredAction
    ? hasPermission(user.role, requiredAction, settings.rolePolicies)
    : true;

  return { user, settings, allowed };
}

export type ApiAuthResult =
  | {
      ok: true;
      user: SafeUser;
      settings: SiteSettings;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminApiAuth(
  request: Request,
  requiredAction?: PermissionAction,
  options?: { allowWhenPasswordChangeRequired?: boolean }
): Promise<ApiAuthResult> {
  if (!verifySameOriginRequest(request)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Cross-origin request rejected." },
        { status: 403 }
      ),
    };
  }

  let token = extractSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
    } catch {
      token = null;
    }
  }

  try {
    const user = await resolveAdminUserFromToken(token);
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Authentication required. Please sign in to continue." },
          { status: 401 }
        ),
      };
    }

    if (user.mustChangePassword && !options?.allowWhenPasswordChangeRequired) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              "Password replacement is required before performing administrative actions.",
            code: "MUST_CHANGE_PASSWORD",
          },
          { status: 403 }
        ),
      };
    }

    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const writeRate = await checkDistributedRateLimit(
        `admin_write:${user.id}`,
        90,
        60 * 1000
      );
      if (!writeRate.allowed) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              error: `Administrative write rate limit exceeded. Please wait ${writeRate.retryAfterSeconds} seconds.`,
            },
            {
              status: 429,
              headers: { "Retry-After": String(writeRate.retryAfterSeconds) },
            }
          ),
        };
      }
    }

    const settings = await db.getSiteSettings();
    if (
      requiredAction &&
      !hasPermission(user.role, requiredAction, settings.rolePolicies)
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Insufficient role permissions for this action." },
          { status: 403 }
        ),
      };
    }

    return { ok: true, user, settings };
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: err.publicMessage, code: err.code },
          { status: 503 }
        ),
      };
    }
    throw err;
  }
}
