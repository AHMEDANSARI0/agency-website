import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as postThemeHandler } from "@/app/api/admin/theme/route";
import {
  buildThemeCssVariables,
  evaluateThemeContrast,
  getContrastRatio,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  SOALE_INSPIRED_DESIGN_SYSTEM,
  SOALE_INSPIRED_PRESET_ID,
  SOALE_INSPIRED_PRESET_NAME,
  SOALE_PREMIUM_DARK,
  SOALE_PREMIUM_LIGHT,
} from "@/features/themes/presets";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { hashPassword } from "@/lib/security/password";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-soale-phase2-"));
const dbFilePath = path.join(tempDir, "phase2-db.json");

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = dbFilePath;
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function makeAdminHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

describe("Soale Redesign Phase 2 — 'Soale Inspired — Premium Agency' Design System & WCAG AA", () => {
  it("1. defines complete independent Light and Dark palettes meeting strict >= 4.5:1 WCAG AA contrast across every text & button pair", () => {
    const soalePreset = BUILT_IN_THEME_PRESETS.find(
      (p) => p.id === SOALE_INSPIRED_PRESET_ID
    );
    expect(soalePreset).toBeDefined();
    expect(soalePreset?.name).toBe(SOALE_INSPIRED_PRESET_NAME);
    expect(soalePreset?.name).toBe("Soale Inspired — Premium Agency");
    expect(soalePreset?.designSystem).toEqual(SOALE_INSPIRED_DESIGN_SYSTEM);

    // Light foundation tokens
    expect(SOALE_PREMIUM_LIGHT.colors.background).toBe("#F7F6F3");
    expect(SOALE_PREMIUM_LIGHT.colors.surface).toBe("#FFFFFF");
    expect(SOALE_PREMIUM_LIGHT.colors.heading).toBe("#171518");
    expect(SOALE_PREMIUM_LIGHT.colors.body).toBe("#5E5A61");
    expect(SOALE_PREMIUM_LIGHT.colors.primary).toBe("#6D199C");
    expect(SOALE_PREMIUM_LIGHT.colors.secondary).toBe("#1D0C49");
    expect(SOALE_PREMIUM_LIGHT.colors.border).toBe("#E5E1E7");

    // Dark foundation tokens
    expect(SOALE_PREMIUM_DARK.colors.background).toBe("#100E13");
    expect(SOALE_PREMIUM_DARK.colors.surface).toBe("#17141C");
    expect(SOALE_PREMIUM_DARK.colors.surfaceElevated).toBe("#211C28");
    expect(SOALE_PREMIUM_DARK.colors.heading).toBe("#F7F5F8");
    expect(SOALE_PREMIUM_DARK.colors.body).toBe("#C2BBC8");
    expect(SOALE_PREMIUM_DARK.colors.muted).toBe("#A29AA8");
    expect(SOALE_PREMIUM_DARK.colors.primary).toBe("#B77AD8");
    expect(SOALE_PREMIUM_DARK.colors.accent).toBe("#A78FCA");
    expect(SOALE_PREMIUM_DARK.colors.border).toBe("#342D3A");

    // Zero contrast warnings
    expect(evaluateThemeContrast("light", SOALE_PREMIUM_LIGHT)).toEqual([]);
    expect(evaluateThemeContrast("dark", SOALE_PREMIUM_DARK)).toEqual([]);

    // Strict >= 4.5:1 normal text & CTA checks across Light
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.heading, SOALE_PREMIUM_LIGHT.colors.background)!
    ).toBeGreaterThanOrEqual(16);
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.body, SOALE_PREMIUM_LIGHT.colors.background)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.muted, SOALE_PREMIUM_LIGHT.colors.background)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.muted, SOALE_PREMIUM_LIGHT.colors.surface)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.primaryForeground, SOALE_PREMIUM_LIGHT.colors.primary)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_LIGHT.colors.secondaryForeground, SOALE_PREMIUM_LIGHT.colors.secondary)!
    ).toBeGreaterThanOrEqual(4.5);

    // Strict >= 4.5:1 normal text & CTA checks across Dark
    expect(
      getContrastRatio(SOALE_PREMIUM_DARK.colors.heading, SOALE_PREMIUM_DARK.colors.background)!
    ).toBeGreaterThanOrEqual(16);
    expect(
      getContrastRatio(SOALE_PREMIUM_DARK.colors.body, SOALE_PREMIUM_DARK.colors.surface)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_DARK.colors.muted, SOALE_PREMIUM_DARK.colors.surfaceElevated)!
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(SOALE_PREMIUM_DARK.colors.primaryForeground, SOALE_PREMIUM_DARK.colors.primary)!
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("2. emits Inter primary typography, 17px/24px/14px Soale geometry radii, and high-contrast dark-island tokens", () => {
    const css = buildThemeCssVariables({
      activePresetId: SOALE_INSPIRED_PRESET_ID,
      defaultMode: "light",
      designSystem: SOALE_INSPIRED_DESIGN_SYSTEM,
      published: {
        light: SOALE_PREMIUM_LIGHT,
        dark: SOALE_PREMIUM_DARK,
      },
    });

    expect(css).toContain("--of-color-bg: #F7F6F3;");
    expect(css).toContain("--of-color-bg: #100E13;");
    expect(css).toContain("--of-color-primary: #6D199C;");
    expect(css).toContain("--of-color-primary: #B77AD8;");
    expect(css).toContain("--of-dark-island-primary: #B77AD8;");
    expect(css).toContain("--of-dark-island-primary-fg: #140F1A;");
    expect(css).toContain("--of-font-heading: var(--font-sans), Inter");
    expect(css).toContain("--of-radius-card: 1.375rem;");
    expect(css).toContain("--of-radius-button: 0.625rem;");
    expect(css).toContain("--of-radius-soale-btn: 1.0625rem;");
    expect(css).toContain("--of-radius-soale-card: 1.5rem;");
    expect(css).toContain("--of-radius-soale-chip: 0.875rem;");
  });

  it("3. activates 'Soale Inspired — Premium Agency' live while keeping 'Original Agency Theme — Archived' untouched and recoverable", async () => {
    const admin = await db.createUser({
      email: "phase2.soale@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      passwordHash: hashPassword("Phase2Soale#2026!"),
      mustChangePassword: false,
    });
    const token = createSessionToken(admin);

    const applySoale = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "apply_preset",
          presetId: SOALE_INSPIRED_PRESET_ID,
          publish: true,
        }),
      })
    );
    expect(applySoale.status).toBe(200);

    const active = await db.getThemeConfig();
    expect(active.activePresetId).toBe(SOALE_INSPIRED_PRESET_ID);
    expect(active.designSystem).toEqual(SOALE_INSPIRED_DESIGN_SYSTEM);
    expect(active.published.light.colors.background).toBe("#F7F6F3");
    expect(active.published.dark.colors.background).toBe("#100E13");

    // Verify archived original theme was NOT touched
    expect(active.archivedOriginalTheme?.id).toBe(ORIGINAL_AGENCY_ARCHIVED_PRESET_ID);
    expect(active.archivedOriginalTheme?.light.colors.primary).toBe("#EF2929");
  });
});
