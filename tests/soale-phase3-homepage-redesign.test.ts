import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING_CONFIG,
  resolvePricingConfig,
} from "@/features/pricing/default-pricing";

describe("Soale Redesign Phase 3 — Homepage Redesign, Card Architecture & Own Navbar Preservation", () => {
  it("1. preserves our own existing Navbar.tsx untouched while upgrading Footer.tsx to Soale semantic tokens", () => {
    const navbarSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );
    expect(navbarSrc).toContain("mega-panel-services");
    expect(navbarSrc).toContain("mega-panel-solutions");
    expect(navbarSrc).toContain("mega-panel-proof");
    expect(navbarSrc).toContain("ThemeToggle");

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
    expect(homeSrc).toContain('data-reveal="card"');

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
    for (const num of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
      expect(processSrc).toContain(`"${num}"`);
    }
  });

  it("3. configures 4-tier Starter/Growth/Scale/Enterprise Custom-Scoped Coming Soon pricing with zero fake dollar claims", () => {
    expect(DEFAULT_PRICING_CONFIG.comingSoonMode).toBe(true);
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
