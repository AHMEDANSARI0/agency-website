import { isSafeRedirectRule, safeRedirectDestination } from "@/lib/security/redirect-safety";

/** Small per-isolate cache; it never retains expired rules if refresh fails. */
interface EdgeRedirect {
  destinationPath: string;
  permanent: boolean;
}
interface CacheEntry {
  origin: string;
  expiresAt: number;
  map: Map<string, EdgeRedirect>;
}

const SUCCESS_TTL_MS = 15_000;
const FAILURE_RETRY_MS = 2_000;
let cached: CacheEntry | null = null;
let pending: { origin: string; promise: Promise<CacheEntry> } | null = null;

export function normalizeRedirectPath(pathname: string): string {
  const trimmed = pathname.trim().replace(/\/+$/, "");
  return (trimmed || "/").toLowerCase();
}

async function refresh(origin: string): Promise<CacheEntry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 600);
  try {
    const response = await fetch(`${origin}/api/redirects`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "x-omniflow-edge-internal": "1" },
    });
    if (!response.ok) throw new Error("Redirect rules unavailable");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("rules" in data) || !Array.isArray(data.rules)) {
      throw new Error("Invalid redirect rules");
    }
    const map = new Map<string, EdgeRedirect>();
    for (const rule of data.rules) {
      if (!rule || typeof rule !== "object" || typeof rule.sourcePath !== "string" ||
          typeof rule.destinationPath !== "string" || typeof rule.permanent !== "boolean") {
        throw new Error("Invalid redirect rule");
      }
      const destinationPath = safeRedirectDestination(rule.destinationPath);
      if (!isSafeRedirectRule(rule.sourcePath, rule.destinationPath) || !destinationPath) continue;
      map.set(normalizeRedirectPath(rule.sourcePath), {
        destinationPath,
        permanent: rule.permanent,
      });
    }
    return { origin, expiresAt: Date.now() + SUCCESS_TTL_MS, map };
  } catch {
    return { origin, expiresAt: Date.now() + FAILURE_RETRY_MS, map: new Map() };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupEdgeRedirect(origin: string, pathname: string): Promise<EdgeRedirect | null> {
  let entry = cached;
  if (!entry || entry.origin !== origin || Date.now() >= entry.expiresAt) {
    if (!pending || pending.origin !== origin) {
      const promise = refresh(origin);
      pending = { origin, promise };
    }
    const current = pending;
    entry = await current.promise;
    // An overlapping request for another origin must not install its result as ours.
    if (pending === current) {
      cached = entry;
      pending = null;
    }
  }
  return entry.map.get(normalizeRedirectPath(pathname)) ?? null;
}
