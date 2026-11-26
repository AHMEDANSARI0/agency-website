import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { MediaAsset } from "@/types/content";
import {
  ALLOWED_MEDIA_EXTENSIONS,
  ALLOWED_MEDIA_MIME_TYPES,
  getMaxSingleUploadBytes,
  getTotalStorageQuotaBytes,
  removeStoredMediaFile,
  storeMediaFile,
  validateMediaUpload,
} from "@/features/media/storage";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { DatabaseUnavailableError, StorageUnavailableError } from "@/lib/env";
import {
  checkDistributedRateLimit,
  extractClientIp,
} from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const patchMediaSchema = z.object({
  id: z.string().min(1).max(80),
  altText: z.string().max(180).optional(),
  category: z.enum(["image", "svg", "document", "brand"]).optional(),
});

function handleStorageOrDbError(err: unknown): NextResponse {
  if (
    err instanceof StorageUnavailableError ||
    err instanceof DatabaseUnavailableError
  ) {
    return NextResponse.json(
      { error: err.publicMessage, code: err.code },
      { status: err.statusCode }
    );
  }
  return NextResponse.json(
    { error: "Media operation failed unexpectedly." },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminApiAuth(request, "media:manage");
    if (!auth.ok) return auth.response;

    const assets = await db.listMediaAssets();
    const usedBytes = assets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);
    const quotaBytes = getTotalStorageQuotaBytes();
    const maxSingleUploadBytes = getMaxSingleUploadBytes();

    return NextResponse.json({
      assets,
      quota: {
        usedBytes,
        remainingBytes: Math.max(0, quotaBytes - usedBytes),
        percentUsed: Number(((usedBytes / quotaBytes) * 100).toFixed(2)),
        quotaBytes,
        maxSingleUploadBytes,
        allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
        allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
      },
    });
  } catch (err) {
    return handleStorageOrDbError(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApiAuth(request, "media:manage");
    if (!auth.ok) return auth.response;

    const uploadRate = await checkDistributedRateLimit(
      `admin_media_upload:${auth.user.id}`,
      20,
      5 * 60 * 1000
    );
    if (uploadRate.unavailable) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later.", code: "RATE_LIMIT_UNAVAILABLE" },
        { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } }
      );
    }
    if (!uploadRate.allowed) {
      return NextResponse.json(
        {
          error: `Upload rate limit reached. Please wait ${uploadRate.retryAfterSeconds} seconds before uploading more files.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(uploadRate.retryAfterSeconds) },
        }
      );
    }

    const maxSingleBytes = getMaxSingleUploadBytes();
    const declaredLength = Number(request.headers.get("content-length") || "0");
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > maxSingleBytes + 64 * 1024
    ) {
      return NextResponse.json(
        {
          error: `Upload exceeds the maximum single-file limit (${Math.round(
            maxSingleBytes / (1024 * 1024)
          )} MB).`,
        },
        { status: 413 }
      );
    }

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

    const check = validateMediaUpload(fileEntry.type, buffer, fileEntry.name);
    if (!check.valid || !check.ext || !check.defaultCategory) {
      return NextResponse.json(
        { error: check.reason || "Invalid media file." },
        { status: 400 }
      );
    }

    const existingAssets = await db.listMediaAssets();
    const currentUsed = existingAssets.reduce((s, a) => s + a.sizeBytes, 0);
    const totalQuotaBytes = getTotalStorageQuotaBytes();
    if (currentUsed + buffer.length > totalQuotaBytes) {
      const quotaMb = Math.round(totalQuotaBytes / (1024 * 1024));
      return NextResponse.json(
        {
          error: `Total media storage quota (${quotaMb} MB) reached. Remove unused files before uploading.`,
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
  } catch (err) {
    return handleStorageOrDbError(err);
  }
}

export async function PATCH(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Media asset not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, asset: updated });
  } catch (err) {
    return handleStorageOrDbError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminApiAuth(request, "media:manage");
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const force = url.searchParams.get("force") === "true";
    if (!id) {
      return NextResponse.json({ error: "Missing media id." }, { status: 400 });
    }

    const allAssets = await db.listMediaAssets();
    const target = allAssets.find((a) => a.id === id);
    if (!target) {
      return NextResponse.json(
        { error: "Media asset not found." },
        { status: 404 }
      );
    }

    // Safe deletion protection: block deleting referenced assets unless SUPER_ADMIN explicitly confirms force=true
    if (
      target.usedIn.length > 0 &&
      !(force && auth.user.role === "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        {
          error: `Cannot delete "${target.originalName}" because it is actively referenced (${target.usedIn.join(
            ", "
          )}). Update those references first.`,
          usedIn: target.usedIn,
        },
        { status: 409 }
      );
    }

    await removeStoredMediaFile(target);
    const deleted = await db.deleteMediaAsset(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Media asset not found." },
        { status: 404 }
      );
    }

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
  } catch (err) {
    return handleStorageOrDbError(err);
  }
}
