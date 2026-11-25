"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileCheck2, RotateCcw } from "lucide-react";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleSectionHeader,
} from "@/components/ui/soale";

interface ProcessPhaseItem {
  num: string;
  phaseLabel: string;
  duration: string;
  title: string;
  detail: string;
  deliverable: string;
  checkpoints: string[];
}

export const PROCESS_PHASES_4: ProcessPhaseItem[] = [
  {
    num: "01",
    phaseLabel: "Phase 01",
    duration: "Days 1–3",
    title: "Workflow Review & Written Scope",
    detail:
      "We map how enquiries, messages, and admin tasks move through your inbox and CRM today, then give you a plain-English scope before any build starts.",
    deliverable: "Written Bottleneck Map & Fixed Scope",
    checkpoints: [
      "25-minute review of your current lead & support flow",
      "Clear list of what runs automatically vs. what stays human",
      "Fixed scope and timeline agreed upfront",
    ],
  },
  {
    num: "02",
    phaseLabel: "Phase 02",
    duration: "Week 1",
    title: "Rules, Guardrails & Approval Gates",
    detail:
      "We set strict validation rules, duplicate protection, and human sign-off gates so AI never invents prices, discounts, or unapproved promises.",
    deliverable: "Approved Rules & Escalation Guardrails",
    checkpoints: [
      "Answers restricted strictly to your approved FAQs and policies",
      "One-click human approval for quotes and custom requests",
      "Duplicate-safe CRM contact and deal matching",
    ],
  },
  {
    num: "03",
    phaseLabel: "Phase 03",
    duration: "Week 2",
    title: "Staging Build & Team Walkthrough",
    detail:
      "We connect your forms, CRM, WhatsApp/Slack alerts, and calendar inside a safe test environment and walk your team through real sample runs.",
    deliverable: "Tested Staging Workflow & Live Walkthrough",
    checkpoints: [
      "Connected end-to-end in staging without disrupting live leads",
      "Tested against after-hours spikes, spam, and edge cases",
      "Plain-English walkthrough with your team before go-live",
    ],
  },
  {
    num: "04",
    phaseLabel: "Phase 04",
    duration: "Launch & Beyond",
    title: "Go-Live, Training & Full Ownership",
    detail:
      "We switch the workflow live, monitor early runs closely, and hand over full admin access and simple guides — your business owns everything.",
    deliverable: "100% Client-Owned System & Plain-English Guide",
    checkpoints: [
      "Full admin ownership of workflows, prompts, and accounts",
      "Short written & recorded guide for new staff",
      "Post-launch check-in to tune rules once real volume flows",
    ],
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
      const raw = (vh * 0.68 - rect.top) / Math.max(rect.height * 0.82, 280);
      const clamped = Math.max(0, Math.min(0.999, raw));
      const idx = Math.floor(clamped * PROCESS_PHASES_4.length);
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

  const activePhase = PROCESS_PHASES_4[activeIndex] ?? PROCESS_PHASES_4[0];
  const progressRatio = (activeIndex + 1) / PROCESS_PHASES_4.length;

  const handlePillKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx =
      (idx + delta + PROCESS_PHASES_4.length) % PROCESS_PHASES_4.length;
    setActiveIndex(nextIdx);
    setUserPinned(true);
    pillRefs.current[nextIdx]?.focus();
  };

  return (
    <div ref={sectionRef}>
      <SoaleSectionHeader
        align="split"
        eyebrow="How We Work"
        title="Four clear phases from workflow review to handover."
        description="No open-ended retainers or black-box setups. Every project follows four predictable steps with your team in control."
        action={
          <SoaleArrowButton href="/how-it-works" variant="surface">
            See how it works
          </SoaleArrowButton>
        }
      />

      {/* Scroll-Synced 4-Phase Progress Bar */}
      <div className="mt-10">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          <span className="font-medium">
            {activePhase.phaseLabel} of 04 · {activePhase.title}
          </span>
          {userPinned && (
            <button
              type="button"
              onClick={() => setUserPinned(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Resume scroll sync</span>
            </button>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-300"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
      </div>

      {/* 4-Phase Selector Pills + Active Phase Detail Card */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          role="tablist"
          aria-label="4-phase delivery process"
          className="flex flex-col gap-3 lg:col-span-5"
        >
          {PROCESS_PHASES_4.map((step, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={step.num}
                ref={(el) => {
                  pillRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? "true" : "false"}
                onClick={() => {
                  setActiveIndex(idx);
                  setUserPinned(true);
                }}
                onKeyDown={(e) => handlePillKeyDown(e, idx)}
                className="soale-process-pill text-left"
              >
                <span
                  className={`soale-process-num ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-ink-muted"
                  }`}
                >
                  {step.num}
                </span>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink-heading">
                      {step.title}
                    </span>
                    <span className="shrink-0 text-[0.7rem] text-ink-muted">
                      {step.duration}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <SoaleCard className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-accent-subtle px-3 py-1 text-xs font-semibold text-primary">
                {activePhase.phaseLabel} · {activePhase.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                <span>{activePhase.deliverable}</span>
              </span>
            </div>

            <h3 className="soale-h3 mt-4 text-ink-heading">
              {activePhase.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
              {activePhase.detail}
            </p>

            <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
              {activePhase.checkpoints.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-xs text-ink-body sm:text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <span className="text-xs text-ink-muted">
              You keep 100% admin access to every workflow we deliver.
            </span>
            <SoaleArrowButton
              href="/contact?intent=call&source=process_section"
              variant="primary"
              size="sm"
            >
              Book a free workflow review
            </SoaleArrowButton>
          </div>
        </SoaleCard>
      </div>
    </div>
  );
}
