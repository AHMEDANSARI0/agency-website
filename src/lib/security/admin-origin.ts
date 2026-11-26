import { isAllowedProductionWriteHost } from "@/lib/security/write-host";

/** Strict Origin gate for browser-facing admin writes. Never trusts X-Forwarded-Host. */
export function verifyAdminWriteOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  if (request.headers.get("sec-fetch-site")?.trim().toLowerCase() === "cross-site") return false;
  const originHeader = request.headers.get("origin")?.trim();
  if (!originHeader || originHeader.toLowerCase() === "null") return false;
  try {
    const origin = new URL(originHeader);
    if ((origin.protocol !== "https:" && origin.protocol !== "http:") || origin.username || origin.password ||
        origin.pathname !== "/" || origin.search || origin.hash) return false;
    const requestUrl = new URL(request.url);
    const rawHost = request.headers.get("host")?.trim() || requestUrl.host;
    if (!rawHost || /[\s,\\/@?#]/.test(rawHost)) return false;
    const hostUrl = new URL(`${origin.protocol}//${rawHost}`);
    if (hostUrl.username || hostUrl.password || hostUrl.pathname !== "/" || hostUrl.search || hostUrl.hash || origin.host !== hostUrl.host) return false;

    if (process.env.NODE_ENV === "production") {
      const localDev = process.env.OMNIFLOW_ALLOW_LOCAL_DEV_DB === "true" &&
        (origin.hostname === "localhost" || origin.hostname === "127.0.0.1" || origin.hostname === "[::1]");
      if (origin.protocol !== "https:" && !localDev) return false;
      // Local HTTP override is for isolated development only, never a public deployment.
      if (!localDev && !isAllowedProductionWriteHost(request.headers.get("host"), process.env.OMNIFLOW_ALLOWED_WRITE_HOSTS)) return false;
    } else if (requestUrl.host === hostUrl.host && requestUrl.protocol !== origin.protocol) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
