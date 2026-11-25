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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getCanonicalSiteUrl();

  const [pages, services, caseStudies, blogPosts] = await Promise.all([
    getCachedPages(),
    getCachedPublishedServices(),
    getCachedPublishedCaseStudies(),
    getCachedPublishedBlogPosts(),
  ]);

  const noIndexSlugs = new Set(
    pages
      .filter((p) => p.seo?.noIndex)
      .map((p) => p.slug.toLowerCase())
  );

  const entries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.filter(
    (route) => {
      const slug = route.path === "/" ? "home" : route.path.replace(/^\//, "");
      return !noIndexSlugs.has(slug.toLowerCase());
    }
  ).map((route) => ({
    url: `${baseUrl}${route.path === "/" ? "" : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  for (const svc of services) {
    if (svc.seo?.noIndex) continue;
    entries.push({
      url: `${baseUrl}/services/${svc.slug}`,
      lastModified: new Date(svc.updatedAt),
      changeFrequency: "monthly",
      priority: svc.isFlagshipPriority ? 0.88 : 0.78,
    });
  }

  for (const cs of caseStudies) {
    if (cs.seo?.noIndex) continue;
    entries.push({
      url: `${baseUrl}/case-studies/${cs.slug}`,
      lastModified: new Date(cs.updatedAt),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const post of blogPosts) {
    if (post.seo?.noIndex) continue;
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: 0.76,
    });
  }

  return entries;
}
