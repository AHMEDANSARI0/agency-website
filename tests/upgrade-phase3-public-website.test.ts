import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";

describe("Upgrade Phase 3 — Public Website Redesign (Mega-Menu, 16-Section Homepage & Inner Pages)", () => {
  let tempDir = "";

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-upg-p3-"));
    process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "upg-p3-db.json");
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    delete process.env.OMNIFLOW_LOCAL_DB_PATH;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("seeds all 6 focused homepage sections plus the strict verified-testimonials gate", async () => {
    const snapshot = createInitialSeedSnapshot();
    const home = snapshot.pages.find((p) => p.slug === "home");
    expect(home).toBeDefined();

    const sectionTypes = home!.sections.map((s) => s.type);
    expect(sectionTypes).toEqual([
      "hero",
      "flagship_systems",
      "interactive_demos_preview",
      "case_studies_highlight",
      "how_it_works",
      "cta_banner",
    ]);

    const verifiedTestimonials = await db.listTestimonials(true);
    expect(verifiedTestimonials).toHaveLength(0);
    const activeSectionCount = home!.sections.filter((s) => s.isVisible).length;
    expect(activeSectionCount).toBe(6);
  });

  it("wires accessible Admin-driven Navbar with Escape key, mobile drawer, and settings.navigation", () => {
    const navbarSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );

    expect(navbarSource).toContain("settings.navigation");
    expect(navbarSource).toContain("aria-expanded");
    expect(navbarSource).toContain("aria-controls");
    expect(navbarSource).toContain("Escape");
    expect(navbarSource).toContain("mobile-navigation-drawer");
    expect(navbarSource).toContain("data-lenis-prevent");

    const settingsSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/SiteSettingsClient.tsx"),
      "utf8"
    );
    const editorBridgeSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/visual-editor/VisualEditorCanvasBridge.tsx"),
      "utf8"
    );
    expect(settingsSource).toContain('const previewSrc = `${previewPath}');
    expect(settingsSource).toContain("src={previewSrc}");
    expect(settingsSource).toContain('value="/pricing">Pricing</option>');
    expect(settingsSource).toContain("OMNIFLOW_NAVBAR_PREVIEW");
    expect(editorBridgeSource).toContain("omniflow:ve-navbar-update");
    expect(editorBridgeSource).toContain("OMNIFLOW_THEME_PREVIEW");
  });

  it("eliminates legacy Phase 1 vermilion/amber hardcoded colors across public website pages", () => {
    const homepageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/page.tsx"),
      "utf8"
    );

    expect(homepageSource).not.toContain("210,58,31");
    expect(homepageSource).not.toContain("#E6A92E");
    expect(homepageSource).toContain("HomeAutomationLabPreview");
    expect(homepageSource).toContain("architecture_governance");
    expect(homepageSource).toContain("roi_framing");
  });

  it("wires reusable PageConversionBanner across core inner public routes", () => {
    const innerRoutes = [
      "src/app/(website)/services/page.tsx",
      "src/app/(website)/services/[slug]/page.tsx",
      "src/app/(website)/solutions/page.tsx",
      "src/app/(website)/how-it-works/page.tsx",
      "src/app/(website)/demos/page.tsx",
      "src/app/(website)/case-studies/page.tsx",
      "src/app/(website)/case-studies/[slug]/page.tsx",
      "src/app/(website)/about/page.tsx",
      "src/app/(website)/team/page.tsx",
      "src/app/(website)/blog/page.tsx",
      "src/app/(website)/blog/[slug]/page.tsx",
      "src/app/(website)/faq/page.tsx",
    ];

    for (const relPath of innerRoutes) {
      const content = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
      expect(content).toContain("PageConversionBanner");
    }
  });
});
