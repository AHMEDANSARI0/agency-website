import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../package.json";
import { GET as healthHandler } from "@/app/api/health/route";
import { OMNIFLOW_APP_VERSION } from "@/features/system/health";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { buildOrganizationAndWebsiteJsonLd, serializeJsonLd } from "@/features/seo/json-ld";
import { db } from "@/lib/database";

describe("Upgrade Phase 9 — Final v1.0.0 Production Audit, Honesty Policy & Pre-Flight CLI", () => {
  it("1. aligns v1.0.0 release version across package.json, system health, and /api/health", async () => {
    expect(pkg.version).toBe("1.0.0");
    expect(OMNIFLOW_APP_VERSION).toBe("1.0.0");

    const res = await healthHandler(
      new Request("http://localhost:3000/api/health?probe=liveness")
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      status: string;
      version: string;
      securityProfile: string;
    };
    expect(json.status).toBe("ok");
    expect(json.version).toBe("1.0.0");
    expect(json.securityProfile).toContain("v8");
  });

  it("2. upholds strict brand honesty invariants across testimonials, case studies, and JSON-LD", async () => {
    const [settings, brand, publicTestimonials, caseStudies, theme] =
      await Promise.all([
        db.getSiteSettings(),
        db.getBrandAssets(),
        db.listTestimonials(true),
        db.listCaseStudies(true),
        db.getThemeConfig(),
      ]);

    expect(settings.companyName).toBe("OmniFlow");
    expect(settings.founderName).toBe("Ahmed Ansari");
    expect(settings.targetMarkets).toEqual([
      "United States",
      "United Kingdom",
      "Canada",
    ]);
    expect(theme.defaultMode).toBe("light");

    // Zero fake public testimonials shipped out-of-the-box
    expect(publicTestimonials).toHaveLength(0);

    // Every seeded portfolio item carries an explicit truthful workType
    expect(caseStudies.length).toBeGreaterThanOrEqual(3);
    for (const cs of caseStudies) {
      expect(Object.keys(WORK_TYPE_META)).toContain(cs.workType);
    }

    // Zero fake review or star rating markup in Organization JSON-LD
    const orgJson = serializeJsonLd(
      buildOrganizationAndWebsiteJsonLd(settings, brand, "https://omniflow.example")
    );
    expect(orgJson).not.toContain("aggregateRating");
    expect(orgJson).not.toContain("reviewRating");
  });

  it("3. verifies SQL migrations are strictly idempotent and non-destructive", () => {
    const m1 = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/0001_omniflow_schema.sql"),
      "utf8"
    );
    const m2 = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/0002_production_upgrade.sql"),
      "utf8"
    );

    for (const sql of [m1, m2]) {
      expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/i);
      expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
      expect(sql).not.toMatch(/\bTRUNCATE\s+TABLE\b/i);
    }
  });

  it("4. runs scripts/preflight-check.mjs cleanly in CI mode and flags missing secrets in strict production mode", () => {
    const scriptPath = path.join(process.cwd(), "scripts/preflight-check.mjs");
    const ciOut = execFileSync(process.execPath, [scriptPath], {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "test" },
    });
    expect(ciOut).toContain("0 failed");

    let prodFailed = false;
    try {
      execFileSync(process.execPath, [scriptPath, "--mode=production"], {
        encoding: "utf8",
        env: {
          ...process.env,
          NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
          DATABASE_URL: "",
          AUTH_SECRET: "short",
        },
        stdio: "pipe",
      });
    } catch {
      prodFailed = true;
    }
    expect(prodFailed).toBe(true);
  });
});
