function normalizeHostHeader(rawHost: string | null): string | null {
  if (!rawHost) return null;
  const primary = rawHost.split(",")[0]?.trim().toLowerCase() || "";
  return primary || null;
}

export function verifySameOriginRequest(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return false;
  }

  const host = normalizeHostHeader(
    request.headers.get("x-forwarded-host") || request.headers.get("host")
  );
  const origin = request.headers.get("origin")?.trim();

  if (origin) {
    if (origin.toLowerCase() === "null" || !host) {
      return false;
    }
    try {
      const originHost = new URL(origin).host.toLowerCase();
      return originHost === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer")?.trim();
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      return refererHost === host;
    } catch {
      return false;
    }
  }

  // Non-browser server-side / automated test requests without Origin or Referer
  return true;
}
