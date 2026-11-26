import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CACHE_TAGS,
  PUBLIC_ISR_REVALIDATE_SECONDS,
  getCachedActiveRedirects,
  getCachedPages,
  getCachedPublishedBlogPosts,
  getCachedPublishedCaseStudies,
  getCachedPublishedFaqs,
  getCachedPublishedServices,
  getCachedPublishedTeamMembers,
  getCachedPublishedTestimonials,
  getCachedSiteSettings,
  getCachedThemeConfig,
} from "../src/lib/cache/public-cache";

const ROOT = process.cwd();

describe("Phase 2 — Performance Without Compromising Motion (ISR, Caching, Bundle & GPU Discipline)", () => {
  it("enforces ISR (revalidate = 600) and zero force-dynamic across public layouts and marketing pages", () => {
    expect(PUBLIC_ISR_REVALIDATE_SECONDS).toBe(600);

    const rootLayout = fs.readFileSync(
      path.join(ROOT, "src/app/layout.tsx"),
      "utf8"
    );
    const websiteLayout = fs.readFileSync(
      path.join(ROOT, "src/app/(website)/layout.tsx"),
      "utf8"
    );
    const notFoundPage = fs.readFileSync(
      path.join(ROOT, "src/app/not-found.tsx"),
      "utf8"
    );

    expect(rootLayout).not.toContain('dynamic = "force-dynamic"');
    expect(websiteLayout).not.toContain('dynamic = "force-dynamic"');
    expect(websiteLayout).not.toContain("headers()");
    expect(websiteLayout).not.toContain("findActiveRedirect");
    expect(notFoundPage).not.toContain("headers()");
    expect(notFoundPage).not.toContain("findActiveRedirect");

    // Admin routes remain dynamic
    const adminLayout = fs.readFileSync(
      path.join(ROOT, "src/app/admin/layout.tsx"),
      "utf8"
    );
    expect(adminLayout).toContain('dynamic = "force-dynamic"');

    // Public ISR routes export revalidate = 600 and zero force-dynamic
    const isrRoutes = [
      "src/app/(website)/page.tsx",
      "src/app/(website)/services/page.tsx",
      "src/app/(website)/services/[slug]/page.tsx",
      "src/app/(website)/case-studies/page.tsx",
      "src/app/(website)/case-studies/[slug]/page.tsx",
      "src/app/(website)/blog/page.tsx",
      "src/app/(website)/blog/[slug]/page.tsx",
      "src/app/(website)/pricing/page.tsx",
      "src/app/(website)/faq/page.tsx",
      "src/app/(website)/team/page.tsx",
      "src/app/(website)/work/page.tsx",
      "src/app/(website)/about/page.tsx",
      "src/app/(website)/solutions/page.tsx",
      "src/app/(website)/how-it-works/page.tsx",
      "src/app/(website)/demos/page.tsx",
      "src/app/(website)/contact/page.tsx",
      "src/app/sitemap.ts",
      "src/app/feed.xml/route.ts",
    ];

    for (const rel of isrRoutes) {
      const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
      expect(content, `${rel} should not force-dynamic`).not.toContain(
        'dynamic = "force-dynamic"'
      );
      expect(content, `${rel} should export revalidate = 600`).toContain(
        "export const revalidate = 600"
      );
    }
  });

  it("exposes cached public readers for every CMS tag and wires revalidateTag/revalidatePath into DB writes", async () => {
    expect(Object.keys(CACHE_TAGS)).toEqual(
      expect.arrayContaining([
        "settings",
        "theme",
        "brand",
        "pages",
        "services",
        "caseStudies",
        "blog",
        "faqs",
        "team",
        "testimonials",
        "redirects",
      ])
    );

    const [
      settings,
      theme,
      pages,
      services,
      caseStudies,
      posts,
      faqs,
      team,
      testimonials,
      redirects,
    ] = await Promise.all([
      getCachedSiteSettings(),
      getCachedThemeConfig(),
      getCachedPages(),
      getCachedPublishedServices(),
      getCachedPublishedCaseStudies(),
      getCachedPublishedBlogPosts(),
      getCachedPublishedFaqs(),
      getCachedPublishedTeamMembers(),
      getCachedPublishedTestimonials(),
      getCachedActiveRedirects(),
    ]);

    expect(settings.companyName).toBeTruthy();
    expect(theme.activePresetId).toBeTruthy();
    expect(pages.length).toBeGreaterThan(0);
    expect(services.length).toBeGreaterThan(0);
    expect(caseStudies.length).toBeGreaterThan(0);
    expect(posts.length).toBeGreaterThan(0);
    expect(faqs.length).toBeGreaterThan(0);
    expect(team.length).toBeGreaterThan(0);
    expect(Array.isArray(testimonials)).toBe(true);
    expect(Array.isArray(redirects)).toBe(true);

    const dbSource = fs.readFileSync(
      path.join(ROOT, "src/lib/database/index.ts"),
      "utf8"
    );
    expect(dbSource).toContain("revalidateTag");
    expect(dbSource).toContain("revalidatePath");
  });

  it("co-locates Vercel compute in Tokyo (hnd1) with keep-warm cron and removes dead animation modules", () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")
    );
    expect(vercelConfig.regions).toContain("hnd1");
    expect(vercelConfig.crons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/api/health?probe=liveness" }),
      ])
    );

    expect(
      fs.existsSync(path.join(ROOT, "src/components/animations/Reveal.tsx"))
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(ROOT, "src/components/animations/LightUpText.tsx")
      )
    ).toBe(false);
  });

  it("enforces max 2 self-hosted font families, removes .cv-auto, idle-loads Lenis & GA4, and restricts backdrop-blur to navbar/modals", () => {
    const rootLayout = fs.readFileSync(
      path.join(ROOT, "src/app/layout.tsx"),
      "utf8"
    );
    expect(rootLayout).toContain("Inter");
    expect(rootLayout).toContain("Plus_Jakarta_Sans");
    expect(rootLayout).not.toContain("JetBrains_Mono");

    const globalsCss = fs.readFileSync(
      path.join(ROOT, "src/styles/globals.css"),
      "utf8"
    );
    expect(globalsCss).not.toContain("content-visibility: auto");
    expect(globalsCss).toContain('html[data-tab-hidden="true"]');
    expect(globalsCss).toContain('[data-offscreen="true"]');

    const motionRuntime = fs.readFileSync(
      path.join(ROOT, "src/components/animations/MotionRuntime.tsx"),
      "utf8"
    );
    expect(motionRuntime).toContain('import("lenis")');
    expect(motionRuntime).toContain("requestIdleCallback");

    const consentMgr = fs.readFileSync(
      path.join(ROOT, "src/components/analytics/AnalyticsConsentManager.tsx"),
      "utf8"
    );
    expect(consentMgr).toContain('strategy="lazyOnload"');

    const eyebrow = fs.readFileSync(
      path.join(ROOT, "src/components/ui/soale/SoaleEyebrow.tsx"),
      "utf8"
    );
    expect(eyebrow).not.toContain("backdrop-blur");
  });
});
