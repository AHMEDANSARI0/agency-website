import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildWorkflowAuditPayload,
  calculateAutomationSavings,
  ESCALATION_TRIGGERS,
  evaluateLeadQualification,
  evaluateReadinessAssessment,
  generateGroundedSupportReply,
  getSupportDomainPack,
  LEAD_DEMO_PRESETS,
  SAVINGS_SCENARIO_PRESETS,
  simulateWorkflowExecution,
  SUPPORT_SAMPLE_PROMPTS,
} from "@/features/demos/engine";

describe("Upgrade Phase 4 — Interactive Demos & Calculators UX Upgrade", () => {
  it("1. computes SLA targets, segment briefs, and deterministic lead tiers", () => {
    const ukPreset = evaluateLeadQualification(LEAD_DEMO_PRESETS[0].data);
    expect(ukPreset.tier).toBe("High-Intent Fast-Track");
    expect(ukPreset.targetResponseSla).toContain("Priority Same-Day");
    expect(ukPreset.preCallBrief).toContain("Consultant / Advisory Firm");

    const caPreset = evaluateLeadQualification(LEAD_DEMO_PRESETS[2].data);
    expect(caPreset.preCallBrief).toContain("Small / Boutique Agency");
    expect(caPreset.targetResponseSla.length).toBeGreaterThan(10);
  });

  it("2. exposes inspectable SOP packs, hard escalation triggers, and out-of-scope safe fallback", () => {
    const advisoryPack = getSupportDomainPack("advisory");
    expect(advisoryPack.entries.length).toBeGreaterThanOrEqual(2);
    expect(ESCALATION_TRIGGERS.some((t) => t.keyword === "discount")).toBe(true);
    expect(SUPPORT_SAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(4);

    const outOfScope = generateGroundedSupportReply(
      "service_ops",
      "Do you offer custom international freight brokerage in Singapore?"
    );
    expect(outOfScope.mode).toBe("human_escalation_required");
    expect(outOfScope.guardrailTriggered).toContain("guessing is disabled");
  });

  it("3. emits deterministic step latencies and zero-data-loss idempotent audit JSON", () => {
    const steps = simulateWorkflowExecution({
      trigger: "proposal_won",
      action: "provision_onboarding",
      simulateExternalEmailOutage: true,
    });
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => s.latencyMs > 0)).toBe(true);
    expect(steps[3]?.status).toBe("fallback_engaged");

    const auditRaw = buildWorkflowAuditPayload({
      trigger: "proposal_won",
      action: "provision_onboarding",
      simulateExternalEmailOutage: true,
      runCount: 3,
    });
    const parsed = JSON.parse(auditRaw) as {
      idempotencyKey: string;
      notificationState: string;
      recordsLost: number;
    };
    expect(parsed.idempotencyKey).toContain("idem_of_proposal_won_1003");
    expect(parsed.notificationState).toBe("queued_for_retry_zero_data_loss");
    expect(parsed.recordsLost).toBe(0);
  });

  it("4. calculates workweeks reclaimed, retained human hours, and USD/GBP/CAD presets", () => {
    expect(SAVINGS_SCENARIO_PRESETS.map((p) => p.currency)).toEqual([
      "USD",
      "GBP",
      "CAD",
    ]);

    const model = calculateAutomationSavings({
      currency: "CAD",
      teamMembersCount: 5,
      manualHoursPerPersonPerWeek: 8, // 40 hrs/wk total
      hourlyCost: 60,
      captureRatePercent: 50, // 20 hrs/wk reclaimed -> 1040 hrs/yr -> 26 workweeks
    });
    expect(model.currencySymbol).toBe("CA$");
    expect(model.totalWeeklyManualHours).toBe(40);
    expect(model.weeklyHoursRetainedHuman).toBe(20);
    expect(model.annualHoursReclaimed).toBe(1040);
    expect(model.annualWorkweeksReclaimed).toBe(26);
  });

  it("5. generates 4-pillar readiness scorecards and a 3-week pilot milestone roadmap", () => {
    const result = evaluateReadinessAssessment({
      sopClarity: 3,
      dataTracking: 2,
      weeklyRepetitiveVolume: 3,
      humanOwnerAssigned: 2,
      primaryBottleneck: "operations",
    });
    expect(result.pillars).toHaveLength(4);
    expect(result.pilotMilestonePlan).toHaveLength(3);
    expect(result.recommendedServiceSlug).toBe("workflow-automation");
  });

  it("6. wires keyboard tab navigation, export brief, and simulation-to-contact context handoff", () => {
    const hubSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/demos/InteractiveDemosHub.tsx"),
      "utf8"
    );
    expect(hubSource).toContain("ArrowRight");
    expect(hubSource).toContain("ArrowLeft");
    expect(hubSource).toContain("Export Brief (.txt)");
    expect(hubSource).toContain("Reset Inputs");
    expect(hubSource).toContain("buildContactHref");

    const contactFormSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/ContactForm.tsx"),
      "utf8"
    );
    expect(contactFormSource).toContain("defaultContext");
    expect(contactFormSource).toContain("Interactive Lab Context Attached");
  });
});
