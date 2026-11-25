import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OMNIFLOW_DARK_PURPLE_AI_PRESET_ID } from "@/features/themes/presets";
import { db } from "@/lib/database";
import {
  CURRENT_SEED_VERSION,
  createInitialSeedSnapshot,
} from "@/lib/database/seed-data";

describe("Phase 7 — Vitest DB Isolation & Dark-First Production Theme Seed Alignment", () => {
  it("1. strips ambient .env DATABASE_URL and isolates OMNIFLOW_LOCAL_DB_PATH inside os.tmpdir()", () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(process.env.OMNIFLOW_LOCAL_DB_PATH).toBeTruthy();

    const resolvedLocalPath = path.resolve(
      process.env.OMNIFLOW_LOCAL_DB_PATH as string
    );
    const resolvedTmpDir = path.resolve(os.tmpdir());
    const workspaceDefaultDb = path.resolve(
      process.cwd(),
      "data",
      "omniflow-db.json"
    );

    expect(resolvedLocalPath.startsWith(resolvedTmpDir)).toBe(true);
    expect(resolvedLocalPath).not.toBe(workspaceDefaultDb);
  });

  it("2. removes legacy createSoaleProductionThemeSeed ('light') and persists upgraded kv_configs theme_config in PostgreSQL", () => {
    const dbIndexSrc = fs.readFileSync(
      path.join(process.cwd(), "src/lib/database/index.ts"),
      "utf8"
    );

    expect(dbIndexSrc).not.toContain("createSoaleProductionThemeSeed");
    expect(dbIndexSrc).toContain("themeConfigUpgraded");
    expect(CURRENT_SEED_VERSION).toBeGreaterThanOrEqual(13);
  });

  it("3. deterministically resolves defaultMode === 'dark' and omniflow-dark-purple-ai out-of-the-box", async () => {
    const seed = createInitialSeedSnapshot();
    expect(seed.themeConfig.activePresetId).toBe(
      OMNIFLOW_DARK_PURPLE_AI_PRESET_ID
    );
    expect(seed.themeConfig.defaultMode).toBe("dark");

    const runtimeTheme = await db.getThemeConfig();
    expect(runtimeTheme.activePresetId).toBe(OMNIFLOW_DARK_PURPLE_AI_PRESET_ID);
    expect(runtimeTheme.defaultMode).toBe("dark");
  });
});
