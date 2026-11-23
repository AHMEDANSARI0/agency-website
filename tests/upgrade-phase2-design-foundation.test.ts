import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildThemeCssVariables,
  evaluateThemeContrast,
  getContrastRatio,
  isValidCssColor,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  DEFAULT_THEME_PRESET_ID,
  OMNIFLOW_DARK_TOKENS,
  OMNIFLOW_LIGHT_TOKENS,
  createDefaultThemeConfiguration,
  normalizeStoredThemeConfig,
} from "@/features/themes/presets";
import type { ThemeConfiguration } from "@/types/theme";

describe("Upgrade Phase 2 — Light-First Design Foundation, CSS Token Architecture & Brand System", () => {
  it("1. enforces premium Light-First default tokens (white/slate surfaces, indigo/violet/blue accents, deep charcoal text)", () => {
    const defaultConfig = createDefaultThemeConfiguration();
    expect(defaultConfig.defaultMode).toBe("light");
    expect(defaultConfig.activePresetId).toBe(DEFAULT_THEME_PRESET_ID);

    // Light surfaces: clean white + cool grey
    expect(OMNIFLOW_LIGHT_TOKENS.colors.background).toBe("#F8FAFC");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.surface).toBe("#FFFFFF");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.surfaceMuted).toBe("#F1F5F9");

    // Light typography: deep charcoal & executive slate (>= 4.5:1 WCAG AA)
    expect(OMNIFLOW_LIGHT_TOKENS.colors.heading).toBe("#0B1120");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.body).toBe("#334155");
    expect(
      getContrastRatio(
        OMNIFLOW_LIGHT_TOKENS.colors.heading,
        OMNIFLOW_LIGHT_TOKENS.colors.background
      )
    ).toBeGreaterThan(15);
    expect(
      getContrastRatio(
        OMNIFLOW_LIGHT_TOKENS.colors.muted,
        OMNIFLOW_LIGHT_TOKENS.colors.background
      )
    ).toBeGreaterThanOrEqual(4.5);

    // Brand accents: Indigo / Violet / Electric Blue
    expect(OMNIFLOW_LIGHT_TOKENS.colors.primary).toBe("#4F46E5");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.accent).toBe("#6366F1");
    expect(OMNIFLOW_LIGHT_TOKENS.components.gradientTo).toBe("#2563EB");

    // Dark mode: deep midnight charcoal-navy (#090D16 / #0F1624)
    expect(OMNIFLOW_DARK_TOKENS.colors.background).toBe("#090D16");
    expect(OMNIFLOW_DARK_TOKENS.colors.surface).toBe("#0F1624");
    expect(OMNIFLOW_DARK_TOKENS.colors.heading).toBe("#F8FAFC");
  });

  it("2. verifies 0 WCAG AA contrast warnings across every built-in preset in both Light and Dark mode", () => {
    expect(BUILT_IN_THEME_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of BUILT_IN_THEME_PRESETS) {
      const lightWarnings = evaluateThemeContrast("light", preset.light);
      const darkWarnings = evaluateThemeContrast("dark", preset.dark);
      expect(lightWarnings, `Light contrast warnings in ${preset.id}`).toEqual([]);
      expect(darkWarnings, `Dark contrast warnings in ${preset.id}`).toEqual([]);
    }
  });

  it("3. generates complete centralized CSS variables for :root/[data-theme=light] and [data-theme=dark]/.dark", () => {
    const css = buildThemeCssVariables(createDefaultThemeConfiguration());
    expect(css).toContain(':root, [data-theme="light"] {');
    expect(css).toContain('[data-theme="dark"], .dark {');
    expect(css).toContain("--of-color-primary: #4F46E5;");
    expect(css).toContain("--of-color-bg: #F8FAFC;");
    expect(css).toContain("--of-color-bg: #090D16;");
    expect(css).toContain("--of-text-navbar: #0B1120;");
    expect(css).toContain("--of-text-navbar: #F8FAFC;");
    expect(css).toContain("--of-surface-glass:");
    expect(css).toContain("--of-shadow-glow:");
    expect(css).toContain("--of-radius-card: 1rem;");

    // Blocks CSS injection payloads
    expect(isValidCssColor("#4F46E5; position:fixed")).toBe(false);
    expect(isValidCssColor("rgba(255, 255, 255, 0.88)")).toBe(true);
  });

  it("4. non-destructively migrates untouched legacy dark/vermilion seeds while preserving admin customizations", () => {
    const untouchedLegacySeed: ThemeConfiguration = {
      activePresetId: "omniflow-editorial-ember",
      defaultMode: "dark",
      published: { light: OMNIFLOW_LIGHT_TOKENS, dark: OMNIFLOW_DARK_TOKENS },
      draft: { light: OMNIFLOW_LIGHT_TOKENS, dark: OMNIFLOW_DARK_TOKENS },
      previousPublished: null,
      customPresets: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const migrated = normalizeStoredThemeConfig(untouchedLegacySeed);
    expect(migrated.upgraded).toBe(true);
    expect(migrated.config.defaultMode).toBe("light");
    expect(migrated.config.activePresetId).toBe("omniflow-light-signature");

    // Admin-customized config (updatedBy set) is strictly preserved
    const adminCustomized: ThemeConfiguration = {
      ...untouchedLegacySeed,
      defaultMode: "dark",
      updatedBy: "admin@omniflow.example",
    };
    const preserved = normalizeStoredThemeConfig(adminCustomized);
    expect(preserved.upgraded).toBe(false);
    expect(preserved.config.defaultMode).toBe("dark");
  });

  it("5. ensures zero legacy warm-obsidian/vermilion hexes or copied external logos exist in src/", () => {
    const globalsCss = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(globalsCss).not.toContain("#0B0908");
    expect(globalsCss).not.toContain("#D23A1F");
    expect(globalsCss).not.toContain("#F2EADB");

    const brandMark = fs.readFileSync(
      path.join(process.cwd(), "src/components/ui/BrandMark.tsx"),
      "utf8"
    );
    expect(brandMark).not.toContain("poai");
    expect(brandMark).toContain("lightLogoUrl");
    expect(brandMark).toContain("darkLogoUrl");
    expect(brandMark).toContain("symbolUrl");
  });
});
