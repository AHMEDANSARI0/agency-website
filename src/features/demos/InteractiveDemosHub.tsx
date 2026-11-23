"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Filter,
  Info,
  MessageSquareText,
  Play,
  RotateCcw,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  type DemoTabId,
  type LeadDemoInput,
  type ReadinessAnswers,
  type SupportedCurrency,
  type SupportDomainId,
  type WorkflowActionId,
  type WorkflowTriggerId,
} from "./engine";

interface InteractiveDemosHubProps {
  initialTab?: DemoTabId;
}

const TABS: Array<{
  id: DemoTabId;
  step: string;
  label: string;
  shortLabel: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "lead-qualification",
    step: "01",
    label: "Lead Qualification",
    shortLabel: "Lead Scoring",
    summary: "Fit scoring, SLA routing & pre-call brief",
    icon: Filter,
  },
  {
    id: "support-generator",
    step: "02",
    label: "AI Support Triage",
    shortLabel: "AI Support",
    summary: "SOP-grounded replies & human escalation",
    icon: MessageSquareText,
  },
  {
    id: "workflow-builder",
    step: "03",
    label: "Workflow Simulator",
    shortLabel: "Workflow",
    summary: "Atomic DB commit & API outage resilience",
    icon: Workflow,
  },
  {
    id: "savings-calculator",
    step: "04",
    label: "Savings Calculator",
    shortLabel: "Calculator",
    summary: "USD / GBP / CAD reclaimed capacity model",
    icon: Calculator,
  },
  {
    id: "readiness-assessment",
    step: "05",
    label: "Readiness Diagnostic",
    shortLabel: "Readiness",
    summary: "4-pillar maturity score & 3-week pilot plan",
    icon: ClipboardCheck,
  },
];

const DEFAULT_READINESS: ReadinessAnswers = {
  sopClarity: 2,
  dataTracking: 2,
  weeklyRepetitiveVolume: 3,
  humanOwnerAssigned: 2,
  primaryBottleneck: "leads",
};

export function InteractiveDemosHub({
  initialTab = "lead-qualification",
}: InteractiveDemosHubProps) {
  const [activeTab, setActiveTab] = useState<DemoTabId>(initialTab);
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // --- State 1: Lead Qualification ---
  const [leadInput, setLeadInput] = useState<LeadDemoInput>(LEAD_DEMO_PRESETS[0].data);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const leadResult = evaluateLeadQualification(leadInput);

  // --- State 2: AI Support Generator ---
  const [supportDomain, setSupportDomain] = useState<SupportDomainId>("advisory");
  const [supportQuery, setSupportQuery] = useState<string>(SUPPORT_SAMPLE_PROMPTS[0].question);
  const [showKnowledgeInspector, setShowKnowledgeInspector] = useState(true);
  const [copiedSupport, setCopiedSupport] = useState(false);
  const supportResult = generateGroundedSupportReply(supportDomain, supportQuery);
  const domainPack = getSupportDomainPack(supportDomain);

  // --- State 3: Workflow Builder ---
  const [wfTrigger, setWfTrigger] = useState<WorkflowTriggerId>("new_lead");
  const [wfAction, setWfAction] = useState<WorkflowActionId>("crm_and_brief");
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [runCount, setRunCount] = useState(1);
  const [copiedAuditJson, setCopiedAuditJson] = useState(false);
  const wfSteps = simulateWorkflowExecution({
    trigger: wfTrigger,
    action: wfAction,
    simulateExternalEmailOutage: simulateOutage,
  });
  const wfAuditJson = buildWorkflowAuditPayload({
    trigger: wfTrigger,
    action: wfAction,
    simulateExternalEmailOutage: simulateOutage,
    runCount,
  });
  const totalWfLatency = wfSteps.reduce((acc, s) => acc + s.latencyMs, 0);

  // --- State 4: Savings Calculator ---
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [teamCount, setTeamCount] = useState(5);
  const [weeklyManualHours, setWeeklyManualHours] = useState(6);
  const [hourlyCost, setHourlyCost] = useState(65);
  const [capturePercent, setCapturePercent] = useState(50);
  const [copiedSavings, setCopiedSavings] = useState(false);
  const savingsResult = calculateAutomationSavings({
    currency,
    teamMembersCount: teamCount,
    manualHoursPerPersonPerWeek: weeklyManualHours,
    hourlyCost,
    captureRatePercent: capturePercent,
  });
  const conservativeScenario = calculateAutomationSavings({
    currency,
    teamMembersCount: teamCount,
    manualHoursPerPersonPerWeek: weeklyManualHours,
    hourlyCost,
    captureRatePercent: 35,
  });
  const matureScenario = calculateAutomationSavings({
    currency,
    teamMembersCount: teamCount,
    manualHoursPerPersonPerWeek: weeklyManualHours,
    hourlyCost,
    captureRatePercent: 65,
  });

  // --- State 5: Readiness Assessment ---
  const [readiness, setReadiness] = useState<ReadinessAnswers>(DEFAULT_READINESS);
  const [copiedReadiness, setCopiedReadiness] = useState(false);
  const readinessResult = evaluateReadinessAssessment(readiness);

  const controlClasses =
    "mt-1.5 block w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]";

  function selectTab(nextTab: DemoTabId) {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let targetIndex = -1;
    if (event.key === "ArrowRight") {
      targetIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = TABS.length - 1;
    }
    if (targetIndex !== -1) {
      event.preventDefault();
      const next = TABS[targetIndex];
      if (next) {
        selectTab(next.id);
        tabButtonRefs.current[targetIndex]?.focus();
      }
    }
  }

  function resetCurrentTab() {
    if (activeTab === "lead-qualification") {
      setLeadInput({ ...LEAD_DEMO_PRESETS[0].data });
    } else if (activeTab === "support-generator") {
      setSupportDomain("advisory");
      setSupportQuery(SUPPORT_SAMPLE_PROMPTS[0].question);
    } else if (activeTab === "workflow-builder") {
      setWfTrigger("new_lead");
      setWfAction("crm_and_brief");
      setSimulateOutage(false);
      setRunCount(1);
    } else if (activeTab === "savings-calculator") {
      setCurrency("USD");
      setTeamCount(5);
      setWeeklyManualHours(6);
      setHourlyCost(65);
      setCapturePercent(50);
    } else if (activeTab === "readiness-assessment") {
      setReadiness({ ...DEFAULT_READINESS });
    }
  }

  function buildActiveDiagnosticText(): string {
    if (activeTab === "lead-qualification") {
      return leadResult.preCallBrief;
    }
    if (activeTab === "support-generator") {
      return [
        `[SIMULATED SUPPORT TRIAGE BRIEF]`,
        `Domain Pack: ${domainPack.name}`,
        `Decision Mode: ${supportResult.confidenceLabel}`,
        `Matched Rule: ${supportResult.matchedPolicyTitle}`,
        supportResult.guardrailTriggered ? `Guardrail Reason: ${supportResult.guardrailTriggered}` : null,
        `Draft Reply:\n${supportResult.customerDraftReply}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (activeTab === "workflow-builder") {
      return `[SIMULATED WORKFLOW EXECUTION TRACE]\n${wfAuditJson}`;
    }
    if (activeTab === "savings-calculator") {
      return [
        `[SIMULATED CAPACITY ESTIMATE — ${currency}]`,
        `Staff: ${teamCount} | Weekly Manual Hours/Person: ${weeklyManualHours} hrs | Blended Cost: ${savingsResult.currencySymbol}${hourlyCost}/hr`,
        `Automation Share: ${capturePercent}%`,
        `Monthly Reclaimed: ${savingsResult.monthlyHoursReclaimed} hrs (${savingsResult.currencySymbol}${savingsResult.monthlyValueReclaimed.toLocaleString()})`,
        `Annual Reclaimed: ${savingsResult.annualHoursReclaimed} hrs / ${savingsResult.annualWorkweeksReclaimed} workweeks (${savingsResult.currencySymbol}${savingsResult.annualValueReclaimed.toLocaleString()})`,
      ].join("\n");
    }
    return [
      `[SIMULATED AUTOMATION READINESS REPORT]`,
      `Readiness Score: ${readinessResult.score}/100 (${readinessResult.stageLabel})`,
      `Recommended Starting System: ${readinessResult.recommendedServiceName}`,
      `Summary: ${readinessResult.summary}`,
      `Action Steps:\n- ${readinessResult.actionChecklist.join("\n- ")}`,
    ].join("\n");
  }

  function downloadDiagnosticBrief() {
    const content = `${buildActiveDiagnosticText()}\n\nGenerated in OmniFlow Interactive Lab (Deterministic Simulation — Non-Binding Estimate)\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omniflow-${activeTab}-brief.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyText(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1800);
    } catch {
      setter(false);
    }
  }

  const activeTabIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab)
  );
  const activeTabMeta = TABS[activeTabIndex] ?? TABS[0];

  const buildContactHref = (serviceSlugOrTitle: string, summaryContext: string) => {
    const params = new URLSearchParams({
      service: serviceSlugOrTitle,
      context: summaryContext.slice(0, 420),
    });
    return `/contact?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Lab Telemetry & Transparency Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-primary/25 bg-accent-subtle/50 p-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:mt-0">
            <Info className="h-4 w-4" />
          </div>
          <p className="text-xs leading-relaxed text-ink-body">
            <strong className="text-ink-heading">Deterministic Simulation Console:</strong>{" "}
            All five tools execute locally in your browser using deterministic schemas and sample SOP packs (zero paid AI calls, zero data stored). Outputs are illustrative engineering previews.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetCurrentTab}
            className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
          >
            <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
            <span>Reset Inputs</span>
          </button>
          <button
            type="button"
            onClick={downloadDiagnosticBrief}
            className="inline-flex items-center gap-1.5 rounded-control border border-primary/30 bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-accent-subtle"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Brief (.txt)</span>
          </button>
        </div>
      </div>

      {/* Accessible 5-Tool Selector Deck */}
      <div
        role="tablist"
        aria-label="OmniFlow interactive demonstrations"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5"
      >
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabButtonRefs.current[idx] = el;
              }}
              id={`demo-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`demo-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-line bg-surface-card text-ink-body shadow-sm hover:border-primary/40 hover:text-ink-heading"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`font-mono text-[0.68rem] font-bold uppercase tracking-wider ${
                    selected ? "text-indigo-100" : "text-primary"
                  }`}
                >
                  Tool {tab.step}
                </span>
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-white" : "text-primary"
                  }`}
                />
              </div>
              <span
                className={`mt-1.5 text-sm font-bold ${
                  selected ? "text-white" : "text-ink-heading"
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`mt-0.5 line-clamp-1 text-[0.7rem] ${
                  selected ? "text-indigo-100/90" : "text-ink-muted"
                }`}
              >
                {tab.summary}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tool Subheader Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink-muted">
        <span className="font-mono">
          Active Module: <strong className="text-ink-heading">Tool {activeTabMeta.step} of 05 · {activeTabMeta.label}</strong>
        </span>
        <span className="font-mono">Tip: Use ← / → arrow keys on tabs to switch modules</span>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LEAD QUALIFICATION SIMULATOR                                   */}
      {/* ===================================================================== */}
      {activeTab === "lead-qualification" && (
        <div
          id="demo-panel-lead-qualification"
          role="tabpanel"
          aria-labelledby="demo-tab-lead-qualification"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div>
              <Badge variant="accent">Tool 01 · Inbound Lead Qualification</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                Enquiry Scoring, SLA Routing &amp; Pre-Call Dossier
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">
                Load a sample US/UK/Canada scenario or customize any field to inspect deterministic fit scoring and CRM owner assignment.
              </p>
            </div>

            <div>
              <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">
                Quick-Load Sample Scenarios
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEAD_DEMO_PRESETS.map((preset) => {
                  const isCurrent = leadInput.companyName === preset.data.companyName;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLeadInput({ ...preset.data })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isCurrent
                          ? "border-primary bg-accent-subtle text-primary"
                          : "border-line bg-surface-muted text-ink-heading hover:border-primary/40"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Firm Segment Selector Pills */}
            <div>
              <span className="block text-xs font-semibold text-ink-heading">
                Business Profile
              </span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[
                  { id: "service_business" as const, label: "Service Business" },
                  { id: "consultant" as const, label: "Advisory / Consultant" },
                  { id: "small_agency" as const, label: "Boutique Agency" },
                ].map((seg) => {
                  const active = leadInput.segment === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLeadInput({ ...leadInput, segment: seg.id })}
                      className={`rounded-control border px-2.5 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "border-primary bg-accent-subtle text-primary"
                          : "border-line bg-surface text-ink-body hover:text-ink-heading"
                      }`}
                    >
                      {seg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="demo-company" className="block text-xs font-semibold text-ink-heading">
                  Prospect Company
                </label>
                <input
                  id="demo-company"
                  type="text"
                  value={leadInput.companyName}
                  onChange={(e) => setLeadInput({ ...leadInput, companyName: e.target.value })}
                  className={controlClasses}
                />
              </div>

              <div>
                <label htmlFor="demo-region" className="block text-xs font-semibold text-ink-heading">
                  Operating Region
                </label>
                <select
                  id="demo-region"
                  value={leadInput.region}
                  onChange={(e) =>
                    setLeadInput({
                      ...leadInput,
                      region: e.target.value as LeadDemoInput["region"],
                    })
                  }
                  className={controlClasses}
                >
                  <option value="USA">United States (EST/CST/PST)</option>
                  <option value="UK">United Kingdom (GMT/BST)</option>
                  <option value="Canada">Canada (EST/PST)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="demo-volume" className="font-semibold text-ink-heading">
                    Monthly Inbound Enquiries
                  </label>
                  <span className="font-mono font-bold text-primary">
                    {leadInput.monthlyEnquiries}/mo
                  </span>
                </div>
                <input
                  id="demo-volume"
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={leadInput.monthlyEnquiries}
                  onChange={(e) =>
                    setLeadInput({ ...leadInput, monthlyEnquiries: Number(e.target.value) })
                  }
                  className="mt-3 w-full accent-[var(--of-color-primary)]"
                />
              </div>

              <div>
                <label htmlFor="demo-timeline" className="block text-xs font-semibold text-ink-heading">
                  Target Implementation Window
                </label>
                <select
                  id="demo-timeline"
                  value={leadInput.timeline}
                  onChange={(e) =>
                    setLeadInput({
                      ...leadInput,
                      timeline: e.target.value as LeadDemoInput["timeline"],
                    })
                  }
                  className={controlClasses}
                >
                  <option value="immediate">Immediate (2–4 weeks)</option>
                  <option value="near_term">Near-term (1–2 months)</option>
                  <option value="exploratory">Exploratory / Researching</option>
                </select>
              </div>
            </div>

            <label
              htmlFor="demo-budget-defined"
              className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface-muted/60 px-4 py-3"
            >
              <span className="text-xs font-semibold text-ink-heading">
                Prospect confirmed an allocated project budget range
              </span>
              <input
                id="demo-budget-defined"
                type="checkbox"
                checked={leadInput.budgetDefined}
                onChange={(e) => setLeadInput({ ...leadInput, budgetDefined: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-primary focus:ring-[var(--of-ring-focus)]"
              />
            </label>

            <div>
              <label htmlFor="demo-problem" className="block text-xs font-semibold text-ink-heading">
                Operational Bottleneck Description
              </label>
              <textarea
                id="demo-problem"
                rows={3}
                value={leadInput.problemSummary}
                onChange={(e) => setLeadInput({ ...leadInput, problemSummary: e.target.value })}
                className={controlClasses}
              />
            </div>
          </div>

          {/* Right Output Console */}
          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-6 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Deterministic Fit Score
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-ink-heading">
                      {leadResult.score}
                    </p>
                    <span className="font-mono text-xs text-ink-muted">/ 100 pts</span>
                  </div>
                </div>
                <Badge variant="accent">{leadResult.tier}</Badge>
              </div>

              {/* Visual Fit Score Progress Bar */}
              <div className="mt-4">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${leadResult.score}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[0.65rem] text-ink-muted">
                  <span>0 · Discovery</span>
                  <span>50 · Standard</span>
                  <span>75+ · Fast-Track</span>
                </div>
              </div>

              {/* Routing Metadata Grid */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-surface p-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-muted">
                    Assigned Queue
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-ink-heading">
                    {leadResult.recommendedOwner}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface p-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-muted">
                    Response SLA Target
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-primary">
                    {leadResult.targetResponseSla}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-ink-body">
                {leadResult.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Auto-Generated Pre-Call Brief
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(leadResult.preCallBrief, setCopiedBrief)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {copiedBrief ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedBrief ? "Copied" : "Copy Brief"}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3.5 font-mono text-xs leading-relaxed text-ink-body">
                  {leadResult.preCallBrief}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Button
                href={buildContactHref(
                  leadResult.recommendedServiceSlug,
                  `Simulated Lead Qualification (${leadResult.score}/100 - ${leadResult.tier}) for ${leadInput.companyName} (${leadInput.region}, ~${leadInput.monthlyEnquiries} enquiries/mo).`
                )}
                size="sm"
              >
                Scope This Pipeline With Summary
                <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="font-mono text-[0.68rem] text-ink-muted">
                Matched: {leadResult.recommendedServiceTitle}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AI CUSTOMER SUPPORT RESPONSE GENERATOR                         */}
      {/* ===================================================================== */}
      {activeTab === "support-generator" && (
        <div
          id="demo-panel-support-generator"
          role="tabpanel"
          aria-labelledby="demo-tab-support-generator"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div>
              <Badge variant="accent">Tool 02 · Policy-Grounded AI Support</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                Approved SOP Triage &amp; Human Escalation Guardrails
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">
                Test routine policy questions vs. sensitive discount, refund, legal, or out-of-scope prompts to see how OmniFlow prevents ungrounded guessing.
              </p>
            </div>

            <div>
              <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">
                Test Prompts (Routine vs. Guardrail Edge Cases)
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUPPORT_SAMPLE_PROMPTS.map((sample) => {
                  const active = supportQuery === sample.question;
                  return (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setSupportDomain(sample.domain);
                        setSupportQuery(sample.question);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-accent-subtle text-primary"
                          : "border-line bg-surface-muted text-ink-heading hover:border-primary/40"
                      }`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="support-domain" className="block text-xs font-semibold text-ink-heading">
                Active Approved Knowledge Pack
              </label>
              <select
                id="support-domain"
                value={supportDomain}
                onChange={(e) => setSupportDomain(e.target.value as SupportDomainId)}
                className={controlClasses}
              >
                <option value="advisory">B2B Advisory &amp; Tax Practice SOPs</option>
                <option value="agency">Boutique Digital &amp; Ops Agency Playbook</option>
                <option value="service_ops">Commercial Service Operator Manual</option>
              </select>
            </div>

            <div>
              <label htmlFor="support-msg" className="block text-xs font-semibold text-ink-heading">
                Incoming Client Message
              </label>
              <textarea
                id="support-msg"
                rows={3}
                value={supportQuery}
                onChange={(e) => setSupportQuery(e.target.value)}
                placeholder="Type a client question (try mentioning kickoff documents, weekly status, or 'discount' / 'liability')..."
                className={controlClasses}
              />
            </div>

            {/* Approved Knowledge Base & Guardrails Inspector */}
            <div className="rounded-xl border border-line bg-surface-muted/70 p-4">
              <button
                type="button"
                aria-expanded={showKnowledgeInspector}
                onClick={() => setShowKnowledgeInspector((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-bold text-ink-heading"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Inspect Active SOP Rules ({domainPack.entries.length}) &amp; Hard Escalation Triggers</span>
                </span>
                <span className="font-mono text-[0.68rem] text-primary">
                  {showKnowledgeInspector ? "Hide" : "Show"}
                </span>
              </button>

              {showKnowledgeInspector && (
                <div className="mt-3 space-y-3 border-t border-line pt-3 text-xs">
                  {domainPack.entries.map((entry) => (
                    <div key={entry.title} className="rounded-lg border border-line bg-surface p-3">
                      <p className="font-bold text-ink-heading">{entry.title}</p>
                      <p className="mt-1 text-ink-body">{entry.approvedAnswer}</p>
                    </div>
                  ))}
                  <div className="rounded-lg border border-amber-500/25 bg-surface p-3">
                    <p className="font-semibold text-ink-heading">
                      Mandatory Human Escalation Triggers:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ESCALATION_TRIGGERS.map((t) => (
                        <span
                          key={t.keyword}
                          className="rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold text-ink-heading"
                        >
                          &ldquo;{t.keyword}&rdquo;
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-6 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <Badge
                  variant={
                    supportResult.mode === "grounded_auto_draft" ? "accent" : "outline"
                  }
                >
                  {supportResult.confidenceLabel}
                </Badge>
                <span className="font-mono text-xs text-ink-muted">
                  {supportResult.matchedPolicyTitle}
                </span>
              </div>

              {supportResult.mode === "grounded_auto_draft" ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-accent-subtle/50 p-3.5 text-xs text-ink-body">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">Verified SOP Match:</strong> Reply drafted strictly from your approved policy pack with zero invented promises.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-status-warning/40 bg-surface p-3.5 text-xs text-ink-body">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                  <span>
                    <strong className="text-ink-heading">Guardrail Engaged: </strong>
                    {supportResult.guardrailTriggered}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Simulated Client Reply Draft
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(supportResult.customerDraftReply, setCopiedSupport)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {copiedSupport ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSupport ? "Copied" : "Copy Draft"}
                  </button>
                </div>
                <div className="mt-1.5 whitespace-pre-wrap rounded-control border border-line bg-surface p-4 text-sm leading-relaxed text-ink-body">
                  {supportResult.customerDraftReply}
                </div>
              </div>

              {supportResult.internalEscalationNote && (
                <div>
                  <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Internal Team Escalation Dossier
                  </span>
                  <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3.5 font-mono text-xs leading-relaxed text-ink-body">
                    {supportResult.internalEscalationNote}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Button
                href={buildContactHref(
                  "ai-customer-support",
                  `Tested Policy-Grounded AI Support (${domainPack.name} — ${supportResult.confidenceLabel}). Looking to configure approved SOP triage with human escalation.`
                )}
                size="sm"
              >
                Scope Grounded Support System
                <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="font-mono text-[0.68rem] text-ink-muted">
                Zero hallucinated policies
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: WORKFLOW AUTOMATION BUILDER & RESILIENCE SIMULATOR             */}
      {/* ===================================================================== */}
      {activeTab === "workflow-builder" && (
        <div
          id="demo-panel-workflow-builder"
          role="tabpanel"
          aria-labelledby="demo-tab-workflow-builder"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-5">
            <div>
              <Badge variant="accent">Tool 03 · Fault-Tolerant Orchestration</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                Pipeline &amp; Outage Resilience Simulator
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">
                Configure an operational trigger and action, then inject a simulated email API outage to verify zero-data-loss persistence.
              </p>
            </div>

            <div>
              <label htmlFor="wf-trigger" className="block text-xs font-semibold text-ink-heading">
                1. Inbound Event Trigger
              </label>
              <select
                id="wf-trigger"
                value={wfTrigger}
                onChange={(e) => setWfTrigger(e.target.value as WorkflowTriggerId)}
                className={controlClasses}
              >
                <option value="new_lead">Inbound Website Enquiry Submitted</option>
                <option value="proposal_won">CRM Opportunity Marked &apos;Won&apos;</option>
                <option value="support_ticket">Client Support Message Received</option>
              </select>
            </div>

            <div>
              <label htmlFor="wf-action" className="block text-xs font-semibold text-ink-heading">
                2. Primary Automated Execution
              </label>
              <select
                id="wf-action"
                value={wfAction}
                onChange={(e) => setWfAction(e.target.value as WorkflowActionId)}
                className={controlClasses}
              >
                <option value="crm_and_brief">Create CRM Record + Pre-Call Brief</option>
                <option value="provision_onboarding">Provision Onboarding Checklist &amp; Tasks</option>
                <option value="triage_and_escalate">Match Approved SOP or Route Human Summary</option>
              </select>
            </div>

            <label
              htmlFor="wf-outage-toggle"
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                simulateOutage
                  ? "border-status-warning/50 bg-amber-500/10"
                  : "border-line bg-surface-muted"
              }`}
            >
              <input
                id="wf-outage-toggle"
                type="checkbox"
                checked={simulateOutage}
                onChange={(e) => setSimulateOutage(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line-strong text-primary focus:ring-[var(--of-ring-focus)]"
              />
              <span className="text-xs leading-relaxed text-ink-body">
                <strong className="block text-ink-heading">
                  Inject Simulated Email Provider Outage
                </strong>
                Test how OmniFlow commits records to PostgreSQL first with retry flags when downstream notification APIs fail.
              </span>
            </label>

            {/* Fragile Chain vs OmniFlow Comparison Card */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-line bg-surface p-3">
                <p className="font-mono text-[0.65rem] uppercase text-ink-muted">
                  Fragile Zap Chain
                </p>
                <p className="mt-1 font-bold text-ink-heading">
                  {simulateOutage ? "Step Fails · Lead Lost" : "Runs Without Audit Log"}
                </p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-accent-subtle/50 p-3">
                <p className="font-mono text-[0.65rem] uppercase text-primary">
                  OmniFlow Pipeline
                </p>
                <p className="mt-1 font-bold text-ink-heading">
                  {simulateOutage ? "DB Saved · Queued Retry" : "Committed + Audited"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setRunCount((c) => c + 1)}
              className="w-full sm:w-auto"
            >
              <Play className="h-3.5 w-3.5" />
              Execute Simulation Trace (Run #{runCount})
            </Button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-7 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-heading">
                  Execution Trace · Run #{runCount}
                </span>
                <span className="font-mono text-xs text-primary">
                  Total Deterministic Latency: ~{totalWfLatency}ms · 0 Records Lost
                </span>
              </div>

              <ol className="mt-4 space-y-3">
                {wfSteps.map((step) => (
                  <li
                    key={step.stepNumber}
                    className="rounded-xl border border-line bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink-heading">
                        0{step.stepNumber}. {step.nodeName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.68rem] text-ink-muted">
                          {step.latencyMs}ms
                        </span>
                        <Badge
                          variant={step.status === "passed" ? "accent" : "outline"}
                        >
                          {step.status === "passed" ? "Committed" : "Safe Fallback Engaged"}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-body">{step.detail}</p>
                  </li>
                ))}
              </ol>

              {/* Inspectable Audit Payload */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Idempotent Audit Log Payload
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(wfAuditJson, setCopiedAuditJson)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {copiedAuditJson ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedAuditJson ? "Copied JSON" : "Copy JSON"}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto rounded-control border border-line bg-surface p-3 font-mono text-[0.72rem] leading-relaxed text-ink-body">
                  {wfAuditJson}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Button
                href={buildContactHref(
                  "workflow-automation",
                  `Simulated Workflow Architecture (Trigger: ${wfTrigger}, Action: ${wfAction}, Outage Resilience Tested: ${simulateOutage ? "Yes" : "Standard"}).`
                )}
                size="sm"
              >
                Scope Fault-Tolerant Workflow
                <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="font-mono text-[0.68rem] text-ink-muted">
                Idempotency + dead-letter queue standard
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AUTOMATION SAVINGS CALCULATOR                                  */}
      {/* ===================================================================== */}
      {activeTab === "savings-calculator" && (
        <div
          id="demo-panel-savings-calculator"
          role="tabpanel"
          aria-labelledby="demo-tab-savings-calculator"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="accent">Tool 04 · Capacity &amp; Cost Model</Badge>
                <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                  Multi-Currency Admin Time &amp; Value Estimator
                </h2>
              </div>

              <div
                role="group"
                aria-label="Select currency"
                className="inline-flex rounded-control border border-line bg-surface-muted p-1"
              >
                {(["USD", "GBP", "CAD"] as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    aria-pressed={currency === cur}
                    className={`rounded-md px-3 py-1 font-mono text-xs font-bold transition-colors ${
                      currency === cur
                        ? "bg-primary text-primary-foreground"
                        : "text-ink-body hover:text-ink-heading"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Regional Benchmark Presets */}
            <div>
              <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">
                Benchmark Team Profiles
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SAVINGS_SCENARIO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCurrency(preset.currency);
                      setTeamCount(preset.teamMembersCount);
                      setWeeklyManualHours(preset.manualHoursPerPersonPerWeek);
                      setHourlyCost(preset.hourlyCost);
                      setCapturePercent(preset.captureRatePercent);
                    }}
                    className="rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary/40"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-line bg-surface-muted/55 p-4">
              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="calc-staff" className="font-semibold text-ink-heading">
                    Team Members Handling Repetitive Admin / Triage
                  </label>
                  <span className="font-mono font-bold text-primary">{teamCount} staff</span>
                </div>
                <input
                  id="calc-staff"
                  type="range"
                  min={1}
                  max={25}
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--of-color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="calc-hours" className="font-semibold text-ink-heading">
                    Manual Copy-Paste / Triage Hours per Person / Week
                  </label>
                  <span className="font-mono font-bold text-primary">{weeklyManualHours} hrs/wk</span>
                </div>
                <input
                  id="calc-hours"
                  type="range"
                  min={1}
                  max={20}
                  value={weeklyManualHours}
                  onChange={(e) => setWeeklyManualHours(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--of-color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="calc-rate" className="font-semibold text-ink-heading">
                    Blended Hourly Team Cost ({currency})
                  </label>
                  <span className="font-mono font-bold text-primary">
                    {savingsResult.currencySymbol}
                    {hourlyCost}/hr
                  </span>
                </div>
                <input
                  id="calc-rate"
                  type="range"
                  min={20}
                  max={160}
                  step={5}
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--of-color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="calc-capture" className="font-semibold text-ink-heading">
                    Conservative Automation Share (Keeps Human Review)
                  </label>
                  <span className="font-mono font-bold text-primary">{capturePercent}%</span>
                </div>
                <input
                  id="calc-capture"
                  type="range"
                  min={30}
                  max={70}
                  step={5}
                  value={capturePercent}
                  onChange={(e) => setCapturePercent(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--of-color-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-6 sm:p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Illustrative Capacity Model ({currency})
                </span>
                <button
                  type="button"
                  onClick={() => copyText(buildActiveDiagnosticText(), setCopiedSavings)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  {copiedSavings ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedSavings ? "Copied Estimate" : "Copy Estimate"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Monthly Hours Reclaimed</span>
                  <p className="mt-1 text-2xl font-extrabold text-ink-heading">
                    {savingsResult.monthlyHoursReclaimed} hrs/mo
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Annual Capacity Reclaimed</span>
                  <p className="mt-1 text-2xl font-extrabold text-ink-heading">
                    {savingsResult.annualHoursReclaimed} hrs/yr
                  </p>
                  <p className="mt-0.5 font-mono text-[0.7rem] text-primary">
                    ≈ {savingsResult.annualWorkweeksReclaimed} full 40-hr workweeks
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Monthly Capacity Value</span>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {savingsResult.currencySymbol}
                    {savingsResult.monthlyValueReclaimed.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-primary/35 bg-surface p-4">
                  <span className="text-xs text-ink-muted">Annual Capacity Value</span>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {savingsResult.currencySymbol}
                    {savingsResult.annualValueReclaimed.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Weekly Allocation Visual Bar */}
              <div className="mt-5 rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink-heading">
                    Weekly Team Admin Split ({savingsResult.totalWeeklyManualHours} hrs/wk total)
                  </span>
                  <span className="font-mono text-primary">
                    {capturePercent}% Automated · {100 - capturePercent}% Human Judgment
                  </span>
                </div>
                <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="bg-primary transition-all duration-300"
                    style={{ width: `${capturePercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[0.72rem] text-ink-muted">
                  {savingsResult.weeklyHoursRetainedHuman} hrs/wk stay intentionally with your team for relationship approvals and exceptions.
                </p>
              </div>

              {/* 3-Tier Sensitivity Comparison */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  {
                    label: "Conservative (35%)",
                    val: `${conservativeScenario.currencySymbol}${conservativeScenario.annualValueReclaimed.toLocaleString()}/yr`,
                    hrs: `${conservativeScenario.annualHoursReclaimed} hrs`,
                  },
                  {
                    label: `Selected (${capturePercent}%)`,
                    val: `${savingsResult.currencySymbol}${savingsResult.annualValueReclaimed.toLocaleString()}/yr`,
                    hrs: `${savingsResult.annualHoursReclaimed} hrs`,
                    highlight: true,
                  },
                  {
                    label: "Mature (65%)",
                    val: `${matureScenario.currencySymbol}${matureScenario.annualValueReclaimed.toLocaleString()}/yr`,
                    hrs: `${matureScenario.annualHoursReclaimed} hrs`,
                  },
                ].map((tier) => (
                  <div
                    key={tier.label}
                    className={`rounded-lg border p-2.5 ${
                      tier.highlight
                        ? "border-primary bg-accent-subtle/60"
                        : "border-line bg-surface"
                    }`}
                  >
                    <p className="font-mono text-[0.65rem] text-ink-muted">{tier.label}</p>
                    <p className="mt-0.5 font-bold text-ink-heading">{tier.val}</p>
                    <p className="font-mono text-[0.65rem] text-primary">{tier.hrs}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-muted">
                <strong>Methodology Note:</strong> Straightforward multiplication of entered hours × {capturePercent}% capture ratio. Provided for internal planning — never a guaranteed financial claim.
              </p>
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <Button
                href={buildContactHref(
                  "workflow-automation",
                  `Capacity Calculator Estimate (${currency}): ${teamCount} staff × ${weeklyManualHours} hrs/wk at ${savingsResult.currencySymbol}${hourlyCost}/hr (${capturePercent}% share) = ~${savingsResult.annualHoursReclaimed} hrs/yr (${savingsResult.currencySymbol}${savingsResult.annualValueReclaimed.toLocaleString()}/yr).`
                )}
                size="sm"
              >
                Validate Estimate With OmniFlow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: AUTOMATION READINESS ASSESSMENT                                */}
      {/* ===================================================================== */}
      {activeTab === "readiness-assessment" && (
        <div
          id="demo-panel-readiness-assessment"
          role="tabpanel"
          aria-labelledby="demo-tab-readiness-assessment"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-4 lg:col-span-6">
            <div>
              <Badge variant="accent">Tool 05 · 5-Point Maturity Diagnostic</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                Automation Readiness &amp; Pilot Roadmap
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">
                Benchmark your current SOP clarity, data structure, volume, and exception ownership to generate a tailored 3-week pilot plan.
              </p>
            </div>

            <div>
              <label htmlFor="rd-sop" className="block text-xs font-semibold text-ink-heading">
                1. How clearly documented is your current process?
              </label>
              <select
                id="rd-sop"
                value={readiness.sopClarity}
                onChange={(e) =>
                  setReadiness({
                    ...readiness,
                    sopClarity: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className={controlClasses}
              >
                <option value={1}>Ad-hoc — handled differently each time</option>
                <option value={2}>Partially outlined in notes or emails</option>
                <option value={3}>Clear, repeatable steps our team agrees on</option>
              </select>
            </div>

            <div>
              <label htmlFor="rd-data" className="block text-xs font-semibold text-ink-heading">
                2. Where do enquiries and tasks currently live?
              </label>
              <select
                id="rd-data"
                value={readiness.dataTracking}
                onChange={(e) =>
                  setReadiness({
                    ...readiness,
                    dataTracking: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className={controlClasses}
              >
                <option value={1}>Scattered across shared email inboxes &amp; chats</option>
                <option value={2}>Tracked manually in spreadsheets</option>
                <option value={3}>Tracked in a structured CRM or project database</option>
              </select>
            </div>

            <div>
              <label htmlFor="rd-vol" className="block text-xs font-semibold text-ink-heading">
                3. Weekly team time spent on this repetitive process
              </label>
              <select
                id="rd-vol"
                value={readiness.weeklyRepetitiveVolume}
                onChange={(e) =>
                  setReadiness({
                    ...readiness,
                    weeklyRepetitiveVolume: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className={controlClasses}
              >
                <option value={1}>Under 3 hours/week</option>
                <option value={2}>3 to 10 hours/week</option>
                <option value={3}>10+ hours/week across the team</option>
              </select>
            </div>

            <div>
              <label htmlFor="rd-owner" className="block text-xs font-semibold text-ink-heading">
                4. Internal ownership for reviewing exceptions
              </label>
              <select
                id="rd-owner"
                value={readiness.humanOwnerAssigned}
                onChange={(e) =>
                  setReadiness({
                    ...readiness,
                    humanOwnerAssigned: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className={controlClasses}
              >
                <option value={1}>No clear single owner yet</option>
                <option value={2}>Founder reviews occasionally</option>
                <option value={3}>Dedicated operations or practice owner</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-ink-heading">
                5. Highest-priority bottleneck for the next 90 days
              </span>
              <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { id: "leads" as const, label: "Lead Qualification" },
                  { id: "support" as const, label: "Client Support Triage" },
                  { id: "operations" as const, label: "Internal Handoffs" },
                ].map((goal) => {
                  const active = readiness.primaryBottleneck === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setReadiness({ ...readiness, primaryBottleneck: goal.id })
                      }
                      className={`rounded-control border px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "border-primary bg-accent-subtle text-primary"
                          : "border-line bg-surface text-ink-body hover:text-ink-heading"
                      }`}
                    >
                      {goal.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-6 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Readiness Score
                  </span>
                  <p className="mt-0.5 text-3xl font-extrabold text-ink-heading">
                    {readinessResult.score} / 100
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{readinessResult.stageLabel}</Badge>
                  <button
                    type="button"
                    onClick={() => copyText(buildActiveDiagnosticText(), setCopiedReadiness)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    {copiedReadiness ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedReadiness ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <p className="mt-3.5 text-sm leading-relaxed text-ink-body">
                {readinessResult.summary}
              </p>

              {/* 4-Pillar Readiness Breakdown Bars */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {readinessResult.pillars.map((pillar) => (
                  <div key={pillar.label} className="rounded-lg border border-line bg-surface p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-heading">{pillar.label}</span>
                      <span className="font-mono text-[0.68rem] text-primary">
                        {pillar.status}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${pillar.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Steps */}
              <div className="mt-4">
                <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                  Preparation Checklist
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-body">
                  {readinessResult.actionChecklist.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested 3-Week Pilot Roadmap */}
              <div className="mt-4 rounded-xl border border-primary/25 bg-surface p-4">
                <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-primary">
                  Recommended Starting Pilot · {readinessResult.recommendedServiceName}
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-ink-heading">
                  {readinessResult.pilotMilestonePlan.map((milestone) => (
                    <li key={milestone}>• {milestone}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <Button
                href={buildContactHref(
                  readinessResult.recommendedServiceSlug,
                  `Readiness Assessment Result: ${readinessResult.score}/100 (${readinessResult.stageLabel}). Priority Bottleneck: ${readiness.primaryBottleneck}. Recommended Pilot: ${readinessResult.recommendedServiceName}.`
                )}
                size="sm"
              >
                Scope {readinessResult.recommendedServiceName}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
