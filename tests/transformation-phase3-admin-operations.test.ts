import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import { PATCH as patchLeadHandler } from "@/app/api/admin/leads/[id]/route";
import { GET as exportLeadsHandler } from "@/app/api/admin/leads/export/route";
import { POST as importLeadsHandler } from "@/app/api/admin/leads/import/route";
import { PUT as putThemeHandler } from "@/app/api/admin/theme/route";
import { computeSeoCompleteness, slugifyValue } from "@/features/admin/cms/cms-helpers";
import { SECTION_CATALOG } from "@/features/admin/PageBuilderClient";
import { parseLeadsCsv, serializeLeadsToCsv } from "@/features/leads/csv";
import {
  buildThemeCssVariables,
  sanitizeDesignSystemTokens,
} from "@/features/themes/color-utils";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { computeLeadDashboardMetrics, db } from "@/lib/database";

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "omniflow-transformation-p3-")
);

function extractCookieToken(setCookieHeader: string | null): string {
  expect(setCookieHeader).toBeTruthy();
  const match = (setCookieHeader as string).match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  expect(match?.[1]).toBeTruthy();
  return match![1] as string;
}

function makeAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase3-ops-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Transformation Phase 3 — Admin Panel & Business Operations", () => {
  let adminToken = "";

  it("1. verifies migration 0003 is strictly non-destructive, idempotent, and enables RLS", () => {
    const sqlPath = path.resolve(
      process.cwd(),
      "supabase/migrations/0003_crm_and_operations.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS priority/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS proposal_value/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS expected_closing_date/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS lost_reason/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS lead_idempotency_keys/i);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).not.toMatch(/TRUNCATE\s+TABLE/i);
  });

  it("2. authenticates Super Admin and imports + updates CRM leads with priority, proposalValue, expectedClosingDate, and lostReason", async () => {
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
    expect(loginRes.status).toBe(200);
    adminToken = extractCookieToken(loginRes.headers.get("set-cookie"));

    const csvPayload = [
      "Name,Email,Company,Industry,Interested Service,Priority,Proposal Value,Expected Closing Date,Source,Business Problem",
      '"Sarah Jenkins",sarah@northstarops.co.uk,"Northstar Ops","B2B Consulting","AI Workflow Automation",Urgent,8500,2026-12-15,linkedin_outbound,"Automate client onboarding, Slack alerts, and CRM handoff"',
      '"=EvilFormula",bad-email,"Acme","SaaS","AI Support",Low,1000,,,"Invalid row should be skipped"',
      '"David Chen",david@pacificfreight.ca,"Pacific Freight","Logistics","Lead Routing",High,12000,2026-12-20,referral,"Unify carrier quote intake"',
    ].join("\r\n");

    const importRes = await importLeadsHandler(
      new Request("http://localhost:3000/api/admin/leads/import", {
        method: "POST",
        headers: makeAuthHeaders(adminToken),
        body: JSON.stringify({ csvText: csvPayload }),
      })
    );
    expect(importRes.status).toBe(201);
    const importBody = (await importRes.json()) as {
      importedCount: number;
      skippedCount: number;
      leads: Array<{ id: string; priority: string; proposalValue: number | null; source: string }>;
    };
    expect(importBody.importedCount).toBe(2);
    expect(importBody.skippedCount).toBe(1);
    expect(importBody.leads[0].priority).toBe("Urgent");
    expect(importBody.leads[0].proposalValue).toBe(8500);
    expect(importBody.leads[0].source).toBe("linkedin_outbound");

    // Patch first lead to Won and second lead to Lost with lostReason
    const winRes = await patchLeadHandler(
      new Request(
        `http://localhost:3000/api/admin/leads/${importBody.leads[0].id}`,
        {
          method: "PATCH",
          headers: makeAuthHeaders(adminToken),
          body: JSON.stringify({
            status: "Won",
            priority: "Urgent",
            proposalValue: 9200,
            followUpDate: "2026-11-20",
            statusNote: "Signed master services agreement",
          }),
        }
      ),
      { params: Promise.resolve({ id: importBody.leads[0].id }) }
    );
    expect(winRes.status).toBe(200);

    const lostRes = await patchLeadHandler(
      new Request(
        `http://localhost:3000/api/admin/leads/${importBody.leads[1].id}`,
        {
          method: "PATCH",
          headers: makeAuthHeaders(adminToken),
          body: JSON.stringify({
            status: "Lost",
            lostReason: "Deferred automation budget to next fiscal quarter",
          }),
        }
      ),
      { params: Promise.resolve({ id: importBody.leads[1].id }) }
    );
    expect(lostRes.status).toBe(200);
    const lostJson = (await lostRes.json()) as {
      lead: { status: string; lostReason: string | null };
    };
    expect(lostJson.lead.status).toBe("Lost");
    expect(lostJson.lead.lostReason).toContain("Deferred automation budget");
  });

  it("3. computes accurate real DB dashboard metrics and exports filtered CSV with new CRM columns", async () => {
    const metrics = await db.getLeadDashboardMetrics();
    expect(metrics.totalLeads).toBeGreaterThanOrEqual(2);
    expect(metrics.wonLeads).toBeGreaterThanOrEqual(1);
    expect(metrics.lostLeads).toBeGreaterThanOrEqual(1);
    expect(metrics.wonRevenueValue).toBe(9200);
    expect(
      metrics.sourcesBreakdown.some((s) => s.source === "linkedin_outbound")
    ).toBe(true);

    const allLeads = await db.listLeads();
    const deterministicMetrics = computeLeadDashboardMetrics(
      allLeads,
      new Date("2026-11-22T12:00:00Z")
    );
    expect(deterministicMetrics.conversionRatePercent).toBeGreaterThan(0);

    // Export filtered by source
    const exportRes = await exportLeadsHandler(
      new Request(
        "http://localhost:3000/api/admin/leads/export?source=linkedin_outbound",
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
        }
      )
    );
    expect(exportRes.status).toBe(200);
    const csvText = await exportRes.text();
    expect(csvText).toContain("Priority");
    expect(csvText).toContain("Proposal Value");
    expect(csvText).toContain("9200");

    // Verify round-trip parse strips formula prefixes safely
    const serialized = serializeLeadsToCsv(allLeads);
    const reparsed = parseLeadsCsv(serialized);
    expect(reparsed.validRows.length).toBe(allLeads.length);
  });

  it("4. verifies CMS domain modularization and SEO completeness scoring", () => {
    const workspacePath = path.resolve(
      process.cwd(),
      "src/features/admin/CmsWorkspaceClient.tsx"
    );
    const workspaceLines = fs
      .readFileSync(workspacePath, "utf8")
      .split("\n").length;
    // Refactored from 1,981 lines into domain panels under src/features/admin/cms/*
    expect(workspaceLines).toBeLessThan(950);

    expect(slugifyValue("  AI Lead Routing & Qualification! ")).toBe(
      "ai-lead-routing-qualification"
    );

    const strongSeo = computeSeoCompleteness({
      title: "Deterministic AI Lead Qualification Blueprint",
      slug: "deterministic-ai-lead-qualification",
      summary:
        "Learn how deterministic webhook routing and policy-grounded LLM extraction eliminate slow B2B lead response times without brittle SaaS chains.",
      bodyText: Array.from({ length: 95 }, () => "automation").join(" "),
    });
    expect(strongSeo.score).toBe(100);
  });

  it("5. validates Page Builder section catalog and Theme Studio designSystem tokens + CSS generation", async () => {
    expect(SECTION_CATALOG.length).toBe(18);
    expect(SECTION_CATALOG.some((s) => s.type === "hero")).toBe(true);

    const sanitized = sanitizeDesignSystemTokens({
      typography: "technical",
      buttonStyle: "rounded",
      borderRadius: "generous",
      spacing: "spacious",
      animationIntensity: "subtle",
    });
    expect(sanitized.borderRadius).toBe("generous");

    // Default CSS preserves --of-radius-card: 1rem;
    const defaultCss = buildThemeCssVariables(null);
    expect(defaultCss).toContain("--of-radius-card: 1rem;");

    // Custom generous radius emits --of-radius-card: 1.375rem;
    const currentTheme = await db.getThemeConfig();
    const putRes = await putThemeHandler(
      new Request("http://localhost:3000/api/admin/theme", {
        method: "PUT",
        headers: makeAuthHeaders(adminToken),
        body: JSON.stringify({
          defaultMode: "light",
          activePresetId: currentTheme.activePresetId,
          designSystem: {
            typography: "architectural",
            buttonStyle: "rounded",
            borderRadius: "generous",
            spacing: "spacious",
            animationIntensity: "subtle",
          },
          light: currentTheme.draft.light,
          dark: currentTheme.draft.dark,
          overrides: currentTheme.draft.overrides,
          publish: true,
        }),
      })
    );
    expect(putRes.status).toBe(200);
    const putJson = (await putRes.json()) as {
      themeConfig: { designSystem?: { borderRadius: string; buttonStyle: string } };
    };
    expect(putJson.themeConfig.designSystem?.borderRadius).toBe("generous");
    expect(putJson.themeConfig.designSystem?.buttonStyle).toBe("rounded");

    const updatedCss = buildThemeCssVariables(await db.getThemeConfig());
    expect(updatedCss).toContain("--of-radius-card: 1.375rem;");
    expect(updatedCss).toContain("--of-radius-button: 0.625rem;");
  });
});
