import type { PricingConfig, SiteSettings } from "@/types/content";

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  comingSoonMode: false,
  sectionEyebrow: "Pricing & Scopes",
  sectionTitle: "Clear written scopes before any work begins.",
  sectionSubtitle:
    "Projects typically start from {{PRICE_FROM}} depending on how many tools and approval steps we connect. Every engagement starts with a free 25-minute workflow review.",
  projectToggleLabel: "Fixed-Scope Build",
  retainerToggleLabel: "Ongoing Care & Tuning",
  statusBannerText: "Projects typically start from {{PRICE_FROM}}",
  packages: [
    {
      id: "tier-starter",
      name: "Starter",
      badge: "Single Workflow",
      isPopular: false,
      targetAudience: "Solo consultants & small clinics",
      projectPriceLabel: "From {{PRICE_FROM}}",
      retainerPriceLabel: "Optional Monthly Care",
      comingSoonNote: "Fixed written quote after free review",
      summary:
        "Fix one daily bottleneck — capture every enquiry 24/7, qualify it cleanly, and send your team an instant brief.",
      deliverables: [
        "1 end-to-end lead or booking workflow",
        "24/7 form validation & spam filtering",
        "CRM update + instant WhatsApp or email alert",
        "Plain-English guide & 100% client ownership",
      ],
      ctaLabel: "Book a free workflow review",
      ctaHref: "/contact?intent=call&tier=starter",
    },
    {
      id: "tier-growth",
      name: "Growth",
      badge: "Most Popular",
      isPopular: true,
      targetAudience: "Growing clinics, consultancies & agencies",
      projectPriceLabel: "Custom Fixed Scope",
      retainerPriceLabel: "Priority Monthly Tuning",
      comingSoonNote: "Scoped to your CRM & inbox volume",
      summary:
        "Connect lead scoring, approved-FAQ customer replies, and booking follow-ups with human sign-off on important steps.",
      deliverables: [
        "Instant lead scoring + duplicate-safe CRM sync",
        "24/7 FAQ replies strictly from your approved policies",
        "One-click human approval for quotes & exceptions",
        "Fallback retry queue so no enquiry is ever lost",
      ],
      ctaLabel: "Book a free workflow review",
      ctaHref: "/contact?intent=call&tier=growth",
    },
    {
      id: "tier-scale",
      name: "Scale",
      badge: "Multi-Team Ops",
      isPopular: false,
      targetAudience: "Established firms connecting sales & delivery",
      projectPriceLabel: "Multi-Workflow Scope",
      retainerPriceLabel: "Dedicated Ops Partner",
      comingSoonNote: "Scoped across 4+ business tools",
      summary:
        "Keep your CRM, client onboarding folders, billing updates, and weekly summary reports in sync without copy-pasting.",
      deliverables: [
        "Connected workflows across 4+ tools in your stack",
        "Automatic client kickoff tasks & folder setup",
        "Weekly response-time & pipeline summary report",
        "Live team training & post-launch check-ins",
      ],
      ctaLabel: "Book a free workflow review",
      ctaHref: "/contact?intent=call&tier=scale",
    },
    {
      id: "tier-enterprise",
      name: "Enterprise",
      badge: "Custom Systems",
      isPopular: false,
      targetAudience: "Multi-site teams needing custom internal tools",
      projectPriceLabel: "Tailored Proposal",
      retainerPriceLabel: "Principal Advisory SLA",
      comingSoonNote: "Custom architecture & security review",
      summary:
        "Custom internal portals, role-based approval workflows, audit logs, and direct founder-led architectural oversight.",
      deliverables: [
        "Custom internal dashboards, databases & APIs",
        "Role-based permissions & complete audit logs",
        "Security review & self-hosted deployment option",
        "Direct founder oversight across US/UK/CA hours",
      ],
      ctaLabel: "Book a free workflow review",
      ctaHref: "/contact?intent=call&tier=enterprise",
    },
  ],
};

function isUntouchedLegacyComingSoonPricing(cfg: PricingConfig): boolean {
  return Boolean(
    cfg.comingSoonMode === true &&
      typeof cfg.statusBannerText === "string" &&
      cfg.statusBannerText.includes("Published Tier Rates Coming Soon")
  );
}

export function resolvePricingConfig(settings?: SiteSettings | null): PricingConfig {
  if (
    !settings?.pricingConfig ||
    !Array.isArray(settings.pricingConfig.packages) ||
    isUntouchedLegacyComingSoonPricing(settings.pricingConfig)
  ) {
    return DEFAULT_PRICING_CONFIG;
  }
  return {
    ...DEFAULT_PRICING_CONFIG,
    ...settings.pricingConfig,
    packages:
      settings.pricingConfig.packages.length > 0
        ? settings.pricingConfig.packages
        : DEFAULT_PRICING_CONFIG.packages,
  };
}
