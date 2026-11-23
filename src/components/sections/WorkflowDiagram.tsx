"use client";

import React, { useState } from "react";
import { CheckCircle2, Database, FileCheck2, Inbox, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface StageSpec {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  ruleType: string;
  sampleInput: string;
  actionTaken: string[];
  sampleOutput: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageSpec[] = [
  {
    id: "capture",
    step: "Stage 01",
    title: "Structured Intake Capture",
    subtitle: "Web form, booking webhook, or support inbox event",
    ruleType: "Deterministic Schema Validation",
    sampleInput:
      '{ "company": "Northbridge Advisory (UK)", "service": "Lead Management", "timeline": "Within 30 days" }',
    actionTaken: [
      "Validates required business context and email syntax",
      "Filters automated bot submissions via honeypot & rate limits",
      "Normalizes fields before downstream processing",
    ],
    sampleOutput: "Validated Payload · Ready for Qualification",
    icon: Inbox,
  },
  {
    id: "qualify",
    step: "Stage 02",
    title: "Qualification & Guardrail Check",
    subtitle: "Fit scoring, duplicate check, and policy boundaries",
    ruleType: "Deterministic Rules + Bounded Classification",
    sampleInput: "Practice size: 14 consultants · Bottleneck: Manual inbox-to-CRM entry across EST/GMT",
    actionTaken: [
      "Checks existing CRM records for returning email addresses",
      "Assigns priority tier based on service fit and timeline clarity",
      "Flags custom scoping questions for human review",
    ],
    sampleOutput: "Priority: High Fit · Duplicate Flag: False · Owner: Principal",
    icon: FileCheck2,
  },
  {
    id: "sync",
    step: "Stage 03",
    title: "CRM Pipeline & Audit Logging",
    subtitle: "Atomic record creation with status history",
    ruleType: "Relational Database Transaction",
    sampleInput: "Status -> 'New' | Source -> 'website_contact' | Consent -> Verified",
    actionTaken: [
      "Stores structured enquiry in CRM with timestamped status history",
      "Attaches pre-call summary note for discovery preparation",
      "Guarantees zero lost enquiries even if external email is offline",
    ],
    sampleOutput: "CRM Record Stored · Audit Trail Logged",
    icon: Database,
  },
  {
    id: "handoff",
    step: "Stage 04",
    title: "Team Brief & Client Acknowledgement",
    subtitle: "Immediate owner alert with human-in-the-loop control",
    ruleType: "Event Notification + Human Approval",
    sampleInput: "Dispatch pre-call brief to practice lead + send clear response-window confirmation",
    actionTaken: [
      "Sends concise summary brief to the assigned team owner",
      "Confirms receipt to the prospect without robotic or fabricated claims",
      "Queues follow-up reminder date inside the CRM",
    ],
    sampleOutput: "Owner Alerted · Next Action Scheduled",
    icon: Send,
  },
];

export function WorkflowDiagram() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = STAGES[activeIndex] ?? STAGES[0];

  return (
    <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <Badge>Architecture Demonstration · Sample Payload</Badge>
          <h3 className="mt-2 text-lg font-semibold text-ink-heading sm:text-xl">
            End-to-End Lead &amp; Triage Automation Flow
          </h3>
        </div>
        <p className="text-xs text-ink-muted">Select any stage below to inspect workflow logic</p>
      </div>

      {/* Interactive Stage Selector */}
      <div
        role="tablist"
        aria-label="Workflow architecture stages"
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = index === activeIndex;
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveIndex(index)}
              className={`flex flex-col items-start rounded-control border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-[var(--of-color-accent-subtle)] shadow-sm"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {stage.step}
                </span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="mt-2 text-sm font-semibold text-ink-heading">{stage.title}</span>
              <span className="mt-1 text-xs text-ink-muted">{stage.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Inspection Panel */}
      <div
        role="tabpanel"
        className="mt-6 grid grid-cols-1 gap-6 rounded-control border border-line bg-surface-muted p-5 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Sample Trigger / Input
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3.5 font-mono text-xs text-ink-body">
            {activeStage.sampleInput}
          </pre>
          <div className="mt-4">
            <span className="text-xs font-medium text-ink-muted">Execution Mode: </span>
            <span className="text-xs font-semibold text-ink-heading">{activeStage.ruleType}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Automated Steps Executed
            </p>
            <ul className="mt-2.5 space-y-2">
              {activeStage.actionTaken.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-body">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface px-4 py-2.5">
            <span className="text-xs font-medium text-ink-muted">Stage Output:</span>
            <span className="text-xs font-semibold text-primary">{activeStage.sampleOutput}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
