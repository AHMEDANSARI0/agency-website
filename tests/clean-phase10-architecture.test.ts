import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import {
  CURRENT_SEED_VERSION,
  DEFAULT_HOME_SECTIONS,
  createInitialSeedSnapshot,
} from "@/lib/database/seed-data";
import {
  DEFAULT_HERO_CANVAS_CONFIG,
  HERO_CANVAS_PRESETS,
  normalizeHeroCanvasConfig,
} from "@/types/hero-canvas";
import { PUT as putAdminPage } from "@/app/api/admin/pages/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { STATIC_ROUTE_SEO_DEFAULTS } from "@/lib/seo/static-route-metadata";
import sitemap from "@/app/sitemap";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Phase 10 — Theme-Harmonized 3D Globe, Recommended 9-Section Home, Admin-Driven Nav & Real Inner-Page Studio", () => {
  let tempDir = "";

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-clean-p10-"));
    process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "clean-p10-db.json");
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    delete process.env.OMNIFLOW_LOCAL_DB_PATH;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

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

  it("1. harmonizes 3D Globe defaults & canvas renderer with OmniFlow Dark Purple AI (#A855F7 Orchid & #FB923C Sunset Orange) in Dark & Light modes", () => {
    expect(DEFAULT_HERO_CANVAS_CONFIG.visualMode).toBe("quantum_sphere");
    expect(DEFAULT_HERO_CANVAS_CONFIG.layoutAlign).toBe("split_left");
    expect(DEFAULT_HERO_CANVAS_CONFIG.showCommandCenter).toBe(false);
    expect(DEFAULT_HERO_CANVAS_CONFIG.primaryGlowColor).toBe("#A855F7");
    expect(DEFAULT_HERO_CANVAS_CONFIG.secondaryGlowColor).toBe("#FB923C");
    expect(DEFAULT_HERO_CANVAS_CONFIG.glowIntensity).toBe(0.72);

    const normalized = normalizeHeroCanvasConfig(undefined);
    expect(normalized).toEqual(DEFAULT_HERO_CANVAS_CONFIG);
    expect(HERO_CANVAS_PRESETS).toHaveLength(4);
    expect(HERO_CANVAS_PRESETS[0]?.config.primaryGlowColor).toBe("#A855F7");

    const globeSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/animations/InteractiveGlobeCanvas.tsx"
      ),
      "utf8"
    );
    expect(globeSrc).toContain("isLightMode");
    expect(globeSrc).toContain("#A855F7");
    expect(globeSrc).toContain("#FB923C");
    expect(globeSrc).not.toContain("three");
    expect(globeSrc).not.toContain("framer-motion");
  });

  it("2. enforces the recommended 9-section Homepage flow and migrates legacy snapshots to v18", async () => {
    expect(CURRENT_SEED_VERSION).toBe(18);
    expect(DEFAULT_HOME_SECTIONS).toHaveLength(9);
    expect(DEFAULT_HOME_SECTIONS.map((s) => s.type)).toEqual([
      "hero",
      "trust_strip",
      "problems_outcomes",
      "flagship_systems",
      "interactive_demos_preview",
      "case_studies_highlight",
      "how_it_works",
      "faq_section",
      "cta_banner",
    ]);

    const seed = createInitialSeedSnapshot();
    const legacy9Path = path.join(tempDir, "legacy-v15-9sec.json");
    const legacy9Sections = [
      "hero",
      "trust_strip",
      "problems_outcomes",
      "flagship_systems",
      "interactive_demos_preview",
      "how_it_works",
      "case_studies_highlight",
      "roi_framing",
      "faq_section",
    ].map((type, idx) => ({
      id: `sec_${idx}`,
      type,
      title: `Legacy ${type}`,
      isVisible: true,
      order: idx + 1,
      config: {},
    }));

    const legacySnapshot = {
      ...seed,
      schemaVersion: 16,
      siteSettings: { ...seed.siteSettings, navbarStyle: undefined },
      pages: [
        {
          ...seed.pages[0],
          sections: legacy9Sections,
          draftSections: legacy9Sections,
        },
      ],
    };
    delete legacySnapshot.siteSettingsDraft;
    delete legacySnapshot.cardMotionDraft;
    delete legacySnapshot.brandAssetsDraft;
    fs.writeFileSync(legacy9Path, JSON.stringify(legacySnapshot, null, 2), "utf8");

    process.env.OMNIFLOW_LOCAL_DB_PATH = legacy9Path;
    const upgradedHome = await db.getPageBySlug("home");
    expect(upgradedHome?.sections).toHaveLength(9);
    expect((await db.getSiteSettings()).navbarStyle?.topOffset).toBe(12);
    expect((await db.getSiteSettingsDraft()).navbarStyle?.topOffset).toBe(12);
    expect(await db.getCardMotionDraft()).toEqual(await db.getCardMotion());
    expect(await db.getBrandAssetsDraft()).toEqual(await db.getBrandAssets());
    expect(
      normalizeHeroCanvasConfig(upgradedHome?.sections[0]?.config?.heroCanvas)
    ).toMatchObject({
      visualMode: "quantum_sphere",
      primaryGlowColor: "#A855F7",
      secondaryGlowColor: "#FB923C",
      showCommandCenter: false,
    });
  });

  it("3. powers Navbar 100% from Admin Settings -> Navigation and consolidates /work into /case-studies via 308 permanentRedirect", async () => {
    const navbarSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );
    expect(navbarSrc.split("\n").length).toBeLessThan(260);
    expect(navbarSrc).toContain("settings.navigation");
    expect(navbarSrc).toContain("data-lenis-prevent");
    expect(navbarSrc).not.toContain("mega-panel-services");

    const workPageSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/work/page.tsx"),
      "utf8"
    );
    expect(workPageSrc).toContain('permanentRedirect("/case-studies")');
    const redirectResponse = await middleware(new NextRequest("http://localhost:3000/work"));
    expect(redirectResponse.status).toBe(308);
    expect(redirectResponse.headers.get("location")).toBe("http://localhost:3000/case-studies");

    const caseStudiesSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/case-studies/page.tsx"),
      "utf8"
    );
    expect(caseStudiesSrc).toContain("WorkFilterGrid");
    expect(caseStudiesSrc).toContain('pageSlug="case-studies"');

    expect("work" in STATIC_ROUTE_SEO_DEFAULTS).toBe(false);

    const sitemapUrls = (await sitemap()).map((entry) => entry.url);
    expect(sitemapUrls.some((u) => u.endsWith("/case-studies"))).toBe(true);
    expect(sitemapUrls.some((u) => u.endsWith("/work"))).toBe(false);
  });

  it("4. wires real inner-page DB overrides across all 14 static routes, unifies /admin/seo, modularizes PageBuilderClient, and hardens ContactForm", async () => {
    const staticInnerRoutes = [
      ["services", "src/app/(website)/services/page.tsx"],
      ["solutions", "src/app/(website)/solutions/page.tsx"],
      ["case-studies", "src/app/(website)/case-studies/page.tsx"],
      ["pricing", "src/app/(website)/pricing/page.tsx"],
      ["how-it-works", "src/app/(website)/how-it-works/page.tsx"],
      ["demos", "src/app/(website)/demos/page.tsx"],
      ["blog", "src/app/(website)/blog/page.tsx"],
      ["about", "src/app/(website)/about/page.tsx"],
      ["team", "src/app/(website)/team/page.tsx"],
      ["faq", "src/app/(website)/faq/page.tsx"],
      ["contact", "src/app/(website)/contact/page.tsx"],
      ["privacy-policy", "src/app/(website)/privacy-policy/page.tsx"],
      ["terms-of-service", "src/app/(website)/terms-of-service/page.tsx"],
      ["cookie-policy", "src/app/(website)/cookie-policy/page.tsx"],
    ] as const;

    for (const [slug, relPath] of staticInnerRoutes) {
      const src = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
      expect(src).toContain(`pageSlug="${slug}"`);
    }

    // Persist an inner-page override via PUT /api/admin/pages and verify DB persistence
    const headers = await buildSuperAdminHeaders();
    const putRes = await putAdminPage(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          slug: "services",
          title: "Services",
          publish: true,
          sections: [
            {
              id: "sec_services_hero",
              type: "hero",
              title: "Custom Engineered AI Workflow Systems",
              subtitle: "Live DB-backed inner page header override.",
              isVisible: true,
              order: 1,
              config: {
                ctaLabel: "Scope Your Workflow",
                ctaHref: "/contact?intent=call",
              },
            },
            {
              id: "sec_services_note",
              type: "rich_text",
              title: "Executive SLA Guarantee",
              subtitle: "Every deployment ships with runbooks.",
              isVisible: true,
              order: 2,
              config: {
                markdown: "## Full Ownership\n\nDeployed inside your cloud.",
              },
            },
            {
              id: "sec_services_cta",
              type: "cta_banner",
              title: "Start With One High-Impact Workflow",
              subtitle: "Written scope in 48 hours.",
              isVisible: true,
              order: 3,
              config: {},
            },
          ],
        }),
      })
    );
    expect(putRes.status).toBe(200);
    const savedServicesPage = await db.getPageBySlug("services");
    expect(savedServicesPage?.sections).toHaveLength(3);
    expect(savedServicesPage?.sections[0]?.title).toBe(
      "Custom Engineered AI Workflow Systems"
    );

    // Modularized PageBuilderClient + Unified SEO Hub + ContactForm hardening
    const builderSrc = fs.readFileSync(
      path.join(process.cwd(), "src/features/admin/PageBuilderClient.tsx"),
      "utf8"
    );
    expect(builderSrc.split("\n").length).toBeLessThan(1500);
    expect(builderSrc).toContain("HeroGlobeStudioPanel");
    expect(builderSrc).toContain("PageSeoPanel");
    expect(builderSrc).toContain("INNER_PAGE_SUPPORTED_TYPES");

    const adminShellSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/admin/AdminShell.tsx"),
      "utf8"
    );
    expect(adminShellSrc).toContain('href: "/admin/seo"');
    expect(adminShellSrc).not.toContain('href: "/admin/seo-inspector"');

    const contactFormSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/ContactForm.tsx"),
      "utf8"
    );
    expect(contactFormSrc).toContain("inFlightRef");
    expect(contactFormSrc).toContain("AbortController");
  });
});
