import { db } from "@/lib/database";

interface RateWindow {
  timestamps: number[];
}

const buckets = new Map<string, RateWindow>();
const SAFE_IP_REGEX = /^[0-9a-fA-F:.]{2,64}$/;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
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
 * - Seamlessly falls back to in-memory sliding window (`checkRateLimit`) in local dev/tests or prior to migration 0002.
 */
export async function checkDistributedRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const safeKey = key.slice(0, 180);
  const distributed = await db.checkDistributedRateLimitBucket(
    safeKey,
    maxRequests,
    windowMs
  );
  if (distributed) {
    return distributed;
  }
  return checkRateLimit(safeKey, maxRequests, windowMs);
}

export function sanitizeIpCandidate(raw: string | null | undefined): string {
  if (!raw) return "unknown";
  const cleaned = raw.trim().slice(0, 64);
  if (!SAFE_IP_REGEX.test(cleaned)) {
    return "unknown";
  }
  return cleaned;
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    const valid = sanitizeIpCandidate(first);
    if (valid !== "unknown") return valid;
  }
  return sanitizeIpCandidate(headers.get("x-real-ip"));
}
