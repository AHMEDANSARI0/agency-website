import { NextResponse } from "next/server";
import { z } from "zod";
import type { UserRole } from "@/types/auth";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const ROLES: [UserRole, ...UserRole[]] = ["SUPER_ADMIN", "EDITOR", "AUTHOR"];

const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Full name is required.").max(100),
    email: z.string().trim().email("Valid staff email is required.").max(160),
    role: z.enum(ROLES),
    password: z.string().min(10).max(128),
  })
  .strict();

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "users:manage");
  if (!auth.ok) return auth.response;

  const users = await db.listUsers();
  return NextResponse.json({
    users,
    rolePolicies: auth.settings.rolePolicies,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "users:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid user account payload." },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(parsed.data.password);
  if (!strength.valid) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  const cleanName = sanitizePlainText(parsed.data.name, 100);
  if (cleanName.length < 2) {
    return NextResponse.json({ error: "Full name is invalid." }, { status: 400 });
  }

  try {
    const created = await db.createUser({
      name: cleanName,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      passwordHash: hashPassword(parsed.data.password),
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "user.created",
      entityType: "user",
      entityId: created.id,
      summary: `Provisioned staff account ${created.email} with role ${created.role}.`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create user.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
