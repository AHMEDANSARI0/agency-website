"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2, RotateCcw } from "lucide-react";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleSectionHeader,
} from "@/components/ui/soale";

interface ProcessPillStep {
  num: string;
  phaseIndex: number;
  title: string;
  detail: string;
  deliverable: string;
}

const PHASE_COLUMNS = [
  { index: 0, code: "Phase I", title: "Discovery & Audit" },
  { index: 1, code: "Phase II", title: "Schema & Guardrails" },
  { index: 2, code: "Phase III", title: "Staged Engineering" },
  { index: 3, code: "Phase IV", title: "Launch & Handover" },
];

const PROCESS_STEPS_10: ProcessPillStep[] = [
  {
    num: "01",
    phaseIndex: 0,
    title: "Workflow & Bottleneck Mapping",
    detail:
      "We trace how enquiries, client messages, and tasks currently travel across your inbox, forms, and spreadsheets.",
    deliverable: "Current-State Bottleneck Map",
  },
  {
    num: "02",
    phaseIndex: 0,
    title: "Human vs. Automation Boundary",
    detail:
      "We decide explicitly which routine steps should run automatically and which high-judgment steps stay human-approved.",
    deliverable: "Human-in-the-Loop Escalation Matrix",
  },
  {
    num: "03",
    phaseIndex: 1,
    title: "Strict Data Schema & Validation",
    detail:
      "Incoming payloads are validated deterministically with Zod/SQL constraints before any downstream tool is touched.",
    deliverable: "Typed Intake & CRM Data Contracts",
  },
  {
    num: "04",
    phaseIndex: 1,
    title: "Approved SOP Knowledge Grounding",
    detail:
      "AI classification and draft replies are strictly bounded to your approved policies — zero invented pricing or promises.",
    deliverable: "Policy-Bounded Prompt & Retrieval Spec",
  },
  {
    num: "05",
    phaseIndex: 1,
    title: "Duplicate & Idempotency Locks",
    detail:
      "Repeat form clicks, webhook retries, and returning leads are matched cleanly so duplicate CRM deals never pile up.",
    deliverable: "Idempotency & Deduplication Rules",
  },
  {
    num: "06",
    phaseIndex: 2,
    title: "Cross-Stack API & CRM Wiring",
    detail:
      "We connect your forms, CRM, Slack/WhatsApp alerts, calendars, and databases with signed webhooks and clean audit logs.",
    deliverable: "Connected Sandbox Workflow",
  },
  {
    num: "07",
    phaseIndex: 2,
    title: "Dead-Letter & Outage Fallback",
    detail:
      "Every enquiry commits atomically first; if an external API hiccups, nothing is lost and your team gets alerted.",
    deliverable: "Fail-Safe Persistence & Retry Queue",
  },
  {
    num: "08",
    phaseIndex: 2,
    title: "Adversarial & Edge-Case QA",
    detail:
      "We test malformed inputs, spam bots, after-hours spikes, and out-of-scope questions before production cutover.",
    deliverable: "Verified Staging QA Report",
  },
  {
    num: "09",
    phaseIndex: 3,
    title: "Production Cutover & Team Walkthrough",
    detail:
      "We launch cleanly alongside your existing operations and walk your team through daily usage in plain English.",
    deliverable: "Live Cutover & Recorded Walkthrough",
  },
  {
    num: "10",
    phaseIndex: 3,
    title: "100% Client IP & Runbook Handover",
    detail:
      "You receive full repository/workflow ownership, plain-English runbooks, and post-launch operational tuning.",
    deliverable: "Complete Admin Access & Runbooks",
  },
];

export function SoaleProcessSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userPinned, setUserPinned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || userPinned) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const updateFromScroll = () => {
      rafId = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const raw = (vh * 0.68 - rect.top) / Math.max(rect.height * 0.82, 320);
      const clamped = Math.max(0, Math.min(0.999, raw));
      const idx = Math.floor(clamped * PROCESS_STEPS_10.length);
      setActiveIndex(idx);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateFromScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateFromScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [userPinned]);

  const activeStep = PROCESS_STEPS_10[activeIndex] ?? PROCESS_STEPS_10[0];
  const progressRatio = (activeIndex + 1) / PROCESS_STEPS_10.length;

  const handlePillKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx =
      (idx + delta + PROCESS_STEPS_10.length) % PROCESS_STEPS_10.length;
    setActiveIndex(nextIdx);
    setUserPinned(true);
    pillRefs.current[nextIdx]?.focus();
  };

  return (
    <div ref={sectionRef}>
      <SoaleSectionHeader
        align="split"
        eyebrow="10-Stage Delivery Process"
        title="Deterministic engineering from first bottleneck audit to full handover."
        description="Scroll or select any stage below to inspect how OmniFlow designs, tests, and hands over reliable automation systems without black-box lock-in."
        action={
          <SoaleArrowButton href="/how-it-works" variant="surface">
            Full Methodology
          </SoaleArrowButton>
        }
      />

      {/* Scroll-Linked GPU Progress Rail Across Stages 01 – 10 */}
      <div className="mt-10">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          <span className="font-mono uppercase tracking-[0.12em]">
            Delivery Progress · Stage {activeStep.num} of 10
          </span>
          {userPinned ? (
            <button
              type="button"
              onClick={() => setUserPinned(false)}
              className="inline-flex items-center gap-1 font-mono text-[0.7rem] font-semibold text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Resume scroll sync</span>
            </button>
          ) : (
            <span className="font-mono text-[0.7rem]">
              Scroll-synced · Click or use arrow keys to inspect
            </span>
          )}
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
      </div>

      {/* Signature Soale Top-Bordered 4-Phase Grid with 10 Rounded 100px Process Pills */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {PHASE_COLUMNS.map((col) => {
          const steps = PROCESS_STEPS_10.filter(
            (s) => s.phaseIndex === col.index
          );
          const phaseActive = activeStep.phaseIndex === col.index;

          return (
            <div
              key={col.code}
              className={`border-t-2 pt-5 transition-colors duration-300 ${
                phaseActive ? "border-primary" : "border-line"
              }`}
            >
              <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                {col.code}
              </p>
              <h3 className="mt-1 text-base font-semibold text-ink-heading">
                {col.title}
              </h3>

              <div className="mt-5 space-y-3">
                {steps.map((step) => {
                  const idx = Number(step.num) - 1;
                  const isCurrent = idx === activeIndex;
                  const isPassed = idx <= activeIndex;

                  return (
                    <button
                      key={step.num}
                      ref={(el) => {
                        pillRefs.current[idx] = el;
                      }}
                      type="button"
                      data-active={isCurrent ? "true" : "false"}
                      onClick={() => {
                        setActiveIndex(idx);
                        setUserPinned(true);
                      }}
                      onKeyDown={(e) => handlePillKeyDown(e, idx)}
                      className="soale-process-pill text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
                    >
                      <span
                        className={`soale-process-num ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : isPassed
                              ? "bg-accent-subtle text-primary"
                              : "bg-surface-muted text-ink-muted"
                        }`}
                      >
                        {step.num}
                      </span>
                      <span className="truncate text-xs font-semibold text-ink-heading sm:text-[0.82rem]">
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Deliverable Inspector Card with Smooth Transition & Prev/Next */}
      <SoaleCard className="mt-8 p-6 sm:p-7">
        <div
          key={activeStep.num}
          className="soale-filter-enter grid grid-cols-1 items-center gap-6 lg:grid-cols-12"
        >
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground">
                  Stage {activeStep.num} / 10
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  {PHASE_COLUMNS[activeStep.phaseIndex]?.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous process stage"
                  onClick={() => {
                    setActiveIndex(
                      (p) =>
                        (p - 1 + PROCESS_STEPS_10.length) %
                        PROCESS_STEPS_10.length
                    );
                    setUserPinned(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink-heading transition-colors hover:border-primary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Next process stage"
                  onClick={() => {
                    setActiveIndex((p) => (p + 1) % PROCESS_STEPS_10.length);
                    setUserPinned(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink-heading transition-colors hover:border-primary"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <h4 className="soale-h3 mt-3 text-ink-heading">
              {activeStep.title}
            </h4>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-body">
              {activeStep.detail}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface-muted/70 p-4 lg:col-span-4">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary">
              Verified Client Deliverable
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-heading">
              <FileCheck2 className="h-4 w-4 shrink-0 text-primary" />
              <span>{activeStep.deliverable}</span>
            </p>
          </div>
        </div>
      </SoaleCard>
    </div>
  );
}
