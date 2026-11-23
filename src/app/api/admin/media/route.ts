import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { MediaAsset } from "@/types/content";
import {
  FREE_TIER_QUOTA_BYTES,
  MAX_UPLOAD_BYTES,
  removeStoredMediaFile,
  storeMediaFile,
  validateMediaUpload,
} from "@/features/media/storage";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const patchMediaSchema = z.object({
  id: z.string().min(1).max(80),
  altText: z.string().max(180).optional(),
  category: z.enum(["image", "svg", "document", "brand"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "media:manage");
  if (!auth.ok) return auth.response;

  const assets = await db.listMediaAssets();
  const usedBytes = assets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);

  return NextResponse.json({
    assets,
    quota: {
      usedBytes,
      quotaBytes: FREE_TIER_QUOTA_BYTES,
      maxSingleUploadBytes: MAX_UPLOAD_BYTES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "media:manage");
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data upload." },
      { status: 400 }
    );
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const altTextRaw = String(form.get("altText") || "").trim();
  const categoryRaw = String(form.get("category") || "").trim();

  const arrayBuf = await fileEntry.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const check = validateMediaUpload(fileEntry.type, buffer);
  if (!check.valid || !check.ext || !check.defaultCategory) {
    return NextResponse.json(
      { error: check.reason || "Invalid media file." },
      { status: 400 }
    );
  }

  const existingAssets = await db.listMediaAssets();
  const currentUsed = existingAssets.reduce((s, a) => s + a.sizeBytes, 0);
  if (currentUsed + buffer.length > FREE_TIER_QUOTA_BYTES) {
    return NextResponse.json(
      {
        error:
          "Free-tier media quota (500 MB) reached. Remove unused files before uploading.",
      },
      { status: 413 }
    );
  }

  const stored = await storeMediaFile({
    originalName: fileEntry.name || `upload.${check.ext}`,
    mimeType: fileEntry.type.toLowerCase(),
    buffer,
    ext: check.ext,
  });

  const validCategory: MediaAsset["category"] =
    categoryRaw === "image" ||
    categoryRaw === "svg" ||
    categoryRaw === "document" ||
    categoryRaw === "brand"
      ? categoryRaw
      : check.defaultCategory;

  const asset: MediaAsset = {
    id: `med_${randomBytes(6).toString("hex")}`,
    filename: stored.filename,
    originalName: sanitizePlainText(fileEntry.name || stored.filename, 120),
    mimeType: fileEntry.type.toLowerCase(),
    sizeBytes: buffer.length,
    url: stored.url,
    storageProvider: stored.storageProvider,
    altText: sanitizePlainText(altTextRaw || fileEntry.name, 180),
    category: validCategory,
    uploadedBy: auth.user.email,
    usedIn: [],
    createdAt: new Date().toISOString(),
  };

  const saved = await db.saveMediaAsset(asset);

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "media.uploaded",
    entityType: "media",
    entityId: saved.id,
    summary: `Uploaded media "${saved.originalName}" (${Math.round(
      saved.sizeBytes / 1024
    )} KB, ${saved.storageProvider}).`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, asset: saved }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAuth(request, "media:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid media metadata update." },
      { status: 400 }
    );
  }

  const updated = await db.updateMediaAssetMeta(parsed.data.id, {
    altText:
      parsed.data.altText !== undefined
        ? sanitizePlainText(parsed.data.altText, 180)
        : undefined,
    category: parsed.data.category,
  });

  if (!updated) {
    return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, asset: updated });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiAuth(request, "media:manage");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing media id." }, { status: 400 });
  }

  const deleted = await db.deleteMediaAsset(id);
  if (!deleted) {
    return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  }

  await removeStoredMediaFile(deleted);

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "media.deleted",
    entityType: "media",
    entityId: deleted.id,
    summary: `Deleted media asset "${deleted.originalName}".`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
