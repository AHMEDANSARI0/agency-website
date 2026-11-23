import { NextResponse } from "next/server";
import { z } from "zod";
import { db, toSafeUser } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { checkDistributedRateLimit, extractClientIp } from "@/lib/security/rate-limit";
import { readBoundedJsonBody } from "@/lib/security/request-guards";

const DUMMY_PASSWORD_HASH = hashPassword("DummyConstantTimeFallback_2026!");
const MAX_AUTH_PAYLOAD_BYTES = 16 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid staff email address.").max(160),
  password: z.string().min(1, "Password is required.").max(256),
});

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  const ip = extractClientIp(request.headers);

  const bounded = await readBoundedJsonBody(request, MAX_AUTH_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json(
      { error: bounded.error },
      { status: bounded.status, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = loginSchema.safeParse(bounded.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid credentials format." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const emailNormalized = parsed.data.email.toLowerCase();
  const rate = await checkDistributedRateLimit(
    `admin_login:${ip}:${emailNormalized}`,
    6,
    15 * 60 * 1000
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many sign-in attempts. Please wait ${rate.retryAfterSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    const userCount = await db.countUsers();
    if (userCount === 0) {
      return NextResponse.json(
        {
          error:
            "Initial administrator setup has not been completed yet. Complete one-time setup at /admin/setup.",
          setupRequired: true,
        },
        { status: 403 }
      );
    }

    const user = await db.findUserByEmail(emailNormalized);
    const candidateHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordValid = verifyPassword(parsed.data.password, candidateHash);

    if (!user || !passwordValid || !user.isActive) {
      await db.recordAuditLog({
        actorId: user?.id || "anonymous",
        actorEmail: emailNormalized,
        actorRole: user?.role || "AUTHOR",
        action: "auth.login_failed",
        entityType: "auth",
        summary:
          user && !user.isActive
            ? `Blocked sign-in attempt for deactivated account (${emailNormalized}).`
            : `Failed sign-in attempt for ${emailNormalized}.`,
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: "Invalid email or password, or this account is inactive." },
        { status: 401 }
      );
    }

    await db.recordUserLogin(user.id);
    const safeUser = toSafeUser({
      ...user,
      lastLoginAt: new Date().toISOString(),
    });
    const token = createSessionToken(safeUser);

    await db.recordAuditLog({
      actorId: safeUser.id,
      actorEmail: safeUser.email,
      actorRole: safeUser.role,
      action: "auth.login_success",
      entityType: "auth",
      entityId: safeUser.id,
      summary: safeUser.mustChangePassword
        ? `Staff user ${safeUser.name} (${safeUser.role}) signed in — forced first-login password replacement active.`
        : `Staff user ${safeUser.name} (${safeUser.role}) signed in.`,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      ok: true,
      user: safeUser,
      mustChangePassword: safeUser.mustChangePassword,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Authentication service encountered an unexpected error." },
      { status: 500 }
    );
  }
}
