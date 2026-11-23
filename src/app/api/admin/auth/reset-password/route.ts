import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import {
  hashPassword,
  hashRecoveryToken,
  validatePasswordStrength,
  verifyRecoveryTokenHash,
} from "@/lib/security/password";
import { checkDistributedRateLimit, extractClientIp } from "@/lib/security/rate-limit";

const resetSchema = z
  .object({
    token: z.string().trim().min(32, "Invalid recovery token.").max(256),
    newPassword: z.string().min(10, "Password must be at least 10 characters.").max(128),
  })
  .strict();

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  const ip = extractClientIp(request.headers);
  const rate = await checkDistributedRateLimit(`admin_reset:${ip}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many reset attempts. Please wait ${rate.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid reset payload." },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(parsed.data.newPassword, {
    rejectKnownDefaults: true,
  });
  if (!strength.valid) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  try {
    const tokenHash = hashRecoveryToken(parsed.data.token);
    const user = await db.findUserByRecoveryTokenHash(tokenHash);

    if (
      !user ||
      !user.isActive ||
      !verifyRecoveryTokenHash(
        parsed.data.token,
        user.recoveryTokenHash,
        user.recoveryExpiresAt
      )
    ) {
      return NextResponse.json(
        { error: "Recovery token is invalid or has expired." },
        { status: 400 }
      );
    }

    const updated = await db.updateUser(user.id, {
      passwordHash: hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
      bumpSessionVersion: true,
      recoveryTokenHash: null,
      recoveryExpiresAt: null,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Unable to complete password reset." },
        { status: 500 }
      );
    }

    await db.recordAuditLog({
      actorId: updated.id,
      actorEmail: updated.email,
      actorRole: updated.role,
      action: "auth.password_recovered",
      entityType: "auth",
      entityId: updated.id,
      summary: `Completed password recovery for ${updated.email} and revoked all prior sessions (v${updated.sessionVersion}).`,
      ipAddress: ip,
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated and prior sessions revoked. You may now sign in.",
    });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to process password reset." },
      { status: 500 }
    );
  }
}
