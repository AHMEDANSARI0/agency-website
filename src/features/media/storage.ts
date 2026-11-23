import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { MediaAsset } from "@/types/content";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB per upload
export const FREE_TIER_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB Supabase Free Tier reference

const ALLOWED_MIMES: Record<
  string,
  { ext: string; defaultCategory: MediaAsset["category"] }
> = {
  "image/png": { ext: "png", defaultCategory: "image" },
  "image/jpeg": { ext: "jpg", defaultCategory: "image" },
  "image/webp": { ext: "webp", defaultCategory: "image" },
  "image/gif": { ext: "gif", defaultCategory: "image" },
  "image/svg+xml": { ext: "svg", defaultCategory: "svg" },
  "application/pdf": { ext: "pdf", defaultCategory: "document" },
};

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
  buffer: Buffer
): {
  valid: boolean;
  reason?: string;
  ext?: string;
  defaultCategory?: MediaAsset["category"];
} {
  if (buffer.length === 0) {
    return { valid: false, reason: "Uploaded file is empty." };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      reason: "File exceeds the 4 MB maximum upload limit.",
    };
  }
  const normalizedMime = mimeType.trim().toLowerCase();
  const meta = ALLOWED_MIMES[normalizedMime];
  if (!meta) {
    return {
      valid: false,
      reason:
        "Unsupported file format. Allowed formats: PNG, JPEG, WebP, GIF, sanitized SVG, and PDF.",
    };
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
    ext: meta.ext,
    defaultCategory: meta.defaultCategory,
  };
}

function getLocalUploadsDir(): string {
  if (process.env.OMNIFLOW_UPLOADS_DIR) {
    return path.resolve(process.env.OMNIFLOW_UPLOADS_DIR);
  }
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith("/var/task")
  ) {
    return path.join(os.tmpdir(), "omniflow-uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
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
  const baseSlug = input.originalName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "asset";

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}-${baseSlug}.${input.ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "omniflow-media";

  if (supabaseUrl && serviceKey) {
    const endpoint = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(
      bucket
    )}/${encodeURIComponent(filename)}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": input.mimeType,
        "x-upsert": "true",
      },
      body: new Uint8Array(input.buffer),
    });

    if (!res.ok) {
      throw new Error(`Supabase Storage upload failed (${res.status}).`);
    }

    const publicUrl = `${supabaseUrl.replace(
      /\/$/,
      ""
    )}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(
      filename
    )}`;

    return {
      filename,
      url: publicUrl,
      storageProvider: "supabase",
    };
  }

  // Zero-cost local disk fallback
  const dir = getLocalUploadsDir();
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
    const safeName = path.basename(asset.filename);
    const fullPath = path.join(getLocalUploadsDir(), safeName);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { force: true });
    }
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "omniflow-media";
  if (supabaseUrl && serviceKey) {
    const endpoint = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(
      bucket
    )}/${encodeURIComponent(asset.filename)}`;
    await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    }).catch(() => undefined);
  }
}
