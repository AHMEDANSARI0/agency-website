import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";

describe("Upgrade Phase 3 — Public Website Redesign (Mega-Menu, 16-Section Homepage & Inner Pages)", () => {
  beforeEach(() => {
    const tempDbPath = path.join(
      process.cwd(),
      "data",
      `test-upgrade-phase3-${Date.now()}.json`
    );
    process.env.OMNIFLOW_DB_PATH = tempDbPath;
  });

  it("seeds all 16 visible narrative homepage sections plus the strict verified-testimonials gate", async () => {
    const snapshot = createInitialSeedSnapshot();
    const home = snapshot.pages.find((p) => p.slug === "home");
    expect(home).toBeDefined();

    const sectionTypes = home!.sections.map((s) => s.type);
    expect(sectionTypes).toEqual([
      "hero",
      "trust_strip",
      "problems_outcomes",
      "flagship_systems",
      "services_overview",
      "interactive_demos_preview",
      "workflow_demo",
      "how_it_works",
      "industry_use_cases",
      "architecture_governance",
      "roi_framing",
      "case_studies_highlight",
      "founder_intro",
      "insights_preview",
      "testimonials",
      "faq_section",
      "cta_banner",
    ]);

    // When verified testimonials are empty (truthful baseline), 16 live sections render
    const verifiedTestimonials = await db.listTestimonials(true);
    expect(verifiedTestimonials).toHaveLength(0);
    const activeNonTestimonialCount = home!.sections.filter(
      (s) => s.isVisible && s.type !== "testimonials"
    ).length;
    expect(activeNonTestimonialCount).toBe(16);
  });

  it("includes accessible WAI-ARIA mega-menu controls, 8 service links, and 5 live demo links in Navbar", () => {
    const navbarSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );

    expect(navbarSource).toContain("mega-panel-services");
    expect(navbarSource).toContain("mega-panel-solutions");
    expect(navbarSource).toContain("mega-panel-proof");
    expect(navbarSource).toContain("aria-expanded");
    expect(navbarSource).toContain("aria-controls");
    expect(navbarSource).toContain("Escape");
    expect(navbarSource).toContain("ArrowDown");

    const requiredLinks = [
      "/services/lead-management",
      "/services/ai-customer-support",
      "/services/workflow-automation",
      "/services/ai-sales-intelligence",
      "/services/ai-customer-experience",
      "/services/ai-operations",
      "/services/ai-analytics",
      "/services/custom-ai-systems",
      "/demos?tab=lead-qualification",
      "/demos?tab=support-generator",
      "/demos?tab=workflow-builder",
      "/demos?tab=savings-calculator",
      "/demos?tab=readiness-assessment",
    ];

    for (const href of requiredLinks) {
      expect(navbarSource).toContain(href);
    }
  });

  it("eliminates legacy Phase 1 vermilion/amber hardcoded colors across public website pages", () => {
    const homepageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/page.tsx"),
      "utf8"
    );

    expect(homepageSource).not.toContain("210,58,31");
    expect(homepageSource).not.toContain("#E6A92E");
    expect(homepageSource).toContain("HomeAutomationLabPreview");
    expect(homepageSource).toContain("architecture_governance");
    expect(homepageSource).toContain("roi_framing");
  });

  it("wires reusable PageConversionBanner across core inner public routes", () => {
    const innerRoutes = [
      "src/app/(website)/services/page.tsx",
      "src/app/(website)/services/[slug]/page.tsx",
      "src/app/(website)/solutions/page.tsx",
      "src/app/(website)/how-it-works/page.tsx",
      "src/app/(website)/demos/page.tsx",
      "src/app/(website)/work/page.tsx",
      "src/app/(website)/case-studies/page.tsx",
      "src/app/(website)/case-studies/[slug]/page.tsx",
      "src/app/(website)/about/page.tsx",
      "src/app/(website)/team/page.tsx",
      "src/app/(website)/blog/page.tsx",
      "src/app/(website)/blog/[slug]/page.tsx",
      "src/app/(website)/faq/page.tsx",
    ];

    for (const relPath of innerRoutes) {
      const content = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
      expect(content).toContain("PageConversionBanner");
    }
  });
});
