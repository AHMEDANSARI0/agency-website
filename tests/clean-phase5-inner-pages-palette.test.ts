import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateThemeContrast } from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  DEFAULT_THEME_PRESET_ID,
  OMNIFLOW_DARK_PURPLE_AI_DARK,
  OMNIFLOW_DARK_PURPLE_AI_LIGHT,
  OMNIFLOW_DARK_PURPLE_AI_PRESET_ID,
  createDefaultThemeConfiguration,
  normalizeStoredThemeConfig,
} from "@/features/themes/presets";
import type { ThemeConfiguration } from "@/types/theme";

describe("Phase 5 — Inner Pages Cleanup, Dark Purple AI Palette Consistency & Plain-English Copy", () => {
  it("1. sets OmniFlow Dark Purple AI (#07030D, #7E22CE -> #C026D3 -> #FB923C, dark mode) as default while keeping all 9 built-in presets intact and WCAG AA compliant", () => {
    expect(DEFAULT_THEME_PRESET_ID).toBe(OMNIFLOW_DARK_PURPLE_AI_PRESET_ID);

    const cfg = createDefaultThemeConfiguration();
    expect(cfg.activePresetId).toBe("omniflow-dark-purple-ai");
    expect(cfg.defaultMode).toBe("dark");
    expect(cfg.published.dark.colors.background).toBe("#07030D");
    expect(cfg.published.dark.components.gradientFrom).toBe("#7E22CE");
    expect(cfg.published.dark.components.gradientVia).toBe("#C026D3");
    expect(cfg.published.dark.components.gradientTo).toBe("#FB923C");

    expect(evaluateThemeContrast("dark", OMNIFLOW_DARK_PURPLE_AI_DARK)).toEqual([]);
    expect(evaluateThemeContrast("light", OMNIFLOW_DARK_PURPLE_AI_LIGHT)).toEqual([]);

    // All existing presets remain available in Admin Theme Studio
    const requiredPresetIds = [
      "omniflow-dark-purple-ai",
      "omniflow-light-signature",
      "omniflow-cobalt-enterprise",
      "omniflow-emerald-ops",
      "omniflow-violet-studio",
      "omniflow-cyber-architect",
      "omniflow-red-glass",
      "original-agency-theme-archived",
      "soale-inspired-premium-agency",
    ];
    for (const id of requiredPresetIds) {
      expect(BUILT_IN_THEME_PRESETS.some((p) => p.id === id)).toBe(true);
    }

    const cssGlobals = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(cssGlobals).toContain("--of-color-bg: #07030D;");
    expect(cssGlobals).toContain("linear-gradient(135deg, #7E22CE, #C026D3, #FB923C)");
  });

  it("2. auto-upgrades untouched omniflow-light-signature / soale-inspired themes while preserving admin customizations", () => {
    const untouchedIndigo: ThemeConfiguration = {
      ...createDefaultThemeConfiguration(),
      activePresetId: "omniflow-light-signature",
      defaultMode: "light",
    };
    const migrated = normalizeStoredThemeConfig(untouchedIndigo);
    expect(migrated.upgraded).toBe(true);
    expect(migrated.config.activePresetId).toBe("omniflow-dark-purple-ai");
    expect(migrated.config.defaultMode).toBe("dark");

    const customizedIndigo: ThemeConfiguration = {
      ...untouchedIndigo,
      updatedBy: "Ahmed Ansari",
    };
    const preserved = normalizeStoredThemeConfig(customizedIndigo);
    expect(preserved.upgraded).toBe(false);
    expect(preserved.config.activePresetId).toBe("omniflow-light-signature");
  });

  it("3. cleans inner pages (/pricing, /how-it-works, /about, /team, /contact, /services, /demos) with plain-English copy, consistent CTAs, and zero legacy 10-stage / Coming Soon references", () => {
    const howSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/how-it-works/page.tsx"),
      "utf8"
    );
    expect(howSrc).toContain("Four Clear Steps From Workflow Review to Handover");
    expect(howSrc).not.toContain("10-stage");
    expect(howSrc).toContain("See live demo");

    const aboutSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/about/page.tsx"),
      "utf8"
    );
    expect(aboutSrc).toContain("See 4-Phase Process");
    expect(aboutSrc).not.toContain("10-Stage Process");

    const teamSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/team/page.tsx"),
      "utf8"
    );
    expect(teamSrc).toContain("{{FOUNDER_PHOTO_URL}}");

    const contactSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/contact/page.tsx"),
      "utf8"
    );
    expect(contactSrc).toContain("Free 25-Minute Workflow Review");

    const bannerSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/PageConversionBanner.tsx"),
      "utf8"
    );
    expect(bannerSrc).toContain("Free 25-Minute Workflow Review");
    expect(bannerSrc).toContain("See live demo");
  });
});
