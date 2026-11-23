import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  GET as getThemeHandler,
  POST as postThemeHandler,
  PUT as putThemeHandler,
} from "@/app/api/admin/theme/route";
import {
  buildThemeCssVariables,
  evaluateThemeContrast,
  getContrastRatio,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  OMNIFLOW_RED_GLASS_DARK,
  OMNIFLOW_RED_GLASS_LIGHT,
  OMNIFLOW_RED_GLASS_PRESET_ID,
} from "@/features/themes/presets";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { hashPassword } from "@/lib/security/password";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-red-glass-test-"));
const dbFilePath = path.join(tempDir, "red-glass-db.json");

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

describe("OmniFlow Red Glass Theme Bundle — Tokens, CSS Isolation & Admin Persistence", () => {
  it("1. defines exact Light and Dark palette tokens inside the unified OmniFlow Red Glass preset", () => {
    const preset = BUILT_IN_THEME_PRESETS.find(
      (p) => p.id === OMNIFLOW_RED_GLASS_PRESET_ID
    );
    expect(preset).toBeDefined();
    expect(preset?.name).toBe("OmniFlow Red Glass");
    expect(preset?.isBuiltIn).toBe(true);

    // Light Variant exact token verification
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.background).toBe("#F5F6FA");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.surface).toBe("#FFFFFF");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.surfaceElevated).toBe("#FFFFFF");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.surfaceMuted).toBe("#ECEEF4");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.heading).toBe("#17191F");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.body).toBe("#626875");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.muted).toBe("#858B98");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.primary).toBe("#EF2929");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.primaryHover).toBe("#D91F28");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.accentSubtle).toBe("#FFF0F0");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.border).toBe("#E2E5EC");
    expect(OMNIFLOW_RED_GLASS_LIGHT.components.borderSecondary).toBe("#ECEEF3");
    expect(OMNIFLOW_RED_GLASS_LIGHT.components.glassBg).toBe("rgba(255,255,255,0.68)");
    expect(OMNIFLOW_RED_GLASS_LIGHT.components.glassBorder).toBe("rgba(255,255,255,0.75)");
    expect(OMNIFLOW_RED_GLASS_LIGHT.components.primaryButtonBg).toBe("#EF2929");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.primaryForeground).toBe("#FFFFFF");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.secondary).toBe("#17191F");
    expect(OMNIFLOW_RED_GLASS_LIGHT.colors.secondaryForeground).toBe("#FFFFFF");

    // Dark Variant exact token verification
    expect(OMNIFLOW_RED_GLASS_DARK.colors.background).toBe("#101116");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.surfaceMuted).toBe("#17191F");
    expect(OMNIFLOW_RED_GLASS_DARK.components.tertiaryBg).toBe("#1D2028");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.heading).toBe("#F5F6FA");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.body).toBe("#B6BAC5");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.muted).toBe("#858B98");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.primary).toBe("#FF3038");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.primaryHover).toBe("#FF5158");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.accentSubtle).toBe("rgba(255,48,56,0.12)");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.surface).toBe("#191B23");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.surfaceElevated).toBe("#20232D");
    expect(OMNIFLOW_RED_GLASS_DARK.components.glassBg).toBe("rgba(35,37,47,0.68)");
    expect(OMNIFLOW_RED_GLASS_DARK.components.glassBorder).toBe("rgba(255,255,255,0.10)");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.border).toBe("#30333E");
    expect(OMNIFLOW_RED_GLASS_DARK.components.borderSecondary).toBe("#262933");
    expect(OMNIFLOW_RED_GLASS_DARK.components.primaryButtonBg).toBe("#EF2929");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.primaryForeground).toBe("#FFFFFF");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.secondary).toBe("#F5F6FA");
    expect(OMNIFLOW_RED_GLASS_DARK.colors.secondaryForeground).toBe("#17191F");
  });

  it("2. emits pure neutral-charcoal, glass, and controlled-red CSS variables with zero purple or unrelated blue leakage", () => {
    const css = buildThemeCssVariables({
      activePresetId: OMNIFLOW_RED_GLASS_PRESET_ID,
      defaultMode: "light",
      published: {
        light: OMNIFLOW_RED_GLASS_LIGHT,
        dark: OMNIFLOW_RED_GLASS_DARK,
      },
    });

    expect(css).toContain("--of-color-bg: #F5F6FA;");
    expect(css).toContain("--of-color-bg: #101116;");
    expect(css).toContain("--of-color-primary: #EF2929;");
    expect(css).toContain("--of-color-primary: #FF3038;");
    expect(css).toContain("--of-btn-primary-bg: #EF2929;");
    expect(css).toContain("--of-surface-glass: rgba(255,255,255,0.68);");
    expect(css).toContain("--of-border-glass: rgba(255,255,255,0.75);");
    expect(css).toContain("--of-surface-glass: rgba(35,37,47,0.68);");
    expect(css).toContain("--of-border-glass: rgba(255,255,255,0.10);");
    expect(css).toContain("--of-color-border-subtle: #ECEEF3;");
    expect(css).toContain("--of-color-border-subtle: #262933;");
    expect(css).toContain("--of-color-bg-tertiary: #1D2028;");

    // Zero purple / indigo / unrelated blue hexes in generated theme CSS
    const forbiddenHexes = [
      "#4F46E5",
      "#6366F1",
      "#818CF8",
      "#312E81",
      "#5B21B6",
      "#2563EB",
      "#3B82F6",
      "#0284C7",
      "#22D3EE",
    ];
    for (const hex of forbiddenHexes) {
      expect(css.toUpperCase()).not.toContain(hex);
    }

    // Accessibility contrast verification
    expect(evaluateThemeContrast("light", OMNIFLOW_RED_GLASS_LIGHT)).toEqual([]);
    expect(evaluateThemeContrast("dark", OMNIFLOW_RED_GLASS_DARK)).toEqual([]);
    expect(
      getContrastRatio(
        OMNIFLOW_RED_GLASS_LIGHT.colors.heading,
        OMNIFLOW_RED_GLASS_LIGHT.colors.background
      )!
    ).toBeGreaterThan(15);
    expect(
      getContrastRatio(
        OMNIFLOW_RED_GLASS_DARK.colors.heading,
        OMNIFLOW_RED_GLASS_DARK.colors.background
      )!
    ).toBeGreaterThan(16);
  });

  it("3. integrates into Admin Theme Studio: select, switch modes, customize, restore bundle defaults, and switch back without losing prior preset config", async () => {
    const admin = await db.createUser({
      email: "theme.architect@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      passwordHash: hashPassword("RedGlassStudio#2026!"),
      mustChangePassword: false,
    });
    const token = createSessionToken(admin);

    // 1. Confirm OmniFlow Red Glass is listed in GET /api/admin/theme builtInPresets
    const getRes = await getThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      })
    );
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as {
      builtInPresets: Array<{ id: string; name: string }>;
      themeConfig: { activePresetId: string };
    };
    expect(
      getJson.builtInPresets.some(
        (p) => p.id === OMNIFLOW_RED_GLASS_PRESET_ID && p.name === "OmniFlow Red Glass"
      )
    ).toBe(true);

    // 2. Customize the initial Indigo Signature theme first (e.g., custom link color #1E40AF)
    const currentInitial = await db.getThemeConfig();
    const customizedIndigoLight = structuredClone(currentInitial.draft.light);
    customizedIndigoLight.colors.link = "#1E40AF";

    const saveIndigoRes = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          defaultMode: "light",
          activePresetId: "omniflow-light-signature",
          light: customizedIndigoLight,
          dark: currentInitial.draft.dark,
          publish: true,
        }),
      })
    );
    expect(saveIndigoRes.status).toBe(200);

    // 3. Apply & Publish OmniFlow Red Glass
    const applyRedRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "apply_preset",
          presetId: OMNIFLOW_RED_GLASS_PRESET_ID,
          publish: true,
        }),
      })
    );
    expect(applyRedRes.status).toBe(200);

    const afterApplyRed = await db.getThemeConfig();
    expect(afterApplyRed.activePresetId).toBe(OMNIFLOW_RED_GLASS_PRESET_ID);
    expect(afterApplyRed.published.light.colors.primary).toBe("#EF2929");
    expect(afterApplyRed.published.dark.colors.primary).toBe("#FF3038");

    // 4. Switch defaultMode across dark / system and customize Red Glass temporarily, then restore bundle defaults
    const modifiedRedLight = structuredClone(afterApplyRed.draft.light);
    modifiedRedLight.colors.primary = "#B81820";

    const putModifiedRed = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          defaultMode: "system",
          activePresetId: OMNIFLOW_RED_GLASS_PRESET_ID,
          light: modifiedRedLight,
          dark: afterApplyRed.draft.dark,
          publish: true,
        }),
      })
    );
    expect(putModifiedRed.status).toBe(200);
    expect((await db.getThemeConfig()).defaultMode).toBe("system");
    expect((await db.getThemeConfig()).published.light.colors.primary).toBe("#B81820");

    // Restore OmniFlow Red Glass factory bundle defaults
    const resetRedRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "reset_preset_defaults",
          presetId: OMNIFLOW_RED_GLASS_PRESET_ID,
          publish: true,
        }),
      })
    );
    expect(resetRedRes.status).toBe(200);
    const restoredRed = await db.getThemeConfig();
    expect(restoredRed.published.light.colors.primary).toBe("#EF2929");
    expect(restoredRed.published.dark.colors.primary).toBe("#FF3038");

    // 5. Switch BACK to OmniFlow Indigo Signature and confirm its #1E40AF customization was NOT lost!
    const switchBackRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "apply_preset",
          presetId: "omniflow-light-signature",
          publish: true,
        }),
      })
    );
    expect(switchBackRes.status).toBe(200);
    const switchedBack = await db.getThemeConfig();
    expect(switchedBack.activePresetId).toBe("omniflow-light-signature");
    expect(switchedBack.published.light.colors.link).toBe("#1E40AF");
  });
});
