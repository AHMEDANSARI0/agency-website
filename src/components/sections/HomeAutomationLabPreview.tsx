"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  MessageSquareText,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AiConversationSimulator } from "@/components/sections/AiConversationSimulator";
import {
  calculateAutomationSavings,
  evaluateLeadQualification,
  LEAD_DEMO_PRESETS,
  simulateWorkflowExecution,
  type SupportedCurrency,
} from "@/features/demos/engine";

type PreviewMode = "lead" | "support" | "resilience" | "savings";

export function HomeAutomationLabPreview() {
  const [mode, setMode] = useState<PreviewMode>("lead");
  const [presetIdx, setPresetIdx] = useState(0);
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [teamCount, setTeamCount] = useState(5);
  const [weeklyHours, setWeeklyHours] = useState(6);

  const activePreset = LEAD_DEMO_PRESETS[presetIdx] ?? LEAD_DEMO_PRESETS[0];
  const leadEval = evaluateLeadQualification(activePreset.data);
  const workflowSteps = simulateWorkflowExecution({
    trigger: "new_lead",
    action: "crm_and_brief",
    simulateExternalEmailOutage: simulateOutage,
  });
  const hourlyMap: Record<SupportedCurrency, number> = {
    USD: 65,
    GBP: 52,
    CAD: 75,
  };
  const savings = calculateAutomationSavings({
    currency,
    teamMembersCount: teamCount,
    manualHoursPerPersonPerWeek: weeklyHours,
    hourlyCost: hourlyMap[currency],
    captureRatePercent: 50,
  });

  return (
    <div className="surface-3d rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 lg:flex-row lg:items-center">
        <div>
          <Badge variant="accent">Interactive Sandbox · Zero Paid APIs · Instant</Badge>
          <h3 className="mt-2.5 text-xl font-bold tracking-tight text-ink-heading sm:text-2xl">
            Test OmniFlow&apos;s Deterministic &amp; AI Triage Logic Live
          </h3>
          <p className="mt-1 text-sm text-ink-body">
            Every output below is computed live by deterministic rules — never pre-baked screenshots or fabricated metrics.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Homepage interactive lab modes"
          className="inline-flex flex-wrap gap-1.5 rounded-xl border border-line bg-surface-muted p-1.5"
        >
          {[
            { id: "lead" as const, label: "Lead Scoring", icon: Filter },
            { id: "support" as const, label: "AI Support Simulator", icon: MessageSquareText },
            { id: "resilience" as const, label: "Fail-Safe Queue", icon: Workflow },
            { id: "savings" as const, label: "Time & Cost Estimator", icon: Calculator },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-ink-body hover:text-ink-heading"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: Lead Qualification */}
      {mode === "lead" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Select Inbound Enquiry Scenario
            </p>
            <div className="space-y-2">
              {LEAD_DEMO_PRESETS.map((preset, idx) => {
                const selected = idx === presetIdx;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetIdx(idx)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      selected
                        ? "border-primary bg-accent-subtle/60"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-heading">
                        {preset.label}
                      </span>
                      <span className="font-mono text-[0.7rem] text-primary">
                        {preset.data.region}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-body">
                      {preset.data.problemSummary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-muted">
                    Deterministic Score &amp; Routing
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-ink-heading">{leadEval.tier}</p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 font-mono text-xs font-bold text-primary-foreground">
                  Fit Score: {leadEval.score}/100
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {leadEval.reasons.slice(0, 3).map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs text-ink-body">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-lg border border-line bg-surface p-3 font-mono text-xs text-ink-body">
                <span className="font-semibold text-ink-heading">Recommended System: </span>
                {leadEval.recommendedServiceTitle} · Owner: {leadEval.recommendedOwner}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="font-mono text-[0.7rem] text-ink-muted">
                Simulated deterministic evaluation
              </span>
              <Link
                href="/demos?tab=lead-qualification"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Customize fields in full Lead Scorer
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Fault-Tolerant Workflow Queue */}
      {mode === "resilience" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 lg:col-span-5">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                Failure-Resilience Verification
              </p>
              <h4 className="mt-2 text-base font-bold text-ink-heading">
                What happens when a third-party email provider times out?
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-body">
                Fragile Zapier chains silently drop enquiries when downstream APIs hiccup. Toggle an email outage below to see how OmniFlow preserves every CRM record first.
              </p>

              <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-line-strong bg-surface-muted px-4 py-3">
                <span className="text-xs font-semibold text-ink-heading">
                  Simulate External Email Outage
                </span>
                <input
                  type="checkbox"
                  checked={simulateOutage}
                  onChange={(e) => setSimulateOutage(e.target.checked)}
                  className="h-4 w-4 rounded border-line-strong text-primary focus:ring-[var(--of-ring-focus)]"
                />
              </label>
            </div>

            <Link
              href="/demos?tab=workflow-builder"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Open full Workflow Simulator
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 lg:col-span-7">
            {workflowSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted p-3.5"
              >
                {step.status === "passed" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-heading">
                      0{step.stepNumber} · {step.nodeName}
                    </p>
                    <span
                      className={`font-mono text-[0.68rem] font-semibold uppercase ${
                        step.status === "passed"
                          ? "text-status-success"
                          : "text-status-warning"
                      }`}
                    >
                      {step.status === "passed" ? "Committed" : "Fallback Engaged"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-body">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Multi-Currency Time & Cost Estimator */}
      {mode === "savings" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-heading">Operating Currency</span>
              <div className="inline-flex gap-1 rounded-lg border border-line bg-surface-muted p-1">
                {(["USD", "GBP", "CAD"] as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold ${
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

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="home-team-slider" className="font-semibold text-ink-heading">
                  Staff Handling Admin / Triage
                </label>
                <span className="font-mono font-semibold text-primary">{teamCount} people</span>
              </div>
              <input
                id="home-team-slider"
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
                <label htmlFor="home-hours-slider" className="font-semibold text-ink-heading">
                  Manual Admin Hours / Person / Week
                </label>
                <span className="font-mono font-semibold text-primary">{weeklyHours} hrs/wk</span>
              </div>
              <input
                id="home-hours-slider"
                type="range"
                min={2}
                max={20}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--of-color-primary)]"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-5 lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-muted">
                  Reclaimed / Month
                </p>
                <p className="mt-1 text-2xl font-bold text-ink-heading">
                  {savings.monthlyHoursReclaimed} hrs
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">Conservative 50% capture rate</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-muted">
                  Illustrative Annual Capacity
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {savings.currencySymbol}
                  {savings.annualValueReclaimed.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  At {savings.currencySymbol}
                  {hourlyMap[currency]}/hr blended cost
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="font-mono text-[0.68rem] text-ink-muted">
                Mathematical estimate — not a guaranteed ROI claim.
              </span>
              <Link
                href="/demos?tab=savings-calculator"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Adjust hourly rate &amp; capture %
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: AI Customer Support Conversation Simulator */}
      {mode === "support" && <AiConversationSimulator />}

      {/* Quick Bar to All 5 Demos */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono uppercase tracking-wider text-ink-muted">All 5 Live Tools:</span>
          {[
            { label: "Lead Scoring", href: "/demos?tab=lead-qualification", icon: Filter },
            { label: "Support Triage", href: "/demos?tab=support-generator", icon: MessageSquareText },
            { label: "Workflow Builder", href: "/demos?tab=workflow-builder", icon: Workflow },
            { label: "ROI Calculator", href: "/demos?tab=savings-calculator", icon: Calculator },
            { label: "Readiness Audit", href: "/demos?tab=readiness-assessment", icon: ClipboardCheck },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-medium text-ink-heading transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="h-3 w-3 text-primary" />
                <span>{tool.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/contact?service=${encodeURIComponent(
              mode === "lead"
                ? "lead-management"
                : mode === "support"
                  ? "ai-customer-support"
                  : mode === "resilience"
                    ? "workflow-automation"
                    : "ai-operations"
            )}&intent=call&source=homepage_lab_${mode}&context=${encodeURIComponent(
              mode === "lead"
                ? `Tested Homepage Lead Scorer: ${activePreset.label} -> ${leadEval.tier} (${leadEval.score}/100)`
                : mode === "support"
                  ? "Tested Homepage AI Support Conversation Simulator (5-Stage Policy Retrieval & Escalation)"
                  : mode === "resilience"
                    ? `Tested Homepage Fail-Safe Queue (Outage Simulation: ${simulateOutage ? "Enabled" : "Normal"})`
                    : `Tested Homepage Time & Cost Estimator: ${teamCount} staff, ${weeklyHours} hrs/wk (${savings.monthlyHoursReclaimed} hrs/mo reclaimed in ${currency})`
            )}`}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <span>Book Discovery Call With This Scenario</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/demos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <span>Open Full Interactive Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
