import type { BrandAssetConfig } from "@/types/brand";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PageDocument,
  ServiceItem,
  SiteSettings,
  TeamMember,
} from "@/types/content";

export const PLACEHOLDER_TOKENS = {
  CONTACT_EMAIL: "{{CONTACT_EMAIL}}",
  WHATSAPP_NUMBER: "{{WHATSAPP_NUMBER}}",
  BOOKING_LINK: "{{BOOKING_LINK}}",
  PRICE_FROM: "{{PRICE_FROM}}",
  FOUNDER_PHOTO_URL: "{{FOUNDER_PHOTO_URL}}",
} as const;

const PLACEHOLDER_REGEX = /\{\{[A-Z0-9_]+\}\}/g;

export interface UnfilledPlaceholderItem {
  token: string;
  fieldLabel: string;
  location: string;
  adminHref: string;
}

export function isPlaceholderValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\{\{[A-Z0-9_]+\}\}/.test(value);
}

export function hasConfiguredContactEmail(
  email: string | null | undefined
): email is string {
  if (!email) return false;
  const trimmed = email.trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return false;
  if (trimmed.toLowerCase().endsWith(".example")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeLegacyContactEmail(rawEmail: string | undefined): string {
  const trimmed = (rawEmail || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "hello@omniflow.example") {
    return PLACEHOLDER_TOKENS.CONTACT_EMAIL;
  }
  return trimmed;
}

export function extractPlaceholderTokens(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(PLACEHOLDER_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export function findUnfilledPlaceholders(input: {
  settings: SiteSettings;
  brand?: BrandAssetConfig;
  pages?: PageDocument[];
  services?: ServiceItem[];
  caseStudies?: CaseStudyItem[];
  blogPosts?: BlogPost[];
  faqs?: FaqItem[];
  teamMembers?: TeamMember[];
}): UnfilledPlaceholderItem[] {
  const items: UnfilledPlaceholderItem[] = [];
  const seen = new Set<string>();

  const pushUnique = (item: UnfilledPlaceholderItem) => {
    const key = `${item.token}::${item.location}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const token of extractPlaceholderTokens(input.settings.contactEmail)) {
    pushUnique({
      token,
      fieldLabel: "Public Contact Email",
      location: "Site Settings → Contact Email",
      adminHref: "/admin/settings",
    });
  }

  for (const token of extractPlaceholderTokens(input.settings.bookingUrl)) {
    pushUnique({
      token,
      fieldLabel: "Booking Calendar Link",
      location: "Site Settings → Booking URL",
      adminHref: "/admin/settings",
    });
  }

  const whatsapp = (input.settings as SiteSettings & { whatsappNumber?: string })
    .whatsappNumber;
  for (const token of extractPlaceholderTokens(whatsapp)) {
    pushUnique({
      token,
      fieldLabel: "WhatsApp Number",
      location: "Site Settings → WhatsApp Number",
      adminHref: "/admin/settings",
    });
  }

  if (input.settings.pricingConfig) {
    const pricingJson = JSON.stringify(input.settings.pricingConfig);
    for (const token of extractPlaceholderTokens(pricingJson)) {
      pushUnique({
        token,
        fieldLabel: "Starting Project Rate",
        location: "Site Settings → Pricing Studio",
        adminHref: "/admin/settings#pricing",
      });
    }
  }

  for (const member of input.teamMembers || []) {
    if (
      member.isFounder &&
      (!member.avatarUrl || isPlaceholderValue(member.avatarUrl))
    ) {
      pushUnique({
        token: PLACEHOLDER_TOKENS.FOUNDER_PHOTO_URL,
        fieldLabel: `Founder Photo (${member.name})`,
        location: "CMS Studio → Leadership & Team",
        adminHref: "/admin/cms?tab=team",
      });
    }
  }

  for (const page of input.pages || []) {
    const pageJson = JSON.stringify(page);
    for (const token of extractPlaceholderTokens(pageJson)) {
      pushUnique({
        token,
        fieldLabel: `Page "${page.title}"`,
        location: `Page Builder → /${page.slug === "home" ? "" : page.slug}`,
        adminHref: "/admin/pages",
      });
    }
  }

  for (const faq of input.faqs || []) {
    for (const token of extractPlaceholderTokens(`${faq.question} ${faq.answer}`)) {
      pushUnique({
        token,
        fieldLabel: `FAQ "${faq.question.slice(0, 48)}"`,
        location: "CMS Studio → FAQs",
        adminHref: "/admin/cms",
      });
    }
  }

  for (const service of input.services || []) {
    for (const token of extractPlaceholderTokens(JSON.stringify(service))) {
      pushUnique({
        token,
        fieldLabel: `Service "${service.title}"`,
        location: "CMS Studio → Services",
        adminHref: "/admin/cms",
      });
    }
  }

  for (const cs of input.caseStudies || []) {
    for (const token of extractPlaceholderTokens(JSON.stringify(cs))) {
      pushUnique({
        token,
        fieldLabel: `Case Study "${cs.title}"`,
        location: "CMS Studio → Case Studies",
        adminHref: "/admin/cms",
      });
    }
  }

  for (const post of input.blogPosts || []) {
    for (const token of extractPlaceholderTokens(JSON.stringify(post))) {
      pushUnique({
        token,
        fieldLabel: `Article "${post.title}"`,
        location: "CMS Studio → Blog",
        adminHref: "/admin/cms",
      });
    }
  }

  return items;
}
