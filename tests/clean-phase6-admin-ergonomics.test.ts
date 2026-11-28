import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLEAN_HOME_9_SECTIONS,
  SECTION_CATALOG,
} from "@/features/admin/PageBuilderClient";
import {
  DEFAULT_HOME_SECTIONS,
  createInitialSeedSnapshot,
} from "@/lib/database/seed-data";
import {
  PLACEHOLDER_TOKENS,
  findUnfilledPlaceholders,
} from "@/lib/placeholders";

describe("Phase 6 — Admin CMS, Theme Studio, Pricing & {{PLACEHOLDER}} Ergonomics", () => {
  it("1. surfaces all unfilled owner placeholders ({{CONTACT_EMAIL}}, {{PRICE_FROM}}, {{FOUNDER_PHOTO_URL}}) with direct Admin deep links and clears cleanly once filled", () => {
    const seed = createInitialSeedSnapshot();

    const warnings = findUnfilledPlaceholders({
      settings: seed.siteSettings,
      pages: seed.pages,
      services: seed.services,
      caseStudies: seed.caseStudies,
      blogPosts: seed.blogPosts,
      faqs: seed.faqs,
      teamMembers: seed.teamMembers,
    });

    const contactWarn = warnings.find(
      (w) => w.token === PLACEHOLDER_TOKENS.CONTACT_EMAIL
    );
    const priceWarn = warnings.find(
      (w) => w.token === PLACEHOLDER_TOKENS.PRICE_FROM
    );
    const founderWarn = warnings.find(
      (w) => w.token === PLACEHOLDER_TOKENS.FOUNDER_PHOTO_URL
    );

    expect(contactWarn?.adminHref).toBe("/admin/settings");
    expect(priceWarn?.adminHref).toBe("/admin/settings#pricing");
    expect(founderWarn?.adminHref).toBe("/admin/cms?tab=team");

    // Once all 3 owner slots are populated, warnings drop to 0
    const filledPricing = JSON.parse(
      JSON.stringify(seed.siteSettings.pricingConfig).replaceAll(
        PLACEHOLDER_TOKENS.PRICE_FROM,
        "$1,200"
      )
    );
    const afterFill = findUnfilledPlaceholders({
      settings: {
        ...seed.siteSettings,
        contactEmail: "hello@yourdomain.com",
        pricingConfig: filledPricing,
      },
      pages: seed.pages,
      services: seed.services,
      caseStudies: seed.caseStudies,
      blogPosts: seed.blogPosts,
      faqs: seed.faqs,
      teamMembers: seed.teamMembers.map((m) => ({
        ...m,
        avatarUrl: "/logo-mark.svg",
      })),
    });

    expect(afterFill).toHaveLength(0);
  });

  it("2. wires 1-click {{PRICE_FROM}} quick-fill in PricingSettingsEditor and removes legacy Coming Soon copy from new tier templates", () => {
    const pricingEditorSrc = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/PricingSettingsEditor.tsx"),
      "utf8"
    );

    expect(pricingEditorSrc).toContain("applyStartingPriceToken");
    expect(pricingEditorSrc).toContain("Apply Starting Rate");
    expect(pricingEditorSrc).toContain("PLACEHOLDER_TOKENS.PRICE_FROM");
    expect(pricingEditorSrc).not.toContain("Published Rate Coming Soon");
  });

  it("3. initializes ThemeManagerClient in dark mode when defaultMode is dark and badges OmniFlow Dark Purple AI as Default SaaS", () => {
    const themeClientSrc = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/ThemeManagerClient.tsx"),
      "utf8"
    );

    expect(themeClientSrc).toContain(
      'initialConfig.defaultMode === "light" ? "light" : "dark"'
    );
    expect(themeClientSrc).toContain("Dark Mode First (Dark Purple AI — Default)");
    expect(themeClientSrc).toContain("Default SaaS");
    expect(themeClientSrc).toContain("OMNIFLOW_DARK_PURPLE_AI_PRESET_ID");
  });

  it("4. keeps PageBuilderClient CLEAN_HOME_9_SECTIONS in 1:1 parity with DEFAULT_HOME_SECTIONS and exposes Core 01..09 + Restore Default 9-Section Home", () => {
    expect(CLEAN_HOME_9_SECTIONS).toEqual(DEFAULT_HOME_SECTIONS);

    const firstNineTypes = SECTION_CATALOG.slice(0, 9).map((c) => c.type);
    expect(firstNineTypes).toEqual(DEFAULT_HOME_SECTIONS.map((s) => s.type));

    const builderSrc = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/PageBuilderClient.tsx"),
      "utf8"
    );
    expect(builderSrc).toContain("Restore Default 9-Section Home");
    expect(
      fs.readFileSync(path.join(process.cwd(), "src/styles/globals.css"), "utf8")
    ).toContain(
      '#of-home-sections-root [data-of-theme-spacing="true"] > section'
    );
  });
});
