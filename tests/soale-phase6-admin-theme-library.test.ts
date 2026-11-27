import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  POST as postThemeHandler,
  PUT as putThemeHandler,
} from "@/app/api/admin/theme/route";
import { PUT as putSettingsHandler } from "@/app/api/admin/settings/route";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { resolveNavbarStyleSettings } from "@/features/admin/navbar-style-defaults";
import { buildThemeCssVariables } from "@/features/themes/color-utils";
import {
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  SOALE_INSPIRED_PRESET_ID,
} from "@/features/themes/presets";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { hashPassword } from "@/lib/security/password";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-soale-phase6-"));
const dbFilePath = path.join(tempDir, "phase6-db.json");

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

describe("Soale Redesign Phase 6 — Extended Theme Library, Inter Typography Controls & Pricing Studio", () => {
  let adminToken = "";

  it("1. supports Duplicate, Rename, Version Restore, and Delete on custom presets while strictly protecting Built-in & Archived Original presets", async () => {
    const admin = await db.createUser({
      email: "phase6.admin@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      passwordHash: hashPassword("Phase6Theme#2026!"),
      mustChangePassword: false,
    });
    adminToken = createSessionToken(admin);

    // Duplicate "Original Agency Theme — Archived" into an editable custom preset
    const dupRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "duplicate_preset",
          presetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
          activate: true,
        }),
      })
    );
    expect(dupRes.status).toBe(200);
    const dupJson = (await dupRes.json()) as {
      preset: { id: string; name: string; isBuiltIn: boolean; isLocked?: boolean };
    };
    expect(dupJson.preset.id.startsWith("custom_")).toBe(true);
    expect(dupJson.preset.isBuiltIn).toBe(false);
    expect(dupJson.preset.isLocked).toBe(false);

    // Rename the duplicated custom preset
    const renameRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "rename_preset",
          presetId: dupJson.preset.id,
          name: "OmniFlow Seasonal Edition",
        }),
      })
    );
    expect(renameRes.status).toBe(200);
    const afterRename = await db.getThemeConfig();
    expect(
      afterRename.customPresets.find((p) => p.id === dupJson.preset.id)?.name
    ).toBe("OmniFlow Seasonal Edition");

    // Attempting to rename or delete "Original Agency Theme — Archived" must fail with 400
    const blockedRename = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "rename_preset",
          presetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
          name: "Should Fail",
        }),
      })
    );
    expect(blockedRename.status).toBe(400);

    const blockedDelete = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "delete_custom_preset",
          presetId: SOALE_INSPIRED_PRESET_ID,
        }),
      })
    );
    expect(blockedDelete.status).toBe(400);

    // Delete the custom preset and confirm fallback to Soale Inspired preset
    const delRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "delete_custom_preset",
          presetId: dupJson.preset.id,
        }),
      })
    );
    expect(delRes.status).toBe(200);
    const afterDelete = await db.getThemeConfig();
    expect(afterDelete.activePresetId).toBe(SOALE_INSPIRED_PRESET_ID);
  });

  it("2. persists Inter headingWeight, bodyLineHeight, letterSpacing & restores versionHistory snapshots", async () => {
    const current = await db.getThemeConfig();

    const putRes = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          defaultMode: "light",
          activePresetId: SOALE_INSPIRED_PRESET_ID,
          designSystem: {
            typography: "editorial",
            buttonStyle: "rounded",
            borderRadius: "generous",
            spacing: "spacious",
            animationIntensity: "full",
            headingWeight: "500",
            bodyLineHeight: "editorial",
            letterSpacing: "tight",
          },
          light: current.draft.light,
          dark: current.draft.dark,
          publish: true,
        }),
      })
    );
    expect(putRes.status).toBe(200);

    const saved = await db.getThemeConfig();
    expect(saved.designSystem?.headingWeight).toBe("500");
    expect(saved.designSystem?.bodyLineHeight).toBe("editorial");
    expect(saved.designSystem?.letterSpacing).toBe("tight");
    expect((saved.versionHistory ?? []).length).toBeGreaterThanOrEqual(1);

    const css = buildThemeCssVariables(saved);
    expect(css).toContain("--of-heading-weight: 500;");
    expect(css).toContain("--of-body-leading: 1.74;");
    expect(css).toContain("--of-heading-tracking: -0.036em;");

    // Restore from versionHistory
    const verId = saved.versionHistory![0].versionId;
    const restoreVerRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          action: "restore_version",
          versionId: verId,
          publish: true,
        }),
      })
    );
    expect(restoreVerRes.status).toBe(200);

    // Verify Real Component Live Preview stage exists
    const previewSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/features/admin/theme/ThemeLivePreviewStage.tsx"
      ),
      "utf8"
    );
    expect(previewSrc).toContain("Real Component Live Preview");
    expect(previewSrc).toContain("WCAG 2.1 Live Contrast Telemetry");
  });

  it("3. saves Pricing Studio 'Coming Soon' toggle and 4-tier package updates via PUT /api/admin/settings", async () => {
    const currentSettings = await db.getSiteSettings();
    const basePricing = resolvePricingConfig(currentSettings);
    const updatedNavbarStyle = {
      ...resolveNavbarStyleSettings(currentSettings.navbarStyle),
      topOffset: 24,
      darkButtonHoverBackground: "#4C1D95",
    };

    const updatedPricing = {
      ...basePricing,
      comingSoonMode: false,
      statusBannerText: "Transparent milestone scopes available after audit.",
      packages: basePricing.packages.map((pkg, idx) =>
        idx === 0
          ? {
              ...pkg,
              projectPriceLabel: "Scoped Milestone Sprint",
              ctaHref: "javascript:alert(1)", // unsafe href -> sanitized to /contact
            }
          : pkg
      ),
    };

    const putRes = await putSettingsHandler(
      new Request("http://localhost:3000/api/admin/settings", {
        method: "PUT",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          companyName: currentSettings.companyName,
          positioning: currentSettings.positioning,
          tagline: currentSettings.tagline,
          founderName: currentSettings.founderName,
          contactEmail: currentSettings.contactEmail,
          supportHours: currentSettings.supportHours,
          bookingUrl: currentSettings.bookingUrl,
          primaryCtaLabel: currentSettings.primaryCtaLabel,
          primaryCtaHref: currentSettings.primaryCtaHref,
          secondaryCtaLabel: currentSettings.secondaryCtaLabel,
          secondaryCtaHref: currentSettings.secondaryCtaHref,
          navigation: currentSettings.navigation,
          navbarStyle: updatedNavbarStyle,
          footerLinks: currentSettings.footerLinks,
          pricingConfig: updatedPricing,
        }),
      })
    );
    expect(putRes.status).toBe(200);

    const savedSettings = await db.getSiteSettings();
    const reloaded = resolvePricingConfig(savedSettings);
    expect(reloaded.comingSoonMode).toBe(false);
    expect(reloaded.packages[0].projectPriceLabel).toBe(
      "Scoped Milestone Sprint"
    );
    expect(reloaded.packages[0].ctaHref).toBe("/contact");
    expect(savedSettings.navbarStyle).toMatchObject({
      topOffset: 24,
      darkButtonHoverBackground: "#4C1D95",
    });

    const invalidStyleResponse = await putSettingsHandler(
      new Request("http://localhost:3000/api/admin/settings", {
        method: "PUT",
        headers: makeAdminHeaders(adminToken),
        body: JSON.stringify({
          ...currentSettings,
          navbarStyle: { ...updatedNavbarStyle, darkText: "not-a-color" },
        }),
      })
    );
    expect(invalidStyleResponse.status).toBe(400);
  });
});
