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

describe("Phase 5 — Warm Obsidian & Vermilion Palette, Theme Manager & Brand Assets", () => {
  let adminToken = "";
  let editorToken = "";

  it("1. defaults to Warm Obsidian (#0B0908) + Vermilion (#D23A1F) dark-first palette with 0 WCAG AA warnings", async () => {
    expect(OMNIFLOW_DARK_TOKENS.colors.background).toBe("#0B0908");
    expect(OMNIFLOW_DARK_TOKENS.colors.primary).toBe("#D23A1F");
    expect(OMNIFLOW_DARK_TOKENS.colors.heading).toBe("#F2EADB");
    expect(OMNIFLOW_LIGHT_TOKENS.colors.background).toBe("#F5EFE3");

    for (const preset of BUILT_IN_THEME_PRESETS) {
      expect(evaluateThemeContrast("dark", preset.dark)).toEqual([]);
      expect(evaluateThemeContrast("light", preset.light)).toEqual([]);
    }

    const initialTheme = await db.getThemeConfig();
    expect(initialTheme.activePresetId).toBe("omniflow-editorial-ember");
    expect(initialTheme.defaultMode).toBe("dark");
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
          defaultMode: "dark",
          activePresetId: "omniflow-editorial-ember",
          light: OMNIFLOW_LIGHT_TOKENS,
          dark: OMNIFLOW_DARK_TOKENS,
          publish: true,
        }),
      })
    );
    expect(editorDenied.status).toBe(403);

    // Super Admin publishes custom accent & malicious injection string is sanitized out
    const customDark = structuredClone(OMNIFLOW_DARK_TOKENS);
    customDark.colors.accent = "#FF7A33";
    customDark.colors.link = "#FF7A33; background:url(evil)"; // invalid -> falls back safely

    const pubRes = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          defaultMode: "dark",
          activePresetId: "omniflow-editorial-ember",
          light: OMNIFLOW_LIGHT_TOKENS,
          dark: customDark,
          overrides: { dark: { primaryButtonBg: "#E04020" } },
          publish: true,
        }),
      })
    );
    expect(pubRes.status).toBe(200);
    const pubData = (await pubRes.json()) as {
      themeConfig: {
        published: { dark: { colors: { accent: string; link: string } } };
      };
    };
    expect(pubData.themeConfig.published.dark.colors.accent).toBe("#FF7A33");
    expect(pubData.themeConfig.published.dark.colors.link).toBe(
      OMNIFLOW_DARK_TOKENS.colors.link
    );

    // Save custom preset
    const savePresetRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({
          action: "save_custom_preset",
          name: "Warm Sunset Variant",
        }),
      })
    );
    expect(savePresetRes.status).toBe(200);

    // Rollback restores previous published (#F06A2A accent)
    const rollbackRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeHeaders(adminToken),
        body: JSON.stringify({ action: "rollback" }),
      })
    );
    expect(rollbackRes.status).toBe(200);
    const rolled = await db.getThemeConfig();
    expect(rolled.published.dark.colors.accent).toBe("#F06A2A");
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
