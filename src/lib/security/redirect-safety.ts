/** Shared validation for admin writes and every public custom-redirect sink. */
export function isSafeRedirectSource(value: string): boolean {
  if (typeof value !== "string" || value !== value.trim() || value.length > 200 ||
      !/^\/[a-zA-Z0-9\-_/.]+$/.test(value) || value.includes("//")) return false;
  if (value.split("/").some(part => part === "." || part === "..")) return false;
  const lower = (value.replace(/\/+$/, "") || "/").toLowerCase();
  return lower !== "/" && !lower.startsWith("/admin") && !lower.startsWith("/api") && !lower.startsWith("/_next");
}

/** Strict root-relative URL, with query/fragment allowed. Never an absolute URL. */
export function safeRedirectDestination(value: string): string | null {
  if (typeof value !== "string" || value !== value.trim() || value.length > 300 ||
      !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  const path = value.split(/[?#]/, 1)[0] ?? "";
  // Avoid ambiguous path separators and double-decoding by reverse proxies.
  if (path.includes("//") || /%(?:2f|5c|25|00|0a|0d)/i.test(path)) return null;
  try {
    const decodedPath = decodeURIComponent(path);
    if (/[\\\u0000-\u001f\u007f]/.test(decodedPath) || decodedPath.split("/").some(part => part === "." || part === "..")) return null;
    const parsed = new URL(value, "https://redirect-validation.invalid");
    if (parsed.origin !== "https://redirect-validation.invalid") return null;
    const cleanPath = parsed.pathname.replace(/\/+$/, "") || "/";
    return cleanPath + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

export function safeRedirectPathname(destination: string): string | null {
  const safe = safeRedirectDestination(destination);
  return safe === null ? null : new URL(safe, "https://redirect-validation.invalid").pathname.replace(/\/+$/, "").toLowerCase() || "/";
}

export function isSafeRedirectRule(source: string, destination: string): boolean {
  if (!isSafeRedirectSource(source)) return false;
  const target = safeRedirectPathname(destination);
  return target !== null && target !== source.replace(/\/+$/, "").toLowerCase();
}
