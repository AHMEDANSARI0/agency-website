interface RateWindow {
  timestamps: number[];
}

const buckets = new Map<string, RateWindow>();

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
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
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

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
