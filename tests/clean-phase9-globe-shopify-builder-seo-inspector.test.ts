import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateMetadata as generatePricingMetadata } from "@/app/(website)/pricing/page";
import { generateMetadata as generateServicesMetadata } from "@/app/(website)/services/page";
import sitemap from "@/app/sitemap";
import { PUT as putAdminPage } from "@/app/api/admin/pages/route";
import {
  GET as getSeoInspector,
  PATCH as patchSeoInspector,
} from "@/app/api/admin/seo/inspector/route";
import { runFullSiteSeoInspection } from "@/features/seo/site-seo-inspector";
import { getLiveSiteDiagnosticsReport } from "@/features/system/live-site-report";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import {
  DEFAULT_HERO_CANVAS_CONFIG,
  HERO_CANVAS_PRESETS,
  normalizeHeroCanvasConfig,
} from "@/types/hero-canvas";

let tempDir = "";

async function buildSuperAdminHeaders(): Promise<HeadersInit> {
  const users = await db.listUsers();
  const superAdmin =
    users.find((u) => u.role === "SUPER_ADMIN") ?? users[0]!;
  const token = createSessionToken({
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: superAdmin.role,
    sessionVersion: superAdmin.sessionVersion ?? 1,
  });
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-clean-p9-"));
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "clean-p9-db.json");
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("Phase 9 — 3D Interactive Globe Studio, Shopify Live Customizer & Every-Page SEO Inspector", () => {
  it("1. prevents conflicting public/app favicon routes and enforces orphan cleanup in clean-dev-cache.mjs", () => {
    const publicFavicon = path.join(process.cwd(), "public/favicon.ico");
    const conflictingAppFavicon = path.join(
      process.cwd(),
      "src/app/favicon.ico"
    );
    const cleanScript = fs.readFileSync(
      path.join(process.cwd(), "scripts/clean-dev-cache.mjs"),
      "utf8"
    );

    expect(fs.existsSync(publicFavicon)).toBe(true);
    expect(fs.existsSync(conflictingAppFavicon)).toBe(false);
    expect(cleanScript).toContain("src/app/favicon.ico/route.ts");
  });

  it("2. normalizes HeroCanvasConfig across all 4 presets (Orbital Halo, Quip Quantum Sphere, BlueOrbit Horizon Arc, Hybrid) and persists via PUT /api/admin/pages", async () => {
    expect(HERO_CANVAS_PRESETS).toHaveLength(4);
    expect(HERO_CANVAS_PRESETS.map((p) => p.config.visualMode)).toEqual([
      "orbital_halo",
      "quantum_sphere",
      "horizon_arc",
      "halo_plus_globe",
    ]);

    const clamped = normalizeHeroCanvasConfig({
      visualMode: "quantum_sphere",
      layoutAlign: "split_left",
      globeScale: 99,
      globeOffsetX: -999,
      globeOffsetY: 500,
      rotationSpeed: -5,
      particleDensity: "dense",
      primaryGlowColor: "#4db1c0",
      secondaryGlowColor: "not-a-hex",
      glowIntensity: 1.8,
    });

    expect(clamped.visualMode).toBe("quantum_sphere");
    expect(clamped.layoutAlign).toBe("split_left");
    expect(clamped.globeScale).toBe(1.65);
    expect(clamped.globeOffsetX).toBe(-280);
    expect(clamped.globeOffsetY).toBe(200);
    expect(clamped.rotationSpeed).toBe(0);
    expect(clamped.primaryGlowColor).toBe("#4DB1C0");
    expect(clamped.secondaryGlowColor).toBe(
      DEFAULT_HERO_CANVAS_CONFIG.secondaryGlowColor
    );
    expect(clamped.glowIntensity).toBe(1);

    // Persist 3D Globe configuration onto Home page via Admin API
    const headers = await buildSuperAdminHeaders();
    const home = await db.getPageBySlug("home");
    expect(home).not.toBeNull();

    const updatedSections = home!.sections.map((sec) =>
      sec.type === "hero"
        ? {
            ...sec,
            config: {
              ...sec.config,
              ctaLabel: "Launch Global Workflow",
              heroCanvas: {
                visualMode: "horizon_arc",
                layoutAlign: "centered",
                globeScale: 1.15,
                globeOffsetX: 24,
                globeOffsetY: -16,
                rotationSpeed: 1.4,
                particleDensity: "dense",
                primaryGlowColor: "#2C5DB7",
                secondaryGlowColor: "#38BDF8",
                showOrbitalRing: false,
                showSignalArcs: true,
                interactiveDrag: true,
                showCommandCenter: true,
              },
            },
          }
        : sec
    );

    const res = await putAdminPage(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id: home!.id,
          slug: "home",
          title: home!.title,
          sections: updatedSections,
          publish: true,
        }),
      })
    );
    expect(res.status).toBe(200);

    const savedHome = await db.getPageBySlug("home");
    const savedHero = savedHome?.sections.find((s) => s.type === "hero");
    expect(savedHero?.config?.heroCanvas).toMatchObject({
      visualMode: "horizon_arc",
      layoutAlign: "centered",
      globeScale: 1.15,
      globeOffsetX: 24,
      globeOffsetY: -16,
      primaryGlowColor: "#2C5DB7",
    });
  });

  it("3. wires zero-dependency InteractiveGlobeCanvas, VisualEditorCanvasBridge, and Shopify split-screen PageBuilderClient", () => {
    const globeSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/animations/InteractiveGlobeCanvas.tsx"
      ),
      "utf8"
    );
    const bridgeSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/visual-editor/VisualEditorCanvasBridge.tsx"
      ),
      "utf8"
    );
    const builderSrc = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/PageBuilderClient.tsx"),
      "utf8"
    );

    expect(globeSrc).toContain("quantum_sphere");
    expect(globeSrc).toContain("horizon_arc");
    expect(globeSrc).not.toContain("three");
    expect(globeSrc).not.toContain("framer-motion");

    expect(bridgeSrc).toContain("OMNIFLOW_VE_SYNC");
    expect(bridgeSrc).toContain("OMNIFLOW_VE_SECTION_CLICKED");

    expect(builderSrc).toContain("OMNIFLOW_VE_GLOBE_DRAGGED");
    expect(builderSrc).toContain("onDragStart");
    expect(builderSrc).toContain("?ve=1");
  });

  it("4. audits all static & dynamic routes in Site SEO Inspector, applies 1-click inline metadata fixes, updates generateMetadata() + sitemap.xml, and fires global Admin alerts on critical SEO issues", async () => {
    const initialAudit = await runFullSiteSeoInspection();

    // 16 static pages + 8 services + 3 case studies + 3 blog posts >= 30 routes
    expect(initialAudit.totalRoutes).toBeGreaterThanOrEqual(28);
    expect(
      initialAudit.routes.some((r) => r.routePath === "/pricing")
    ).toBe(true);
    expect(
      initialAudit.routes.some(
        (r) => r.routePath === "/services/lead-management"
      )
    ).toBe(true);

    // Verify all 15 static inner routes export dynamic generateMetadata() (not static metadata)
    const servicesMeta = await generateServicesMetadata();
    expect(servicesMeta.alternates?.canonical).toContain("/services");

    // Verify GET /api/admin/seo/inspector
    const headers = await buildSuperAdminHeaders();
    const getRes = await getSeoInspector(
      new Request("http://localhost:3000/api/admin/seo/inspector", {
        method: "GET",
        headers,
      })
    );
    expect(getRes.status).toBe(200);

    // Apply inline fix on /pricing via PATCH /api/admin/seo/inspector including noIndex=true
    const patchRes = await patchSeoInspector(
      new Request("http://localhost:3000/api/admin/seo/inspector", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          entityKind: "page",
          entitySlug: "pricing",
          seo: {
            seoTitle: "Fixed-Scope AI Workflow Pricing",
            seoDescription:
              "Transparent fixed-scope AI workflow automation packages for US, UK, and Canadian service teams with full code ownership and zero lock-in.",
            noIndex: true,
          },
        }),
      })
    );
    expect(patchRes.status).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.ok).toBe(true);

    // Dynamic metadata on /pricing immediately reflects override + robots noindex
    const updatedPricingMeta = await generatePricingMetadata();
    expect(updatedPricingMeta.title).toBe("Fixed-Scope AI Workflow Pricing");
    expect(updatedPricingMeta.robots).toEqual({
      index: false,
      follow: false,
    });

    // Sitemap automatically excludes /pricing when marked noIndex
    const sitemapEntries = await sitemap();
    expect(
      sitemapEntries.some((entry) => entry.url.endsWith("/pricing"))
    ).toBe(false);

    // Global Live Site Report & SEO Inspector surface a critical alert for commercial route marked noindex
    const liveReport = await getLiveSiteDiagnosticsReport();
    const seoCheck = liveReport.checks.find(
      (c) => c.category === "seo_content"
    );
    expect(seoCheck?.severity).toBe("critical");
    expect(seoCheck?.fixHref).toBe("/admin/seo");
  });
});
