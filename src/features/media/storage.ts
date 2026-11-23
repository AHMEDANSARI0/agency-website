import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { MediaAsset } from "@/types/content";
import {
  StorageUnavailableError,
  isPlaceholderEnvValue,
  isProductionEnvironment,
} from "@/lib/env";

export const DEFAULT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB max single file (fits Vercel serverless 4.5 MB body cap)
export const DEFAULT_TOTAL_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB persistent storage quota

// Backwards-compatible named constants
export const MAX_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_BYTES;
export const FREE_TIER_QUOTA_BYTES = DEFAULT_TOTAL_QUOTA_BYTES;

export function getMaxSingleUploadBytes(): number {
  const parsed = Number(process.env.MEDIA_MAX_FILE_BYTES || DEFAULT_MAX_UPLOAD_BYTES);
  if (Number.isFinite(parsed) && parsed >= 64 * 1024 && parsed <= 50 * 1024 * 1024) {
    return Math.floor(parsed);
  }
  return DEFAULT_MAX_UPLOAD_BYTES;
}

export function getTotalStorageQuotaBytes(): number {
  const parsed = Number(process.env.MEDIA_TOTAL_QUOTA_BYTES || DEFAULT_TOTAL_QUOTA_BYTES);
  if (Number.isFinite(parsed) && parsed >= 10 * 1024 * 1024) {
    return Math.floor(parsed);
  }
  return DEFAULT_TOTAL_QUOTA_BYTES;
}

export const ALLOWED_MEDIA_MIME_MAP: Record<
  string,
  {
    canonicalExt: string;
    acceptedExtensions: readonly string[];
    defaultCategory: MediaAsset["category"];
  }
> = {
  "image/png": {
    canonicalExt: "png",
    acceptedExtensions: ["png"],
    defaultCategory: "image",
  },
  "image/jpeg": {
    canonicalExt: "jpg",
    acceptedExtensions: ["jpg", "jpeg"],
    defaultCategory: "image",
  },
  "image/webp": {
    canonicalExt: "webp",
    acceptedExtensions: ["webp"],
    defaultCategory: "image",
  },
  "image/gif": {
    canonicalExt: "gif",
    acceptedExtensions: ["gif"],
    defaultCategory: "image",
  },
  "image/svg+xml": {
    canonicalExt: "svg",
    acceptedExtensions: ["svg"],
    defaultCategory: "svg",
  },
  "application/pdf": {
    canonicalExt: "pdf",
    acceptedExtensions: ["pdf"],
    defaultCategory: "document",
  },
};

export const ALLOWED_MEDIA_MIME_TYPES = Object.keys(ALLOWED_MEDIA_MIME_MAP);
export const ALLOWED_MEDIA_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "pdf",
] as const;

function matchesMagicHeader(mime: string, buf: Buffer): boolean {
  if (buf.length < 4) return false;
  switch (mime) {
    case "image/png":
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      );
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/gif":
      return (
        buf.subarray(0, 6).toString("ascii") === "GIF87a" ||
        buf.subarray(0, 6).toString("ascii") === "GIF89a"
      );
    case "image/webp":
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "application/pdf":
      return buf.subarray(0, 4).toString("ascii") === "%PDF";
    case "image/svg+xml":
      return validateSafeSvgBuffer(buf).valid;
    default:
      return false;
  }
}

export function validateSafeSvgBuffer(buf: Buffer): {
  valid: boolean;
  reason?: string;
} {
  const text = buf.toString("utf8");
  if (!/<svg[\s>]/i.test(text)) {
    return { valid: false, reason: "Invalid SVG document structure." };
  }
  const dangerousPatterns = [
    /<script[\s>]/i,
    /<foreignobject[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /data\s*:\s*text\/html/i,
    /\bon[a-z]+\s*=/i,
  ];
  for (const regex of dangerousPatterns) {
    if (regex.test(text)) {
      return {
        valid: false,
        reason:
          "SVG contains disallowed executable scripts, event handlers, or embedded objects.",
      };
    }
  }
  return { valid: true };
}

export function validateMediaUpload(
  mimeType: string,
  buffer: Buffer,
  originalFilename?: string
): {
  valid: boolean;
  reason?: string;
  ext?: string;
  defaultCategory?: MediaAsset["category"];
} {
  if (buffer.length === 0) {
    return { valid: false, reason: "Uploaded file is empty." };
  }
  const maxFileBytes = getMaxSingleUploadBytes();
  if (buffer.length > maxFileBytes) {
    const maxMb = (maxFileBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "");
    return {
      valid: false,
      reason: `File exceeds the ${maxMb} MB maximum per-file upload limit.`,
    };
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  const meta = ALLOWED_MEDIA_MIME_MAP[normalizedMime];
  if (!meta) {
    return {
      valid: false,
      reason: `Unsupported MIME type. Allowed types: ${ALLOWED_MEDIA_MIME_TYPES.join(", ")}.`,
    };
  }

  if (originalFilename && originalFilename.includes(".")) {
    const rawExt = originalFilename.split(".").pop()?.trim().toLowerCase() || "";
    if (rawExt && !meta.acceptedExtensions.includes(rawExt)) {
      return {
        valid: false,
        reason: `File extension (.${rawExt}) does not match declared MIME type (${normalizedMime}).`,
      };
    }
  }

  if (normalizedMime === "image/svg+xml") {
    const svgCheck = validateSafeSvgBuffer(buffer);
    if (!svgCheck.valid) return svgCheck;
  } else if (!matchesMagicHeader(normalizedMime, buffer)) {
    return {
      valid: false,
      reason: "File binary signature does not match declared MIME type.",
    };
  }

  return {
    valid: true,
    ext: meta.canonicalExt,
    defaultCategory: meta.defaultCategory,
  };
}

function getLocalDevUploadsDir(): string {
  if (process.env.OMNIFLOW_UPLOADS_DIR) {
    return path.resolve(process.env.OMNIFLOW_UPLOADS_DIR);
  }
  return path.join(process.cwd(), "public", "uploads");
}

function getSupabaseStorageConfig(): {
  supabaseUrl: string;
  serviceKey: string;
  bucket: string;
} | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "omniflow-media";

  if (
    isPlaceholderEnvValue(supabaseUrl) ||
    !/^https:\/\//i.test(supabaseUrl) ||
    isPlaceholderEnvValue(serviceKey)
  ) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceKey,
    bucket,
  };
}

export interface StorageHealthVerification {
  provider: "supabase_storage" | "local_dev" | "unconfigured_production";
  configured: boolean;
  healthy: boolean;
  bucket: string;
  maxSingleFileBytes: number;
  totalQuotaBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: readonly string[];
  message: string;
}

export async function verifyStorageHealth(): Promise<StorageHealthVerification> {
  const strictProd = isProductionEnvironment();
  const cfg = getSupabaseStorageConfig();
  const maxSingleFileBytes = getMaxSingleUploadBytes();
  const totalQuotaBytes = getTotalStorageQuotaBytes();

  if (!cfg) {
    if (strictProd) {
      return {
        provider: "unconfigured_production",
        configured: false,
        healthy: false,
        bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "omniflow-media",
        maxSingleFileBytes,
        totalQuotaBytes,
        allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
        allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
        message:
          "Persistent object storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      };
    }

    return {
      provider: "local_dev",
      configured: true,
      healthy: true,
      bucket: "public/uploads",
      maxSingleFileBytes,
      totalQuotaBytes,
      allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
      allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
      message: "Local development filesystem storage active.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  if (typeof timer.unref === "function") timer.unref();

  try {
    const res = await fetch(
      `${cfg.supabaseUrl}/storage/v1/bucket/${encodeURIComponent(cfg.bucket)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cfg.serviceKey}`,
          apikey: cfg.serviceKey,
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      return {
        provider: "supabase_storage",
        configured: true,
        healthy: false,
        bucket: cfg.bucket,
        maxSingleFileBytes,
        totalQuotaBytes,
        allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
        allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
        message: `Supabase Storage bucket "${cfg.bucket}" returned status ${res.status}. Ensure the public bucket exists in Supabase Storage.`,
      };
    }

    return {
      provider: "supabase_storage",
      configured: true,
      healthy: true,
      bucket: cfg.bucket,
      maxSingleFileBytes,
      totalQuotaBytes,
      allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
      allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
      message: `Supabase Storage bucket "${cfg.bucket}" verified and reachable.`,
    };
  } catch {
    return {
      provider: "supabase_storage",
      configured: true,
      healthy: false,
      bucket: cfg.bucket,
      maxSingleFileBytes,
      totalQuotaBytes,
      allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
      allowedExtensions: ALLOWED_MEDIA_EXTENSIONS,
      message: "Supabase Storage endpoint could not be reached within timeout.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function storeMediaFile(input: {
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  ext: string;
}): Promise<{
  filename: string;
  url: string;
  storageProvider: "local" | "supabase";
}> {
  const baseSlug =
    input.originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "asset";

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}-${baseSlug}.${input.ext}`;
  const strictProd = isProductionEnvironment();
  const cfg = getSupabaseStorageConfig();

  if (cfg) {
    const endpoint = `${cfg.supabaseUrl}/storage/v1/object/${encodeURIComponent(
      cfg.bucket
    )}/${encodeURIComponent(filename)}`;

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.serviceKey}`,
          apikey: cfg.serviceKey,
          "Content-Type": input.mimeType,
          "x-upsert": "true",
        },
        body: new Uint8Array(input.buffer),
      });
    } catch {
      throw new StorageUnavailableError(
        "STORAGE_UPLOAD_FAILED",
        "Failed to reach persistent cloud media storage. Upload was rejected to prevent temporary data loss."
      );
    }

    if (!res.ok) {
      throw new StorageUnavailableError(
        "STORAGE_UPLOAD_FAILED",
        `Persistent media storage rejected the upload (HTTP ${res.status}). Verify bucket "${cfg.bucket}" exists in Supabase Storage.`
      );
    }

    const publicUrl = `${cfg.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(
      cfg.bucket
    )}/${encodeURIComponent(filename)}`;

    return {
      filename,
      url: publicUrl,
      storageProvider: "supabase",
    };
  }

  // Production NEVER silently falls back to ephemeral/local storage
  if (strictProd) {
    throw new StorageUnavailableError(
      "STORAGE_UNCONFIGURED",
      "Persistent media storage is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  // Local development & automated test filesystem storage ONLY
  const dir = getLocalDevUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), input.buffer);

  return {
    filename,
    url: `/uploads/${filename}`,
    storageProvider: "local",
  };
}

export async function removeStoredMediaFile(asset: MediaAsset): Promise<void> {
  if (asset.storageProvider === "local") {
    if (isProductionEnvironment()) {
      return;
    }
    const safeName = path.basename(asset.filename);
    const fullPath = path.join(getLocalDevUploadsDir(), safeName);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { force: true });
    }
    return;
  }

  const cfg = getSupabaseStorageConfig();
  if (!cfg) {
    if (isProductionEnvironment()) {
      throw new StorageUnavailableError(
        "STORAGE_UNCONFIGURED",
        "Persistent media storage is not configured in production."
      );
    }
    return;
  }

  const endpoint = `${cfg.supabaseUrl}/storage/v1/object/${encodeURIComponent(
    cfg.bucket
  )}/${encodeURIComponent(asset.filename)}`;

  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${cfg.serviceKey}`,
      apikey: cfg.serviceKey,
    },
  });

  if (!res.ok && res.status !== 404 && isProductionEnvironment()) {
    throw new StorageUnavailableError(
      "STORAGE_DELETE_FAILED",
      `Failed to delete object from Supabase Storage (HTTP ${res.status}).`
    );
  }
}
