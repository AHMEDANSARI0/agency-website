import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import {
  DELETE as deleteSeoHandler,
  GET as getSeoHandler,
  POST as postSeoHandler,
  PUT as putSeoHandler,
} from "@/app/api/admin/seo/route";
import { POST as createUserHandler } from "@/app/api/admin/users/route";
import { GET as healthHandler } from "@/app/api/health/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  buildFaqPageJsonLd,
  buildOrganizationAndWebsiteJsonLd,
  getCanonicalSiteUrl,
  serializeJsonLd,
} from "@/features/seo/json-ld";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase7-test-"));

function extractCookieToken(setCookieHeader: string | null): string {
  const match = (setCookieHeader || "").match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match?.[1] || "";
}

function makeJsonHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase7-db.json");
  process.env.NEXT_PUBLIC_SITE_URL = "https://omniflow.example";
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 7 — Technical SEO, Sitemap/Robots, JSON-LD, Redirects & Consent Analytics", () => {
  let adminToken = "";
  let editorToken = "";

  it("1. generates accurate sitemap.xml & robots.txt while excluding /admin and /api", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain("https://omniflow.example");
    expect(urls).toContain("https://omniflow.example/services");
    expect(urls).toContain("https://omniflow.example/demos");
    expect(urls).toContain("https://omniflow.example/services/lead-management");
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/api"))).toBe(false);

    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe("https://omniflow.example/sitemap.xml");
    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules[0]
      : robotsConfig.rules;
    expect(rules.disallow).toContain("/admin/");
    expect(rules.disallow).toContain("/api/");
  });

  it("2. serializes JSON-LD safely against </script> XSS and omits fake review ratings", async () => {
    const [settings, brand, faqs] = await Promise.all([
      db.getSiteSettings(),
      db.getBrandAssets(),
      db.listFaqs(true),
    ]);

    const orgSchema = buildOrganizationAndWebsiteJsonLd(settings, brand);
    const serializedOrg = serializeJsonLd(orgSchema);
    expect(serializedOrg).toContain("OmniFlow");
    expect(serializedOrg).toContain("Ahmed Ansari");
    expect(serializedOrg).not.toContain("aggregateRating");

    const faqSchema = buildFaqPageJsonLd(faqs);
    expect(faqSchema["@type"]).toBe("FAQPage");
    expect(faqSchema.mainEntity.length).toBeGreaterThan(0);

    const hostilePayload = {
      headline: '</script><script>alert("xss")</script>',
    };
    const safeJson = serializeJsonLd(hostilePayload);
    expect(safeJson).not.toContain("</script>");
    expect(safeJson).toContain("\\u003c/script\\u003e");
  });

  it("3. enforces redirect loop guards, protects /admin paths, and resolves active redirects", async () => {
    const loginRes = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    adminToken = extractCookieToken(loginRes.headers.get("set-cookie"));

    const createEd = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          name: "SEO Editor",
          email: "seo.editor@omniflow.example",
          password: "Editor_StrongPass_2026!",
          role: "EDITOR",
        }),
      })
    );
    expect(createEd.status).toBe(201);

    const edLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "seo.editor@omniflow.example",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    editorToken = extractCookieToken(edLogin.headers.get("set-cookie"));

    // Block hijacking /admin/*
    const hijackAdmin = await postSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          sourcePath: "/admin/login",
          destinationPath: "/contact",
          permanent: true,
        }),
      })
    );
    expect(hijackAdmin.status).toBe(400);

    // Block self-redirect loop
    const selfLoop = await postSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          sourcePath: "/legacy-audit",
          destinationPath: "/legacy-audit",
          permanent: true,
        }),
      })
    );
    expect(selfLoop.status).toBe(400);

    // Create valid permanent redirect A -> B
    const createRdr = await postSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "POST",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          sourcePath: "/old-automation-services",
          destinationPath: "/services/workflow-automation",
          permanent: true,
        }),
      })
    );
    expect(createRdr.status).toBe(200);
    const createdRule = (await createRdr.json()).redirect;

    // Block 2-hop loop B -> A
    const reverseLoop = await postSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "POST",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          sourcePath: "/services/workflow-automation",
          destinationPath: "/old-automation-services",
          permanent: true,
        }),
      })
    );
    expect(reverseLoop.status).toBe(400);

    // Resolve active redirect via db.findActiveRedirect
    const resolved = await db.findActiveRedirect("/old-automation-services");
    expect(resolved).not.toBeNull();
    expect(resolved?.destinationPath).toBe("/services/workflow-automation");
    expect(resolved?.permanent).toBe(true);

    // Delete redirect
    const delRes = await deleteSeoHandler(
      new Request(
        `http://localhost:3000/api/admin/seo?id=${encodeURIComponent(createdRule.id)}`,
        { method: "DELETE", headers: makeJsonHeaders(editorToken) }
      )
    );
    expect(delRes.status).toBe(200);
    expect(await db.findActiveRedirect("/old-automation-services")).toBeNull();
  });

  it("4. enforces RBAC on GA4 analytics, respects noIndex in sitemap, and reports phase 7 health", async () => {
    const auditRes = await getSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        headers: makeJsonHeaders(editorToken),
      })
    );
    expect(auditRes.status).toBe(200);
    const auditJson = await auditRes.json();
    expect(auditJson.canManageAnalytics).toBe(false);
    expect(auditJson.auditRows.length).toBeGreaterThan(10);

    // Editor can update page SEO metadata (including noIndex), which removes '/' from sitemap
    const pageSeoRes = await putSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          mode: "page_seo",
          pageSeo: {
            pageSlug: "home",
            seoTitle: "OmniFlow — Deterministic AI & Workflow Engineering",
            seoDescription:
              "Automate repetitive business operations with grounded AI and deterministic systems across the US, UK, and Canada.",
            noIndex: true,
          },
        }),
      })
    );
    expect(pageSeoRes.status).toBe(200);
    const sitemapNoIndex = await sitemap();
    expect(sitemapNoIndex.some((e) => e.url === "https://omniflow.example")).toBe(
      false
    );

    // Restore indexable home page
    await putSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          mode: "page_seo",
          pageSeo: {
            pageSlug: "home",
            seoTitle: "OmniFlow — Deterministic AI & Workflow Engineering",
            seoDescription:
              "Automate repetitive business operations with grounded AI and deterministic systems across the US, UK, and Canada.",
            noIndex: false,
          },
        }),
      })
    );

    // Editor blocked from modifying global GA4 scripts (403)
    const edGaBlocked = await putSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          mode: "analytics",
          analytics: {
            enabled: true,
            ga4MeasurementId: "G-OMNIFLOW26",
            requireCookieConsent: true,
          },
        }),
      })
    );
    expect(edGaBlocked.status).toBe(403);

    // Super Admin rejects invalid GA4 format (400)
    const badGa = await putSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          mode: "analytics",
          analytics: {
            enabled: true,
            ga4MeasurementId: "INVALID-SCRIPT-ID",
            requireCookieConsent: true,
          },
        }),
      })
    );
    expect(badGa.status).toBe(400);

    // Super Admin saves valid consent-gated GA4 config (200)
    const okGa = await putSeoHandler(
      new Request("http://localhost:3000/api/admin/seo", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          mode: "analytics",
          analytics: {
            enabled: true,
            ga4MeasurementId: "G-OMNIFLOW26",
            requireCookieConsent: true,
          },
        }),
      })
    );
    expect(okGa.status).toBe(200);

    // Health endpoint reports phase 7
    const healthRes = await healthHandler();
    const healthJson = await healthRes.json();
    expect(healthJson.status).toBe("ok");
    expect(healthJson.phase).toBe(7);
  });

  it("5. gracefully falls back to Local JSON Store when DATABASE_URL points to an unreachable/IPv6-only Supabase host", async () => {
    const prevDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://postgres:testpass@db.nonexistent-project-ref-0000.supabase.co:5432/postgres";

    try {
      const [entries, pages, settings] = await Promise.all([
        sitemap(),
        db.listPages(),
        db.getSiteSettings(),
      ]);

      expect(entries.length).toBeGreaterThan(15);
      expect(pages.length).toBeGreaterThan(0);
      expect(settings.companyName).toBe("OmniFlow");
      expect(db.getMode()).toBe("local_file_fallback");
    } finally {
      if (prevDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = prevDbUrl;
      }
    }
  });

  it("6. tolerates short ADMIN_BOOTSTRAP_PASSWORD or malformed NEXT_PUBLIC_SITE_URL in .env without crashing builds", () => {
    const prevPass = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.ADMIN_BOOTSTRAP_PASSWORD = "short";
    process.env.NEXT_PUBLIC_SITE_URL = "http://[::1]:bad:url";

    try {
      const snap = createInitialSeedSnapshot();
      expect(snap.users[0].passwordHash.startsWith("scrypt$")).toBe(true);
      expect(getCanonicalSiteUrl()).toBe("http://localhost:3000");
    } finally {
      if (prevPass === undefined) delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
      else process.env.ADMIN_BOOTSTRAP_PASSWORD = prevPass;

      if (prevSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl;
    }
  });
});
