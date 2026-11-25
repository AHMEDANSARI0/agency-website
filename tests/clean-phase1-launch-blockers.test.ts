import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateMetadata as generateHomeMetadata } from "@/app/(website)/page";
import { metadata as aboutMetadata } from "@/app/(website)/about/page";
import { metadata as howItWorksMetadata } from "@/app/(website)/how-it-works/page";
import { GET as getSetupHandler } from "@/app/api/admin/auth/setup/route";
import { GET as healthHandler } from "@/app/api/health/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import {
  findUnfilledPlaceholders,
  hasConfiguredContactEmail,
  normalizeLegacyContactEmail,
  PLACEHOLDER_TOKENS,
} from "@/lib/placeholders";
import { buildHomeAbsoluteTitle, stripTrailingBrand } from "@/lib/seo/title";

let tempDir = "";

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-clean-p1-"));
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "clean-p1-db.json");
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("Phase 1 — Launch Blockers, Placeholders, Admin Hardening & Brand Assets", () => {
  it("1. prevents brand duplication on Home (title.absolute) and all child pages", async () => {
    const homeMeta = await generateHomeMetadata();
    expect(homeMeta.title).toEqual(
      expect.objectContaining({
        absolute: expect.any(String),
      })
    );
    const absTitle = (homeMeta.title as { absolute: string }).absolute;
    const brandMatches = absTitle.match(/OmniFlow/gi) || [];
    expect(brandMatches.length).toBe(1);

    expect(String(aboutMetadata.title)).not.toMatch(/OmniFlow/i);
    expect(String(howItWorksMetadata.title)).not.toMatch(/OmniFlow/i);

    expect(
      stripTrailingBrand("Lead Management Systems | OmniFlow", "OmniFlow")
    ).toBe("Lead Management Systems");
    expect(
      buildHomeAbsoluteTitle(
        "OmniFlow | AI Automation | OmniFlow",
        "OmniFlow",
        "Operations Partner"
      )
    ).toBe("OmniFlow — AI Automation");
  });

  it("2. replaces hello@omniflow.example with {{CONTACT_EMAIL}}, upgrades legacy DB defaults, and surfaces Admin Dashboard warnings", () => {
    const seed = createInitialSeedSnapshot();
    expect(seed.siteSettings.contactEmail).toBe(
      PLACEHOLDER_TOKENS.CONTACT_EMAIL
    );
    expect(hasConfiguredContactEmail(seed.siteSettings.contactEmail)).toBe(
      false
    );
    expect(hasConfiguredContactEmail("hello@omniflow.example")).toBe(false);
    expect(hasConfiguredContactEmail("hello@yourdomain.com")).toBe(true);
    expect(normalizeLegacyContactEmail("hello@omniflow.example")).toBe(
      PLACEHOLDER_TOKENS.CONTACT_EMAIL
    );

    const warnings = findUnfilledPlaceholders({
      settings: seed.siteSettings,
      pages: seed.pages,
      services: seed.services,
      caseStudies: seed.caseStudies,
      blogPosts: seed.blogPosts,
      faqs: seed.faqs,
    });
    expect(
      warnings.some((w) => w.token === PLACEHOLDER_TOKENS.CONTACT_EMAIL)
    ).toBe(true);
    expect(
      warnings.some((w) => w.token === PLACEHOLDER_TOKENS.PRICE_FROM)
    ).toBe(true);

    const filledPricing = seed.siteSettings.pricingConfig
      ? JSON.parse(
          JSON.stringify(seed.siteSettings.pricingConfig).replaceAll(
            PLACEHOLDER_TOKENS.PRICE_FROM,
            "$1,200"
          )
        )
      : undefined;

    const filledWarnings = findUnfilledPlaceholders({
      settings: {
        ...seed.siteSettings,
        contactEmail: "hello@yourdomain.com",
        pricingConfig: filledPricing,
      },
    });
    expect(filledWarnings).toHaveLength(0);
  });

  it("3. locks /admin/setup once Super Admin exists and redacts public /api/health details", async () => {
    const hasSuper = await db.hasSuperAdmin();
    expect(hasSuper).toBe(true);

    const setupRes = await getSetupHandler();
    expect(setupRes.status).toBe(404);
    const setupJson = await setupRes.json();
    expect(setupJson.setupRequired).toBe(false);

    // Public /api/health returns strictly { status: "ok" | "degraded" }
    const pubRes = await healthHandler(
      new Request("http://localhost:3000/api/health")
    );
    const pubJson = await pubRes.json();
    expect(Object.keys(pubJson)).toEqual(["status"]);
    expect(["ok", "degraded"]).toContain(pubJson.status);

    // Authenticated admin receives full diagnostics
    const users = await db.listUsers();
    const superAdmin = users.find((u) => u.role === "SUPER_ADMIN")!;
    const token = createSessionToken(superAdmin);
    const adminRes = await healthHandler(
      new Request("http://localhost:3000/api/health", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      })
    );
    const adminJson = await adminRes.json();
    expect(adminJson.status).toBe("ok");
    expect(adminJson.database).toBeDefined();
    expect(adminJson.storage).toBeDefined();
  });

  it("4. ships real public/ brand assets (1200x630 OG, favicons, logo), clean DEPLOYMENT_AND_HANDOVER.md, and passing preflight", () => {
    const root = process.cwd();
    for (const rel of [
      "public/logo.svg",
      "public/logo-dark.svg",
      "public/favicon.svg",
      "public/favicon.ico",
      "public/apple-touch-icon.png",
      "public/og-image.png",
      "DEPLOYMENT_AND_HANDOVER.md",
    ]) {
      const full = path.join(root, rel);
      expect(fs.existsSync(full)).toBe(true);
      expect(fs.statSync(full).size).toBeGreaterThan(100);
    }

    const handover = fs.readFileSync(
      path.join(root, "DEPLOYMENT_AND_HANDOVER.md"),
      "utf8"
    );
    expect(handover).toContain("0001_omniflow_schema.sql");
    expect(handover).toContain("0004_security_and_performance.sql");
    expect(handover).toContain("omniflow-media");
    expect(handover).toContain("/admin/setup");
    expect(handover).toContain("Rollback");
    // Must not document env values / connection strings
    expect(handover).not.toContain("postgresql://");
    expect(handover).not.toContain("DATABASE_URL=");
    expect(handover).not.toContain("AUTH_SECRET=");

    const preflightOut = execFileSync(
      process.execPath,
      ["scripts/preflight-check.mjs"],
      { cwd: root, encoding: "utf8" }
    );
    expect(preflightOut).toContain("0 failed");
  });

  it("5. includes ContactForm error retry button, Idempotency-Key header, and honeypot field", () => {
    const contactSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/ContactForm.tsx"),
      "utf8"
    );
    expect(contactSrc).toContain("handleRetry");
    expect(contactSrc).toContain("Try Again");
    expect(contactSrc).toContain("Idempotency-Key");
    expect(contactSrc).toContain("company_fax_number");
  });
});
