/**
 * Resolve only the exact www counterpart of an explicitly configured HTTPS
 * origin. TLS enforcement and static/API paths remain hosting responsibilities.
 */
export function canonicalHostDestination(
  requestUrl: URL,
  configuredSiteUrl: string | undefined,
  enabled: boolean,
  deploymentEnvironment: string | undefined,
  requestHost?: string | null
): URL | null {
  if (!enabled || (deploymentEnvironment && deploymentEnvironment !== "production")) return null;
  const raw = configuredSiteUrl?.trim();
  if (!raw) return null;
  try {
    const canonical = new URL(raw);
    if (
      canonical.protocol !== "https:" || canonical.username || canonical.password ||
      canonical.port || canonical.pathname !== "/" || canonical.search || canonical.hash
    ) return null;
    const host = canonical.hostname.toLowerCase();
    const labels = host.split(".");
    if (
      labels.length < 2 || host.length > 253 ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
      /^\d+(?:\.\d+){3}$/.test(host) || host.endsWith(".localhost") ||
      host === "vercel.app" || host.endsWith(".vercel.app")
    ) return null;
    const alternate = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    const actualHost = (requestHost ?? requestUrl.host).trim().toLowerCase();
    if (alternate === host || ![alternate, `${alternate}:80`, `${alternate}:443`].includes(actualHost)) return null;
    const destination = new URL(canonical.origin);
    destination.pathname = requestUrl.pathname;
    destination.search = requestUrl.search;
    return destination;
  } catch {
    return null;
  }
}
