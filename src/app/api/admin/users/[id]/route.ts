import { NextResponse } from "next/server";
import { z } from "zod";
import type { UserRole } from "@/types/auth";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const ROLES: [UserRole, ...UserRole[]] = ["SUPER_ADMIN", "EDITOR", "AUTHOR"];

const patchUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
    newPassword: z.string().min(10).max(128).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth(request, "users:manage");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid user update payload." },
      { status: 400 }
    );
  }

  const target = await db.findUserById(id);
  if (!target) {
    return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
  }

  const payload = parsed.data;

  // Prevent self-deactivation or self-demotion from SUPER_ADMIN
  if (target.id === auth.user.id) {
    if (payload.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own active session account." },
        { status: 400 }
      );
    }
    if (payload.role && payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You cannot demote your own Super Admin account." },
        { status: 400 }
      );
    }
  }

  // Prevent removing or deactivating the last active SUPER_ADMIN
  const wouldLoseSuperAdmin =
    target.role === "SUPER_ADMIN" &&
    target.isActive &&
    (payload.isActive === false || (payload.role && payload.role !== "SUPER_ADMIN"));

  if (wouldLoseSuperAdmin) {
    const allUsers = await db.listUsers();
    const activeSuperAdmins = allUsers.filter(
      (u) => u.role === "SUPER_ADMIN" && u.isActive
    );
    if (activeSuperAdmins.length <= 1) {
      return NextResponse.json(
        { error: "At least one active Super Admin account must remain enabled." },
        { status: 400 }
      );
    }
  }

  let nextPasswordHash: string | undefined;
  if (payload.newPassword) {
    const strength = validatePasswordStrength(payload.newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }
    nextPasswordHash = hashPassword(payload.newPassword);
  }

  const cleanName =
    payload.name !== undefined ? sanitizePlainText(payload.name, 100) : undefined;

  const updated = await db.updateUser(id, {
    name: cleanName,
    role: payload.role,
    isActive: payload.isActive,
    passwordHash: nextPasswordHash,
  });

  if (!updated) {
    return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
  }

  const changes: string[] = [];
  if (payload.role && payload.role !== target.role) {
    changes.push(`role ${target.role} -> ${payload.role}`);
  }
  if (payload.isActive !== undefined && payload.isActive !== target.isActive) {
    changes.push(payload.isActive ? "reactivated account" : "deactivated account");
  }
  if (cleanName && cleanName !== target.name) {
    changes.push(`renamed to ${cleanName}`);
  }
  if (nextPasswordHash) {
    changes.push("rotated password");
  }

  if (changes.length > 0) {
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "user.updated",
      entityType: "user",
      entityId: updated.id,
      summary: `Updated staff account ${updated.email}: ${changes.join(", ")}.`,
      ipAddress: extractClientIp(request.headers),
    });
  }

  return NextResponse.json({ ok: true, user: updated });
}
