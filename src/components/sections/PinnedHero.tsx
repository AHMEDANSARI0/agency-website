"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Move } from "lucide-react";
import { InteractiveGlobeCanvas } from "@/components/animations/InteractiveGlobeCanvas";
import { SoaleArrowButton } from "@/components/ui/soale";
import {
  DEFAULT_HERO_CANVAS_CONFIG,
  normalizeHeroCanvasConfig,
  type HeroCanvasConfig,
} from "@/types/hero-canvas";

export interface PinnedHeroProps {
  companyName?: string;
  tagline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  headlineOverride?: string;
  subtitleOverride?: string;
  heroCanvas?: Partial<HeroCanvasConfig> | Record<string, unknown>;
  canvasPositionDragMode?: boolean;
  onGlobePositionChange?: (offsetX: number, offsetY: number) => void;
}

type CommandTabId = "overview" | "leads" | "workflows" | "support" | "reports";

interface CommandViewData {
  id: CommandTabId;
  label: string;
  metrics: [
    { label: string; value: string; delta: string },
    { label: string; value: string; delta: string },
    { label: string; value: string; delta: string },
  ];
  chartTitle: string;
  chartPathLine: string;
  chartPathArea: string;
  runsTitle: string;
  runs: Array<{
    name: string;
    status: "Done" | "Needs approval";
  }>;
}

const COMMAND_VIEWS: CommandViewData[] = [
  {
    id: "overview",
    label: "Overview",
    metrics: [
      { label: "Avg. response", value: "1.8 min", delta: "faster than last week" },
      { label: "Leads handled", value: "2,481", delta: "this month" },
      { label: "Hours saved", value: "126 h", delta: "this month" },
    ],
    chartTitle: "Enquiries answered",
    chartPathLine:
      "M 18 134 C 68 132, 95 128, 132 110 C 168 92, 205 98, 248 92 C 292 86, 326 98, 362 84 C 398 70, 420 46, 466 44 C 504 42, 524 44, 546 34",
    chartPathArea:
      "M 18 134 C 68 132, 95 128, 132 110 C 168 92, 205 98, 248 92 C 292 86, 326 98, 362 84 C 398 70, 420 46, 466 44 C 504 42, 524 44, 546 34 L 546 158 L 18 158 Z",
    runsTitle: "Recent runs",
    runs: [
      { name: "Lead scored", status: "Done" },
      { name: "CRM updated", status: "Done" },
      { name: "Quote reply", status: "Needs approval" },
      { name: "WhatsApp alert", status: "Done" },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    metrics: [
      { label: "Qualified today", value: "38", delta: "scored automatically" },
      { label: "CRM sync rate", value: "100%", delta: "zero duplicate deals" },
      { label: "Owner brief SLA", value: "42 sec", delta: "avg. delivery" },
    ],
    chartTitle: "Qualified inbound leads",
    chartPathLine:
      "M 18 138 C 72 130, 108 118, 152 108 C 198 98, 238 88, 286 78 C 334 68, 382 64, 434 48 C 478 36, 514 38, 546 28",
    chartPathArea:
      "M 18 138 C 72 130, 108 118, 152 108 C 198 98, 238 88, 286 78 C 334 68, 382 64, 434 48 C 478 36, 514 38, 546 28 L 546 158 L 18 158 Z",
    runsTitle: "Recent lead actions",
    runs: [
      { name: "Web form validated", status: "Done" },
      { name: "HubSpot deal created", status: "Done" },
      { name: "Custom scope quote", status: "Needs approval" },
      { name: "Calendar link sent", status: "Done" },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    metrics: [
      { label: "Active workflows", value: "12", delta: "all healthy" },
      { label: "Steps executed", value: "9,840", delta: "this month" },
      { label: "Failed handoffs", value: "0", delta: "retry queue clear" },
    ],
    chartTitle: "Automated workflow runs",
    chartPathLine:
      "M 18 128 C 64 124, 110 116, 156 102 C 204 88, 244 94, 294 76 C 344 58, 392 62, 444 42 C 488 32, 518 34, 546 26",
    chartPathArea:
      "M 18 128 C 64 124, 110 116, 156 102 C 204 88, 244 94, 294 76 C 344 58, 392 62, 444 42 C 488 32, 518 34, 546 26 L 546 158 L 18 158 Z",
    runsTitle: "Workflow stages",
    runs: [
      { name: "Incoming customer enquiry", status: "Done" },
      { name: "Lead qualification", status: "Done" },
      { name: "Optional human approval", status: "Needs approval" },
      { name: "Completed workflow", status: "Done" },
    ],
  },
  {
    id: "support",
    label: "Support inbox",
    metrics: [
      { label: "First reply", value: "54 sec", delta: "approved SOPs only" },
      { label: "Auto-answered", value: "74%", delta: "routine questions" },
      { label: "Escalated cleanly", value: "26%", delta: "with full summary" },
    ],
    chartTitle: "Support threads triaged",
    chartPathLine:
      "M 18 132 C 70 126, 118 112, 164 106 C 212 100, 258 84, 308 74 C 358 64, 404 54, 456 46 C 496 40, 522 36, 546 30",
    chartPathArea:
      "M 18 132 C 70 126, 118 112, 164 106 C 212 100, 258 84, 308 74 C 358 64, 404 54, 456 46 C 496 40, 522 36, 546 30 L 546 158 L 18 158 Z",
    runsTitle: "Latest inbox triage",
    runs: [
      { name: "Hours & booking FAQ", status: "Done" },
      { name: "Onboarding checklist", status: "Done" },
      { name: "Refund exception", status: "Needs approval" },
      { name: "Slack team summary", status: "Done" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    metrics: [
      { label: "Weekly digest", value: "Sent", delta: "every Monday 8am" },
      { label: "Pipeline hygiene", value: "99.4%", delta: "fields complete" },
      { label: "Audit log trail", value: "100%", delta: "client-owned" },
    ],
    chartTitle: "Team hours reclaimed",
    chartPathLine:
      "M 18 140 C 68 134, 114 124, 162 112 C 210 100, 256 90, 306 76 C 356 62, 404 52, 454 40 C 496 32, 524 30, 546 24",
    chartPathArea:
      "M 18 140 C 68 134, 114 124, 162 112 C 210 100, 256 90, 306 76 C 356 62, 404 52, 454 40 C 496 32, 524 30, 546 24 L 546 158 L 18 158 Z",
    runsTitle: "Scheduled reports",
    runs: [
      { name: "Response-time summary", status: "Done" },
      { name: "Source ROI breakdown", status: "Done" },
      { name: "Quarterly scope review", status: "Needs approval" },
      { name: "Backup verification", status: "Done" },
    ],
  },
];

const HERO_ARCHITECTURAL_FACTS = [
  { metric: "5 Demos", label: "Interactive workflow sandboxes" },
  { metric: "US · UK · CA", label: "Working-hours overlap" },
  { metric: "Fixed Scope", label: "Written quote before kickoff" },
  { metric: "100% Yours", label: "Code, prompts & runbooks" },
];

export function PinnedHero({
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  headlineOverride,
  subtitleOverride,
  heroCanvas: rawHeroCanvas,
  canvasPositionDragMode = false,
  onGlobePositionChange,
}: PinnedHeroProps) {
  const [activeTab, setActiveTab] = useState<CommandTabId>("overview");
  const [repeatVisit, setRepeatVisit] = useState(false);
  const [veOverride, setVeOverride] = useState<{
    headline?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    heroCanvas?: Record<string, unknown>;
    dragMode?: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("ve=1")) return;
    const onHeroSync = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          section?: {
            title?: string;
            subtitle?: string;
            config?: Record<string, unknown>;
          };
          canvasPositionDragMode?: boolean;
        }>
      ).detail;
      const sec = detail?.section;
      if (sec) {
        setVeOverride({
          headline: sec.title,
          subtitle: sec.subtitle,
          ctaLabel:
            typeof sec.config?.ctaLabel === "string"
              ? sec.config.ctaLabel
              : undefined,
          ctaHref:
            typeof sec.config?.ctaHref === "string"
              ? sec.config.ctaHref
              : undefined,
          heroCanvas:
            (sec.config?.heroCanvas as Record<string, unknown> | undefined) ??
            undefined,
          dragMode: Boolean(detail?.canvasPositionDragMode),
        });
      }
    };
    window.addEventListener("omniflow:ve-hero-update", onHeroSync);
    return () =>
      window.removeEventListener("omniflow:ve-hero-update", onHeroSync);
  }, []);

  const effectiveDragMode = veOverride?.dragMode ?? canvasPositionDragMode;
  const canvasCfg = normalizeHeroCanvasConfig(
    veOverride?.heroCanvas ?? rawHeroCanvas ?? DEFAULT_HERO_CANVAS_CONFIG
  );
  const showSoaleHalo =
    canvasCfg.visualMode === "orbital_halo" ||
    canvasCfg.visualMode === "halo_plus_globe";
  const showQuantumGlobe =
    canvasCfg.visualMode === "quantum_sphere" ||
    canvasCfg.visualMode === "halo_plus_globe";
  const showHorizonGlobe = canvasCfg.visualMode === "horizon_arc";
  const isSplitLeft = canvasCfg.layoutAlign === "split_left";

  const handleCanvasDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!effectiveDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = canvasCfg.globeOffsetX;
    const origY = canvasCfg.globeOffsetY;

    const onMove = (ev: PointerEvent) => {
      const nextX = Math.max(
        -260,
        Math.min(260, Math.round(origX + (ev.clientX - startX)))
      );
      const nextY = Math.max(
        -180,
        Math.min(180, Math.round(origY + (ev.clientY - startY)))
      );
      onGlobePositionChange?.(nextX, nextY);
      setVeOverride((prev) => ({
        ...(prev ?? {}),
        heroCanvas: {
          ...(prev?.heroCanvas ??
            (rawHeroCanvas as Record<string, unknown>) ??
            {}),
          globeOffsetX: nextX,
          globeOffsetY: nextY,
        },
      }));
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage(
          { type: "OMNIFLOW_VE_GLOBE_DRAGGED", offsetX: nextX, offsetY: nextY },
          window.location.origin
        );
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem("of_hero_seen") === "1") {
        setRepeatVisit(true);
      } else {
        window.sessionStorage.setItem("of_hero_seen", "1");
      }
    } catch {
      // Ignore storage restrictions in private browsing
    }

    const onVisibility = () => {
      if (document.hidden) return;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const currentView =
    COMMAND_VIEWS.find((v) => v.id === activeTab) ?? COMMAND_VIEWS[0];

  const effectivePrimaryHref =
    veOverride?.ctaHref?.trim() ||
    primaryCtaHref?.trim() ||
    "/contact?intent=call";
  const effectiveSecondaryHref = secondaryCtaHref?.trim() || "/demos";
  const resolvedPrimaryLabel = veOverride?.ctaLabel?.trim() || primaryCtaLabel;
  const effectivePrimaryText =
    resolvedPrimaryLabel &&
    !resolvedPrimaryLabel.toLowerCase().includes("discovery")
      ? resolvedPrimaryLabel
      : "Book a free workflow review";
  const effectiveSecondaryText =
    secondaryCtaLabel &&
    !secondaryCtaLabel.toLowerCase().includes("explore")
      ? secondaryCtaLabel
      : "See live demo";

  const customTitleTrimmed =
    (veOverride?.headline ?? headlineOverride)?.trim() || "";
  const resolvedSubtitle =
    (veOverride?.subtitle ?? subtitleOverride)?.trim() || "";
  const useCustomTitle =
    Boolean(customTitleTrimmed) &&
    customTitleTrimmed !== "Automate the work. Accelerate the business.";

  return (
    <section
      aria-label="OmniFlow AI workflow automation hero"
      data-hero-repeat={repeatVisit ? "true" : "false"}
      data-hero-visual={canvasCfg.visualMode}
      style={
        {
          "--of-hero-glow-intensity": canvasCfg.glowIntensity,
        } as React.CSSProperties
      }
      className="of-hero-shell relative overflow-hidden pb-14 pt-20 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-28"
    >
      {/* Soale Orbital Halo Light Ring + Corner Ambient Orbs + Starfield (Dark & Light Mode) */}
      {showSoaleHalo && (
        <div aria-hidden="true" className="soale-hero-circle-wrapper">
          <div className="soale-gradient-circle" />
          <div className="soale-core-circle" />
        </div>
      )}
      <div aria-hidden="true" className="soale-ambient-orb-left" />
      <div aria-hidden="true" className="soale-ambient-orb-right" />
      <div aria-hidden="true" className="soale-starfield" />

      {/* BlueOrbit / Unfold Rising Horizon 3D Globe Backdrop */}
      {showHorizonGlobe && (
        <div
          onPointerDown={handleCanvasDragStart}
          className={`absolute inset-x-0 bottom-0 top-10 z-[1] ${
            effectiveDragMode
              ? "cursor-move ring-2 ring-inset ring-primary/60"
              : "pointer-events-auto"
          }`}
        >
          <InteractiveGlobeCanvas
            variant="horizon_arc"
            scale={canvasCfg.globeScale}
            offsetX={canvasCfg.globeOffsetX}
            offsetY={canvasCfg.globeOffsetY}
            rotationSpeed={canvasCfg.rotationSpeed}
            particleDensity={canvasCfg.particleDensity}
            primaryGlowColor={canvasCfg.primaryGlowColor}
            secondaryGlowColor={canvasCfg.secondaryGlowColor}
            showOrbitalRing={canvasCfg.showOrbitalRing}
            showSignalArcs={canvasCfg.showSignalArcs}
            interactiveDrag={canvasCfg.interactiveDrag && !effectiveDragMode}
          />
          {effectiveDragMode && (
            <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[11px] font-semibold text-primary-foreground shadow-card">
              <Move className="h-3.5 w-3.5" />
              Drag Horizon Globe ({canvasCfg.globeOffsetX}px,{" "}
              {canvasCfg.globeOffsetY}px)
            </span>
          )}
        </div>
      )}

      {/* Centered Backdrop Quantum Globe when Quantum Sphere is set to Centered layout */}
      {showQuantumGlobe && !isSplitLeft && (
        <div
          onPointerDown={handleCanvasDragStart}
          className={`absolute inset-x-0 top-12 z-[1] mx-auto h-[460px] max-w-[680px] opacity-85 sm:h-[560px] ${
            effectiveDragMode
              ? "cursor-move rounded-3xl ring-2 ring-primary/60"
              : ""
          }`}
        >
          <InteractiveGlobeCanvas
            variant="quantum_sphere"
            scale={canvasCfg.globeScale}
            offsetX={canvasCfg.globeOffsetX}
            offsetY={canvasCfg.globeOffsetY}
            rotationSpeed={canvasCfg.rotationSpeed}
            particleDensity={canvasCfg.particleDensity}
            primaryGlowColor={canvasCfg.primaryGlowColor}
            secondaryGlowColor={canvasCfg.secondaryGlowColor}
            showOrbitalRing={canvasCfg.showOrbitalRing}
            showSignalArcs={canvasCfg.showSignalArcs}
            interactiveDrag={canvasCfg.interactiveDrag && !effectiveDragMode}
          />
        </div>
      )}

      {/* Subtle Radial Wash + Perspective Horizon Grid */}
      <div
        aria-hidden="true"
        className="of-hero-glow pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="of-hero-grid pointer-events-none absolute inset-x-0 bottom-0 h-[56%]"
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div
          className={
            isSplitLeft && showQuantumGlobe
              ? "grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10"
              : ""
          }
        >
          {/* Hero Copy Column (Centered or Left-Split when 3D Globe sits on Right) */}
          <div
            className={
              isSplitLeft && showQuantumGlobe
                ? "text-left lg:col-span-7"
                : "mx-auto max-w-5xl text-center"
            }
          >
            {/* Dual-Mode Soale Star Pill Eyebrow */}
            <div
              data-reveal="fade"
              style={{ "--d": 0 } as React.CSSProperties}
              className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-line-strong/80 bg-surface-glass px-4 py-2 text-[0.74rem] font-medium text-ink-heading shadow-card backdrop-blur-md sm:text-xs"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 shrink-0 text-[#FF7023]"
                fill="currentColor"
              >
                <path d="M8 0.5L9.85 6.15L15.5 8L9.85 9.85L8 15.5L6.15 9.85L0.5 8L6.15 6.15L8 0.5Z" />
              </svg>
              <span className="truncate">
                {canvasCfg.eyebrowOverride?.trim() || (
                  <>
                    AI automation for service businesses
                    <span className="hidden text-ink-muted sm:inline">
                      {" "}
                      | US · UK · Canada
                    </span>
                  </>
                )}
              </span>
            </div>

            {/* Display Headline */}
            <h1
              data-reveal=""
              style={{ "--d": 1 } as React.CSSProperties}
              className={`mt-6 text-balance font-display font-bold leading-[1.07] tracking-[-0.036em] text-ink-heading sm:mt-7 ${
                isSplitLeft && showQuantumGlobe
                  ? "text-[2.15rem] sm:text-[3.1rem] lg:text-[3.6rem]"
                  : "text-[2.2rem] sm:text-[3.45rem] lg:text-[4.4rem]"
              }`}
            >
              {useCustomTitle ? (
                <span>{customTitleTrimmed}</span>
              ) : (
                <>
                  <span className="block">Automate the work.</span>
                  <span className="of-hero-gradient-text mt-1 block">
                    Accelerate the business.
                  </span>
                </>
              )}
            </h1>

            {/* 2-Line Plain-English Subcopy (<= 60ch) */}
            <p
              data-reveal=""
              style={{ "--d": 2 } as React.CSSProperties}
              className={`mt-5 max-w-[56ch] text-[0.96rem] leading-relaxed text-ink-body sm:mt-6 sm:text-[1.125rem] ${
                isSplitLeft && showQuantumGlobe ? "" : "mx-auto"
              }`}
            >
              {resolvedSubtitle ||
                "AI workflows that answer every lead, update your CRM and alert your team, with a person approving the important steps."}
            </p>

            {/* Soale Dual-Capsule Sliding-Arrow CTA + Secondary Demo Pill */}
            <div
              data-reveal=""
              style={{ "--d": 3 } as React.CSSProperties}
              className={`mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-3.5 ${
                isSplitLeft && showQuantumGlobe
                  ? "items-start justify-start"
                  : "items-center justify-center"
              }`}
            >
              <SoaleArrowButton href={effectivePrimaryHref} variant="secondary">
                {effectivePrimaryText}
              </SoaleArrowButton>
              <Link
                href={effectiveSecondaryHref}
                className="inline-flex min-h-[45px] items-center justify-center rounded-[17px] border border-line-strong bg-surface-glass px-4 py-2.5 text-[0.84rem] font-medium text-ink-heading backdrop-blur-md transition-colors duration-200 hover:border-primary/60 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-6 sm:py-3 sm:text-[0.92rem]"
              >
                {effectiveSecondaryText}
              </Link>
            </div>

            {/* Architectural Executive Assurance Strip */}
            <div
              className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted ${
                isSplitLeft && showQuantumGlobe
                  ? "justify-start"
                  : "justify-center"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Human-Approved Gates
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                100% Client IP Ownership
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FB923C]" />
                Free 25-Min Scope Review
              </span>
            </div>
          </div>

          {/* Right-Column Interactive 3D Quantum Holographic Globe (Shot #26367677 / Quip Style) */}
          {isSplitLeft && showQuantumGlobe && (
            <div
              onPointerDown={handleCanvasDragStart}
              className={`relative h-[340px] w-full sm:h-[430px] lg:col-span-5 lg:h-[510px] ${
                effectiveDragMode
                  ? "cursor-move rounded-3xl ring-2 ring-dashed ring-primary/70"
                  : ""
              }`}
            >
              <InteractiveGlobeCanvas
                variant="quantum_sphere"
                scale={canvasCfg.globeScale}
                offsetX={canvasCfg.globeOffsetX}
                offsetY={canvasCfg.globeOffsetY}
                rotationSpeed={canvasCfg.rotationSpeed}
                particleDensity={canvasCfg.particleDensity}
                primaryGlowColor={canvasCfg.primaryGlowColor}
                secondaryGlowColor={canvasCfg.secondaryGlowColor}
                showOrbitalRing={canvasCfg.showOrbitalRing}
                showSignalArcs={canvasCfg.showSignalArcs}
                interactiveDrag={canvasCfg.interactiveDrag && !effectiveDragMode}
              />
              {effectiveDragMode && (
                <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[11px] font-semibold text-primary-foreground shadow-card">
                  <Move className="h-3.5 w-3.5" />
                  Drag 3D Globe ({canvasCfg.globeOffsetX}px,{" "}
                  {canvasCfg.globeOffsetY}px)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Soale 4-Column Monospace Architectural Strip (2x2 on Mobile, 4-col on Tablet/Desktop) */}
        <div
          data-reveal=""
          style={{ "--d": 2 } as React.CSSProperties}
          className="mx-auto mt-10 grid max-w-[920px] grid-cols-2 gap-x-5 gap-y-6 sm:mt-14 sm:grid-cols-4 sm:gap-x-8"
        >
          {HERO_ARCHITECTURAL_FACTS.map((item) => (
            <div key={item.metric} className="text-left">
              <div
                aria-hidden="true"
                className="mb-2.5 h-[1.5px] w-11 bg-gradient-to-r from-[#FF7023] via-[#BF4A91] to-[#C823FF]"
              />
              <p className="font-mono text-lg font-semibold tracking-tight text-ink-heading sm:text-xl">
                {item.metric}
              </p>
              <p className="mt-1 text-xs leading-snug text-ink-muted">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Dual-Mode Live HTML/CSS/SVG "Workflow command center" Bento Window */}
        {canvasCfg.showCommandCenter && (
        <div
          data-card-motion-id="home-command-window"
          data-scroll-card=""
          style={{ "--d": 2 } as React.CSSProperties}
          className="of-command-window of-command-window-3d mx-auto mt-10 max-w-[1020px] overflow-hidden rounded-[22px] border border-line-strong/80 bg-surface-elevated/95 text-ink-heading shadow-elevated backdrop-blur-xl sm:mt-14"
        >
          {/* Window Top Chrome Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-muted/80 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF7023]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#BF4A91]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#C823FF]/80" />
              </div>
              <span className="text-xs font-semibold text-ink-heading">
                Workflow command center
              </span>
            </div>

            <span
              title="Illustrative preview metrics — not a client performance claim"
              className="inline-flex items-center rounded-full border border-[#FF7023]/35 bg-[#FF7023]/12 px-2.5 py-0.5 text-[0.68rem] font-semibold text-status-warning"
            >
              Sample data
            </span>
          </div>

          {/* Dashboard Body: Left Sidebar + Right Metrics/Chart/Runs */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Sidebar Navigation (Touch-Friendly Horizontal Scroll on Mobile) */}
            <div
              role="group"
              aria-label="Command center views"
              className="flex gap-1.5 overflow-x-auto border-b border-line bg-surface/70 p-2.5 sm:p-3 md:col-span-3 md:flex-col md:border-b-0 md:border-r md:p-4"
            >
              {COMMAND_VIEWS.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[40px] shrink-0 rounded-xl px-3.5 py-2 text-left text-xs font-medium transition-all sm:text-[0.82rem] ${
                      active
                        ? "bg-accent-subtle font-semibold text-primary shadow-xs"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Main Metrics, SVG Chart & Recent Runs */}
            <div className="space-y-4 p-4 sm:p-6 md:col-span-9">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
                {currentView.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[16px] border border-line bg-surface-card p-4 shadow-card"
                  >
                    <p className="text-xs text-ink-muted">{metric.label}</p>
                    <p className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink-heading sm:text-[1.7rem]">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-status-success">
                      {metric.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom Split: Enquiries Answered SVG Area Chart + Recent Runs */}
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                {/* SVG Area Chart */}
                <div className="rounded-[16px] border border-line bg-surface-card p-4 sm:p-5 lg:col-span-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-heading">
                      {currentView.chartTitle}
                    </p>
                    <span className="text-[0.68rem] text-ink-muted">
                      Last 30 days (sample)
                    </span>
                  </div>

                  <div className="mt-3">
                    <svg
                      viewBox="0 0 560 164"
                      className="h-32 w-full overflow-visible sm:h-40"
                      role="img"
                      aria-label={`${currentView.chartTitle} sample trend chart`}
                    >
                      <defs>
                        <linearGradient
                          id="ofHeroAreaGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#C823FF"
                            stopOpacity="0.34"
                          />
                          <stop
                            offset="55%"
                            stopColor="#FF7023"
                            stopOpacity="0.12"
                          />
                          <stop
                            offset="100%"
                            stopColor="#FF7023"
                            stopOpacity="0"
                          />
                        </linearGradient>
                        <linearGradient
                          id="ofHeroStrokeGrad"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#FF7023" />
                          <stop offset="52%" stopColor="#BF4A91" />
                          <stop offset="100%" stopColor="#C823FF" />
                        </linearGradient>
                      </defs>

                      {/* Subtle horizontal reference lines */}
                      <line
                        x1="18"
                        y1="48"
                        x2="546"
                        y2="48"
                        stroke="var(--of-color-border)"
                        strokeDasharray="3 5"
                      />
                      <line
                        x1="18"
                        y1="98"
                        x2="546"
                        y2="98"
                        stroke="var(--of-color-border)"
                        strokeDasharray="3 5"
                      />
                      <line
                        x1="18"
                        y1="148"
                        x2="546"
                        y2="148"
                        stroke="var(--of-color-border)"
                      />

                      <path
                        d={currentView.chartPathArea}
                        fill="url(#ofHeroAreaGrad)"
                      />
                      <path
                        d={currentView.chartPathLine}
                        fill="none"
                        stroke="url(#ofHeroStrokeGrad)"
                        strokeWidth="2.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Recent Runs Status List */}
                <div className="rounded-[16px] border border-line bg-surface-card p-4 sm:p-5 lg:col-span-4">
                  <p className="text-xs font-semibold text-ink-heading">
                    {currentView.runsTitle}
                  </p>
                  <ul className="mt-3.5 space-y-3">
                    {currentView.runs.map((run) => {
                      const needsApproval = run.status === "Needs approval";
                      return (
                        <li
                          key={run.name}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-ink-body">
                            {run.name}
                          </span>
                          <span
                            className={`shrink-0 font-semibold ${
                              needsApproval
                                ? "text-status-warning"
                                : "text-status-success"
                            }`}
                          >
                            {run.status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
