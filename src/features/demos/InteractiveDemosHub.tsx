"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Filter,
  Info,
  MessageSquareText,
  Play,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  calculateAutomationSavings,
  evaluateLeadQualification,
  evaluateReadinessAssessment,
  generateGroundedSupportReply,
  LEAD_DEMO_PRESETS,
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
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "lead-qualification", label: "1. Lead Qualification", shortLabel: "Lead Scoring", icon: Filter },
  {
    id: "support-generator",
    label: "2. AI Support Triage",
    shortLabel: "AI Support",
    icon: MessageSquareText,
  },
  {
    id: "workflow-builder",
    label: "3. Workflow Simulator",
    shortLabel: "Workflow",
    icon: Workflow,
  },
  {
    id: "savings-calculator",
    label: "4. Savings Calculator",
    shortLabel: "Calculator",
    icon: Calculator,
  },
  {
    id: "readiness-assessment",
    label: "5. Readiness Assessment",
    shortLabel: "Readiness",
    icon: ClipboardCheck,
  },
];

export function InteractiveDemosHub({
  initialTab = "lead-qualification",
}: InteractiveDemosHubProps) {
  const [activeTab, setActiveTab] = useState<DemoTabId>(initialTab);

  // --- State 1: Lead Qualification ---
  const [leadInput, setLeadInput] = useState<LeadDemoInput>(LEAD_DEMO_PRESETS[0].data);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const leadResult = evaluateLeadQualification(leadInput);

  // --- State 2: AI Support Generator ---
  const [supportDomain, setSupportDomain] = useState<SupportDomainId>("advisory");
  const [supportQuery, setSupportQuery] = useState<string>(SUPPORT_SAMPLE_PROMPTS[0].question);
  const [copiedSupport, setCopiedSupport] = useState(false);
  const supportResult = generateGroundedSupportReply(supportDomain, supportQuery);

  // --- State 3: Workflow Builder ---
  const [wfTrigger, setWfTrigger] = useState<WorkflowTriggerId>("new_lead");
  const [wfAction, setWfAction] = useState<WorkflowActionId>("crm_and_brief");
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [runCount, setRunCount] = useState(1);
  const wfSteps = simulateWorkflowExecution({
    trigger: wfTrigger,
    action: wfAction,
    simulateExternalEmailOutage: simulateOutage,
  });

  // --- State 4: Savings Calculator ---
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [teamCount, setTeamCount] = useState(4);
  const [weeklyManualHours, setWeeklyManualHours] = useState(6);
  const [hourlyCost, setHourlyCost] = useState(55);
  const [capturePercent, setCapturePercent] = useState(50);
  const savingsResult = calculateAutomationSavings({
    currency,
    teamMembersCount: teamCount,
    manualHoursPerPersonPerWeek: weeklyManualHours,
    hourlyCost,
    captureRatePercent: capturePercent,
  });

  // --- State 5: Readiness Assessment ---
  const [readiness, setReadiness] = useState<ReadinessAnswers>({
    sopClarity: 2,
    dataTracking: 2,
    weeklyRepetitiveVolume: 3,
    humanOwnerAssigned: 2,
    primaryBottleneck: "leads",
  });
  const readinessResult = evaluateReadinessAssessment(readiness);

  const controlClasses =
    "mt-1.5 block w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]";

  async function copyText(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1800);
    } catch {
      setter(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mandatory Demo Transparency Notice */}
      <div className="flex items-start gap-3 rounded-card border border-primary/30 bg-[var(--of-color-accent-subtle)] p-4 text-xs text-ink-body sm:items-center">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong className="text-ink-heading">Interactive Demo Environment:</strong> These five
          tools run on deterministic sample rules and local knowledge packs in your browser (no paid
          external AI API required). Outputs are illustrative demonstrations—not live client systems
          or guaranteed financial results.
        </span>
      </div>

      {/* Accessible Demo Selector Tabs */}
      <div
        role="tablist"
        aria-label="OmniFlow interactive demonstrations"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-control border px-3 py-3 text-xs font-semibold transition-all sm:text-sm ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-line bg-surface-card text-ink-body hover:border-line-strong hover:text-ink-heading"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden xl:inline">{tab.label}</span>
              <span className="xl:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LEAD QUALIFICATION SIMULATOR                                   */}
      {/* ===================================================================== */}
      {activeTab === "lead-qualification" && (
        <div
          role="tabpanel"
          aria-label="Lead qualification simulator"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div>
              <Badge>Interactive Demo · Lead Qualification</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Inbound Enquiry Scoring &amp; Routing Simulator
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Load a sample scenario or enter custom details to see deterministic fit scoring and
                routing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {LEAD_DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setLeadInput({ ...preset.data })}
                  className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-heading hover:border-primary"
                >
                  Load: {preset.label}
                </button>
              ))}
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
                  Market Region
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
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>

              <div>
                <label htmlFor="demo-volume" className="block text-xs font-semibold text-ink-heading">
                  Monthly Inbound Enquiries: {leadInput.monthlyEnquiries}
                </label>
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
                  Implementation Timeline
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
                  <option value="exploratory">Exploratory</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="demo-budget-defined"
                type="checkbox"
                checked={leadInput.budgetDefined}
                onChange={(e) => setLeadInput({ ...leadInput, budgetDefined: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-primary"
              />
              <label htmlFor="demo-budget-defined" className="text-xs font-medium text-ink-body">
                Prospect confirmed an allocated project budget range
              </label>
            </div>

            <div>
              <label htmlFor="demo-problem" className="block text-xs font-semibold text-ink-heading">
                Bottleneck Description
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

          <div className="flex flex-col justify-between rounded-control border border-line bg-surface-muted p-5 lg:col-span-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-medium text-ink-muted">Simulated Fit Score</span>
                  <p className="text-3xl font-bold text-ink-heading">{leadResult.score} / 100</p>
                </div>
                <Badge>{leadResult.tier}</Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <p>
                  <strong className="text-ink-heading">Assigned Queue: </strong>
                  <span className="text-ink-body">{leadResult.recommendedOwner}</span>
                </p>
                <p>
                  <strong className="text-ink-heading">Matched Service: </strong>
                  <span className="text-primary">{leadResult.recommendedServiceTitle}</span>
                </p>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-ink-body">
                {leadResult.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Auto-Generated Pre-Call Brief (Demo)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(leadResult.preCallBrief, setCopiedBrief)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:text-link-hover"
                  >
                    {copiedBrief ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedBrief ? "Copied" : "Copy Brief"}
                  </button>
                </div>
                <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3 font-mono text-xs text-ink-body">
                  {leadResult.preCallBrief}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 pt-2">
              <Button href={`/contact?service=${leadResult.recommendedServiceSlug}`} size="sm">
                Scope This Lead Pipeline
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AI CUSTOMER SUPPORT RESPONSE GENERATOR                         */}
      {/* ===================================================================== */}
      {activeTab === "support-generator" && (
        <div
          role="tabpanel"
          aria-label="Policy-grounded AI customer support demo"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div>
              <Badge>Interactive Demo · Customer Support Guardrails</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Policy-Grounded Support Triage Simulator
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Test how OmniFlow drafts grounded answers for routine questions while escalating
                discounts, refunds, or legal terms to humans.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUPPORT_SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setSupportDomain(sample.domain);
                    setSupportQuery(sample.question);
                  }}
                  className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-heading hover:border-primary"
                >
                  Try: {sample.label}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="support-domain" className="block text-xs font-semibold text-ink-heading">
                Approved Knowledge Pack
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
                rows={4}
                value={supportQuery}
                onChange={(e) => setSupportQuery(e.target.value)}
                placeholder="Type a client question (try mentioning kickoff documents, weekly status, or 'discount' / 'liability')..."
                className={controlClasses}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-control border border-line bg-surface-muted p-5 lg:col-span-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <Badge
                  variant={
                    supportResult.mode === "grounded_auto_draft" ? "default" : "outline"
                  }
                >
                  {supportResult.confidenceLabel}
                </Badge>
                <span className="text-xs text-ink-muted">{supportResult.matchedPolicyTitle}</span>
              </div>

              {supportResult.guardrailTriggered && (
                <div className="flex items-start gap-2 rounded-control border border-status-warning/40 bg-surface p-3 text-xs text-ink-body">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                  <span>
                    <strong className="text-ink-heading">Guardrail Active: </strong>
                    {supportResult.guardrailTriggered}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Simulated Client Reply Draft
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(supportResult.customerDraftReply, setCopiedSupport)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:text-link-hover"
                  >
                    {copiedSupport ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSupport ? "Copied" : "Copy Draft"}
                  </button>
                </div>
                <div className="mt-1.5 whitespace-pre-wrap rounded-control border border-line bg-surface p-3.5 text-sm leading-relaxed text-ink-body">
                  {supportResult.customerDraftReply}
                </div>
              </div>

              {supportResult.internalEscalationNote && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Internal Human Handoff Brief
                  </span>
                  <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3 font-mono text-xs text-ink-body">
                    {supportResult.internalEscalationNote}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-2">
              <Button href="/contact?service=ai-customer-support" size="sm">
                Build Grounded Support for Your Team
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: WORKFLOW AUTOMATION BUILDER & RESILIENCE SIMULATOR             */}
      {/* ===================================================================== */}
      {activeTab === "workflow-builder" && (
        <div
          role="tabpanel"
          aria-label="Workflow automation simulator"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-5">
            <div>
              <Badge>Interactive Demo · Workflow Orchestration</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Pipeline &amp; Fallback Resilience Simulator
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Configure a workflow trigger and action, then test normal execution vs. simulated
                external email downtime.
              </p>
            </div>

            <div>
              <label htmlFor="wf-trigger" className="block text-xs font-semibold text-ink-heading">
                1. Select Event Trigger
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
                2. Select Primary Automated Action
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

            <div className="flex items-start gap-2.5 rounded-control border border-line bg-surface-muted p-3.5">
              <input
                id="wf-outage-toggle"
                type="checkbox"
                checked={simulateOutage}
                onChange={(e) => setSimulateOutage(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line-strong text-primary"
              />
              <label htmlFor="wf-outage-toggle" className="text-xs leading-relaxed text-ink-body">
                <strong className="text-ink-heading">Simulate External Email API Outage:</strong>{" "}
                Test how OmniFlow preserves records in the database even when a third-party email
                service is unconfigured or offline.
              </label>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setRunCount((c) => c + 1)}
              className="w-full sm:w-auto"
            >
              <Play className="h-3.5 w-3.5" />
              Re-Run Simulation Trace (Run #{runCount})
            </Button>
          </div>

          <div className="rounded-control border border-line bg-surface-muted p-5 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-heading">
                Simulated Execution Log · Run #{runCount}
              </span>
              <Badge variant="status">Deterministic Demo</Badge>
            </div>

            <ol className="mt-4 space-y-3">
              {wfSteps.map((step) => (
                <li
                  key={step.stepNumber}
                  className="rounded-control border border-line bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-heading">
                      0{step.stepNumber}. {step.nodeName}
                    </span>
                    <Badge
                      variant={step.status === "passed" ? "default" : "outline"}
                    >
                      {step.status === "passed" ? "Passed" : "Safe Fallback Engaged"}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-body">{step.detail}</p>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <Button href="/contact?service=workflow-automation" size="sm" variant="outline">
                Scope Custom Workflow Architecture
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AUTOMATION SAVINGS CALCULATOR                                  */}
      {/* ===================================================================== */}
      {activeTab === "savings-calculator" && (
        <div
          role="tabpanel"
          aria-label="Automation savings calculator"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge>Interactive Demo · Operational Capacity Estimator</Badge>
                <h2 className="mt-2 text-xl font-bold text-ink-heading">
                  Repetitive Admin Time &amp; Cost Estimator
                </h2>
              </div>

              <div role="group" aria-label="Select currency" className="inline-flex rounded-control border border-line bg-surface-muted p-0.5">
                {(["USD", "GBP", "CAD"] as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    aria-pressed={currency === cur}
                    className={`rounded-[calc(var(--of-radius-control)-3px)] px-2.5 py-1 text-xs font-semibold ${
                      currency === cur
                        ? "bg-primary text-primary-foreground"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="calc-staff" className="block text-xs font-semibold text-ink-heading">
                Team Members Handling Manual Admin / Triage: {teamCount}
              </label>
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
              <label htmlFor="calc-hours" className="block text-xs font-semibold text-ink-heading">
                Manual Copy-Paste / Triage Hours per Person / Week: {weeklyManualHours} hrs
              </label>
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
              <label htmlFor="calc-rate" className="block text-xs font-semibold text-ink-heading">
                Blended Hourly Team Cost ({savingsResult.currencySymbol}
                {hourlyCost}/hr)
              </label>
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
              <label htmlFor="calc-capture" className="block text-xs font-semibold text-ink-heading">
                Conservative Automation Share: {capturePercent}% (Leaves human review intact)
              </label>
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

          <div className="flex flex-col justify-between rounded-control border border-line bg-surface-muted p-6 lg:col-span-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Illustrative Capacity Estimate (Based on Your Inputs)
              </span>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-control border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Estimated Monthly Time Reclaimed</span>
                  <p className="mt-1 text-2xl font-bold text-ink-heading">
                    {savingsResult.monthlyHoursReclaimed} hrs/mo
                  </p>
                </div>

                <div className="rounded-control border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Estimated Annual Time Reclaimed</span>
                  <p className="mt-1 text-2xl font-bold text-ink-heading">
                    {savingsResult.annualHoursReclaimed} hrs/yr
                  </p>
                </div>

                <div className="rounded-control border border-line bg-surface p-4">
                  <span className="text-xs text-ink-muted">Monthly Operational Capacity Value</span>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {savingsResult.currencySymbol}
                    {savingsResult.monthlyValueReclaimed.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-control border border-primary/30 bg-surface p-4">
                  <span className="text-xs text-ink-muted">Annual Operational Capacity Value</span>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {savingsResult.currencySymbol}
                    {savingsResult.annualValueReclaimed.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                <strong>Calculator Note:</strong> This mathematical estimate multiplies your entered
                staff hours by a conservative {capturePercent}% automation ratio. Actual time saved
                depends on workflow complexity and team adoption—never a guaranteed financial claim.
              </p>
            </div>

            <div className="mt-6">
              <Button href="/contact" size="sm">
                Validate Your Workflow ROI With OmniFlow
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
          role="tabpanel"
          aria-label="Automation readiness assessment"
          className="grid grid-cols-1 gap-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:grid-cols-12 sm:p-8"
        >
          <div className="space-y-4 lg:col-span-6">
            <div>
              <Badge>Interactive Demo · 5-Point Diagnostic</Badge>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Automation Readiness Assessment
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Evaluate how prepared your current processes are for reliable automation.
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
              <label htmlFor="rd-goal" className="block text-xs font-semibold text-ink-heading">
                5. Highest-priority bottleneck for the next 90 days
              </label>
              <select
                id="rd-goal"
                value={readiness.primaryBottleneck}
                onChange={(e) =>
                  setReadiness({
                    ...readiness,
                    primaryBottleneck: e.target.value as ReadinessAnswers["primaryBottleneck"],
                  })
                }
                className={controlClasses}
              >
                <option value="leads">Faster inbound lead qualification &amp; follow-up</option>
                <option value="support">Reducing repetitive client support / onboarding questions</option>
                <option value="operations">Automating internal handoffs &amp; project kickoffs</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-control border border-line bg-surface-muted p-6 lg:col-span-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-medium text-ink-muted">Readiness Score</span>
                  <p className="text-3xl font-bold text-ink-heading">
                    {readinessResult.score} / 100
                  </p>
                </div>
                <Badge>{readinessResult.stageLabel}</Badge>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-body">
                {readinessResult.summary}
              </p>

              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-heading">
                  Recommended Action Steps
                </h3>
                <ul className="mt-2.5 space-y-2 text-xs text-ink-body">
                  {readinessResult.actionChecklist.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-control border border-line bg-surface p-4 text-xs">
                <span className="text-ink-muted">Recommended Starting System: </span>
                <strong className="text-ink-heading">
                  {readinessResult.recommendedServiceName}
                </strong>
              </div>
            </div>

            <div className="mt-6">
              <Button href={`/contact?service=${readinessResult.recommendedServiceSlug}`} size="sm">
                Discuss {readinessResult.recommendedServiceName}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
