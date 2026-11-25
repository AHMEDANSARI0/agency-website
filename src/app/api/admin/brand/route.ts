import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { CACHE_TAGS, revalidatePublicContent } from "@/lib/cache/public-cache";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText, sanitizeSafeUrl } from "@/lib/validation/common";

function cleanOptionalAssetUrl(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return /[<>'"\\]/.test(trimmed) ? null : trimmed;
  }
  return sanitizeSafeUrl(trimmed);
}

const brandSchema = z
  .object({
    brandName: z.string().trim().min(1).max(60),
    tagline: z.string().trim().min(2).max(140),
    altText: z.string().trim().min(2).max(140),
    lightLogoUrl: z.string().max(500).nullable().optional(),
    darkLogoUrl: z.string().max(500).nullable().optional(),
    symbolUrl: z.string().max(500).nullable().optional(),
    faviconUrl: z.string().max(500).nullable().optional(),
    ogImageUrl: z.string().max(500).nullable().optional(),
    showTextFallback: z.boolean(),
    updatedAt: z.string().optional(),
  })
  .strict();

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "brand:manage");
  if (!auth.ok) return auth.response;

  const brandAssets = await db.getBrandAssets();
  return NextResponse.json({ brandAssets });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApiAuth(request, "brand:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid brand asset configuration." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updated = await db.saveBrandAssets({
    brandName: sanitizePlainText(data.brandName, 60),
    tagline: sanitizePlainText(data.tagline, 140),
    altText: sanitizePlainText(data.altText, 140),
    lightLogoUrl: cleanOptionalAssetUrl(data.lightLogoUrl),
    darkLogoUrl: cleanOptionalAssetUrl(data.darkLogoUrl),
    symbolUrl: cleanOptionalAssetUrl(data.symbolUrl),
    faviconUrl: cleanOptionalAssetUrl(data.faviconUrl),
    ogImageUrl: cleanOptionalAssetUrl(data.ogImageUrl),
    showTextFallback: data.showTextFallback,
    updatedAt: new Date().toISOString(),
  });

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "brand.updated",
    entityType: "brand",
    summary: `Updated Brand Identity & Asset slots for ${updated.brandName}.`,
    ipAddress: extractClientIp(request.headers),
  });

  revalidatePublicContent([CACHE_TAGS.brand], ["/"]);

  return NextResponse.json({ ok: true, brandAssets: updated });
}
