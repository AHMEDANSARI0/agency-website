import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import * as cache from "@/lib/cache/public-cache";

vi.mock("@/lib/cache/public-cache", () => ({
  getCachedPages: vi.fn(), getCachedPublishedServices: vi.fn(),
  getCachedPublishedCaseStudies: vi.fn(), getCachedPublishedBlogPosts: vi.fn(),
}));
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllEnvs();});

describe("sitemap accuracy and robust rendering", () => {
  it("excludes noindex and non-self canonicals, omits invalid dates, and deduplicates URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agency.invalid");
    vi.mocked(cache.getCachedPages).mockResolvedValue([
      {slug:"home", seo:{canonicalUrl:"https://agency.invalid/"}, updatedAt:"2024-02-01T00:00:00Z"},
      {slug:"pricing", seo:{noIndex:true}},
      {slug:"solutions", seo:{canonicalUrl:"https://elsewhere.invalid/solutions"}},
      {slug:"about", seo:{canonicalUrl:"/about"}, updatedAt:"not-a-date"},
    ] as never);
    vi.mocked(cache.getCachedPublishedServices).mockResolvedValue([
      {slug:"lead-management", seo:{}, updatedAt:"2024-02-03T00:00:00Z"},
      {slug:"lead-management", seo:{}, updatedAt:"2024-02-03T00:00:00Z"},
      {slug:"hidden", seo:{noIndex:true}},
      {slug:"HIDDEN", seo:{}},
      {slug:"old", seo:{canonicalUrl:"/services/new"}},
    ] as never);
    vi.mocked(cache.getCachedPublishedCaseStudies).mockResolvedValue([{slug:"encoded title", seo:{},updatedAt:"bad"}] as never);
    vi.mocked(cache.getCachedPublishedBlogPosts).mockResolvedValue([{slug:"story", seo:{canonicalUrl:"https://agency.invalid/blog/story?x=1"}}] as never);
    const results = await sitemap(); const urls=results.map(x=>x.url);
    expect(urls).toContain("https://agency.invalid");
    expect(urls).not.toContain("https://agency.invalid/pricing");
    expect(urls).not.toContain("https://agency.invalid/solutions");
    expect(urls).not.toContain("https://agency.invalid/services/hidden");
    expect(urls).not.toContain("https://agency.invalid/services/old");
    expect(urls).not.toContain("https://agency.invalid/blog/story");
    expect(urls).toContain("https://agency.invalid/case-studies/encoded%20title");
    expect(urls.filter(x=>x.endsWith("/services/lead-management"))).toHaveLength(1);
    expect(results.find(x=>x.url.endsWith("/about"))?.lastModified).toBeUndefined();
    expect(results.find(x=>x.url.endsWith("/services/lead-management"))?.lastModified).toEqual(new Date("2024-02-03T00:00:00Z"));
    expect(results.find(x=>x.url.endsWith("/contact"))?.lastModified).toBeUndefined();
  });
  it("permits Next static assets for rendering while keeping private paths excluded", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agency.invalid");
    const rules=robots().rules;const rule=Array.isArray(rules)?rules[0]:rules;
    expect(rule?.disallow).toContain("/admin"); expect(rule?.disallow).toContain("/api/");
    expect(rule?.disallow).not.toContain("/_next/");
  });
  it("removes the global loading boundary and includes a bounded hydration-failure reveal fallback", () => {
    expect(fs.existsSync(path.join(process.cwd(),"src/app/loading.tsx"))).toBe(false);
    const layout=fs.readFileSync(path.join(process.cwd(),"src/app/layout.tsx"),"utf8");
    const runtime=fs.readFileSync(path.join(process.cwd(),"src/components/animations/MotionRuntime.tsx"),"utf8");
    expect(layout).toContain("if(!d.dataset.motionRuntime)delete d.dataset.motion");
    expect(runtime).toContain('dataset.motionRuntime = "ready"');
    expect(runtime).toContain("delete document.documentElement.dataset.motionRuntime");
  });
});
