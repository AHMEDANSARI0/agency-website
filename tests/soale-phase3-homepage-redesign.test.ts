import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING_CONFIG,
  resolvePricingConfig,
} from "@/features/pricing/default-pricing";

describe("Soale Redesign Phase 3 — Homepage Redesign, Card Architecture & Own Navbar Preservation", () => {
  it("1. wires Admin-driven Navbar.tsx with theme switching while upgrading Footer.tsx to Soale semantic tokens", () => {
    const navbarSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );
    expect(navbarSrc).toContain("settings.navigation");
    expect(navbarSrc).toContain("BrandMark");
    expect(navbarSrc).toContain("useTheme");
    expect(navbarSrc).toContain('aria-label="Switch color theme"');

    const footerSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Footer.tsx"),
      "utf8"
    );
    expect(footerSrc).toContain("SoaleArrowButton");
    expect(footerSrc).toContain("CookiePreferencesButton");
    expect(footerSrc).toContain("/feed.xml");
  });

  it("2. wires all Soale Homepage section components, 10-stage process pills, frosted work cards, and split FAQ into page.tsx", () => {
    const homeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/page.tsx"),
      "utf8"
    );

    expect(homeSrc).toContain("PinnedHero");
    expect(homeSrc).toContain("SoaleWorkShowcase");
    expect(homeSrc).toContain("SoaleServicesShowcase");
    expect(homeSrc).toContain("SoaleProcessSection");
    expect(homeSrc).toContain("SoaleEditorialProof");
    expect(homeSrc).toContain("SoalePricingSection");
    expect(homeSrc).toContain("SoaleFaqAccordion");
    expect(homeSrc).toContain('data-card-motion-id="home-standalone-cta"');

    const workSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleWorkShowcase.tsx"
      ),
      "utf8"
    );
    expect(workSrc).toContain("soale-work-tab");
    expect(workSrc).toContain("soale-frosted-overlay");
    expect(workSrc).toContain("Inspect Blueprint");

    const processSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleProcessSection.tsx"
      ),
      "utf8"
    );
    expect(processSrc).toContain("soale-process-pill");
    for (const num of ["01", "02", "03", "04"]) {
      expect(processSrc).toContain(`"${num}"`);
    }
    expect(processSrc).not.toContain('"05"');
  });

  it("3. configures 4-tier Starter/Growth/Scale/Enterprise pricing with {{PRICE_FROM}} placeholder and zero Coming Soon badges", () => {
    expect(DEFAULT_PRICING_CONFIG.comingSoonMode).toBe(false);
    expect(DEFAULT_PRICING_CONFIG.statusBannerText).toContain("{{PRICE_FROM}}");
    expect(DEFAULT_PRICING_CONFIG.packages).toHaveLength(4);
    expect(DEFAULT_PRICING_CONFIG.packages.map((p) => p.name)).toEqual([
      "Starter",
      "Growth",
      "Scale",
      "Enterprise",
    ]);

    for (const pkg of DEFAULT_PRICING_CONFIG.packages) {
      expect(pkg.projectPriceLabel).not.toContain("$");
      expect(pkg.retainerPriceLabel).not.toContain("$");
      expect(pkg.deliverables.length).toBeGreaterThanOrEqual(4);
    }

    const resolved = resolvePricingConfig(null);
    expect(resolved.packages).toHaveLength(4);
  });
});
