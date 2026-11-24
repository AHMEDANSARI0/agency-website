"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bot,
  CheckCircle2,
  Database,
  Filter,
  Inbox,
  Pause,
  Play,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
} from "@/components/ui/soale";

interface PinnedHeroProps {
  companyName: string;
  tagline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

interface CommandStep {
  id: string;
  stepNumber: string;
  label: string;
  shortStatus: string;
  latency: string;
  businessOutcome: string;
  systemTrace: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMAND_SEQUENCE: CommandStep[] = [
  {
    id: "incoming-enquiry",
    stepNumber: "01",
    label: "Incoming customer enquiry",
    shortStatus: "Captured 24/7",
    latency: "0.12s",
    businessOutcome:
      "Every web form, booking request, or inbound email is captured immediately—even after hours or on weekends.",
    systemTrace:
      "POST /intake -> Verified business contact · Region: UK/US · Spam check: Passed",
    icon: Inbox,
  },
  {
    id: "ai-analysis",
    stepNumber: "02",
    label: "AI analysis",
    shortStatus: "Intent extracted",
    latency: "0.48s",
    businessOutcome:
      "Service need, urgency, and bottleneck details are summarized in plain English without anyone reading raw inbox threads.",
    systemTrace:
      "Policy-grounded classifier -> Need: Lead & CRM Automation · Urgency: Within 30 days",
    icon: Bot,
  },
  {
    id: "lead-qualification",
    stepNumber: "03",
    label: "Lead qualification",
    shortStatus: "High-Fit (92/100)",
    latency: "0.64s",
    businessOutcome:
      "High-intent buyers are prioritized automatically while repeat contacts and low-fit requests are flagged cleanly.",
    systemTrace:
      "Deterministic fit rules -> Tier: Fast-Track Discovery · Duplicate CRM match: None",
    icon: Filter,
  },
  {
    id: "crm-update",
    stepNumber: "04",
    label: "CRM update",
    shortStatus: "Pipeline synced",
    latency: "0.85s",
    businessOutcome:
      "Contact details, source attribution, and a pre-call briefing note land in your CRM with zero copy-pasting.",
    systemTrace:
      "Atomic SQL / CRM commit -> Stage: Qualified · Source: Website Discovery Funnel",
    icon: Database,
  },
  {
    id: "whatsapp-email-alert",
    stepNumber: "05",
    label: "WhatsApp / email notification",
    shortStatus: "Alert dispatched",
    latency: "1.10s",
    businessOutcome:
      "The right team owner receives an instant WhatsApp or email brief, and the prospect gets a fast, personal confirmation.",
    systemTrace:
      "Dispatched owner brief (WhatsApp + Email) · Prospect SLA confirmation delivered",
    icon: BellRing,
  },
  {
    id: "human-approval",
    stepNumber: "06",
    label: "Optional human approval",
    shortStatus: "1-click sign-off",
    latency: "Guardrailed",
    businessOutcome:
      "Custom quotes, sensitive replies, or contract exceptions pause safely for your team's one-click approval.",
    systemTrace:
      "Human-in-the-loop gate -> Routine steps auto-run · Custom scope held for owner approval",
    icon: UserCheck,
  },
  {
    id: "completed-workflow",
    stepNumber: "07",
    label: "Completed workflow",
    shortStatus: "Verified & logged",
    latency: "1.35s total",
    businessOutcome:
      "Follow-up reminders are scheduled, every system is connected, and a complete audit log is saved.",
    systemTrace:
      "Workflow complete -> Zero manual re-entry · Follow-up reminder queued · Audit trail saved",
    icon: CheckCircle2,
  },
];

const OUTCOME_PILLS = [
  "Faster customer responses",
  "Reduced repetitive work",
  "Connected CRM & operations",
  "100% client-owned systems",
];

export function PinnedHero({
  companyName,
  tagline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PinnedHeroProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      setIsPlaying(false);
    }
    const onChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setIsPlaying(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      setActiveStep((prev) => (prev + 1) % COMMAND_SEQUENCE.length);
    };

    const timer = window.setInterval(tick, 2800);
    return () => window.clearInterval(timer);
  }, [isPlaying, reducedMotion]);

  const currentStep = COMMAND_SEQUENCE[activeStep] ?? COMMAND_SEQUENCE[0];
  const progressRatio = (activeStep + 1) / COMMAND_SEQUENCE.length;

  const effectivePrimaryLabel =
    primaryCtaLabel?.trim() || "Book a Free Discovery Call";
  const effectivePrimaryHref = primaryCtaHref?.trim() || "/contact?intent=call";
  const effectiveSecondaryLabel =
    secondaryCtaLabel?.trim() || "Explore Live Demos";
  const effectiveSecondaryHref = secondaryCtaHref?.trim() || "/demos";

  return (
    <section
      aria-label="AI Automation Command Center"
      className="soale-ambient-wash relative overflow-hidden pb-14 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Editorial Soale Hero Header + Split Showcase */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Column — Spacious Soale Editorial Typography & Dual-Arrow CTAs */}
          <div className="lg:col-span-6 lg:pt-4">
            <SoaleEyebrow className="mb-6">
              {companyName} · AI &amp; Workflow Automation Partner
            </SoaleEyebrow>

            <h1 className="soale-display text-ink-heading">
              Eliminate repetitive work.{" "}
              <span className="text-primary">
                Respond faster &amp; scale cleanly.
              </span>
            </h1>

            <p className="soale-lead mt-6">
              {companyName} designs reliable AI and deterministic workflow
              automation for service businesses, consultants, and agencies —
              connecting enquiries, CRM, customer support, and back-office
              operations so nothing slips through the cracks.
            </p>

            {/* Signature Soale Connected Capsule + Dual Sliding Arrow Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <SoaleArrowButton href={effectivePrimaryHref} variant="primary">
                {effectivePrimaryLabel}
              </SoaleArrowButton>

              <SoaleArrowButton href={effectiveSecondaryHref} variant="surface">
                {effectiveSecondaryLabel}
              </SoaleArrowButton>
            </div>

            <p className="mt-4 text-xs text-ink-muted">
              Free 25-minute workflow review · Written scope &amp; honest advice
              · Zero obligation
            </p>

            {/* Clean 14px Soale Outcome Chips */}
            <div
              aria-label="Key business outcomes"
              className="mt-8 flex flex-wrap gap-2.5 border-t border-line pt-7"
            >
              {OUTCOME_PILLS.map((outcome) => (
                <SoaleChip key={outcome}>
                  <ShieldCheck
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{outcome}</span>
                </SoaleChip>
              ))}
            </div>
          </div>

          {/* Right Column — 24px Soale Showcase Card: Live 7-Step Automation Sequence */}
          <div
            className="lg:col-span-6"
            onMouseEnter={() => {
              if (!reducedMotion) setIsPlaying(false);
            }}
            onMouseLeave={() => {
              if (!reducedMotion) setIsPlaying(true);
            }}
          >
            <SoaleCard elevated className="p-5 sm:p-7">
              {/* Showcase Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="relative flex h-2.5 w-2.5"
                    aria-hidden="true"
                  >
                    <span
                      className={`inline-flex h-full w-full rounded-full bg-status-success ${
                        isPlaying && !reducedMotion
                          ? "absolute animate-ping opacity-75"
                          : ""
                      }`}
                    />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-success" />
                  </span>
                  <div>
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-heading">
                      Live Workflow Command Showcase
                    </p>
                    <p className="text-xs text-ink-muted">
                      End-to-end intake-to-delivery sequence · Click any stage
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  aria-label={
                    isPlaying
                      ? "Pause workflow animation"
                      : "Play workflow animation"
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3.5 py-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-heading transition-colors hover:border-primary/40"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3 w-3 text-primary" />
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 text-primary" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pure GPU Transform Progress Rail */}
              <div
                aria-hidden="true"
                className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className="h-full origin-left rounded-full bg-primary transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${progressRatio})` }}
                />
                {isPlaying && !reducedMotion && (
                  <div className="animate-signal-flow pointer-events-none absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                )}
              </div>

              {/* 7-Step Connected Automation Sequence */}
              <ol
                aria-label="7-step automated business workflow"
                className="mt-4 space-y-1.5"
              >
                {COMMAND_SEQUENCE.map((step, idx) => {
                  const Icon = step.icon;
                  const isCurrent = idx === activeStep;
                  const isCompleted = idx < activeStep;

                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStep(idx);
                          setIsPlaying(false);
                        }}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`flex w-full items-center justify-between gap-3 rounded-[16px] border px-3.5 py-2.5 text-left transition-all duration-200 ${
                          isCurrent
                            ? "border-primary/45 bg-accent-subtle shadow-sm"
                            : isCompleted
                              ? "border-line bg-surface hover:border-line-strong"
                              : "border-transparent bg-surface-muted/55 opacity-85 hover:border-line hover:opacity-100"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[0.7rem] font-semibold transition-colors ${
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : isCompleted
                                  ? "bg-status-success/15 text-status-success"
                                  : "bg-surface text-ink-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Icon className="h-3.5 w-3.5" />
                            )}
                          </span>

                          <p className="truncate text-xs font-semibold text-ink-heading sm:text-[0.84rem]">
                            <span className="mr-1.5 font-mono text-[0.68rem] text-ink-muted">
                              {step.stepNumber}
                            </span>
                            {step.label}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold ${
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : isCompleted
                                  ? "bg-surface-muted text-ink-heading"
                                  : "text-ink-muted"
                            }`}
                          >
                            {step.shortStatus}
                          </span>
                          <span className="hidden font-mono text-[0.65rem] text-ink-muted sm:inline">
                            {step.latency}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Active Step Outcome Card */}
              <div
                aria-live="polite"
                className="mt-4 rounded-[18px] border border-line bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-primary">
                    Stage {currentStep.stepNumber} · {currentStep.label}
                  </span>
                  <span className="font-mono text-[0.68rem] text-ink-muted">
                    {currentStep.latency}
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-ink-body sm:text-[0.84rem]">
                  {currentStep.businessOutcome}
                </p>

                <p className="mt-3 truncate rounded-xl border border-line bg-surface-muted px-3 py-1.5 font-mono text-[0.68rem] text-ink-heading">
                  {currentStep.systemTrace}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <Link
                    href="/contact?intent=call&source=hero_command_center"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover"
                  >
                    <span>Scope this workflow for your team</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="font-mono text-[0.68rem] text-ink-muted">
                    {tagline}
                  </span>
                </div>
              </div>
            </SoaleCard>
          </div>
        </div>
      </div>
    </section>
  );
}
