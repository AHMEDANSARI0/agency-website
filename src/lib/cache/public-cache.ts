import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { BrandAssetConfig } from "@/types/brand";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PageDocument,
  RedirectRule,
  ServiceCategoryPillar,
  ServiceItem,
  SiteSettings,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import type { ThemeConfiguration } from "@/types/theme";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import { applyOwnerValues } from "@/lib/owner-config";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";

export const PUBLIC_ISR_REVALIDATE_SECONDS = 600;

export const CACHE_TAGS = {
  settings: "settings",
  theme: "theme",
  brand: "brand",
  pages: "pages",
  services: "services",
  caseStudies: "caseStudies",
  blog: "blog",
  faqs: "faqs",
  team: "team",
  testimonials: "testimonials",
  redirects: "redirects",
} as const;

export type PublicCacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

const lastKnownGood = new Map<string, unknown>();

function isTestRuntime(): boolean {
  return Boolean(process.env.VITEST) || process.env.NODE_ENV === "test";
}

async function readWithLastKnownGood<T>(
  key: string,
  loader: () => Promise<T>,
  seedFallback: () => T
): Promise<T> {
  try {
    const fresh = await loader();
    lastKnownGood.set(key, fresh);
    return fresh;
  } catch (err) {
    if (isTestRuntime()) {
      throw err;
    }
    if (lastKnownGood.has(key)) {
      return lastKnownGood.get(key) as T;
    }
    return seedFallback();
  }
}

function createTaggedCachedReader<T>(
  cacheKey: string,
  tags: PublicCacheTag[],
  loader: () => Promise<T>,
  seedFallback: () => T
): () => Promise<T> {
  const nextCached = unstable_cache(
    () => readWithLastKnownGood(cacheKey, loader, seedFallback),
    ["omniflow-public-v2", cacheKey],
    {
      revalidate: PUBLIC_ISR_REVALIDATE_SECONDS,
      tags,
    }
  );

  return cache(async () => {
    if (isTestRuntime()) {
      return loader();
    }
    try {
      const value = await nextCached();
      lastKnownGood.set(cacheKey, value);
      return value;
    } catch {
      return readWithLastKnownGood(cacheKey, loader, seedFallback);
    }
  });
}

const getCachedRawSiteSettings = createTaggedCachedReader<SiteSettings>(
  "site-settings",
  [CACHE_TAGS.settings],
  () => db.getSiteSettings(),
  () => createInitialSeedSnapshot().siteSettings
);

export const getCachedThemeConfig = createTaggedCachedReader<ThemeConfiguration>(
  "theme-config",
  [CACHE_TAGS.theme],
  () => db.getThemeConfig(),
  () => createInitialSeedSnapshot().themeConfig
);

export const getCachedBrandAssets = createTaggedCachedReader<BrandAssetConfig>(
  "brand-assets",
  [CACHE_TAGS.brand],
  () => db.getBrandAssets(),
  () => createInitialSeedSnapshot().brandAssets
);

export const getCachedServicePillars = createTaggedCachedReader<
  ServiceCategoryPillar[]
>(
  "service-pillars",
  [CACHE_TAGS.services],
  () => db.getServicePillars(),
  () => createInitialSeedSnapshot().servicePillars
);

export const getCachedPublishedServices = createTaggedCachedReader<
  ServiceItem[]
>(
  "published-services",
  [CACHE_TAGS.services],
  () => db.listServices(true),
  () =>
    createInitialSeedSnapshot().services.filter((s) => s.status === "published")
);

export const getCachedPublishedCaseStudies = createTaggedCachedReader<
  CaseStudyItem[]
>(
  "published-case-studies",
  [CACHE_TAGS.caseStudies],
  () => db.listCaseStudies(true),
  () =>
    createInitialSeedSnapshot().caseStudies.filter(
      (c) => c.status === "published"
    )
);

export const getCachedPublishedBlogPosts = createTaggedCachedReader<BlogPost[]>(
  "published-blog-posts",
  [CACHE_TAGS.blog],
  () => db.listBlogPosts(true),
  () =>
    createInitialSeedSnapshot().blogPosts.filter(
      (p) => p.status === "published"
    )
);

export const getCachedPublishedFaqs = createTaggedCachedReader<FaqItem[]>(
  "published-faqs",
  [CACHE_TAGS.faqs],
  () => db.listFaqs(true),
  () => createInitialSeedSnapshot().faqs.filter((f) => f.isPublished)
);

const getCachedRawPublishedTeamMembers = createTaggedCachedReader<
  TeamMember[]
>(
  "published-team",
  [CACHE_TAGS.team],
  () => db.listTeamMembers(true),
  () => createInitialSeedSnapshot().teamMembers.filter((m) => m.isPublished)
);

// Keep owner fallbacks confined to the public render snapshot; the CMS itself is not modified.
export const getCachedSiteSettings = cache(async () => {
  const settings = await getCachedRawSiteSettings();
  return applyOwnerValues({ ...settings, pricingConfig: resolvePricingConfig(settings) }, []).settings;
});
export const getCachedPublishedTeamMembers = cache(async () => {
  const [members, settings] = await Promise.all([getCachedRawPublishedTeamMembers(), getCachedRawSiteSettings()]);
  return applyOwnerValues(settings, members).team;
});
export async function getLaunchOwnerInputs(): Promise<{ settings: SiteSettings; team: TeamMember[] }> {
  const [settings, team] = await Promise.all([getCachedRawSiteSettings(), getCachedRawPublishedTeamMembers()]);
  return { settings, team };
}

export const getCachedPublishedTestimonials = createTaggedCachedReader<
  TestimonialItem[]
>(
  "published-testimonials",
  [CACHE_TAGS.testimonials],
  () => db.listTestimonials(true),
  () =>
    createInitialSeedSnapshot().testimonials.filter(
      (t) => t.isPublished && t.isAuthorized && t.isVerified
    )
);

export const getCachedPages = createTaggedCachedReader<PageDocument[]>(
  "all-pages",
  [CACHE_TAGS.pages],
  () => db.listPages(),
  () => createInitialSeedSnapshot().pages
);

export const getCachedActiveRedirects = createTaggedCachedReader<RedirectRule[]>(
  "active-redirects",
  [CACHE_TAGS.redirects],
  async () => {
    const all = await db.listRedirects();
    return all.filter((r) => r.isActive);
  },
  () => []
);

export const getCachedPageBySlug = cache(
  async (slug: string): Promise<PageDocument | null> => {
    const normalized = slug.trim().toLowerCase();
    const pages = await getCachedPages();
    return pages.find((p) => p.slug.toLowerCase() === normalized) ?? null;
  }
);

export const getCachedServiceBySlug = cache(
  async (slug: string): Promise<ServiceItem | null> => {
    const normalized = slug.trim().toLowerCase();
    const services = await getCachedPublishedServices();
    return services.find((s) => s.slug.toLowerCase() === normalized) ?? null;
  }
);

export const getCachedCaseStudyBySlug = cache(
  async (slug: string): Promise<CaseStudyItem | null> => {
    const normalized = slug.trim().toLowerCase();
    const items = await getCachedPublishedCaseStudies();
    return items.find((c) => c.slug.toLowerCase() === normalized) ?? null;
  }
);

export const getCachedBlogPostBySlug = cache(
  async (slug: string): Promise<BlogPost | null> => {
    const normalized = slug.trim().toLowerCase();
    const posts = await getCachedPublishedBlogPosts();
    return posts.find((p) => p.slug.toLowerCase() === normalized) ?? null;
  }
);

/**
 * Invalidates Next.js ISR tags + paths immediately when an admin saves changes.
 * Safe to invoke inside standalone Vitest route-handler tests where Next's
 * incremental static generation store is not mounted.
 */
export function revalidatePublicContent(
  tags: PublicCacheTag[],
  paths: string[] = ["/"]
): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // No-op outside Next.js server request context (e.g. unit tests)
    }
  }
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // No-op outside Next.js server request context
    }
  }
}

/** Invalidate all public data after a broad CMS/theme/restore change. */
export function revalidateAllPublicContent(): void {
  revalidatePublicContent(Object.values(CACHE_TAGS), ["/", "/services", "/solutions", "/case-studies", "/blog", "/about", "/team", "/faq", "/pricing", "/demos", "/how-it-works", "/contact", "/sitemap.xml", "/robots.txt", "/feed.xml"]);
  try { revalidatePath("/", "layout"); } catch { /* standalone tests have no cache context */ }
}
