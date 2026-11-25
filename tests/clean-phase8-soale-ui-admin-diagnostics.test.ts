import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BUILT_IN_THEME_PRESETS,
  SOALE_CREATIVE_AI_DUAL_PRESET,
  SOALE_CREATIVE_AI_PRESET_ID,
} from "@/features/themes/presets";
import { evaluateThemeContrast } from "@/features/themes/color-utils";
import { getLiveSiteDiagnosticsReport } from "@/features/system/live-site-report";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { POST as postTelemetryError } from "@/app/api/telemetry/error/route";
import {
  GET as getLiveReportApi,
  POST as postLiveReportApi,
} from "@/app/api/admin/system/live-report/route";
import { POST as postAdminTheme } from "@/app/api/admin/theme/route";

const ROOT = process.cwd();
const readSrc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("Phase 8 — Soale Dual-Mode UI, Collapsible Admin Sidebar & Live Site Diagnostics", () => {
  let tmpDbFile = "";

  beforeEach(() => {
    tmpDbFile = path.join(
      os.tmpdir(),
      `omniflow-phase8-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
    );
    process.env.OMNIFLOW_LOCAL_DB_PATH = tmpDbFile;
  });

  afterEach(() => {
    if (tmpDbFile && fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
    delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  });

  it("registers Soale Creative AI — Orbital Glow (Dark & Light) in Theme Content Library with zero WCAG AA contrast warnings", async () => {
    const preset = BUILT_IN_THEME_PRESETS.find(
      (p) => p.id === SOALE_CREATIVE_AI_PRESET_ID
    );
    expect(preset).toBeDefined();
    expect(preset?.name).toContain("Soale Creative AI");
    expect(SOALE_CREATIVE_AI_DUAL_PRESET.dark.components.gradientFrom).toBe(
      "#FF7023"
    );
    expect(SOALE_CREATIVE_AI_DUAL_PRESET.dark.components.gradientVia).toBe(
      "#BF4A91"
    );
    expect(SOALE_CREATIVE_AI_DUAL_PRESET.dark.components.gradientTo).toBe(
      "#C823FF"
    );

    const darkWarnings = evaluateThemeContrast(
      "dark",
      SOALE_CREATIVE_AI_DUAL_PRESET.dark
    );
    const lightWarnings = evaluateThemeContrast(
      "light",
      SOALE_CREATIVE_AI_DUAL_PRESET.light
    );
    expect(darkWarnings).toHaveLength(0);
    expect(lightWarnings).toHaveLength(0);

    // Verify Admin Theme Content Library can apply & publish Soale Creative AI preset
    const users = await db.listUsers();
    const superAdmin = users.find((u) => u.role === "SUPER_ADMIN")!;
    const token = await createSessionToken({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      isActive: true,
      mustChangePassword: false,
      sessionVersion: superAdmin.sessionVersion ?? 1,
      createdAt: superAdmin.createdAt,
    });

    const applyReq = new Request("http://localhost:3000/api/admin/theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "localhost:3000",
        Origin: "http://localhost:3000",
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({
        action: "apply_preset",
        presetId: SOALE_CREATIVE_AI_PRESET_ID,
        publish: true,
      }),
    });
    const res = await postAdminTheme(applyReq);
    expect(res.status).toBe(200);
    const updatedTheme = await db.getThemeConfig();
    expect(updatedTheme.activePresetId).toBe(SOALE_CREATIVE_AI_PRESET_ID);
    expect(updatedTheme.published.dark.components.gradientFrom).toBe("#FF7023");
    expect(updatedTheme.published.light.colors.background).toBe("#FAF8F6");
  });

  it("implements dual-mode Soale Orbital Halo light ring, scroll card choreography, and mobile-safe sticky deck rules while keeping OmniFlow content & Navbar", () => {
    const css = readSrc("src/styles/globals.css");
    expect(css).toContain(".soale-hero-circle-wrapper");
    expect(css).toContain(".soale-gradient-circle");
    expect(css).toContain(".soale-core-circle");
    expect(css).toContain("background-color: var(--of-color-bg)");
    expect(css).toContain("[data-scroll-card]");
    expect(css).toContain(".soale-sticky-deck-card");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain(".soale-horizon-card");
    expect(css).toContain(".soale-horizon-beam");

    const hero = readSrc("src/components/sections/PinnedHero.tsx");
    expect(hero).toContain("soale-hero-circle-wrapper");
    expect(hero).toContain("soale-core-circle");
    expect(hero).toContain("Automate the work.");
    expect(hero).toContain("Workflow command center");
    expect(hero).not.toContain("bg-[#0B0615]");

    const layout = readSrc("src/app/(website)/layout.tsx");
    expect(layout).toContain("Navbar");
    expect(layout).toContain("ScrollCardChoreography");
    expect(layout).toContain("ClientErrorMonitor");
  });

  it("upgrades AdminShell with collapsible desktop icon-rail, collapsible 4-group hierarchy, and global Live Site Report alerts", () => {
    const shell = readSrc("src/components/admin/AdminShell.tsx");
    expect(shell).toContain("omniflow_admin_sidebar_collapsed");
    expect(shell).toContain("PanelLeftClose");
    expect(shell).toContain("PanelLeftOpen");
    expect(shell).toContain("w-[72px]");
    expect(shell).toContain("w-[260px]");
    expect(shell).toContain("/admin/diagnostics");
    expect(shell).toContain("Live Site Report");
    expect(shell).toContain("Live Site Error Alert:");
  });

  it("captures live visitor/route errors via telemetry API, surfaces them in Live Site Diagnostics Report, and allows Admin resolution with audit logging", async () => {
    const baseline = await getLiveSiteDiagnosticsReport();
    expect(baseline.criticalCount).toBe(0);
    expect(baseline.unresolvedIncidentCount).toBe(0);

    // Simulate a live client runtime crash on /pricing
    const errReq = new Request("http://localhost:3000/api/telemetry/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "198.51.100.88",
      },
      body: JSON.stringify({
        source: "client_runtime",
        severity: "critical",
        route: "/pricing",
        message: "TypeError: Failed to render custom workflow calculator",
      }),
    });
    const errRes = await postTelemetryError(errReq);
    expect(errRes.status).toBe(200);

    const afterCrash = await getLiveSiteDiagnosticsReport();
    expect(afterCrash.overallStatus).toBe("critical");
    expect(afterCrash.criticalCount).toBeGreaterThanOrEqual(1);
    expect(afterCrash.unresolvedIncidentCount).toBe(1);
    expect(afterCrash.topAlertTitle).toContain("unresolved runtime error");

    // Verify Admin summary endpoint + incident resolution endpoint
    const users = await db.listUsers();
    const superAdmin = users.find((u) => u.role === "SUPER_ADMIN")!;
    const token = await createSessionToken({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      isActive: true,
      mustChangePassword: false,
      sessionVersion: superAdmin.sessionVersion ?? 1,
      createdAt: superAdmin.createdAt,
    });

    const summaryRes = await getLiveReportApi(
      new Request(
        "http://localhost:3000/api/admin/system/live-report?summary=1",
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        }
      )
    );
    expect(summaryRes.status).toBe(200);
    const summaryJson = await summaryRes.json();
    expect(summaryJson.overallStatus).toBe("critical");
    expect(summaryJson.unresolvedIncidentCount).toBe(1);

    const incidentId = afterCrash.incidents[0]!.id;
    const resolveRes = await postLiveReportApi(
      new Request("http://localhost:3000/api/admin/system/live-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Host: "localhost:3000",
          Origin: "http://localhost:3000",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          action: "resolve_incident",
          incidentId,
        }),
      })
    );
    expect(resolveRes.status).toBe(200);
    const resolvedPayload = await resolveRes.json();
    expect(resolvedPayload.report.unresolvedIncidentCount).toBe(0);
    expect(resolvedPayload.report.criticalCount).toBe(0);
  });
});
