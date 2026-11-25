/**
 * Page title normalization utilities ensuring brand name ("OmniFlow")
 * never appears twice when Next.js applies `%s | OmniFlow`.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips any trailing brand suffix (e.g. ` | OmniFlow`, ` — OmniFlow`,
 * ` - OmniFlow`, ` | OmniFlow Insights`) from a child page title so the
 * root layout template `%s | ${companyName}` never doubles the brand.
 */
export function stripTrailingBrand(
  rawTitle: string,
  brandName = "OmniFlow"
): string {
  const safeBrand = escapeRegExp(brandName.trim() || "OmniFlow");
  let cleaned = rawTitle.trim();

  const trailingPattern = new RegExp(
    `(?:\\s*[|—–\\-:]\\s*${safeBrand}(?:\\s+Insights)?)+$`,
    "i"
  );
  cleaned = cleaned.replace(trailingPattern, "").trim();

  // Also prevent leading "OmniFlow | ..." on non-home child pages
  const leadingPattern = new RegExp(`^${safeBrand}\\s*[|—–\\-:]\\s*`, "i");
  if (leadingPattern.test(cleaned)) {
    cleaned = cleaned.replace(leadingPattern, "").trim();
  }

  return cleaned || rawTitle.trim();
}

/**
 * Builds the exact home page title (`title: { absolute }`) and guarantees
 * the brand name appears once cleanly.
 */
export function buildHomeAbsoluteTitle(
  rawSeoTitle: string | undefined,
  companyName = "OmniFlow",
  positioning = "AI Automation & Business Operations Partner"
): string {
  const brand = companyName.trim() || "OmniFlow";
  const fallback = `${brand} — ${positioning.trim()}`;
  if (!rawSeoTitle || !rawSeoTitle.trim()) {
    return fallback;
  }

  const core = stripTrailingBrand(rawSeoTitle, brand);
  if (!core) {
    return fallback;
  }

  // If the remaining text already mentions the brand name, return as-is
  if (new RegExp(`\\b${escapeRegExp(brand)}\\b`, "i").test(core)) {
    return core;
  }

  return `${brand} — ${core}`;
}
