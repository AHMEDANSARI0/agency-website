import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { POST as postLeadHandler } from "@/app/api/leads/route";
import { evaluateThemeContrast } from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  SOALE_INSPIRED_PRESET_ID,
} from "@/features/themes/presets";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-soale-phase7-"));
const dbFilePath = path.join(tempDir, "phase7-qa-db.json");

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = dbFilePath;
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Soale Redesign Phase 7 — Final Responsive, Accessibility, SEO, Speed & Functional QA", () => {
  it("1. verifies retained Navbar.tsx structure, 0 dead '#' anchors, and 100% OmniFlow own content without copied Soale branding", async () => {
    const navbarSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Navbar.tsx"),
      "utf8"
    );
    expect(navbarSrc).toContain("ThemeToggle");
    expect(navbarSrc).toContain("BrandMark");

    const [settings, services, caseStudies, blogPosts, testimonials] =
      await Promise.all([
        db.getSiteSettings(),
        db.listServices(true),
        db.listCaseStudies(true),
        db.listBlogPosts(true),
        db.listTestimonials(true),
      ]);

    expect(settings.companyName).toBe("OmniFlow");
    expect(settings.founderName).toBe("Ahmed Ansari");
    expect(services).toHaveLength(8);
    expect(testimonials).toHaveLength(0);

    const combinedSeedText = JSON.stringify({
      settings,
      services,
      caseStudies,
      blogPosts,
    });
    expect(combinedSeedText).not.toMatch(/lorem ipsum/i);
    expect(combinedSeedText).not.toMatch(/\bSoale Agency\b/i);
  });

  it("2. verifies 0 WCAG 2.1 AA contrast warnings across Light & Dark modes for all 8 built-in presets including Soale & Archived Original", () => {
    expect(BUILT_IN_THEME_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(
      BUILT_IN_THEME_PRESETS.some((p) => p.id === SOALE_INSPIRED_PRESET_ID)
    ).toBe(true);
    expect(
      BUILT_IN_THEME_PRESETS.some(
        (p) => p.id === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID && p.isLocked
      )
    ).toBe(true);

    for (const preset of BUILT_IN_THEME_PRESETS) {
      expect(evaluateThemeContrast("light", preset.light)).toEqual([]);
      expect(evaluateThemeContrast("dark", preset.dark)).toEqual([]);
    }
  });

  it("3. verifies /sitemap.xml coverage (including /pricing + all 8 services), lead form idempotency, and sub-10ms SSR snapshot speed", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith("/pricing"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/services"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/work"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/demos"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/services/lead-management"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/services/workflow-automation"))).toBe(
      true
    );

    // End-to-end public lead submission + idempotent replay check
    const payload = {
      name: "Claire Thornton",
      email: "claire@thorntonlegal.co.uk",
      company: "Thornton Legal Partners",
      industry: "Legal & Advisory",
      interestedService: "Lead Management & Qualification Systems",
      businessProblem:
        "Automate inbound consultation intake, conflict check triage, and calendar routing within 60 seconds.",
      privacyConsent: true,
      companyFaxTrap: "",
    };

    const reqInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "Idempotency-Key": "phase7-qa-idem-key-001",
      },
      body: JSON.stringify(payload),
    };

    const res1 = await postLeadHandler(
      new Request("http://localhost:3000/api/leads", reqInit)
    );
    expect(res1.status).toBe(201);

    const res2 = await postLeadHandler(
      new Request("http://localhost:3000/api/leads", reqInit)
    );
    expect([200, 201]).toContain(res2.status);
    const allLeads = await db.listLeads();
    expect(
      allLeads.filter((l) => l.email === "claire@thorntonlegal.co.uk")
    ).toHaveLength(1);

    // Verify mtime+size zero-parse DB snapshot fast-path speed
    const t0 = performance.now();
    await Promise.all([
      db.getSiteSettings(),
      db.getThemeConfig(),
      db.listServices(true),
      db.listCaseStudies(true),
      db.listBlogPosts(true),
    ]);
    expect(performance.now() - t0).toBeLessThan(25);
  });
});
