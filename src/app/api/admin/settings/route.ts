import { NextResponse } from "next/server";
import { z } from "zod";
import type { PricingConfig } from "@/types/content";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { db } from "@/lib/database";
import { DEFAULT_NAVBAR_STYLE_SETTINGS } from "@/features/admin/navbar-style-defaults";
import { PLACEHOLDER_TOKENS } from "@/lib/placeholders";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const navItemSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().trim().min(1).max(50),
  href: z.string().trim().min(1).max(200),
  isVisible: z.boolean(),
  order: z.number().int().min(0).max(100),
});

const pricingPackageSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2).max(80),
  badge: z.string().trim().max(60).optional(),
  isPopular: z.boolean().optional(),
  targetAudience: z.string().trim().min(2).max(160),
  projectPriceLabel: z.string().trim().min(2).max(90),
  retainerPriceLabel: z.string().trim().min(2).max(90),
  comingSoonNote: z.string().trim().min(2).max(240),
  summary: z.string().trim().min(2).max(320),
  deliverables: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
  ctaLabel: z.string().trim().min(2).max(60),
  ctaHref: z.string().trim().min(1).max(200),
});

const pricingConfigSchema = z.object({
  comingSoonMode: z.boolean(),
  sectionEyebrow: z.string().trim().min(2).max(60),
  sectionTitle: z.string().trim().min(2).max(140),
  sectionSubtitle: z.string().trim().min(2).max(360),
  projectToggleLabel: z.string().trim().min(2).max(60),
  retainerToggleLabel: z.string().trim().min(2).max(60),
  statusBannerText: z.string().trim().min(2).max(240),
  packages: z.array(pricingPackageSchema).min(1).max(6),
});

const navbarStyleSchema = z.object({
  topOffset: z.number().int().min(0).max(100),
  sideInset: z.number().int().min(0).max(100),
  maxWidth: z.number().int().min(400).max(2400),
  barHeight: z.number().int().min(40).max(160),
  barPaddingX: z.number().int().min(0).max(80),
  barRadius: z.number().int().min(0).max(80),
  borderWidth: z.number().int().min(0).max(4),
  backdropBlur: z.number().int().min(0).max(40),
  barShadowBlur: z.number().int().min(0).max(80),
  barShadowOpacity: z.number().int().min(0).max(100),
  groupGap: z.number().int().min(0).max(64),
  navGap: z.number().int().min(0).max(32),
  brandMarkSize: z.enum(["sm", "md", "lg"]),
  linkFontSize: z.number().int().min(10).max(24),
  linkFontWeight: z.enum(["400", "500", "600", "700"]),
  linkPaddingX: z.number().int().min(0).max(32),
  linkPaddingY: z.number().int().min(0).max(24),
  linkRadius: z.number().int().min(0).max(1000),
  buttonFontSize: z.number().int().min(10).max(24),
  buttonFontWeight: z.enum(["400", "500", "600", "700"]),
  buttonPaddingX: z.number().int().min(0).max(48),
  buttonPaddingY: z.number().int().min(0).max(32),
  buttonRadius: z.number().int().min(0).max(1000),
  buttonIconGap: z.number().int().min(0).max(24),
  controlSize: z.number().int().min(24).max(64),
  dropdownWidth: z.number().int().min(160).max(500),
  dropdownRadius: z.number().int().min(0).max(48),
  dropdownPadding: z.number().int().min(0).max(24),
  mobileDrawerPadding: z.number().int().min(0).max(40),
  hoverLift: z.number().int().min(0).max(12),
  transitionDuration: z.number().int().min(0).max(1000),
  shadowOpacity: z.number().int().min(0).max(100),
  accentStart: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentEnd: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkBackgroundOpacity: z.number().int().min(0).max(100),
  darkPanel: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkMutedText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkBorderOpacity: z.number().int().min(0).max(100),
  darkHoverBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkHoverText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkButtonBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkButtonBackgroundOpacity: z.number().int().min(0).max(100),
  darkButtonText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkButtonBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkButtonBorderOpacity: z.number().int().min(0).max(100),
  darkButtonHoverBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  darkButtonHoverText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightBackgroundOpacity: z.number().int().min(0).max(100),
  lightPanel: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightMutedText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightBorderOpacity: z.number().int().min(0).max(100),
  lightHoverBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightHoverText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightButtonBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightButtonBackgroundOpacity: z.number().int().min(0).max(100),
  lightButtonText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightButtonBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightButtonBorderOpacity: z.number().int().min(0).max(100),
  lightButtonHoverBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lightButtonHoverText: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const siteSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  positioning: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(140),
  founderName: z.string().trim().min(2).max(80),
  contactEmail: z
    .string()
    .trim()
    .max(140)
    .refine(
      (val) =>
        val === PLACEHOLDER_TOKENS.CONTACT_EMAIL ||
        z.string().email().safeParse(val).success,
      "Enter a valid contact email or keep {{CONTACT_EMAIL}} until ready."
    ),
  supportHours: z.string().trim().min(2).max(160),
  bookingUrl: z.string().trim().min(1).max(200),
  primaryCtaLabel: z.string().trim().min(2).max(60),
  primaryCtaHref: z.string().trim().min(1).max(200),
  secondaryCtaLabel: z.string().trim().min(2).max(60),
  secondaryCtaHref: z.string().trim().min(1).max(200),
  navigation: z.array(navItemSchema).min(1).max(20),
  navbarStyle: navbarStyleSchema.optional(),
  publish: z.boolean().optional(),
  footerLinks: z.object({
    services: z.array(navItemSchema).max(15),
    company: z.array(navItemSchema).max(15),
    legal: z.array(navItemSchema).max(15),
  }),
  pricingConfig: pricingConfigSchema.optional(),
});

function cleanHref(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return "/contact";
}

function sanitizePricingConfig(
  raw: z.infer<typeof pricingConfigSchema>
): PricingConfig {
  return {
    comingSoonMode: Boolean(raw.comingSoonMode),
    sectionEyebrow: sanitizePlainText(raw.sectionEyebrow, 60),
    sectionTitle: sanitizePlainText(raw.sectionTitle, 140),
    sectionSubtitle: sanitizePlainText(raw.sectionSubtitle, 360),
    projectToggleLabel: sanitizePlainText(raw.projectToggleLabel, 60),
    retainerToggleLabel: sanitizePlainText(raw.retainerToggleLabel, 60),
    statusBannerText: sanitizePlainText(raw.statusBannerText, 240),
    packages: raw.packages.map((pkg, idx) => ({
      id: sanitizePlainText(pkg.id, 60) || `pkg_${idx + 1}`,
      name: sanitizePlainText(pkg.name, 80),
      badge: pkg.badge ? sanitizePlainText(pkg.badge, 60) : undefined,
      isPopular: Boolean(pkg.isPopular),
      targetAudience: sanitizePlainText(pkg.targetAudience, 160),
      projectPriceLabel: sanitizePlainText(pkg.projectPriceLabel, 90),
      retainerPriceLabel: sanitizePlainText(pkg.retainerPriceLabel, 90),
      comingSoonNote: sanitizePlainText(pkg.comingSoonNote, 240),
      summary: sanitizePlainText(pkg.summary, 320),
      deliverables: pkg.deliverables
        .map((item) => sanitizePlainText(item, 180))
        .filter(Boolean),
      ctaLabel: sanitizePlainText(pkg.ctaLabel, 60),
      ctaHref: cleanHref(pkg.ctaHref),
    })),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "settings:manage");
  if (!auth.ok) return auth.response;

  const settings = new URL(request.url).searchParams.get("draft") === "1"
    ? await db.getSiteSettingsDraft()
    : auth.settings;
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApiAuth(request, "settings:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid site settings payload." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const cleanNav = (items: z.infer<typeof navItemSchema>[]) =>
    items.map((item, idx) => ({
      id: sanitizePlainText(item.id, 60) || `nav_${idx + 1}`,
      label: sanitizePlainText(item.label, 50),
      href: cleanHref(item.href),
      isVisible: item.isVisible,
      order: idx + 1,
    }));

  const settingsBase = await db.getSiteSettingsDraft();
  const nextPricingConfig = d.pricingConfig
    ? sanitizePricingConfig(d.pricingConfig)
    : settingsBase.pricingConfig;

  const nextSettings = {
    ...settingsBase,
    companyName: sanitizePlainText(d.companyName, 80),
    positioning: sanitizePlainText(d.positioning, 120),
    tagline: sanitizePlainText(d.tagline, 140),
    founderName: sanitizePlainText(d.founderName, 80),
    contactEmail:
      d.contactEmail.trim() === PLACEHOLDER_TOKENS.CONTACT_EMAIL
        ? PLACEHOLDER_TOKENS.CONTACT_EMAIL
        : d.contactEmail.trim().toLowerCase(),
    supportHours: sanitizePlainText(d.supportHours, 160),
    bookingUrl: cleanHref(d.bookingUrl),
    primaryCtaLabel: sanitizePlainText(d.primaryCtaLabel, 60),
    primaryCtaHref: cleanHref(d.primaryCtaHref),
    secondaryCtaLabel: sanitizePlainText(d.secondaryCtaLabel, 60),
    secondaryCtaHref: cleanHref(d.secondaryCtaHref),
    navigation: cleanNav(d.navigation),
    navbarStyle: d.navbarStyle ?? settingsBase.navbarStyle ?? DEFAULT_NAVBAR_STYLE_SETTINGS,
    footerLinks: {
      services: cleanNav(d.footerLinks.services),
      company: cleanNav(d.footerLinks.company),
      legal: cleanNav(d.footerLinks.legal),
    },
    pricingConfig: nextPricingConfig,
  };
  const publish = d.publish !== false;
  const updated = publish
    ? await db.saveSiteSettings(nextSettings)
    : await db.saveSiteSettingsDraft(nextSettings);
  if (publish) {
    await db.saveSiteSettingsDraft(updated);
    revalidateAllPublicContent();
  }
  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: publish ? "settings.updated" : "settings.draft_saved",
    entityType: "settings",
    summary: publish
      ? d.pricingConfig
        ? `Published global Site Settings and Pricing Studio (comingSoonMode: ${Boolean(nextPricingConfig?.comingSoonMode)}).`
        : "Published global Navigation, Footer links, and CTA settings."
      : "Saved global navbar, navigation, footer, pricing, and CTA changes as a draft.",
    ipAddress: extractClientIp(request.headers),
  });


  return NextResponse.json({ ok: true, published: publish, settings: updated });
}
