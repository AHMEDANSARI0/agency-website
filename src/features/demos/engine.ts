// ==============================================================================
// OmniFlow Deterministic Interactive Demos Engine
// Uses local deterministic rules & sample knowledge packs — zero paid AI APIs.
// All outputs are explicitly labeled as interactive simulation outputs.
// ==============================================================================

export type DemoTabId =
  | "lead-qualification"
  | "support-generator"
  | "workflow-builder"
  | "savings-calculator"
  | "readiness-assessment";

// ------------------------------------------------------------------------------
// 1. Lead Qualification Simulator
// ------------------------------------------------------------------------------

export interface LeadDemoInput {
  companyName: string;
  segment: "service_business" | "consultant" | "small_agency";
  region: "USA" | "UK" | "Canada";
  monthlyEnquiries: number;
  timeline: "immediate" | "near_term" | "exploratory";
  budgetDefined: boolean;
  problemSummary: string;
}

export interface LeadDemoResult {
  score: number;
  tier: "High-Intent Fast-Track" | "Qualified Standard" | "Discovery & Scope Clarification";
  recommendedOwner: string;
  recommendedServiceSlug: string;
  recommendedServiceTitle: string;
  completenessPassed: boolean;
  reasons: string[];
  preCallBrief: string;
  targetResponseSla: string;
}

export const LEAD_DEMO_PRESETS: Array<{ id: string; label: string; data: LeadDemoInput }> = [
  {
    id: "uk-advisory",
    label: "UK Advisory Firm (18 Staff)",
    data: {
      companyName: "Kensington Tax & Advisory",
      segment: "consultant",
      region: "UK",
      monthlyEnquiries: 65,
      timeline: "immediate",
      budgetDefined: true,
      problemSummary:
        "Partners manually triage 65+ monthly enquiries in a shared Outlook mailbox across GMT and EST hours, causing 48-hour reply delays.",
    },
  },
  {
    id: "us-service",
    label: "US Commercial Service Co",
    data: {
      companyName: "Apex Facility Maintenance",
      segment: "service_business",
      region: "USA",
      monthlyEnquiries: 120,
      timeline: "near_term",
      budgetDefined: true,
      problemSummary:
        "After-hours quote requests arrive missing square footage and urgency details, requiring 3 manual follow-up calls per lead.",
    },
  },
  {
    id: "ca-agency",
    label: "Canadian Boutique Agency",
    data: {
      companyName: "Harbourfront Digital Studio",
      segment: "small_agency",
      region: "Canada",
      monthlyEnquiries: 22,
      timeline: "exploratory",
      budgetDefined: false,
      problemSummary:
        "Exploring ways to filter low-fit one-off requests from retainer leads and speed up onboarding.",
    },
  },
];

export function evaluateLeadQualification(input: LeadDemoInput): LeadDemoResult {
  let score = 25;
  const reasons: string[] = [];

  const trimmedProblem = input.problemSummary.trim();
  const completenessPassed = input.companyName.trim().length >= 2 && trimmedProblem.length >= 20;

  if (completenessPassed) {
    score += 20;
    reasons.push("Complete company context and clear bottleneck description provided (+20)");
  } else {
    reasons.push("Brief problem statement — automated follow-up prompt recommended to gather scope");
  }

  if (input.monthlyEnquiries >= 50) {
    score += 20;
    reasons.push(`High recurring enquiry volume (${input.monthlyEnquiries}/mo) justifies immediate automation (+20)`);
  } else if (input.monthlyEnquiries >= 20) {
    score += 12;
    reasons.push(`Steady enquiry volume (${input.monthlyEnquiries}/mo) benefits from structured CRM routing (+12)`);
  } else {
    score += 5;
    reasons.push(`Focused volume (${input.monthlyEnquiries}/mo) suited for lean foundational intake (+5)`);
  }

  if (input.timeline === "immediate") {
    score += 20;
    reasons.push("Immediate implementation window within 2–4 weeks (+20)");
  } else if (input.timeline === "near_term") {
    score += 12;
    reasons.push("Near-term 1–2 month planning horizon (+12)");
  } else {
    score += 4;
    reasons.push("Exploratory timeline — route to educational scoping sequence (+4)");
  }

  if (input.budgetDefined) {
    score += 15;
    reasons.push("Budget range confirmed upfront (+15)");
  }

  score = Math.min(100, Math.max(0, score));

  const tier: LeadDemoResult["tier"] =
    score >= 75
      ? "High-Intent Fast-Track"
      : score >= 50
        ? "Qualified Standard"
        : "Discovery & Scope Clarification";

  const lowerProblem = trimmedProblem.toLowerCase();
  let recommendedServiceSlug = "lead-management";
  let recommendedServiceTitle = "Lead Management & Qualification Systems";

  if (lowerProblem.includes("onboard") || lowerProblem.includes("kickoff") || lowerProblem.includes("handoff")) {
    recommendedServiceSlug = "workflow-automation";
    recommendedServiceTitle = "End-to-End Business Workflow Automation";
  } else if (lowerProblem.includes("support") || lowerProblem.includes("faq") || lowerProblem.includes("ticket")) {
    recommendedServiceSlug = "ai-customer-support";
    recommendedServiceTitle = "AI Customer Support & Triage Workflows";
  }

  const recommendedOwner =
    tier === "High-Intent Fast-Track"
      ? `Principal Architect (${input.region} Overlap Window)`
      : `Solutions Intake Queue (${input.region})`;

  const targetResponseSla =
    tier === "High-Intent Fast-Track"
      ? "< 60s CRM Sync + Priority Same-Day Architect Review"
      : tier === "Qualified Standard"
        ? "< 60s CRM Sync + 1 Business Day Scoping Reply"
        : "Automated Scope Clarification Prompt + Queue Review";

  const segmentLabels: Record<LeadDemoInput["segment"], string> = {
    service_business: "Service Business",
    consultant: "Consultant / Advisory Firm",
    small_agency: "Small / Boutique Agency",
  };

  const preCallBrief = [
    `[SIMULATED PRE-CALL BRIEF]`,
    `Account: ${input.companyName.trim() || "Unnamed Prospect"} (${input.region} · ${segmentLabels[input.segment]})`,
    `Qualification Tier: ${tier} (${score}/100)`,
    `Target SLA: ${targetResponseSla}`,
    `Recommended Starting System: ${recommendedServiceTitle}`,
    `Reported Volume: ~${input.monthlyEnquiries} enquiries/month`,
    `Core Bottleneck: ${trimmedProblem || "Pending details"}`,
  ].join("\n");

  return {
    score,
    tier,
    recommendedOwner,
    recommendedServiceSlug,
    recommendedServiceTitle,
    completenessPassed,
    reasons,
    preCallBrief,
    targetResponseSla,
  };
}

// ------------------------------------------------------------------------------
// 2. Policy-Grounded AI Customer Support Response Generator
// ------------------------------------------------------------------------------

export type SupportDomainId = "advisory" | "agency" | "service_ops";

export interface SupportReplyResult {
  mode: "grounded_auto_draft" | "human_escalation_required";
  confidenceLabel: string;
  matchedPolicyTitle: string;
  customerDraftReply: string;
  internalEscalationNote: string | null;
  guardrailTriggered: string | null;
}

export interface PolicyEntry {
  keywords: string[];
  title: string;
  approvedAnswer: string;
}

const DOMAIN_POLICIES: Record<SupportDomainId, { name: string; entries: PolicyEntry[] }> = {
  advisory: {
    name: "B2B Advisory & Tax Practice",
    entries: [
      {
        keywords: ["document", "upload", "checklist", "kickoff", "prepare"],
        title: "SOP-101: Client Kickoff & Document Portal Checklist",
        approvedAnswer:
          "Before your kickoff call, please upload your prior-year summary statements and current entity structure to your encrypted client portal link. Our team reviews submissions Monday through Friday between 9:00 AM and 5:30 PM EST/GMT.",
      },
      {
        keywords: ["reschedule", "calendar", "time", "hours", "book"],
        title: "SOP-104: Consultation Scheduling & Business Hours",
        approvedAnswer:
          "Consultations can be rescheduled up to 24 hours in advance using the booking link in your confirmation email. Standard advisory hours cover overlapping US (EST) and UK (GMT) business days.",
      },
    ],
  },
  agency: {
    name: "Boutique Digital & Ops Agency",
    entries: [
      {
        keywords: ["onboard", "access", "timeline", "start", "kickoff"],
        title: "PLAYBOOK-02: New Retainer Onboarding Sequence",
        approvedAnswer:
          "Once your agreement is countersigned, your shared project workspace and onboarding checklist are provisioned automatically within 15 minutes. Kickoff calls typically occur within 3 business days.",
      },
      {
        keywords: ["report", "status", "update", "weekly"],
        title: "PLAYBOOK-07: Weekly Delivery Reporting Cadence",
        approvedAnswer:
          "Written progress digests are delivered every Thursday afternoon with completed milestones, active tasks, and any items awaiting client sign-off.",
      },
    ],
  },
  service_ops: {
    name: "Commercial Service Operator",
    entries: [
      {
        keywords: ["area", "region", "coverage", "prepare", "visit", "schedule"],
        title: "OPS-12: Site Visit Preparation & Service Coverage",
        approvedAnswer:
          "Please ensure clear access to the primary utility panel 15 minutes prior to your scheduled technician window. You will receive an automated SMS/email confirmation when the specialist is en route.",
      },
      {
        keywords: ["quote", "estimate", "inspection", "turnaround"],
        title: "OPS-15: Standard Site Assessment & Quote Turnaround",
        approvedAnswer:
          "Standard commercial quotes are issued within one business day once site square footage and service access details are confirmed via our intake form.",
      },
    ],
  },
};

export const ESCALATION_TRIGGERS = [
  { keyword: "discount", reason: "Custom pricing / discount negotiation requires human partner approval." },
  { keyword: "refund", reason: "Billing & refund requests are strictly handled by human finance/account leads." },
  { keyword: "liability", reason: "Legal contract terms & liability clauses cannot be modified by automated support." },
  { keyword: "lawsuit", reason: "Legal sensitivity detected — immediate human principal escalation." },
  { keyword: "guarantee", reason: "Performance/financial guarantees are restricted by compliance guardrails." },
  { keyword: "urgent", reason: "High-urgency flag routed directly to on-call account owner." },
];

export function getSupportDomainPack(domain: SupportDomainId): {
  name: string;
  entries: PolicyEntry[];
} {
  return DOMAIN_POLICIES[domain];
}

export const SUPPORT_SAMPLE_PROMPTS: Array<{
  label: string;
  domain: SupportDomainId;
  question: string;
}> = [
  {
    label: "Routine Kickoff Checklist Question",
    domain: "advisory",
    question: "Hi team, what documents do we need to upload before our kickoff call, and what are your support hours?",
  },
  {
    label: "Pricing & Legal Guardrail Test",
    domain: "agency",
    question: "Can you guarantee a 40% discount and sign our custom unlimited liability addendum today?",
  },
  {
    label: "Weekly Status Cadence Question",
    domain: "agency",
    question: "When do we receive our weekly project status report each week?",
  },
  {
    label: "Out-of-Scope Unknown Topic Test",
    domain: "service_ops",
    question: "Do you offer custom international freight brokerage in Singapore?",
  },
];

export function generateGroundedSupportReply(
  domain: SupportDomainId,
  customerMessage: string
): SupportReplyResult {
  const cleanMsg = customerMessage.trim();
  const lower = cleanMsg.toLowerCase();

  for (const trigger of ESCALATION_TRIGGERS) {
    if (lower.includes(trigger.keyword)) {
      return {
        mode: "human_escalation_required",
        confidenceLabel: "Guardrail Active · Escalated to Human Owner",
        matchedPolicyTitle: "Policy Boundary: Human Approval Required",
        guardrailTriggered: trigger.reason,
        customerDraftReply:
          "Thank you for reaching out. Because your request involves custom commercial or contractual terms, I have forwarded your message directly to your dedicated account lead so they can review and reply personally within one business day.",
        internalEscalationNote: `[HUMAN HANDOFF SUMMARY] Domain: ${DOMAIN_POLICIES[domain].name} | Trigger: "${trigger.keyword}" (${trigger.reason}) | Original Message: "${cleanMsg.slice(0, 240)}"`,
      };
    }
  }

  const pack = DOMAIN_POLICIES[domain];
  let bestEntry: PolicyEntry | null = null;
  let bestHits = 0;

  for (const entry of pack.entries) {
    const hits = entry.keywords.filter((kw) => lower.includes(kw)).length;
    if (hits > bestHits) {
      bestHits = hits;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestHits > 0) {
    return {
      mode: "grounded_auto_draft",
      confidenceLabel: "Grounded in Approved Knowledge Base",
      matchedPolicyTitle: bestEntry.title,
      guardrailTriggered: null,
      customerDraftReply: `Hello,\n\nThank you for your message. ${bestEntry.approvedAnswer}\n\nIf you need anything specific outside this standard process, reply here and a team member will assist you directly.`,
      internalEscalationNote: null,
    };
  }

  return {
    mode: "human_escalation_required",
    confidenceLabel: "Unmatched Topic · Routed to Human Specialist",
    matchedPolicyTitle: "No Exact Approved SOP Match — Safe Fallback",
    guardrailTriggered: "Topic not covered in approved FAQ pack; guessing is disabled by design.",
    customerDraftReply:
      "Thank you for your question. To make sure you receive an accurate answer, I have routed your note to a specialist on our team who will follow up shortly.",
    internalEscalationNote: `[UNMATCHED QUERY HANDOFF] Domain: ${pack.name} | Query routed for human reply & potential FAQ addition: "${cleanMsg.slice(0, 240)}"`,
  };
}

// ------------------------------------------------------------------------------
// 3. Workflow Automation Builder & Step Simulator
// ------------------------------------------------------------------------------

export type WorkflowTriggerId = "new_lead" | "proposal_won" | "support_ticket";
export type WorkflowActionId = "crm_and_brief" | "provision_onboarding" | "triage_and_escalate";

export interface WorkflowSimulationStep {
  stepNumber: number;
  nodeName: string;
  status: "passed" | "fallback_engaged";
  detail: string;
  latencyMs: number;
}

export function simulateWorkflowExecution(params: {
  trigger: WorkflowTriggerId;
  action: WorkflowActionId;
  simulateExternalEmailOutage: boolean;
}): WorkflowSimulationStep[] {
  const triggerLabels: Record<WorkflowTriggerId, string> = {
    new_lead: "Inbound Website Enquiry Submitted",
    proposal_won: "CRM Opportunity Marked 'Won'",
    support_ticket: "Client Support Message Received",
  };

  const actionLabels: Record<WorkflowActionId, string> = {
    crm_and_brief: "Create CRM Lead + Generate Pre-Call Brief",
    provision_onboarding: "Provision Onboarding Checklist & Kickoff Tasks",
    triage_and_escalate: "Match Approved SOP or Route Human Summary",
  };

  const steps: WorkflowSimulationStep[] = [
    {
      stepNumber: 1,
      nodeName: `Trigger: ${triggerLabels[params.trigger]}`,
      status: "passed",
      detail: "Webhook payload received and timestamped with request correlation ID.",
      latencyMs: 18,
    },
    {
      stepNumber: 2,
      nodeName: "Guardrail & Schema Validation",
      status: "passed",
      detail: "Zod field validation, duplicate email check, and rate-limit verification passed.",
      latencyMs: 24,
    },
    {
      stepNumber: 3,
      nodeName: `Primary Execution: ${actionLabels[params.action]}`,
      status: "passed",
      detail: "Primary database transaction committed atomically with audit trail entry.",
      latencyMs: 46,
    },
  ];

  if (params.simulateExternalEmailOutage) {
    steps.push({
      stepNumber: 4,
      nodeName: "Resilience Fallback: Notification Delivery",
      status: "fallback_engaged",
      detail:
        "Simulated external email provider timeout detected -> Record preserved safely in CRM with 'emailNotificationStatus: failed' flag for retry; zero data lost.",
      latencyMs: 32,
    });
  } else {
    steps.push({
      stepNumber: 4,
      nodeName: "Owner Notification & Follow-Up Queue",
      status: "passed",
      detail: "Structured brief dispatched to assigned owner and follow-up date queued.",
      latencyMs: 54,
    });
  }

  return steps;
}

export function buildWorkflowAuditPayload(params: {
  trigger: WorkflowTriggerId;
  action: WorkflowActionId;
  simulateExternalEmailOutage: boolean;
  runCount: number;
}): string {
  return JSON.stringify(
    {
      event: params.trigger,
      idempotencyKey: `idem_of_${params.trigger}_${1000 + params.runCount}`,
      validation: "zod_strict_passed",
      databaseCommit: "committed_atomic",
      actionExecuted: params.action,
      notificationState: params.simulateExternalEmailOutage
        ? "queued_for_retry_zero_data_loss"
        : "dispatched_to_owner",
      recordsLost: 0,
    },
    null,
    2
  );
}

// ------------------------------------------------------------------------------
// 4. Automation Time & Cost Savings Calculator
// ------------------------------------------------------------------------------

export type SupportedCurrency = "USD" | "GBP" | "CAD";

export interface SavingsInput {
  currency: SupportedCurrency;
  teamMembersCount: number;
  manualHoursPerPersonPerWeek: number;
  hourlyCost: number;
  captureRatePercent: number; // Realistic range 30% - 70%
}

export interface SavingsOutput {
  monthlyHoursReclaimed: number;
  annualHoursReclaimed: number;
  annualWorkweeksReclaimed: number;
  monthlyValueReclaimed: number;
  annualValueReclaimed: number;
  totalWeeklyManualHours: number;
  weeklyHoursRetainedHuman: number;
  currencySymbol: string;
}

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  GBP: "£",
  CAD: "CA$",
};

export const SAVINGS_SCENARIO_PRESETS: Array<{
  id: string;
  label: string;
  currency: SupportedCurrency;
  teamMembersCount: number;
  manualHoursPerPersonPerWeek: number;
  hourlyCost: number;
  captureRatePercent: number;
}> = [
  {
    id: "us-advisory",
    label: "US Advisory Practice (5 Staff)",
    currency: "USD",
    teamMembersCount: 5,
    manualHoursPerPersonPerWeek: 6,
    hourlyCost: 65,
    captureRatePercent: 50,
  },
  {
    id: "uk-agency",
    label: "UK Boutique Agency (7 Staff)",
    currency: "GBP",
    teamMembersCount: 7,
    manualHoursPerPersonPerWeek: 5,
    hourlyCost: 48,
    captureRatePercent: 50,
  },
  {
    id: "ca-service",
    label: "Canadian Service Operator (4 Staff)",
    currency: "CAD",
    teamMembersCount: 4,
    manualHoursPerPersonPerWeek: 8,
    hourlyCost: 58,
    captureRatePercent: 55,
  },
];

export function calculateAutomationSavings(input: SavingsInput): SavingsOutput {
  const staff = Math.min(100, Math.max(1, Math.round(input.teamMembersCount)));
  const weeklyHours = Math.min(40, Math.max(1, Number(input.manualHoursPerPersonPerWeek)));
  const rate = Math.min(500, Math.max(10, Number(input.hourlyCost)));
  const captureFraction = Math.min(0.75, Math.max(0.2, Number(input.captureRatePercent) / 100));

  const totalWeeklyManualHours = staff * weeklyHours;
  const weeklyReclaimed = totalWeeklyManualHours * captureFraction;
  const weeklyHoursRetainedHuman = Math.max(
    0,
    Math.round((totalWeeklyManualHours - weeklyReclaimed) * 10) / 10
  );
  const monthlyHoursReclaimed = Math.round(weeklyReclaimed * 4.33);
  const annualHoursReclaimed = Math.round(weeklyReclaimed * 52);
  const annualWorkweeksReclaimed = Math.round((annualHoursReclaimed / 40) * 10) / 10;

  const monthlyValueReclaimed = Math.round(monthlyHoursReclaimed * rate);
  const annualValueReclaimed = Math.round(annualHoursReclaimed * rate);

  return {
    monthlyHoursReclaimed,
    annualHoursReclaimed,
    annualWorkweeksReclaimed,
    monthlyValueReclaimed,
    annualValueReclaimed,
    totalWeeklyManualHours,
    weeklyHoursRetainedHuman,
    currencySymbol: CURRENCY_SYMBOLS[input.currency] || "$",
  };
}

// ------------------------------------------------------------------------------
// 5. Automation Readiness Assessment
// ------------------------------------------------------------------------------

export interface ReadinessAnswers {
  sopClarity: 1 | 2 | 3; // 1 = Ad-hoc, 2 = Partial notes, 3 = Documented repeatable steps
  dataTracking: 1 | 2 | 3; // 1 = Shared inbox only, 2 = Spreadsheets, 3 = Structured CRM/Database
  weeklyRepetitiveVolume: 1 | 2 | 3; // 1 = Low (<3 hrs/wk), 2 = Moderate (3-10 hrs/wk), 3 = High (10+ hrs/wk)
  humanOwnerAssigned: 1 | 2 | 3; // 1 = No clear owner, 2 = Founder reviews occasionally, 3 = Dedicated ops/lead owner
  primaryBottleneck: "leads" | "support" | "operations";
}

export interface ReadinessPillarScore {
  label: string;
  percent: number;
  status: string;
}

export interface ReadinessResult {
  score: number;
  stageLabel: string;
  summary: string;
  actionChecklist: string[];
  recommendedServiceSlug: string;
  recommendedServiceName: string;
  pillars: ReadinessPillarScore[];
  pilotMilestonePlan: string[];
}

export function evaluateReadinessAssessment(answers: ReadinessAnswers): ReadinessResult {
  const rawPoints =
    answers.sopClarity +
    answers.dataTracking +
    answers.weeklyRepetitiveVolume +
    answers.humanOwnerAssigned;
  // rawPoints ranges from 4 to 12 -> normalize to 0..100
  const score = Math.round(((rawPoints - 4) / 8) * 100);

  let stageLabel = "Stage 1 · Process Mapping First";
  let summary =
    "Your team will benefit most from documenting a single clean workflow before layering multi-tool automation.";

  if (score >= 75) {
    stageLabel = "Stage 3 · Ready for Multi-Workflow Automation";
    summary =
      "You have repeatable steps, clear ownership, and meaningful volume—ideal conditions for high-reliability automation.";
  } else if (score >= 45) {
    stageLabel = "Stage 2 · Ready for a Focused Pilot Workflow";
    summary =
      "Your core process is clear enough to automate one high-friction bottleneck first and expand incrementally.";
  }

  const actionChecklist: string[] = [];
  if (answers.sopClarity === 1) {
    actionChecklist.push("Write down the exact 4–6 steps your team currently takes when an enquiry or task arrives.");
  }
  if (answers.dataTracking === 1) {
    actionChecklist.push("Centralize incoming enquiries into a single structured CRM table instead of a shared inbox.");
  }
  if (answers.humanOwnerAssigned < 3) {
    actionChecklist.push("Designate one team owner responsible for reviewing escalated edge cases.");
  }
  actionChecklist.push("Start with deterministic validation and routing rules before adding optional AI steps.");

  const toPercent = (v: 1 | 2 | 3) => (v === 3 ? 100 : v === 2 ? 55 : 20);

  const pillars: ReadinessPillarScore[] = [
    {
      label: "Process & SOP Clarity",
      percent: toPercent(answers.sopClarity),
      status: answers.sopClarity === 3 ? "Repeatable" : answers.sopClarity === 2 ? "Partial Notes" : "Ad-Hoc",
    },
    {
      label: "Data Centralization",
      percent: toPercent(answers.dataTracking),
      status: answers.dataTracking === 3 ? "Structured CRM" : answers.dataTracking === 2 ? "Spreadsheets" : "Inbox Scattered",
    },
    {
      label: "Repetitive Volume ROI",
      percent: toPercent(answers.weeklyRepetitiveVolume),
      status: answers.weeklyRepetitiveVolume === 3 ? "10+ hrs/wk" : answers.weeklyRepetitiveVolume === 2 ? "3–10 hrs/wk" : "< 3 hrs/wk",
    },
    {
      label: "Exception Governance",
      percent: toPercent(answers.humanOwnerAssigned),
      status: answers.humanOwnerAssigned === 3 ? "Dedicated Owner" : answers.humanOwnerAssigned === 2 ? "Founder Review" : "Unassigned",
    },
  ];

  const serviceMap: Record<
    ReadinessAnswers["primaryBottleneck"],
    { slug: string; name: string; pilotSteps: string[] }
  > = {
    leads: {
      slug: "lead-management",
      name: "Lead Management & Qualification Systems",
      pilotSteps: [
        "Week 1: Audit inbound enquiry channels & define qualification schema",
        "Week 2: Build deterministic CRM sync, duplicate check & owner brief",
        "Week 3: Verify edge cases in staging & launch with team runbook",
      ],
    },
    support: {
      slug: "ai-customer-support",
      name: "AI Customer Support & Triage Workflows",
      pilotSteps: [
        "Week 1: Compile top 15 approved FAQ/SOP answers & escalation boundaries",
        "Week 2: Configure policy-grounded reply drafting & human escalation alerts",
        "Week 3: Shadow-mode verification before enabling client-facing triage",
      ],
    },
    operations: {
      slug: "workflow-automation",
      name: "End-to-End Business Workflow Automation",
      pilotSteps: [
        "Week 1: Map cross-tool handoffs & eliminate redundant manual data entry",
        "Week 2: Implement idempotent webhook orchestration & retry fallback queue",
        "Week 3: End-to-end staging test & full administrative handover",
      ],
    },
  };

  const rec = serviceMap[answers.primaryBottleneck];

  return {
    score,
    stageLabel,
    summary,
    actionChecklist,
    recommendedServiceSlug: rec.slug,
    recommendedServiceName: rec.name,
    pillars,
    pilotMilestonePlan: rec.pilotSteps,
  };
}
