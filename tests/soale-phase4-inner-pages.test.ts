import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("Soale Redesign Phase 4 — Inner Pages Redesign, Sticky Service Deck, Pricing Route & Legacy Redirects", () => {
  it("1. upgrades PageHeader, PageConversionBanner, WorkFilterGrid, and BlogFilterList to Soale primitives", () => {
    const headerSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/ui/PageHeader.tsx"),
      "utf8"
    );
    expect(headerSrc).toContain("SoaleEyebrow");
    expect(headerSrc).toContain("soale-h1");

    const bannerSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/PageConversionBanner.tsx"),
      "utf8"
    );
    expect(bannerSrc).toContain("SoaleArrowButton");
    expect(bannerSrc).toContain("SoaleEyebrow");

    const workGridSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/WorkFilterGrid.tsx"),
      "utf8"
    );
    expect(workGridSrc).toContain("soale-work-tab");
    expect(workGridSrc).toContain("soale-frosted-overlay");

    const blogListSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/BlogFilterList.tsx"),
      "utf8"
    );
    expect(blogListSrc).toContain("soale-work-tab");
    expect(blogListSrc).toContain("SoaleCard");
  });

  it("2. implements sticky stacking service deck on /services and legacy slug redirects on /services/[slug]", () => {
    const servicesIndexSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/services/page.tsx"),
      "utf8"
    );
    expect(servicesIndexSrc).toContain("--service-sticky-top");
    expect(servicesIndexSrc).toContain("lg:sticky");
    expect(servicesIndexSrc).toContain("lg:grid-cols-[0.75fr_1fr]");

    const serviceDetailSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/services/[slug]/page.tsx"),
      "utf8"
    );
    expect(serviceDetailSrc).toContain("LEGACY_SERVICE_SLUG_REDIRECTS");
    expect(serviceDetailSrc).toContain("ai-lead-generation");
    expect(serviceDetailSrc).toContain("/services/lead-management");
  });

  it("3. exposes dedicated /pricing route in sitemap and wires Soale alias redirects in not-found.tsx", async () => {
    const pricingPagePath = path.join(
      process.cwd(),
      "src/app/(website)/pricing/page.tsx"
    );
    expect(fs.existsSync(pricingPagePath)).toBe(true);
    const pricingSrc = fs.readFileSync(pricingPagePath, "utf8");
    expect(pricingSrc).toContain("SoalePricingSection");
    expect(pricingSrc).toMatch(/SoaleFaqAccordion|LazyFaqAccordion/);

    const entries = await sitemap();
    expect(entries.some((e) => e.url.endsWith("/pricing"))).toBe(true);

    const middlewareSrc = fs.readFileSync(
      path.join(process.cwd(), "src/middleware.ts"),
      "utf8"
    );
    expect(middlewareSrc).toContain('"/about-us": "/about"');
    expect(middlewareSrc).toContain('"/contact-us": "/contact"');
    expect(middlewareSrc).toContain('"/pricing-plans": "/pricing"');
  });
});
