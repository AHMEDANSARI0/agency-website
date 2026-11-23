import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";

const rolePolicySchema = z
  .object({
    editorCanPublish: z.boolean(),
    editorCanManageTheme: z.boolean(),
  })
  .strict();

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAuth(request, "users:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = rolePolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role policy configuration." },
      { status: 400 }
    );
  }

  const nextSettings = await db.saveSiteSettings({
    ...auth.settings,
    rolePolicies: parsed.data,
  });

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "role_policy.updated",
    entityType: "role_policy",
    summary: `Updated Editor permissions: editorCanPublish=${parsed.data.editorCanPublish}, editorCanManageTheme=${parsed.data.editorCanManageTheme}.`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    ok: true,
    rolePolicies: nextSettings.rolePolicies,
  });
}
