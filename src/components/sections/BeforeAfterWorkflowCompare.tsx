"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Columns2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type CompareViewMode = "split" | "before" | "after";

interface WorkflowScenario {
  id: string;
  label: string;
  serviceSlug: string;
  manualDuration: string;
  automatedDuration: string;
  manualSummary: string;
  automatedSummary: string;
  beforeSteps: Array<{
    step: string;
    title: string;
    painPoint: string;
    frictionTag: string;
  }>;
  afterSteps: Array<{
    step: string;
    title: string;
    outcome: string;
    statusTag: string;
  }>;
}

const SCENARIOS: WorkflowScenario[] = [
  {
    id: "lead-intake",
    label: "01 · Inbound Lead Follow-Up",
    serviceSlug: "lead-management",
    manualDuration: "4–18 hrs average response",
    automatedDuration: "< 2 sec capture, score & alert",
    manualSummary:
      "Enquiries sit unread in a shared mailbox while staff manually copy details into spreadsheets and guess who should reply.",
    automatedSummary:
      "Every enquiry is validated, scored for fit, saved to CRM, and summarized on WhatsApp/email for the right owner automatically.",
    beforeSteps: [
      {
        step: "M1",
        title: "Unstructured email lands in shared inbox",
        painPoint: "Missing company size, timeline, and service scope—forcing back-and-forth emails.",
        frictionTag: "Slow Intake",
      },
      {
        step: "M2",
        title: "Manual copy-paste into CRM & spreadsheet",
        painPoint: "Staff re-type name, email, and notes across 3 tabs; duplicate contacts pile up.",
        frictionTag: "Copy-Paste Drain",
      },
      {
        step: "M3",
        title: "Delayed owner assignment across time zones",
        painPoint: "High-intent US/UK prospects wait overnight before anyone acknowledges receipt.",
        frictionTag: "Lost Buyer Intent",
      },
      {
        step: "M4",
        title: "Forgotten follow-up reminders",
        painPoint: "Busy client delivery weeks cause warm discovery leads to stall silently.",
        frictionTag: "Revenue Leak",
      },
    ],
    afterSteps: [
      {
        step: "A1",
        title: "Structured 24/7 intake & schema validation",
        outcome: "Required context captured cleanly in 45 seconds with spam filtered automatically.",
        statusTag: "0.1s Verified",
      },
      {
        step: "A2",
        title: "Deterministic fit scoring & duplicate check",
        outcome: "Urgency and service fit scored; returning contacts linked cleanly in CRM.",
        statusTag: "Auto-Scored",
      },
      {
        step: "A3",
        title: "Instant WhatsApp / Slack brief + client reply",
        outcome: "Assigned owner gets a pre-call brief immediately; prospect gets clear next steps.",
        statusTag: "Instant Alert",
      },
      {
        step: "A4",
        title: "Scheduled CRM follow-up & human call prep",
        outcome: "Follow-up task queued automatically—your team focuses purely on the conversation.",
        statusTag: "Zero Leads Lost",
      },
    ],
  },
  {
    id: "support-triage",
    label: "02 · Client Support & Policy Triage",
    serviceSlug: "ai-customer-support",
    manualDuration: "3–8 hrs inbox interruption",
    automatedDuration: "Instant grounded reply + safe escalation",
    manualSummary:
      "Senior specialists get interrupted dozens of times a week to repeat the same onboarding, hours, and checklist answers.",
    automatedSummary:
      "Routine questions get instant answers strictly from your approved SOPs, while custom or sensitive requests escalate cleanly to a human.",
    beforeSteps: [
      {
        step: "M1",
        title: "Repetitive FAQ emails interrupt billable work",
        painPoint: "Partners and account managers pause deep work to answer routine status questions.",
        frictionTag: "Context Switching",
      },
      {
        step: "M2",
        title: "Searching folders for the latest policy answer",
        painPoint: "Team members hunt through old threads or docs, leading to inconsistent replies.",
        frictionTag: "Inconsistent Info",
      },
      {
        step: "M3",
        title: "Urgent escalations buried under routine tickets",
        painPoint: "Sensitive billing or VIP issues wait behind simple password or scheduling questions.",
        frictionTag: "SLA Bottleneck",
      },
      {
        step: "M4",
        title: "Long thread reading on handoff",
        painPoint: "Escalated tickets require 10 minutes of reading raw back-and-forth messages.",
        frictionTag: "Slow Handoff",
      },
    ],
    afterSteps: [
      {
        step: "A1",
        title: "Instant intent & guardrail classification",
        outcome: "Separates routine policy questions from billing, legal, or urgent VIP requests.",
        statusTag: "Guardrail Scan",
      },
      {
        step: "A2",
        title: "Approved SOP & FAQ knowledge retrieval",
        outcome: "Pulls verified answers strictly from your approved documentation—never guessing.",
        statusTag: "100% Grounded",
      },
      {
        step: "A3",
        title: "Immediate brand-safe response for routine FAQs",
        outcome: "Clients get helpful 24/7 answers on turnaround times, checklists, and booking.",
        statusTag: "24/7 Resolved",
      },
      {
        step: "A4",
        title: "Clean human escalation with 3-bullet summary",
        outcome: "Complex or commercial questions route straight to your team with full context.",
        statusTag: "Human Control",
      },
    ],
  },
  {
    id: "client-onboarding",
    label: "03 · Deal-Won Client Onboarding",
    serviceSlug: "workflow-automation",
    manualDuration: "45–90 min manual setup per client",
    automatedDuration: "15 sec connected provisioning",
    manualSummary:
      "Every signed agreement triggers 10+ manual admin tasks across Drive, Notion/Asana, Slack, CRM, and invoicing.",
    automatedSummary:
      "One deal-won trigger provisions folders, tasks, Slack channels, and welcome checklists across your stack with full audit logging.",
    beforeSteps: [
      {
        step: "M1",
        title: "Manual folder & workspace creation",
        painPoint: "Account leads duplicate templates by hand and fix naming mistakes later.",
        frictionTag: "Admin Overhead",
      },
      {
        step: "M2",
        title: "Re-typing client details into PM & billing apps",
        painPoint: "Scope notes from CRM are manually copied into project boards and accounting.",
        frictionTag: "Data Drift",
      },
      {
        step: "M3",
        title: "Delayed welcome email & intake checklist",
        painPoint: "New clients wait days after signing before receiving clear kickoff instructions.",
        frictionTag: "Slow Kickoff",
      },
      {
        step: "M4",
        title: "Silent failures when steps are skipped",
        painPoint: "Missing internal tasks surface mid-project when nobody owns the checklist.",
        frictionTag: "Dropped Steps",
      },
    ],
    afterSteps: [
      {
        step: "A1",
        title: "CRM 'Proposal Won' webhook trigger",
        outcome: "Verified deal payload initiates onboarding with idempotent duplicate protection.",
        statusTag: "Idempotent",
      },
      {
        step: "A2",
        title: "Connected workspace, folder & task provisioning",
        outcome: "Client folders, project board tasks, and internal Slack channel spin up together.",
        statusTag: "Multi-App Sync",
      },
      {
        step: "A3",
        title: "Human approval on custom kickoff email",
        outcome: "Tailored welcome checklist is prepared and sent immediately or after 1-click review.",
        statusTag: "Polished UX",
      },
      {
        step: "A4",
        title: "Complete audit log & dead-letter fallback",
        outcome: "Every connected app update is verified; any API hiccup alerts the ops owner.",
        statusTag: "Fail-Safe",
      },
    ],
  },
];

export function BeforeAfterWorkflowCompare() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [viewMode, setViewMode] = useState<CompareViewMode>("split");
  const scenarioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const scenario = SCENARIOS[scenarioIdx] ?? SCENARIOS[0];

  function handleScenarioKeyDown(e: React.KeyboardEvent, idx: number) {
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % SCENARIOS.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + SCENARIOS.length) % SCENARIOS.length;

    if (nextIdx !== null) {
      e.preventDefault();
      setScenarioIdx(nextIdx);
      scenarioRefs.current[nextIdx]?.focus();
    }
  }

  return (
    <div className="surface-3d rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 sm:p-8">
      {/* Top Scenario Tabs + Before/After View Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 xl:flex-row xl:items-center">
        <div
          role="tablist"
          aria-label="Select business process to compare"
          className="flex flex-wrap gap-2"
        >
          {SCENARIOS.map((item, idx) => {
            const selected = idx === scenarioIdx;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  scenarioRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setScenarioIdx(idx)}
                onKeyDown={(e) => handleScenarioKeyDown(e, idx)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-[0.82rem] ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-line bg-surface text-ink-body hover:border-line-strong hover:text-ink-heading"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* View Toggle: Split vs Before Only vs After Only */}
        <div
          role="group"
          aria-label="Before and after comparison view mode"
          className="inline-flex self-start rounded-xl border border-line bg-surface-muted p-1 xl:self-auto"
        >
          {[
            { id: "split" as const, label: "Before vs. After", icon: Columns2 },
            { id: "before" as const, label: "Manual (Before)", icon: Clock },
            { id: "after" as const, label: "Automated (After)", icon: Workflow },
          ].map((modeBtn) => {
            const Icon = modeBtn.icon;
            const active = viewMode === modeBtn.id;
            return (
              <button
                key={modeBtn.id}
                type="button"
                aria-pressed={active}
                onClick={() => setViewMode(modeBtn.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-surface text-ink-heading shadow-sm"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{modeBtn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Canvas */}
      <div
        className={`mt-6 grid grid-cols-1 gap-6 ${
          viewMode === "split" ? "lg:grid-cols-2" : ""
        }`}
      >
        {/* BEFORE — MANUAL BOTTLENECK COLUMN */}
        {(viewMode === "split" || viewMode === "before") && (
          <div className="rounded-2xl border border-line bg-surface-muted/65 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-status-warning/15 text-status-warning">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-ink-muted">
                    Before OmniFlow · Manual Process
                  </p>
                  <h3 className="text-base font-bold text-ink-heading">
                    Disconnected Handoffs &amp; Copy-Paste
                  </h3>
                </div>
              </div>

              <span className="rounded-full border border-line-strong bg-surface px-3 py-1 font-mono text-[0.68rem] font-semibold text-ink-muted">
                {scenario.manualDuration}
              </span>
            </div>

            <p className="mt-3.5 text-xs leading-relaxed text-ink-body sm:text-sm">
              {scenario.manualSummary}
            </p>

            <ol className="mt-4 space-y-2.5">
              {scenario.beforeSteps.map((step) => (
                <li
                  key={step.step}
                  className="rounded-xl border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink-heading sm:text-sm">
                      <span className="mr-2 font-mono text-[0.68rem] text-ink-muted">
                        {step.step}
                      </span>
                      {step.title}
                    </p>
                    <span className="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 font-mono text-[0.65rem] text-ink-muted">
                      {step.frictionTag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                    {step.painPoint}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* AFTER — AUTOMATED OMNIFLOW ARCHITECTURE COLUMN */}
        {(viewMode === "split" || viewMode === "after") && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/35 bg-surface p-5 shadow-card sm:p-6">
            {/* Subtle Animated Signal Conduit */}
            <div
              aria-hidden="true"
              className="relative mb-4 h-1 w-full overflow-hidden rounded-full bg-accent-subtle"
            >
              <div className="animate-signal-flow h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-electric-cyan" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                    After OmniFlow · Connected Automation
                  </p>
                  <h3 className="text-base font-bold text-ink-heading">
                    Guardrailed Execution &amp; Instant Sync
                  </h3>
                </div>
              </div>

              <Badge variant="accent">{scenario.automatedDuration}</Badge>
            </div>

            <p className="mt-3.5 text-xs leading-relaxed text-ink-body sm:text-sm">
              {scenario.automatedSummary}
            </p>

            <ol className="mt-4 space-y-2.5">
              {scenario.afterSteps.map((step) => (
                <li
                  key={step.step}
                  className="rounded-xl border border-primary/20 bg-accent-subtle/35 p-3.5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-bold text-ink-heading sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>{step.title}</span>
                    </p>
                    <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold text-primary">
                      {step.statusTag}
                    </span>
                  </div>
                  <p className="mt-1.5 pl-6 text-xs leading-relaxed text-ink-body">
                    {step.outcome}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Bottom Conversion & Guardrail Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <div className="flex items-center gap-2 text-xs text-ink-body">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Every automated flow includes validation rules, failure alerts, and human sign-off for edge cases.
          </span>
        </div>

        <Link
          href={`/contact?service=${encodeURIComponent(scenario.serviceSlug)}&intent=call&source=before_after_${encodeURIComponent(scenario.id)}`}
          className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover"
        >
          <span>Automate {scenario.label.replace(/^0\d\s·\s/, "")}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
