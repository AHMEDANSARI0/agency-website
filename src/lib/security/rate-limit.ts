import { isIP } from "node:net";
import { db } from "@/lib/database";

interface RateWindow {
  timestamps: number[];
}

const buckets = new Map<string, RateWindow>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  unavailable?: boolean;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  nowMs = Date.now()
): RateLimitResult {
  const cutoff = nowMs - windowMs;
  const current = buckets.get(key) ?? { timestamps: [] };
  current.timestamps = current.timestamps.filter((ts) => ts > cutoff);

  if (current.timestamps.length >= maxRequests) {
    const oldest = current.timestamps[0] ?? nowMs;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - nowMs) / 1000)
    );
    buckets.set(key, current);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  current.timestamps.push(nowMs);
  buckets.set(key, current);

  // Periodic cleanup to prevent unbounded memory growth
  if (buckets.size > 5000) {
    for (const [k, v] of buckets.entries()) {
      if (v.timestamps.every((ts) => ts <= cutoff)) {
        buckets.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - current.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Distributed Free-Tier rate limiter:
 * - Uses Supabase PostgreSQL `rate_limits` table atomically across Vercel Serverless cold starts when available.
 * - Falls back to in-memory sliding windows only in local development and tests; fails closed in production.
 */
export async function checkDistributedRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const safeKey = key.slice(0, 180);
  try {
    const distributed = await db.checkDistributedRateLimitBucket(
      safeKey,
      maxRequests,
      windowMs
    );
    if (distributed) return distributed;
  } catch {
    // Treat unexpected storage errors exactly like an unavailable bucket.
  }
  // Fail closed in production. A per-instance fallback is not distributed and
  // can silently turn protection off after database or migration failures.
  if (process.env.NODE_ENV === "production" || process.env.OMNIFLOW_STRICT_PRODUCTION === "true") {
    return { allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true };
  }
  return checkRateLimit(safeKey, maxRequests, windowMs);
}

export function sanitizeIpCandidate(raw: string | null | undefined): string {
  if (!raw || raw.length > 64) return "unknown";
  const cleaned = raw.trim();
  const version = isIP(cleaned);
  if (version === 4) return cleaned;
  if (version !== 6) return "unknown";
  try {
    // Canonicalize IPv6 so alternate spellings do not get different buckets.
    const normalized = new URL(`http://[${cleaned}]/`).hostname.slice(1, -1).toLowerCase();
    const mapped = /^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/.exec(normalized);
    if (mapped) {
      const hi = parseInt(mapped[1]!, 16), lo = parseInt(mapped[2]!, 16);
      return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
    }
    return normalized;
  } catch {
    return "unknown";
  }
}

/**
 * Request.headers does not expose a verified socket peer. Trust a single header
 * ONLY after an operator has secured the entire proxy chain and origin access.
 * No automatic Vercel/Cloudflare detection, and never parse an XFF list here.
 */
export function extractClientIp(headers: Headers): string {
  const configured = process.env.OMNIFLOW_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (configured !== "x-real-ip" && configured !== "cf-connecting-ip") return "unknown";
  return sanitizeIpCandidate(headers.get(configured));
}
