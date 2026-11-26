/** Exact authority matching for production browser writes; never trusts X-Forwarded-Host. */
function normalizeAuthority(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!value || value.length > 253 || !/^(?:\[[a-f0-9:.]+\]|[a-z0-9.-]+)(?::[0-9]{1,5})?$/.test(value)) return null;
  try {
    const parsed = new URL(`https://${value}`);
    if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) return null;
    const hostname = parsed.hostname;
    if (!hostname.startsWith("[")) {
      const labels = hostname.split(".");
      if (labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    }
    return parsed.host;
  } catch {
    return null;
  }
}

export function isAllowedProductionWriteHost(rawHost: string | null, configuredHosts: string | undefined): boolean {
  if (!rawHost || !configuredHosts || configuredHosts.length > 4096) return false;
  const host = normalizeAuthority(rawHost);
  const entries = configuredHosts.split(",");
  if (!host || entries.length === 0 || entries.length > 32) return false;
  const normalized = entries.map(normalizeAuthority);
  // A malformed entry is a configuration error: do not partially accept the list.
  if (normalized.some(value => !value)) return false;
  return normalized.includes(host);
}
