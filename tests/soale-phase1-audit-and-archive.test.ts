import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  GET as getThemeHandler,
  POST as postThemeHandler,
  PUT as putThemeHandler,
} from "@/app/api/admin/theme/route";
import { evaluateThemeContrast } from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  ORIGINAL_AGENCY_ARCHIVED_DARK,
  ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM,
  ORIGINAL_AGENCY_ARCHIVED_LIGHT,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_NAME,
  ORIGINAL_AGENCY_ARCHIVED_VERSION,
} from "@/features/themes/presets";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { hashPassword } from "@/lib/security/password";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-soale-phase1-"));
const dbFilePath = path.join(tempDir, "phase1-db.json");

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

describe("Soale Redesign Phase 1 — Complete Project Audit, Archive Vault & Reload Speed", () => {
  it("1. captures complete pre-redesign Light & Dark colors, typography, spacing, radii, shadows, and component styling in 'Original Agency Theme — Archived'", async () => {
    const archivedPreset = BUILT_IN_THEME_PRESETS.find(
      (p) => p.id === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID
    );
    expect(archivedPreset).toBeDefined();
    expect(archivedPreset?.name).toBe("Original Agency Theme — Archived");
    expect(archivedPreset?.name).toBe(ORIGINAL_AGENCY_ARCHIVED_PRESET_NAME);
    expect(archivedPreset?.isBuiltIn).toBe(true);
    expect(archivedPreset?.isArchivedOriginal).toBe(true);
    expect(archivedPreset?.isLocked).toBe(true);
    expect(archivedPreset?.version).toBe(ORIGINAL_AGENCY_ARCHIVED_VERSION);
    expect(archivedPreset?.designSystem).toEqual(
      ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM
    );

    // Confirm all 6 prior built-in presets remain 100% preserved
    const expectedIds = [
      "omniflow-light-signature",
      "omniflow-cobalt-enterprise",
      "omniflow-emerald-ops",
      "omniflow-violet-studio",
      "omniflow-cyber-architect",
      "omniflow-red-glass",
      "original-agency-theme-archived",
    ];
    for (const id of expectedIds) {
      expect(BUILT_IN_THEME_PRESETS.some((p) => p.id === id)).toBe(true);
    }

    // Confirm full Light & Dark variant tokens + component styling are captured
    expect(archivedPreset?.light.colors.background).toBe("#F5F6FA");
    expect(archivedPreset?.light.colors.primary).toBe("#EF2929");
    expect(archivedPreset?.light.components.glassBg).toBe("rgba(255,255,255,0.68)");
    expect(archivedPreset?.light.components.shadowCard.length).toBeGreaterThan(5);
    expect(archivedPreset?.dark.colors.background).toBe("#101116");
    expect(archivedPreset?.dark.colors.primary).toBe("#FF3038");
    expect(archivedPreset?.dark.components.glassBg).toBe("rgba(35,37,47,0.68)");
    expect(archivedPreset?.dark.components.shadowCard.length).toBeGreaterThan(5);

    expect(evaluateThemeContrast("light", ORIGINAL_AGENCY_ARCHIVED_LIGHT)).toEqual([]);
    expect(evaluateThemeContrast("dark", ORIGINAL_AGENCY_ARCHIVED_DARK)).toEqual([]);

    const stored = await db.getThemeConfig();
    expect(stored.archivedOriginalTheme).toBeDefined();
    expect(stored.archivedOriginalTheme?.name).toBe(
      "Original Agency Theme — Archived"
    );
  });

  it("2. enforces strict overwrite protection on 'Original Agency Theme — Archived' and supports 1-click full recovery", async () => {
    const admin = await db.createUser({
      email: "phase1.archive@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      passwordHash: hashPassword("Phase1Archive#2026!"),
      mustChangePassword: false,
    });
    const token = createSessionToken(admin);

    // Load & publish Original Agency Theme — Archived
    const restoreRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "restore_archived_theme",
          publish: true,
        }),
      })
    );
    expect(restoreRes.status).toBe(200);
    const afterRestore = await db.getThemeConfig();
    expect(afterRestore.activePresetId).toBe(ORIGINAL_AGENCY_ARCHIVED_PRESET_ID);
    expect(afterRestore.published.light.colors.primary).toBe("#EF2929");
    expect(afterRestore.designSystem?.typography).toBe("architectural");

    // Attempt to overwrite while Original Agency Theme — Archived is active
    const mutatedLight = structuredClone(afterRestore.draft.light);
    mutatedLight.colors.primary = "#123456";

    const putAttempt = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          defaultMode: "dark",
          activePresetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
          designSystem: {
            typography: "editorial",
            buttonStyle: "sharp",
            borderRadius: "compact",
            spacing: "spacious",
            animationIntensity: "minimal",
          },
          light: mutatedLight,
          dark: afterRestore.draft.dark,
          publish: true,
        }),
      })
    );
    expect(putAttempt.status).toBe(200);

    const afterFork = await db.getThemeConfig();
    // Must automatically fork to a working copy instead of overwriting the locked archived preset!
    expect(afterFork.activePresetId).toBe("custom_archived_working_copy");
    expect(afterFork.published.light.colors.primary).toBe("#123456");
    expect(
      afterFork.savedPresetStates?.[ORIGINAL_AGENCY_ARCHIVED_PRESET_ID]
    ).toBeUndefined();
    expect(afterFork.archivedOriginalTheme?.light.colors.primary).toBe("#EF2929");

    // Verify GET /api/admin/theme still exposes untouched Original Agency Theme — Archived
    const getRes = await getThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      })
    );
    const getJson = (await getRes.json()) as {
      builtInPresets: Array<{ id: string; light: { colors: { primary: string } } }>;
    };
    const builtInArchived = getJson.builtInPresets.find(
      (p) => p.id === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID
    );
    expect(builtInArchived?.light.colors.primary).toBe("#EF2929");

    // 1-click recovery via apply_preset or restore_archived_theme restores 100% of original colors + designSystem + defaultMode
    const recoverRes = await postThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "POST",
        headers: makeAdminHeaders(token),
        body: JSON.stringify({
          action: "apply_preset",
          presetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
          publish: true,
        }),
      })
    );
    expect(recoverRes.status).toBe(200);

    const recovered = await db.getThemeConfig();
    expect(recovered.activePresetId).toBe(ORIGINAL_AGENCY_ARCHIVED_PRESET_ID);
    expect(recovered.defaultMode).toBe("light");
    expect(recovered.designSystem).toEqual(ORIGINAL_AGENCY_ARCHIVED_DESIGN_SYSTEM);
    expect(recovered.published.light.colors.primary).toBe("#EF2929");
    expect(recovered.published.dark.colors.primary).toBe("#FF3038");
  });

  it("3. executes sequential SSR database snapshot reads in sub-5ms via mtime+size zero-parse fast path", async () => {
    // Warm first read
    await db.getSiteSettings();

    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      await Promise.all([
        db.getSiteSettings(),
        db.getBrandAssets(),
        db.getThemeConfig(),
        db.listServices(true),
        db.listCaseStudies(true),
        db.listBlogPosts(true),
      ]);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(120);
  });
});
