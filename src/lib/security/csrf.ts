export function verifySameOriginRequest(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!origin) {
    // Allow non-browser server-side tests only when explicitly no origin header is sent and sec-fetch-site isn't cross-site
    const fetchSite = request.headers.get("sec-fetch-site");
    return fetchSite !== "cross-site";
  }

  if (!host) return false;

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}
