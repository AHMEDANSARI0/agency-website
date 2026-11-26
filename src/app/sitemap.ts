import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import {
  getCachedPages,
  getCachedPublishedBlogPosts,
  getCachedPublishedCaseStudies,
  getCachedPublishedServices,
} from "@/lib/cache/public-cache";

export const revalidate = 600;

const STATIC_PUBLIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.85, changeFrequency: "monthly" },
  { path: "/solutions", priority: 0.85, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.85, changeFrequency: "monthly" },
  { path: "/demos", priority: 0.9, changeFrequency: "weekly" },
  { path: "/case-studies", priority: 0.85, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.75, changeFrequency: "monthly" },
  { path: "/team", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.75, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
];

/** Only list the page's own URL. Alternate/external canonicals require manual review. */
function isSelfCanonical(override: string | null | undefined, url: string, baseUrl: string): boolean {
  if (!override?.trim()) return true;
  try {
    const parsed = new URL(override.trim(), `${baseUrl}/`);
    const expected = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) return false;
    const path = (value: string) => value.replace(/\/+$/, "") || "/";
    return parsed.origin === expected.origin && path(parsed.pathname) === path(expected.pathname);
  } catch { return false; }
}

function validDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getCanonicalSiteUrl();

  const [pages, services, caseStudies, blogPosts] = await Promise.all([
    getCachedPages(),
    getCachedPublishedServices(),
    getCachedPublishedCaseStudies(),
    getCachedPublishedBlogPosts(),
  ]);

  const pagesBySlug = new Map<string, (typeof pages)[number]>();
  for (const page of pages) {
    const key = page.slug.toLowerCase();
    if (!pagesBySlug.has(key)) pagesBySlug.set(key, page);
  }
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const add = (url: string, canonical: string | null | undefined, updatedAt: string | undefined,
               changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => {
    if (seen.has(url) || !isSelfCanonical(canonical, url, baseUrl)) return;
    seen.add(url);
    const lastModified = validDate(updatedAt);
    entries.push({ url, ...(lastModified ? { lastModified } : {}), changeFrequency, priority });
  };

  for (const route of STATIC_PUBLIC_ROUTES) {
    const slug = route.path === "/" ? "home" : route.path.slice(1);
    const page = pagesBySlug.get(slug.toLowerCase());
    if (page?.seo?.noIndex) continue;
    const url = `${baseUrl}${route.path === "/" ? "" : route.path}`;
    add(url, page?.seo?.canonicalUrl, page?.updatedAt, route.changeFrequency, route.priority);
  }
  const serviceSlugs = new Set<string>();
  for (const svc of services) {
    if (!svc.slug?.trim() || serviceSlugs.has(svc.slug.toLowerCase())) continue;
    serviceSlugs.add(svc.slug.toLowerCase());
    if (svc.seo?.noIndex) continue;
    add(`${baseUrl}/services/${encodeURIComponent(svc.slug)}`, svc.seo?.canonicalUrl, svc.updatedAt, "monthly", svc.isFlagshipPriority ? 0.88 : 0.78);
  }
  const studySlugs = new Set<string>();
  for (const cs of caseStudies) {
    if (!cs.slug?.trim() || studySlugs.has(cs.slug.toLowerCase())) continue;
    studySlugs.add(cs.slug.toLowerCase());
    if (cs.seo?.noIndex) continue;
    add(`${baseUrl}/case-studies/${encodeURIComponent(cs.slug)}`, cs.seo?.canonicalUrl, cs.updatedAt, "monthly", 0.8);
  }
  const postSlugs = new Set<string>();
  for (const post of blogPosts) {
    if (!post.slug?.trim() || postSlugs.has(post.slug.toLowerCase())) continue;
    postSlugs.add(post.slug.toLowerCase());
    if (post.seo?.noIndex) continue;
    add(`${baseUrl}/blog/${encodeURIComponent(post.slug)}`, post.seo?.canonicalUrl, post.updatedAt, "monthly", 0.76);
  }

  return entries;
}
