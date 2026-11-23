import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import { PUT as putBrandHandler } from "@/app/api/admin/brand/route";
import { POST as postThemeHandler, PUT as putThemeHandler } from "@/app/api/admin/theme/route";
import { POST as createUserHandler } from "@/app/api/admin/users/route";
import { evaluateThemeContrast } from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  DEFAULT_THEME_PRESET_ID,
  OMNIFLOW_DARK_TOKENS,
  OMNIFLOW_LIGHT_TOKENS,
} from "@/features/themes/presets";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase5-test-"));

function extractCookieToken(setCookieHeader: string | null): string {
  const match = (setCookieHeader || "").match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match?.[1] || "";
}

function makeHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase5-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Theme Manager, Light-First Indigo Signature Palette & Brand Assets", () => {
  let adminToken = "";
  let editorToken = "";

  it("1. defaults to Light-First Indigo Signature (#F8FAFC / #4F46E5) + Midnight-Navy Dark Mode (#090D16) with 0 WCAG AA warnings", async () => {
    expect(OMNIFLOW_LIGHT_TOKENS.colors.background).toBe("#F8FAFC");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.surface).toBe("#FFFFFF");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.primary).toBe("#4F46E5");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.heading).toBe("#0B1120");
    expect(OMNIFLOW_DARK_TOKENS.colors.background).toBe("#090D16");
    expect(OMNIFLOW_DARK_TOKENS.colors.heading).toBe("#F8FAFC");

    for (const preset of BUILT_IN_THEME_PRESETS) {
      expect(evaluateThemeContrast("dark", preset.dark)).toEqual([]);
      expect(evaluateThemeContrast("light", preset.light)).toEqual([]);
    }

    const initialTheme = await db.getThemeConfig();
    expect(initialTheme.activePresetId).toBe(DEFAULT_THEME_PRESET_ID);
    expect(initialTheme.defaultMode).toBe("light");
  });

  it("2. enforces RBAC on /api/admin/theme and supports draft, publish, custom presets, CSS sanitization & rollback", async () => {
    const loginRes = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    adminToken = extractCookieToken(loginRes.headers.get("set-cookie"));

    // Create Editor and confirm default 403 on theme:manage
    await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          name: "Editor User",
          email: "editor5@omniflow.example",
          role: "EDITOR",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    const editorLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "editor5@omniflow.example",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    editorToken = extractCookieToken(editorLogin.headers.get("set-cookie"));

    const editorDenied = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeHeaders(editorToken),
        body: JSON.stringify({
          defaultMode: "light",
          activePresetId: DEFAULT_THEME_PRESET_ID,
          light: OMNIFLOW_LIGHT_TOKENS,
          dark: OMNIFLOW_DARK_TOKENS,
          publish: true,
        }),
      })
    );
    expect(editorDenied.status).toBe(403);

    // Super Admin publishes custom accent & malicious injection string is sanitized out
    const customLight = structuredClone(OMNIFLOW_LIGHT_TOKENS);
    customLight.colors.accent = "#2563EB";
    customLight.colors.link = "#2563EB; background:url(evil)"; // invalid -> falls back safely

    const pubRes = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          defaultMode: "light",
          activePresetId: DEFAULT_THEME_PRESET_ID,
          light: customLight,
          dark: OMNIFLOW_DARK_TOKENS,
          overrides: { light: { primaryButtonBg: "#4338CA" } },
          publish: true,
        }),
      })
    );
    expect(pubRes.status).toBe(200);
    const pubData = (await pubRes.json()) as {
      themeConfig: {
        updatedBy?: string;
        published: { light: { colors: { accent: string; link: string } } };
      };
    };
    expect(pubData.themeConfig.updatedBy).toBe("admin@omniflow.example");
    expect(pubData.themeConfig.published.light.colors.accent).toBe("#2563EB");
    expect(pubData.themeConfig.published.light.colors.link).toBe(
      OMNIFLOW_LIGHT_TOKENS.colors.link
    );

    // Save custom preset
    const savePresetRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          action: "save_custom_preset",
          name: "Electric Blue Variant",
        }),
      })
    );
    expect(savePresetRes.status).toBe(200);

    // Rollback restores previous published (#6366F1 accent)
    const rollbackRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({ action: "rollback" }),
      })
    );
    expect(rollbackRes.status).toBe(200);
    const rolled = await db.getThemeConfig();
    expect(rolled.published.light.colors.accent).toBe("#6366F1");
  });

  it("3. updates replaceable Brand Identity slots and strips unsafe javascript: URLs", async () => {
    const brandRes = await putBrandHandler(
      new Request("http://localhost:3000/api/admin/brand", {
        method: "PUT",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          brandName: "OmniFlow",
          tagline: "Automate the work. Accelerate the business.",
          altText: "OmniFlow Brand Identity",
          lightLogoUrl: "/uploads/logo-light.svg",
          darkLogoUrl: "javascript:alert(1)",
          symbolUrl: null,
          faviconUrl: "/uploads/favicon.png",
          ogImageUrl: null,
          showTextFallback: true,
        }),
      })
    );
    expect(brandRes.status).toBe(200);
    const savedBrand = await db.getBrandAssets();
    expect(savedBrand.lightLogoUrl).toBe("/uploads/logo-light.svg");
    expect(savedBrand.darkLogoUrl).toBeNull();
  });
});
