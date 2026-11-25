import type { Metadata } from "next";
import {
  getCachedPageBySlug,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { stripTrailingBrand } from "@/lib/seo/title";

export interface StaticRouteSeoDefault {
  slug: string;
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  primaryH1: string;
  jsonLdTypes: string[];
  sitemapPriority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}

export const STATIC_ROUTE_SEO_DEFAULTS: Record<string, StaticRouteSeoDefault> = {
  services: {
    slug: "services",
    path: "/services",
    label: "Services Directory",
    defaultTitle: "AI Automation & Business Services",
    defaultDescription:
      "Explore OmniFlow’s 8 core automation services: Lead Management, Grounded AI Customer Support, Workflow Automation, and specialized AI operations.",
    primaryH1: "Workflow & AI Systems Built Around Real Business Bottlenecks",
    jsonLdTypes: ["Organization", "WebSite", "ItemList"],
    sitemapPriority: 0.9,
    changeFrequency: "weekly",
  },
  solutions: {
    slug: "solutions",
    path: "/solutions",
    label: "Industry Solutions",
    defaultTitle: "Solutions by Industry & Team",
    defaultDescription:
      "Practical AI and workflow automation solutions tailored for service businesses, consultants, and agencies across the USA, UK, and Canada.",
    primaryH1: "Practical Automation Playbooks by Industry",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.85,
    changeFrequency: "weekly",
  },
  pricing: {
    slug: "pricing",
    path: "/pricing",
    label: "Pricing & Scopes",
    defaultTitle: "Pricing & Written Scopes",
    defaultDescription:
      "Clear fixed-scope automation pricing from OmniFlow — Starter, Growth, Scale, and Enterprise builds with 100% client ownership across US, UK, and Canada.",
    primaryH1: "Simple, Written Scope Before Any Build Starts",
    jsonLdTypes: ["Organization", "WebSite", "FAQPage"],
    sitemapPriority: 0.9,
    changeFrequency: "weekly",
  },
  "how-it-works": {
    slug: "how-it-works",
    path: "/how-it-works",
    label: "How It Works",
    defaultTitle: "How It Works & Delivery Process",
    defaultDescription:
      "Our transparent 4-phase process for reviewing, building, testing, and handing over reliable AI workflow automation for growing service businesses.",
    primaryH1: "From Bottleneck Review to Live Workflow in Weeks",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.85,
    changeFrequency: "monthly",
  },
  "case-studies": {
    slug: "case-studies",
    path: "/case-studies",
    label: "Case Studies Index",
    defaultTitle: "Case Studies & Workflow Blueprints",
    defaultDescription:
      "Detailed technical breakdowns of OmniFlow lead qualification, policy-grounded customer support, and agency onboarding automation architectures.",
    primaryH1: "Transparent Workflow Architectures & Scenario Proof",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.85,
    changeFrequency: "weekly",
  },
  demos: {
    slug: "demos",
    path: "/demos",
    label: "Interactive Demos",
    defaultTitle: "Interactive Automation Demos & ROI",
    defaultDescription:
      "Test OmniFlow’s 5 live workflow demos: Lead Qualification, Grounded AI Support, Workflow Simulator, Multi-Currency ROI Calculator, and Readiness Check.",
    primaryH1: "Test Five Live Workflow Simulators in Your Browser",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.85,
    changeFrequency: "monthly",
  },
  blog: {
    slug: "blog",
    path: "/blog",
    label: "Blog & Guides Index",
    defaultTitle: "Insights & Automation Playbooks",
    defaultDescription:
      "Operational articles and implementation guides on lead qualification, policy-grounded AI customer support, and reliable business workflows.",
    primaryH1: "Practical Implementation Guides & Operations Notes",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.8,
    changeFrequency: "weekly",
  },
  about: {
    slug: "about",
    path: "/about",
    label: "About Us",
    defaultTitle: "About Us & Engineering Standards",
    defaultDescription:
      "Founded by Ahmed Ansari, OmniFlow builds dependable, transparent AI automation and business workflow systems for service businesses and agencies.",
    primaryH1: "Practical Engineering for Businesses That Value Reliability",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.75,
    changeFrequency: "monthly",
  },
  team: {
    slug: "team",
    path: "/team",
    label: "Founder & Team",
    defaultTitle: "Founder & Engineering Leadership",
    defaultDescription:
      "Meet Ahmed Ansari, Founder of OmniFlow, and learn how our automation engineering engagements are led across the US, UK, and Canada.",
    primaryH1: "Founder-Led Engineering With Direct Accountability",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.7,
    changeFrequency: "monthly",
  },
  faq: {
    slug: "faq",
    path: "/faq",
    label: "FAQ",
    defaultTitle: "Frequently Asked Questions",
    defaultDescription:
      "Clear answers about OmniFlow’s AI automation process, data ownership, cost control, human guardrails, and US/UK/Canada engagement workflow.",
    primaryH1: "Straight Answers Before We Talk",
    jsonLdTypes: ["Organization", "WebSite", "FAQPage"],
    sitemapPriority: 0.75,
    changeFrequency: "monthly",
  },
  contact: {
    slug: "contact",
    path: "/contact",
    label: "Contact & Booking",
    defaultTitle: "Book a Free Workflow Review",
    defaultDescription:
      "Book a free 25-minute workflow review or send an enquiry to OmniFlow. Answer leads faster, stop manual copy-pasting, and keep human approval gates.",
    primaryH1: "Let’s Review One Workflow Bottleneck Together",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.9,
    changeFrequency: "monthly",
  },
  "privacy-policy": {
    slug: "privacy-policy",
    path: "/privacy-policy",
    label: "Privacy Policy",
    defaultTitle: "Privacy Policy & Data Governance",
    defaultDescription:
      "How OmniFlow collects, processes, protects, and retains business enquiry data across US, UK, and Canadian client operations.",
    primaryH1: "Privacy Policy",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.3,
    changeFrequency: "yearly",
  },
  "terms-of-service": {
    slug: "terms-of-service",
    path: "/terms-of-service",
    label: "Terms of Service",
    defaultTitle: "Terms of Service & Engagement",
    defaultDescription:
      "Website terms of use, interactive demonstration disclaimers, client IP ownership, and engagement principles for OmniFlow.",
    primaryH1: "Terms of Service",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.3,
    changeFrequency: "yearly",
  },
  "cookie-policy": {
    slug: "cookie-policy",
    path: "/cookie-policy",
    label: "Cookie Policy",
    defaultTitle: "Cookie Policy & Consent Controls",
    defaultDescription:
      "Clear details on essential theme storage, admin authentication cookies, and optional consent-gated analytics on OmniFlow.",
    primaryH1: "Cookie Policy",
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.3,
    changeFrequency: "yearly",
  },
};

/**
 * Resolves full dynamic Next.js `Metadata` for any static route (`slug`),
 * merging Admin-saved `PageDocument.seo` overrides from the CMS over clean
 * defaults so every page supports 1-click live SEO fixes without code changes.
 */
export async function buildStaticRouteMetadata(slug: string): Promise<Metadata> {
  const [pageDoc, settings] = await Promise.all([
    getCachedPageBySlug(slug),
    getCachedSiteSettings(),
  ]);

  const fallback = STATIC_ROUTE_SEO_DEFAULTS[slug] ?? {
    slug,
    path: `/${slug}`,
    label: slug,
    defaultTitle: slug,
    defaultDescription: settings.tagline,
    primaryH1: slug,
    jsonLdTypes: ["Organization", "WebSite"],
    sitemapPriority: 0.5,
    changeFrequency: "monthly" as const,
  };

  const baseUrl = getCanonicalSiteUrl();
  const brand = settings.companyName || "OmniFlow";

  const rawTitle = pageDoc?.seo?.seoTitle?.trim() || fallback.defaultTitle;
  const cleanChildTitle = stripTrailingBrand(rawTitle, brand);
  const fullDisplayTitle = `${cleanChildTitle} | ${brand}`;

  const description =
    pageDoc?.seo?.seoDescription?.trim() || fallback.defaultDescription;

  const rawCanonical = pageDoc?.seo?.canonicalUrl?.trim();
  const canonical = rawCanonical
    ? rawCanonical.startsWith("http")
      ? rawCanonical
      : `${baseUrl}${rawCanonical.startsWith("/") ? "" : "/"}${rawCanonical}`
    : `${baseUrl}${fallback.path}`;

  const ogTitle = pageDoc?.seo?.ogTitle?.trim() || fullDisplayTitle;
  const ogDescription = pageDoc?.seo?.ogDescription?.trim() || description;
  const ogImage = pageDoc?.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;
  const noIndex = Boolean(pageDoc?.seo?.noIndex);

  return {
    title: cleanChildTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}
