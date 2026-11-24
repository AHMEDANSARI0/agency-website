import { NextResponse } from "next/server";
import { z } from "zod";
import type { PricingConfig } from "@/types/content";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
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

const siteSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  positioning: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(140),
  founderName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email().max(140),
  supportHours: z.string().trim().min(2).max(160),
  bookingUrl: z.string().trim().min(1).max(200),
  primaryCtaLabel: z.string().trim().min(2).max(60),
  primaryCtaHref: z.string().trim().min(1).max(200),
  secondaryCtaLabel: z.string().trim().min(2).max(60),
  secondaryCtaHref: z.string().trim().min(1).max(200),
  navigation: z.array(navItemSchema).min(1).max(20),
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

  return NextResponse.json({ settings: auth.settings });
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

  const nextPricingConfig = d.pricingConfig
    ? sanitizePricingConfig(d.pricingConfig)
    : auth.settings.pricingConfig;

  const updated = await db.saveSiteSettings({
    ...auth.settings,
    companyName: sanitizePlainText(d.companyName, 80),
    positioning: sanitizePlainText(d.positioning, 120),
    tagline: sanitizePlainText(d.tagline, 140),
    founderName: sanitizePlainText(d.founderName, 80),
    contactEmail: d.contactEmail.toLowerCase(),
    supportHours: sanitizePlainText(d.supportHours, 160),
    bookingUrl: cleanHref(d.bookingUrl),
    primaryCtaLabel: sanitizePlainText(d.primaryCtaLabel, 60),
    primaryCtaHref: cleanHref(d.primaryCtaHref),
    secondaryCtaLabel: sanitizePlainText(d.secondaryCtaLabel, 60),
    secondaryCtaHref: cleanHref(d.secondaryCtaHref),
    navigation: cleanNav(d.navigation),
    footerLinks: {
      services: cleanNav(d.footerLinks.services),
      company: cleanNav(d.footerLinks.company),
      legal: cleanNav(d.footerLinks.legal),
    },
    pricingConfig: nextPricingConfig,
  });

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "settings.updated",
    entityType: "settings",
    summary: d.pricingConfig
      ? `Updated global Site Settings and Pricing Studio (comingSoonMode: ${Boolean(nextPricingConfig?.comingSoonMode)}).`
      : "Updated global Navigation, Footer links, and CTA settings.",
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, settings: updated });
}
