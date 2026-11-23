import { NextResponse } from "next/server";
import { z } from "zod";
import { db, toSafeUser } from "@/lib/database";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limit";

const DUMMY_PASSWORD_HASH = hashPassword("DummyConstantTimeFallback_2026!");

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid staff email address.").max(160),
  password: z.string().min(1, "Password is required.").max(256),
});

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const ip = extractClientIp(request.headers);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid credentials format." },
      { status: 400 }
    );
  }

  const emailNormalized = parsed.data.email.toLowerCase();
  const rate = checkRateLimit(`admin_login:${ip}:${emailNormalized}`, 6, 15 * 60 * 1000);
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
  const safeUser = toSafeUser({ ...user, lastLoginAt: new Date().toISOString() });
  const token = createSessionToken(safeUser);

  await db.recordAuditLog({
    actorId: safeUser.id,
    actorEmail: safeUser.email,
    actorRole: safeUser.role,
    action: "auth.login_success",
    entityType: "auth",
    entityId: safeUser.id,
    summary: `Staff user ${safeUser.name} (${safeUser.role}) signed in.`,
    ipAddress: ip,
  });

  const response = NextResponse.json({
    ok: true,
    user: safeUser,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
