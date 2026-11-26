import type { SiteSettings, TeamMember } from "@/types/content";

/** Public owner values. This module never accepts or returns authentication secrets. */
export interface OwnerValues {
  contactEmail: string;
  priceFrom: string;
  founderPhotoUrl: string;
}

const TOKEN = /\{\{[A-Z0-9_]+\}\}/;
const isValue = (value: unknown): value is string =>
  typeof value === "string" && Boolean(value.trim()) && !TOKEN.test(value);
export const validOwnerEmail = (value: unknown): value is string =>
  isValue(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && !value.trim().toLowerCase().endsWith(".example");
export const validOwnerPhoto = (value: unknown): value is string => {
  if (!isValue(value)) return false;
  const url = value.trim();
  if (/[\u0000-\u0020\u007f\\]/.test(url)) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try { const parsed = new URL(url); return parsed.protocol === "https:" && !parsed.username && !parsed.password; } catch { return false; }
};

export function resolveOwnerValues(
  settings: Partial<SiteSettings> | null | undefined,
  team: Partial<TeamMember>[] | null | undefined,
  env: Record<string, string | undefined> = process.env
): { values: OwnerValues; missing: string[] } {
  const saved = settings?.ownerValues;
  const envEmail = env.OWNER_CONTACT_EMAIL?.trim() ?? "";
  const cmsEmail = settings?.contactEmail?.trim() ?? "";
  const contactEmail = validOwnerEmail(saved?.contactEmail) ? saved.contactEmail.trim() : validOwnerEmail(cmsEmail) ? cmsEmail : validOwnerEmail(envEmail) ? envEmail : "";
  const envPrice = env.OWNER_PRICE_FROM?.trim() ?? "";
  const pricing = settings?.pricingConfig;
  const cmsPrice = pricing?.packages?.[0]?.projectPriceLabel?.trim() ?? "";
  const ownerPrice = saved?.priceFrom?.trim() ?? "";
  const priceFrom = isValue(ownerPrice) ? ownerPrice : isValue(envPrice) ? envPrice : isValue(cmsPrice) ? cmsPrice : "";
  const tokenPrice = isValue(ownerPrice) ? ownerPrice : envPrice;
  const remainingPricingTokens = pricing && TOKEN.test(
    JSON.stringify(pricing).replaceAll("{{PRICE_FROM}}", () => isValue(tokenPrice) ? tokenPrice : "{{PRICE_FROM}}")
  );
  const founder = team?.find((member) => member.isFounder && member.isPublished !== false);
  const envPhoto = env.OWNER_FOUNDER_PHOTO_URL?.trim() ?? "";
  const photo = founder?.avatarUrl?.trim() ?? "";
  const founderPhotoUrl = validOwnerPhoto(saved?.founderPhotoUrl) ? saved.founderPhotoUrl.trim() : validOwnerPhoto(photo) ? photo : validOwnerPhoto(envPhoto) ? envPhoto : "";
  const missing: string[] = [];
  if (!contactEmail) missing.push("contact email");
  if (!priceFrom || remainingPricingTokens) missing.push("starting price or unresolved pricing placeholders");
  if (!founder || !founderPhotoUrl) missing.push("published founder photo");
  return { values: { contactEmail, priceFrom, founderPhotoUrl }, missing };
}

/** Apply environment fallbacks without mutating or overwriting the stored CMS. */
export function applyOwnerValues(settings: SiteSettings, team: TeamMember[]): { settings: SiteSettings; team: TeamMember[]; missing: string[] } {
  const { values, missing } = resolveOwnerValues(settings, team);
  const rawPrice = settings.ownerValues?.priceFrom?.trim() || process.env.OWNER_PRICE_FROM?.trim();
  let pricing = settings.pricingConfig;
  if (pricing && isValue(rawPrice)) {
    pricing = JSON.parse(JSON.stringify(pricing, (_key, value: unknown) =>
      typeof value === "string" ? value.replaceAll("{{PRICE_FROM}}", () => rawPrice) : value
    )) as SiteSettings["pricingConfig"];
  }
  if (pricing && isValue(settings.ownerValues?.priceFrom) && pricing.packages?.length) {
    pricing = { ...pricing, packages: pricing.packages.map((item, index) => index === 0 ? { ...item, projectPriceLabel: settings.ownerValues!.priceFrom.trim() } : item) };
  }
  const normalizedSettings = { ...settings, contactEmail: values.contactEmail || settings.contactEmail, pricingConfig: pricing };
  const normalizedTeam = team.map((member) => member.isFounder && (validOwnerPhoto(settings.ownerValues?.founderPhotoUrl) || !validOwnerPhoto(member.avatarUrl)) && values.founderPhotoUrl
    ? { ...member, avatarUrl: values.founderPhotoUrl } : member);
  return { settings: normalizedSettings, team: normalizedTeam, missing };
}

export function requireLaunchOwnerValues(settings: SiteSettings, team: TeamMember[]): void {
  const { missing } = resolveOwnerValues(settings, team);
  if (missing.length) throw new Error(`Launch configuration incomplete: ${missing.join(", ")}. See OWNER_VALUES_NEEDED.md.`);
}
