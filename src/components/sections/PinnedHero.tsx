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
  Sparkles,
  UserCheck,
} from "lucide-react";

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
      'POST /intake -> Verified business contact · Region: UK/US · Spam check: Passed',
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
      className="relative px-2.5 pb-6 pt-20 sm:px-4 sm:pb-10 sm:pt-24"
    >
      <div className="surface-3d relative mx-auto max-w-[1380px] overflow-hidden rounded-[24px] border border-line bg-surface bg-hero-glow sm:rounded-[30px]">
        {/* Architectural Grid Backdrop */}
        <div
          aria-hidden="true"
          className="architectural-grid-perspective pointer-events-none absolute inset-0 opacity-85"
        />

        {/* Controlled Indigo / Electric-Blue / Subtle-Cyan Radial Depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full opacity-75"
          style={{
            background:
              "radial-gradient(circle, var(--of-spotlight-color, rgba(79, 70, 229, 0.16)) 0%, var(--of-color-cyan-subtle, rgba(2, 132, 199, 0.08)) 46%, transparent 70%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-16">
          {/* Left Column — Business-Outcome Positioning & Conversion CTAs */}
          <div className="lg:col-span-6">
            <Link
              href="/demos"
              className="group mb-6 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-surface/90 py-1.5 pl-1.5 pr-4 text-[0.78rem] font-medium text-ink-body shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-ink-heading"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wider text-primary-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={` inline-flex h-full w-full rounded-full bg-white opacity-75 ${
                      reducedMotion ? "" : "absolute animate-ping"
                    }`}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live Lab
              </span>
              <span>Test real AI &amp; workflow simulations before hiring us</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>

            <h1 className="font-display text-[clamp(2.15rem,4.4vw,3.75rem)] font-bold leading-[1.07] tracking-tight text-ink-heading">
              Eliminate repetitive work.{" "}
              <span className="shine-adaptive dark:shine">
                Respond faster &amp; scale cleanly.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[clamp(1rem,1.2vw,1.12rem)] leading-relaxed text-ink-body">
              {companyName} designs reliable AI and workflow automation for service
              businesses, consultants, and agencies — connecting your enquiries, CRM,
              customer support, and back-office operations so nothing slips through
              the cracks.
            </p>

            {/* Primary & Secondary Conversion CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                href={effectivePrimaryHref}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-6 py-3.5 text-[0.94rem] font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
              >
                <span>{effectivePrimaryLabel}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href={effectiveSecondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3.5 text-[0.94rem] font-semibold text-ink-heading shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-muted active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{effectiveSecondaryLabel}</span>
              </Link>
            </div>

            <p className="mt-3.5 text-xs text-ink-muted">
              Free 25-minute workflow review · Clear scope &amp; honest advice · Zero obligation
            </p>

            {/* Concrete Business Outcomes Strip */}
            <ul
              aria-label="Key business outcomes"
              className="mt-7 grid grid-cols-1 gap-2.5 border-t border-line pt-6 sm:grid-cols-2"
            >
              {OUTCOME_PILLS.map((outcome) => (
                <li
                  key={outcome}
                  className="flex items-center gap-2 text-xs font-medium text-ink-heading sm:text-[0.82rem]"
                >
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column — Live 7-Step AI Automation Command Center */}
          <div
            className="lg:col-span-6"
            onMouseEnter={() => {
              if (!reducedMotion) setIsPlaying(false);
            }}
            onMouseLeave={() => {
              if (!reducedMotion) setIsPlaying(true);
            }}
          >
            <div className="rounded-2xl border border-[var(--of-border-card)] bg-surface-card/95 p-4 shadow-elevated backdrop-blur sm:p-6">
              {/* Command Center Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
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
                    <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-heading">
                      AI Automation Command Center
                    </p>
                    <p className="text-[0.72rem] text-ink-muted">
                      Real-world client intake-to-delivery sequence (click any step)
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted px-2.5 py-1.5 font-mono text-[0.68rem] font-semibold text-ink-heading transition-colors hover:border-primary/40"
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

              {/* GPU Transform Progress Rail + Signal Packet */}
              <div
                aria-hidden="true"
                className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-primary via-electric to-electric-cyan transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${progressRatio})` }}
                />
                {isPlaying && !reducedMotion && (
                  <div className="animate-signal-flow pointer-events-none absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-transparent via-white/75 to-transparent" />
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
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                          isCurrent
                            ? "border-primary bg-accent-subtle/65 shadow-sm"
                            : isCompleted
                              ? "border-line bg-surface/80 hover:border-line-strong"
                              : "border-transparent bg-surface-muted/45 opacity-85 hover:border-line hover:opacity-100"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[0.7rem] font-bold transition-colors ${
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

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink-heading sm:text-[0.82rem]">
                              <span className="mr-1.5 font-mono text-[0.68rem] text-ink-muted">
                                {step.stepNumber}.
                              </span>
                              {step.label}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-semibold ${
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

              {/* Active Step Inspector — Business Outcome + Technical Trace */}
              <div
                aria-live="polite"
                className="mt-4 rounded-xl border border-primary/20 bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                    Step {currentStep.stepNumber} Outcome · {currentStep.label}
                  </span>
                  <span className="font-mono text-[0.68rem] text-ink-muted">
                    {currentStep.latency}
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-ink-body sm:text-[0.82rem]">
                  {currentStep.businessOutcome}
                </p>

                <p className="mt-2.5 truncate rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-[0.68rem] text-ink-heading">
                  {currentStep.systemTrace}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <Link
                    href="/contact?intent=call&source=hero_command_center"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover"
                  >
                    <span>Automate this in your business</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/demos"
                    className="font-mono text-[0.7rem] text-ink-muted hover:text-ink-heading"
                  >
                    Test live sandbox →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Architectural Status Rail */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-muted/40 px-6 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted sm:px-10">
          <span className="normal-case font-medium text-ink-heading">
            {companyName} · {tagline}
          </span>
          <span>US · UK · Canada (EST &amp; GMT Overlap)</span>
        </div>
      </div>
    </section>
  );
}
