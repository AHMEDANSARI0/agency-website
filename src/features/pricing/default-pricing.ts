import type { PricingConfig, SiteSettings } from "@/types/content";

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  comingSoonMode: true,
  sectionEyebrow: "Engagement Scopes & Pricing",
  sectionTitle: "Transparent, scoped delivery — never open-ended guesswork.",
  sectionSubtitle:
    "Every engagement begins with a written workflow audit and clear scope boundaries. Fixed-package pricing tiers are coming soon — request a tailored scope on a free discovery call today.",
  projectToggleLabel: "Fixed-Scope Implementation",
  retainerToggleLabel: "Ongoing Ops & Advisory",
  statusBannerText:
    "Published Tier Rates Coming Soon — All engagements are currently custom-scoped following a free 25-minute workflow audit.",
  packages: [
    {
      id: "tier-starter",
      name: "Starter",
      badge: "Single Workflow",
      isPopular: false,
      targetAudience: "Independent consultants & lean service teams",
      projectPriceLabel: "Custom Scoped",
      retainerPriceLabel: "Optional Post-Launch Care",
      comingSoonNote: "Published Rate Coming Soon",
      summary:
        "Eliminate one high-friction bottleneck — structured lead capture, instant qualification, and clean CRM handoff.",
      deliverables: [
        "1 end-to-end deterministic workflow",
        "Structured 24/7 enquiry intake & validation",
        "CRM sync + instant owner email/WhatsApp brief",
        "Plain-English runbook & 100% client ownership",
      ],
      ctaLabel: "Scope Starter Build",
      ctaHref: "/contact?intent=call&tier=starter",
    },
    {
      id: "tier-growth",
      name: "Growth",
      badge: "Most Requested",
      isPopular: true,
      targetAudience: "Growing clinics, agencies & multi-person practices",
      projectPriceLabel: "Custom Scoped",
      retainerPriceLabel: "Priority Tuning Available",
      comingSoonNote: "Published Rate Coming Soon",
      summary:
        "Connect inbound lead qualification, policy-grounded AI support triage, and multi-channel follow-ups into one reliable core.",
      deliverables: [
        "Lead scoring + duplicate-safe CRM orchestration",
        "Policy-grounded 24/7 AI support with human escalation",
        "Automated discovery booking & SLA alerts",
        "Dead-letter fallback queue & staging QA suite",
      ],
      ctaLabel: "Book Discovery Scope",
      ctaHref: "/contact?intent=call&tier=growth",
    },
    {
      id: "tier-scale",
      name: "Scale",
      badge: "Connected Operations",
      isPopular: false,
      targetAudience: "Established firms unifying sales, delivery & reporting",
      projectPriceLabel: "Custom Scoped",
      retainerPriceLabel: "Dedicated Monthly Ops",
      comingSoonNote: "Published Rate Coming Soon",
      summary:
        "Synchronize CRM, client onboarding provisioning, billing webhooks, and executive operational reporting without manual re-entry.",
      deliverables: [
        "Multi-system workflow orchestration across 4+ tools",
        "Automated client kickoff & workspace provisioning",
        "Executive pipeline & response-time visibility",
        "Team training walkthrough & post-launch tuning",
      ],
      ctaLabel: "Discuss Scale Architecture",
      ctaHref: "/contact?intent=call&tier=scale",
    },
    {
      id: "tier-enterprise",
      name: "Enterprise",
      badge: "Bespoke Systems",
      isPopular: false,
      targetAudience: "Multi-region teams requiring custom internal AI tools",
      projectPriceLabel: "Bespoke Proposal",
      retainerPriceLabel: "Principal Advisory SLA",
      comingSoonNote: "Tailored Architecture Brief",
      summary:
        "Custom TypeScript/SQL internal tools, role-governed AI assistants, strict audit trails, and principal-led architectural oversight.",
      deliverables: [
        "Custom internal portals, SQL schemas & API gateways",
        "Strict human-in-the-loop approval & audit logging",
        "Security review, RBAC & self-hosted deployment option",
        "Direct Principal Architect oversight (US/UK/CA hours)",
      ],
      ctaLabel: "Request Architecture Call",
      ctaHref: "/contact?intent=call&tier=enterprise",
    },
  ],
};

export function resolvePricingConfig(settings?: SiteSettings | null): PricingConfig {
  if (!settings?.pricingConfig || !Array.isArray(settings.pricingConfig.packages)) {
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
