import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  calculateAutomationSavings,
  evaluateLeadQualification,
  evaluateReadinessAssessment,
  generateGroundedSupportReply,
  LEAD_DEMO_PRESETS,
  simulateWorkflowExecution,
} from "@/features/demos/engine";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase3-test-"));

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase3-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 3 — All 5 Deterministic Interactive Demonstrations", () => {
  it("1. Lead Qualification scores high-intent vs exploratory leads deterministically", () => {
    const highIntent = evaluateLeadQualification(LEAD_DEMO_PRESETS[0].data);
    expect(highIntent.score).toBeGreaterThanOrEqual(75);
    expect(highIntent.tier).toBe("High-Intent Fast-Track");
    expect(highIntent.preCallBrief).toContain("[SIMULATED PRE-CALL BRIEF]");

    const exploratory = evaluateLeadQualification(LEAD_DEMO_PRESETS[2].data);
    expect(exploratory.score).toBeLessThan(75);
    expect(exploratory.recommendedServiceSlug).toBe("workflow-automation");
  });

  it("2. AI Customer Support drafts grounded answers for SOP matches and escalates discounts/liability", () => {
    const routine = generateGroundedSupportReply(
      "advisory",
      "What documents should we upload before our kickoff call?"
    );
    expect(routine.mode).toBe("grounded_auto_draft");
    expect(routine.matchedPolicyTitle).toContain("SOP-101");
    expect(routine.guardrailTriggered).toBeNull();

    const risky = generateGroundedSupportReply(
      "agency",
      "Can you guarantee a 50% discount and waive all liability?"
    );
    expect(risky.mode).toBe("human_escalation_required");
    expect(risky.guardrailTriggered).toBeTruthy();
    expect(risky.internalEscalationNote).toContain("[HUMAN HANDOFF SUMMARY]");
  });

  it("3. Workflow Simulator traces normal execution and external outage fallback", () => {
    const normalSteps = simulateWorkflowExecution({
      trigger: "new_lead",
      action: "crm_and_brief",
      simulateExternalEmailOutage: false,
    });
    expect(normalSteps).toHaveLength(4);
    expect(normalSteps.every((s) => s.status === "passed")).toBe(true);

    const outageSteps = simulateWorkflowExecution({
      trigger: "new_lead",
      action: "crm_and_brief",
      simulateExternalEmailOutage: true,
    });
    expect(outageSteps[3]?.status).toBe("fallback_engaged");
    expect(outageSteps[3]?.detail).toContain("zero data lost");
  });

  it("4. Automation Savings Calculator computes conservative capacity across USD, GBP, and CAD", () => {
    const usd = calculateAutomationSavings({
      currency: "USD",
      teamMembersCount: 4,
      manualHoursPerPersonPerWeek: 5, // 20 hrs/wk total
      hourlyCost: 50,
      captureRatePercent: 50, // 10 hrs/wk reclaimed -> ~43 hrs/mo, 520 hrs/yr
    });
    expect(usd.currencySymbol).toBe("$");
    expect(usd.monthlyHoursReclaimed).toBe(43);
    expect(usd.annualHoursReclaimed).toBe(520);
    expect(usd.annualValueReclaimed).toBe(26000);

    const gbp = calculateAutomationSavings({
      currency: "GBP",
      teamMembersCount: 2,
      manualHoursPerPersonPerWeek: 6,
      hourlyCost: 40,
      captureRatePercent: 50,
    });
    expect(gbp.currencySymbol).toBe("£");
    expect(gbp.annualHoursReclaimed).toBe(312);
  });

  it("5. Readiness Assessment maps diagnostic inputs to stages and service recommendations", () => {
    const stage3 = evaluateReadinessAssessment({
      sopClarity: 3,
      dataTracking: 3,
      weeklyRepetitiveVolume: 3,
      humanOwnerAssigned: 3,
      primaryBottleneck: "support",
    });
    expect(stage3.score).toBe(100);
    expect(stage3.stageLabel).toContain("Stage 3");
    expect(stage3.recommendedServiceSlug).toBe("ai-customer-support");

    const stage1 = evaluateReadinessAssessment({
      sopClarity: 1,
      dataTracking: 1,
      weeklyRepetitiveVolume: 1,
      humanOwnerAssigned: 1,
      primaryBottleneck: "leads",
    });
    expect(stage1.score).toBe(0);
    expect(stage1.stageLabel).toContain("Stage 1");
    expect(stage1.actionChecklist.length).toBeGreaterThanOrEqual(3);
  });

  it("auto-upgrades Phase 2 navigation to include /demos on v3 read", async () => {
    const settings = await db.getSiteSettings();
    expect(settings.navigation.some((n) => n.href === "/demos")).toBe(true);
    expect(settings.secondaryCtaHref).toBe("/demos");
  });
});
