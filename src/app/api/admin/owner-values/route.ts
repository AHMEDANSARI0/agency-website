import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { db } from "@/lib/database";
import { resolveOwnerValues, validOwnerEmail, validOwnerPhoto } from "@/lib/owner-config";
import { readBoundedJsonBody } from "@/lib/security/request-guards";
import { extractClientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  contactEmail: z.string().trim().max(140).refine(validOwnerEmail, "Enter a valid public contact email."),
  priceFrom: z.string().trim().min(1).max(90).refine(v => !/[<>\u0000-\u001f\u007f]/.test(v) && !/\{\{[^}]*\}\}/.test(v), "Enter a real price and currency, not a placeholder."),
  founderPhotoUrl: z.string().trim().max(2048).refine(validOwnerPhoto, "Use an uploaded image path or HTTPS image URL."),
  publish: z.boolean().optional(),
}).strict();

export async function PUT(request: Request) {
  // Owner settings are a write: require Origin in addition to the shared CSRF check.
  if (!request.headers.get("origin")) return NextResponse.json({ error: "Origin header required." }, { status: 403 });
  const auth = await requireAdminApiAuth(request, "settings:manage");
  if (!auth.ok) return auth.response;
  const body = await readBoundedJsonBody(request, 8192);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid owner values." }, { status: 400 });
  const { publish: shouldPublish } = parsed.data;
  const ownerValues = {
    contactEmail: parsed.data.contactEmail.toLowerCase(),
    priceFrom: parsed.data.priceFrom,
    founderPhotoUrl: parsed.data.founderPhotoUrl,
  };
  const draft = await db.getSiteSettingsDraft();
  const next = { ...draft, ownerValues };
  const publish = shouldPublish !== false;
  const updated = publish
    ? await db.saveSiteSettings(next)
    : await db.saveSiteSettingsDraft(next);
  if (publish) {
    await db.saveSiteSettingsDraft(updated);
    revalidateAllPublicContent();
  }
  await db.recordAuditLog({ actorId: auth.user.id, actorEmail: auth.user.email, actorRole: auth.user.role, action: publish ? "settings.owner_values_updated" : "settings.owner_values_draft_saved", entityType: "settings", summary: `${publish ? "Published" : "Saved draft for"} public owner launch information.`, ipAddress: extractClientIp(request.headers) });
  const team = await db.listTeamMembers(true);
  return NextResponse.json({ ok: true, published: publish, missing: resolveOwnerValues(updated, team).missing }, { headers: { "Cache-Control": "no-store" } });
}
