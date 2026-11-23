"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Database,
  FileCheck2,
  Inbox,
  Pause,
  Play,
  Send,
} from "lucide-react";
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
    sampleInput:
      "Practice size: 14 consultants · Bottleneck: Manual inbox-to-CRM entry across EST/GMT",
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
    sampleInput:
      "Status -> 'New' | Source -> 'website_contact' | Consent -> Verified",
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
    sampleInput:
      "Dispatch pre-call brief to practice lead + send clear response-window confirmation",
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
  const [autoPlay, setAutoPlay] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!autoPlay) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAutoPlay(false);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STAGES.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [autoPlay]);

  const activeStage = STAGES[activeIndex] ?? STAGES[0];
  const progressRatio = (activeIndex + 1) / STAGES.length;

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % STAGES.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + STAGES.length) % STAGES.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = STAGES.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      setAutoPlay(false);
      setActiveIndex(nextIdx);
      tabRefs.current[nextIdx]?.focus();
    }
  }

  return (
    <div className="surface-3d rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <Badge>Architecture Demonstration · Sample Payload</Badge>
          <h3 className="mt-2 text-lg font-semibold text-ink-heading sm:text-xl">
            End-to-End Lead &amp; Triage Automation Flow
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-ink-muted sm:block">
            Select or arrow-key through stages
          </p>
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            aria-pressed={autoPlay}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary/40 hover:text-primary"
          >
            {autoPlay ? (
              <>
                <Pause className="h-3.5 w-3.5 text-primary" />
                <span>Pause Flow</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-primary" />
                <span>Auto-Walkthrough</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stage Progress Connector Hairline */}
      <div
        aria-hidden="true"
        className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full origin-left rounded-full bg-brand-gradient transition-transform duration-500 ease-[var(--of-ease-balance)] will-change-transform"
          style={{ transform: `scaleX(${progressRatio})` }}
        />
      </div>

      {/* Interactive Stage Selector */}
      <div
        role="tablist"
        aria-label="Workflow architecture stages"
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = index === activeIndex;
          return (
            <button
              key={stage.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`wf-tab-${stage.id}`}
              aria-controls={`wf-panel-${stage.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                setAutoPlay(false);
                setActiveIndex(index);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex flex-col items-start rounded-control border p-4 text-left transition-all duration-200 ${
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
              <span className="mt-2 text-sm font-semibold text-ink-heading">
                {stage.title}
              </span>
              <span className="mt-1 text-xs text-ink-muted">{stage.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Inspection Panel */}
      <div
        role="tabpanel"
        id={`wf-panel-${activeStage.id}`}
        aria-labelledby={`wf-tab-${activeStage.id}`}
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
            <span className="text-xs font-medium text-ink-muted">
              Execution Mode:{" "}
            </span>
            <span className="text-xs font-semibold text-ink-heading">
              {activeStage.ruleType}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Automated Steps Executed
            </p>
            <ul className="mt-2.5 space-y-2">
              {activeStage.actionTaken.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-ink-body"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface px-4 py-2.5">
            <span className="text-xs font-medium text-ink-muted">
              Stage Output:
            </span>
            <span className="text-xs font-semibold text-primary">
              {activeStage.sampleOutput}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
