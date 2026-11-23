import type {
  BlogPost,
  FaqItem,
  ServiceItem,
  SiteSettings,
} from "@/types/content";
import type { BrandAssetConfig } from "@/types/brand";

export function getCanonicalSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * Safely serializes structured data for <script type="application/ld+json">
 * Escapes <, >, and & so closing script tags or HTML entities can never break out.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
  baseUrl = getCanonicalSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function buildOrganizationAndWebsiteJsonLd(
  settings: SiteSettings,
  brand: BrandAssetConfig,
  baseUrl = getCanonicalSiteUrl()
) {
  const logoUrl = brand.lightLogoUrl || brand.darkLogoUrl || brand.symbolUrl;
  const resolvedLogo =
    logoUrl && logoUrl.startsWith("/") ? `${baseUrl}${logoUrl}` : logoUrl;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: settings.companyName,
      description: `${settings.positioning}. ${settings.tagline}`,
      url: baseUrl,
      email: settings.contactEmail,
      founder: {
        "@type": "Person",
        name: settings.founderName,
      },
      areaServed: [
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "Canada" },
      ],
      ...(resolvedLogo ? { logo: resolvedLogo } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: settings.companyName,
      description: settings.tagline,
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
    },
  ];
}

export function buildServiceJsonLd(
  service: ServiceItem,
  settings: SiteSettings,
  baseUrl = getCanonicalSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: service.categoryName,
    description: service.shortSummary,
    url: `${baseUrl}/services/${service.slug}`,
    provider: {
      "@type": "Organization",
      name: settings.companyName,
      url: baseUrl,
    },
    areaServed: ["United States", "United Kingdom", "Canada"],
  };
}

export function buildArticleJsonLd(
  post: BlogPost,
  settings: SiteSettings,
  baseUrl = getCanonicalSiteUrl()
) {
  const imageUrl = post.featuredImageUrl
    ? post.featuredImageUrl.startsWith("/")
      ? `${baseUrl}${post.featuredImageUrl}`
      : post.featuredImageUrl
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: settings.companyName,
      url: baseUrl,
    },
    datePublished: post.publishedAt || post.updatedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
    ...(imageUrl ? { image: [imageUrl] } : {}),
  };
}

export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
