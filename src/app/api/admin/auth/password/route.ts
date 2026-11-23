import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { db } from "@/lib/database";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/security/password";
import { extractClientIp } from "@/lib/security/rate-limit";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required.").max(256),
    newPassword: z.string().min(10, "New password must be at least 10 characters.").max(128),
  })
  .strict();

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, undefined, {
    allowWhenPasswordChangeRequired: true,
  });
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid password payload." },
      { status: 400 }
    );
  }

  const liveUser = await db.findUserById(auth.user.id);
  if (!liveUser || !liveUser.isActive) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!verifyPassword(parsed.data.currentPassword, liveUser.passwordHash)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  if (verifyPassword(parsed.data.newPassword, liveUser.passwordHash)) {
    return NextResponse.json(
      { error: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(parsed.data.newPassword, {
    rejectKnownDefaults: true,
  });
  if (!strength.valid) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  const updated = await db.updateUser(liveUser.id, {
    passwordHash: hashPassword(parsed.data.newPassword),
    mustChangePassword: false,
    bumpSessionVersion: true,
    recoveryTokenHash: null,
    recoveryExpiresAt: null,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Unable to update password." },
      { status: 500 }
    );
  }

  await db.recordAuditLog({
    actorId: updated.id,
    actorEmail: updated.email,
    actorRole: updated.role,
    action: "auth.password_changed",
    entityType: "auth",
    entityId: updated.id,
    summary: `Staff user ${updated.email} rotated their password and invalidated older sessions (v${updated.sessionVersion}).`,
    ipAddress: extractClientIp(request.headers),
  });

  // Issue a fresh cookie bound to the incremented sessionVersion so current browser stays signed in
  const freshToken = createSessionToken(updated);
  const response = NextResponse.json({ ok: true, user: updated });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    freshToken,
    getSessionCookieOptions()
  );
  return response;
}

/**
 * DELETE /api/admin/auth/password
 * Revokes ALL active sessions for the current staff user across every browser/device
 * (or keeps current device signed in if ?keepCurrent=true).
 */
export async function DELETE(request: Request) {
  const auth = await requireAdminApiAuth(request, undefined, {
    allowWhenPasswordChangeRequired: true,
  });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const keepCurrent = url.searchParams.get("keepCurrent") === "true";

  const updated = await db.updateUser(auth.user.id, {
    bumpSessionVersion: true,
  });
  if (!updated) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await db.recordAuditLog({
    actorId: updated.id,
    actorEmail: updated.email,
    actorRole: updated.role,
    action: "auth.sessions_revoked",
    entityType: "auth",
    entityId: updated.id,
    summary: `Revoked active sessions for ${updated.email} (sessionVersion -> ${updated.sessionVersion}).`,
    ipAddress: extractClientIp(request.headers),
  });

  const response = NextResponse.json({
    ok: true,
    sessionVersion: updated.sessionVersion,
  });

  if (keepCurrent) {
    const freshToken = createSessionToken(updated);
    response.cookies.set(
      SESSION_COOKIE_NAME,
      freshToken,
      getSessionCookieOptions()
    );
  } else {
    response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  }

  return response;
}
