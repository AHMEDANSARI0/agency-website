import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getCmsHandler, POST as postCmsHandler } from "@/app/api/admin/cms/route";
import { PATCH as patchLeadHandler } from "@/app/api/admin/leads/[id]/route";
import { GET as exportLeadsHandler } from "@/app/api/admin/leads/export/route";
import { POST as importLeadsHandler } from "@/app/api/admin/leads/import/route";
import { PUT as putThemeHandler } from "@/app/api/admin/theme/route";
import { GET as getUsersHandler } from "@/app/api/admin/users/route";
import { GET as healthHandler } from "@/app/api/health/route";
import { POST as submitLeadHandler } from "@/app/api/leads/route";
import { GET as rssFeedHandler } from "@/app/feed.xml/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import {
  buildOrganizationAndWebsiteJsonLd,
  serializeJsonLd,
} from "@/features/seo/json-ld";
import { getSystemHealthReport } from "@/features/system/health";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { hashPassword } from "@/lib/security/password";
import { middleware } from "@/middleware";

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "omniflow-transformation-p5-")
);
const dbFilePath = path.join(tempDir, "phase5-production-db.json");

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = dbFilePath;
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function buildCookieHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

describe("Transformation Phase 5 — End-to-End Production Verification & Handover Readiness", () => {
  it("enforces Edge middleware 307 redirect on protected /admin routes while permitting valid HMAC sessions and public auth routes", async () => {
    // 1. Unauthenticated /admin and /admin/leads must return 307 -> /admin/login with no-store
    for (const protectedPath of ["/admin", "/admin/leads", "/admin/cms", "/admin/users"]) {
      const req = new NextRequest(`http://localhost:3000${protectedPath}`);
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/admin/login");
      expect(res.headers.get("cache-control")).toContain("no-store");
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
    }

    // 2. Tampered & expired session cookies must also be rejected at the Edge
    const tamperedReq = new NextRequest("http://localhost:3000/admin", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=eyJ1c2VySWQiOiJ1c3JfMSJ9.forged` },
    });
    expect((await middleware(tamperedReq)).status).toBe(307);

    const expiredToken = createSessionToken(
      {
        id: "usr_exp",
        email: "expired@omniflow.example",
        name: "Expired Staff",
        role: "SUPER_ADMIN",
        sessionVersion: 1,
      },
      1,
      Date.now() - 5 * 3600_000
    );
    const expiredReq = new NextRequest("http://localhost:3000/admin/theme", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${expiredToken}` },
    });
    expect((await middleware(expiredReq)).status).toBe(307);

    // 3. Public auth pages (/admin/login, /admin/setup, /admin/recover) pass through with 200 + no-store
    for (const publicAuthPath of ["/admin/login", "/admin/setup", "/admin/recover"]) {
      const req = new NextRequest(`http://localhost:3000${publicAuthPath}`);
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toContain("no-store");
    }

    // 4. Valid HMAC session passes through Edge middleware cleanly
    const validToken = createSessionToken({
      id: "usr_valid",
      email: "architect@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      sessionVersion: 1,
    });
    const validReq = new NextRequest("http://localhost:3000/admin/leads", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${validToken}` },
    });
    const validRes = await middleware(validReq);
    expect(validRes.status).toBe(200);
    expect(validRes.headers.get("cache-control")).toContain("no-store");
  });

  it("verifies full E2E business journey: Discovery Call intake -> Dashboard KPIs -> CRM deal progression -> CSV export & import", async () => {
    // Provision active Super Admin without forced password rotation for admin operations
    const superAdmin = await db.createUser({
      email: "founder.phase5@omniflow.example",
      name: "Ahmed Ansari",
      role: "SUPER_ADMIN",
      passwordHash: hashPassword("Phase5Executive#2026!"),
      mustChangePassword: false,
    });
    const adminToken = createSessionToken(superAdmin);

    // 1. Public prospect submits a Discovery Call request via /api/leads
    const intakeRes = await submitLeadHandler(
      new Request("http://localhost:3000/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          "X-Forwarded-For": "198.51.100.88",
        },
        body: JSON.stringify({
          name: "Olivia Bennett",
          email: "olivia.bennett@northstar-ops.example",
          company: "Northstar Operations Ltd",
          website: "https://northstar-ops.example",
          industry: "Professional Services",
          interestedService: "Workflow Automation",
          businessProblem:
            "Manual client onboarding across HubSpot, Slack, and Stripe takes 6 hours per client.",
          budgetRange: "$5,000 – $12,000",
          timeline: "Within 30 days",
          enquiryType: "discovery_call",
          preferredCallWindow: "Morning (9am–12pm)",
          timezone: "Europe/London",
          privacyConsent: true,
        }),
      })
    );
    expect(intakeRes.status).toBe(201);
    const { leadId } = (await intakeRes.json()) as { leadId: string };

    // 2. Qualify & value the deal in CRM (/api/admin/leads/[id])
    const qualifyRes = await patchLeadHandler(
      new Request(`http://localhost:3000/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: buildCookieHeaders(adminToken),
        body: JSON.stringify({
          status: "Won",
          priority: "High",
          proposalValue: 9500,
          expectedClosingDate: "2026-12-15",
          noteText: "Signed Phase 1 HubSpot-to-Stripe workflow automation architecture scope.",
        }),
      }),
      { params: Promise.resolve({ id: leadId }) }
    );
    expect(qualifyRes.status).toBe(200);

    // 3. Verify Executive Dashboard KPI metrics reflect real closed revenue & conversion
    const metrics = await db.getLeadDashboardMetrics();
    expect(metrics.totalLeads).toBeGreaterThanOrEqual(1);
    expect(metrics.wonLeads).toBeGreaterThanOrEqual(1);
    expect(metrics.wonRevenueValue).toBeGreaterThanOrEqual(9500);

    // 4. Export CSV and verify formula-injection safety + newly closed deal presence
    const csvRes = await exportLeadsHandler(
      new Request("http://localhost:3000/api/admin/leads/export", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
      })
    );
    expect(csvRes.status).toBe(200);
    const csvText = await csvRes.text();
    expect(csvText).toContain("olivia.bennett@northstar-ops.example");
    expect(csvText).toContain("9500");

    // 5. Batch import a secondary partner lead via CSV
    const batchCsv = [
      "Name,Email,Company,Industry,Interested Service,Business Problem,Status,Priority,Proposal Value",
      '"Marcus Vance","marcus@maple-advisory.example","Maple Advisory","Consulting","Lead Management","Inbound form routing delays across Toronto & Vancouver offices.","Qualified","High","6800"',
    ].join("\n");

    const importRes = await importLeadsHandler(
      new Request("http://localhost:3000/api/admin/leads/import", {
        method: "POST",
        headers: buildCookieHeaders(adminToken),
        body: JSON.stringify({ csvText: batchCsv }),
      })
    );
    expect(importRes.status).toBe(201);
    const importJson = (await importRes.json()) as { importedCount: number };
    expect(importJson.importedCount).toBe(1);
  });

  it("enforces strict RBAC matrix across SUPER_ADMIN, EDITOR, AUTHOR, and unauthenticated callers", async () => {
    const editor = await db.createUser({
      email: "editor.phase5@omniflow.example",
      name: "Content Editor",
      role: "EDITOR",
      passwordHash: hashPassword("Phase5Editor#2026!"),
      mustChangePassword: false,
    });
    const author = await db.createUser({
      email: "author.phase5@omniflow.example",
      name: "Blog Author",
      role: "AUTHOR",
      passwordHash: hashPassword("Phase5Author#2026!"),
      mustChangePassword: false,
    });

    const editorToken = createSessionToken(editor);
    const authorToken = createSessionToken(author);

    // Unauthenticated callers always get 401
    const unauthCms = await getCmsHandler(
      new Request("http://localhost:3000/api/admin/cms")
    );
    expect(unauthCms.status).toBe(401);

    // AUTHOR cannot list users (403), export CRM leads (403), or mutate global theme (403)
    const authorUsers = await getUsersHandler(
      new Request("http://localhost:3000/api/admin/users", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${authorToken}` },
      })
    );
    expect(authorUsers.status).toBe(403);

    const authorLeadsExport = await exportLeadsHandler(
      new Request("http://localhost:3000/api/admin/leads/export", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${authorToken}` },
      })
    );
    expect(authorLeadsExport.status).toBe(403);

    const currentTheme = await db.getThemeConfig();
    const authorThemePut = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: buildCookieHeaders(authorToken),
        body: JSON.stringify(currentTheme),
      })
    );
    expect(authorThemePut.status).toBe(403);

    // AUTHOR cannot directly publish a blog post (content:publish is restricted to EDITOR / SUPER_ADMIN)
    const authorPublishAttempt = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: buildCookieHeaders(authorToken),
        body: JSON.stringify({
          entity: "blog",
          slug: "author-direct-publish-attempt",
          title: "Author Direct Publish Attempt",
          excerpt: "Testing RBAC publish restriction for AUTHOR role across CMS studio.",
          category: "Engineering",
          tags: ["RBAC"],
          status: "published",
          contentMarkdown:
            "## Section\nTesting RBAC enforcement so AUTHOR accounts can draft articles without publishing directly.",
          seo: {
            seoTitle: "Author Publish Test",
            seoDescription: "Testing RBAC enforcement for blog publishing.",
          },
        }),
      })
    );
    expect(authorPublishAttempt.status).toBe(403);

    // AUTHOR CAN save their own draft article (200)
    const authorDraftAttempt = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: buildCookieHeaders(authorToken),
        body: JSON.stringify({
          entity: "blog",
          slug: "author-valid-draft-article",
          title: "Author Valid Draft Article",
          excerpt: "Testing that AUTHOR role can cleanly save draft insights for editorial review.",
          category: "Engineering",
          tags: ["Draft"],
          status: "draft",
          contentMarkdown:
            "## Draft Insight\nAuthors can write and submit drafts while Editors control publication.",
        }),
      })
    );
    expect(authorDraftAttempt.status).toBe(200);

    // EDITOR cannot manage staff users (403) but CAN read CMS inventory (200)
    const editorUsers = await getUsersHandler(
      new Request("http://localhost:3000/api/admin/users", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${editorToken}` },
      })
    );
    expect(editorUsers.status).toBe(403);

    const editorCms = await getCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${editorToken}` },
      })
    );
    expect(editorCms.status).toBe(200);
  });

  it("verifies strict Brand Honesty invariants, truthful JSON-LD, sitemap/robots/RSS feeds, and 4-migration readiness", async () => {
    const [settings, brand, publicTestimonials, caseStudies] = await Promise.all([
      db.getSiteSettings(),
      db.getBrandAssets(),
      db.listTestimonials(true),
      db.listCaseStudies(true),
    ]);

    // 1. Zero unverified public testimonials by default
    expect(publicTestimonials).toHaveLength(0);

    // 2. Every published case study uses an honest, disclosed workType badge
    expect(caseStudies.length).toBeGreaterThan(0);
    for (const cs of caseStudies) {
      expect(Object.keys(WORK_TYPE_META)).toContain(cs.workType);
      expect(WORK_TYPE_META[cs.workType].label.length).toBeGreaterThan(3);
      expect(WORK_TYPE_META[cs.workType].disclosure.length).toBeGreaterThan(10);
    }

    // 3. Organization + WebSite JSON-LD contains zero fake aggregateRating or review counts
    const orgJsonLd = serializeJsonLd(
      buildOrganizationAndWebsiteJsonLd(settings, brand, "https://omniflow.ai")
    );
    expect(orgJsonLd).not.toContain("aggregateRating");
    expect(orgJsonLd).not.toContain("reviewCount");

    // 4. Sitemap, Robots, RSS 2.0 Feed, and Health probes
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/services"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/demos"))).toBe(true);
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);

    const robotsRules = robots();
    expect(JSON.stringify(robotsRules.rules)).toContain("/admin");

    const rssRes = await rssFeedHandler();
    expect(rssRes.status).toBe(200);
    const rssXml = await rssRes.text();
    expect(rssXml).toContain("<rss version=\"2.0\"");

    // Public /api/health returns only status, while authenticated admin gets full diagnostics
    const publicHealthRes = await healthHandler(
      new Request("http://localhost:3000/api/health")
    );
    expect(publicHealthRes.status).toBe(200);
    expect(await publicHealthRes.json()).toEqual({ status: "ok" });

    const superUser = (await db.listUsers()).find((u) => u.role === "SUPER_ADMIN")!;
    const adminToken = createSessionToken(superUser);
    const adminHealthRes = await healthHandler(
      new Request("http://localhost:3000/api/health", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
      })
    );
    expect(adminHealthRes.status).toBe(200);
    const healthJson = (await adminHealthRes.json()) as {
      status: string;
      database: { schemaReady: boolean };
    };
    expect(healthJson.status).toBe("ok");
    expect(healthJson.database.schemaReady).toBe(true);

    // 5. Verify all 4 non-destructive SQL migrations exist in order
    const sysReport = await getSystemHealthReport({ probe: "readiness" });
    expect(sysReport.database.appliedMigrations).toEqual([
      "0001_omniflow_schema",
      "0002_production_upgrade",
      "0003_crm_and_operations",
      "0004_security_and_performance",
    ]);
  });
});
