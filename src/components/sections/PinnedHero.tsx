"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface PinnedHeroProps {
  companyName: string;
  tagline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

function clamp01(val: number): number {
  return Math.min(1, Math.max(0, val));
}

export function PinnedHero({
  companyName,
  tagline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PinnedHeroProps) {
  const trackRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
      return;
    }

    let targetP = 0;
    let currentP = 0;
    let rafId = 0;

    const computeTarget = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      targetP = clamp01(-rect.top / scrollable);
    };

    const onScrollOrResize = () => {
      computeTarget();
      if (!rafId) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    const step = () => {
      const diff = targetP - currentP;
      if (Math.abs(diff) > 0.001) {
        currentP += diff * 0.18;
        setProgress(currentP);
        rafId = window.requestAnimationFrame(step);
      } else {
        currentP = targetP;
        setProgress(currentP);
        rafId = 0;
      }
    };

    computeTarget();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const converge = clamp01(progress / 0.52);
  const firstCopyFade = 1 - clamp01(progress / 0.36);
  const secondCopyFade = clamp01((progress - 0.54) / 0.24);
  const ringOpacity = clamp01((progress - 0.44) / 0.2);

  const arcOffset = (1 - converge) * 72;
  const arcRotate = (1 - converge) * -24;
  const glowScale = 1 + converge * 0.32;

  return (
    <section
      ref={trackRef}
      aria-label="Introduction"
      className={reducedMotion ? "relative px-3 pt-20 sm:px-5 sm:pt-24" : "relative h-[195svh]"}
    >
      <div
        className={
          reducedMotion
            ? "min-h-[620px] py-8"
            : "sticky top-0 flex h-[100svh] min-h-[640px] flex-col pt-16 sm:pt-20 p-2.5 sm:p-4"
        }
      >
        <div className="relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] border border-line bg-surface bg-hero-glow shadow-card sm:rounded-[30px]">
          {/* Subtle Architectural Grid Backdrop */}
          <div
            aria-hidden="true"
            className="bg-grid-subtle pointer-events-none absolute inset-0 opacity-75 [mask-image:radial-gradient(ellipse_at_center,black_38%,transparent_80%)]"
          />

          {/* Ambient Indigo / Violet / Electric Blue Radial Aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[44%] h-[72vmin] w-[72vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
            style={{
              opacity: 0.55 + converge * 0.25,
              transform: `translate(-50%, -50%) scale(${glowScale})`,
              background:
                "radial-gradient(circle, var(--of-spotlight-color, rgba(79, 70, 229, 0.14)), transparent 65%)",
            }}
          />

          {/* Original OmniFlow Architectural Flow Geometry */}
          <svg
            aria-hidden="true"
            viewBox="0 0 160 160"
            className="pointer-events-none absolute left-1/2 top-[44%] h-[min(56vmin,480px)] w-[min(56vmin,480px)] -translate-x-1/2 -translate-y-1/2 overflow-visible will-change-transform"
          >
            <defs>
              <linearGradient id="of-hero-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.48" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.44" />
              </linearGradient>
            </defs>

            <g
              style={{
                transform: `translate(${-arcOffset}px, ${-arcOffset * 0.5}px) rotate(${arcRotate}deg)`,
                transformOrigin: "80px 80px",
              }}
            >
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.9"
                strokeDasharray="180 150"
              />
              <rect
                x="48"
                y="48"
                width="64"
                height="64"
                rx="18"
                fill="none"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.8"
              />
              <circle cx="80" cy="48" r="4" fill="#4F46E5" fillOpacity="0.85" />
            </g>

            <g
              style={{
                transform: `translate(${arcOffset}px, ${arcOffset * 0.5}px) rotate(${-arcRotate}deg)`,
                transformOrigin: "80px 80px",
              }}
            >
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.9"
                strokeDasharray="150 180"
                strokeDashoffset="95"
              />
              <rect
                x="52"
                y="52"
                width="56"
                height="56"
                rx="16"
                fill="none"
                stroke="#2563EB"
                strokeOpacity="0.35"
                strokeWidth="0.8"
                transform="rotate(45 80 80)"
              />
              <circle cx="80" cy="112" r="4" fill="#2563EB" fillOpacity="0.85" />
            </g>

            <g style={{ opacity: reducedMotion ? 0.32 : ringOpacity }}>
              <circle
                cx="80"
                cy="80"
                r="62"
                fill="none"
                stroke="#4F46E5"
                strokeOpacity="0.45"
                strokeWidth="1.1"
              />
              {[22, 34, 46].map((r) => (
                <circle
                  key={r}
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke="#6366F1"
                  strokeOpacity="0.2"
                  strokeWidth="0.6"
                />
              ))}
              <circle
                cx="80"
                cy="80"
                r={reducedMotion ? 5.5 : 5.5 * ringOpacity}
                fill="#4F46E5"
              />
            </g>
          </svg>

          {/* Stage 1 Hero Copy */}
          <div
            className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 text-center will-change-transform"
            style={
              reducedMotion
                ? undefined
                : {
                    opacity: firstCopyFade,
                    transform: `translateY(${(1 - firstCopyFade) * -42}px)`,
                    pointerEvents: firstCopyFade < 0.15 ? "none" : "auto",
                  }
            }
          >
            <Link
              href="/demos"
              className="group mb-7 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-surface/90 py-1.5 pl-1.5 pr-4 text-[0.8rem] font-medium text-ink-body shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-ink-heading"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-primary-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live
              </span>
              <span>Interactive AI workflow demos — test with your own inputs</span>
              <span
                aria-hidden="true"
                className="text-primary transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <h1 className="t-hero text-ink-heading">
              Automate the work.
              <br />
              <span className="shine-adaptive dark:shine">Accelerate the business.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.3vw,1.16rem)] leading-relaxed text-ink-body">
              {companyName} connects deterministic automation and policy-grounded AI to your
              everyday operations — so repetitive handoffs run themselves while your team
              focuses on clients and growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={primaryCtaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[0.94rem] font-medium text-primary-foreground shadow-glow transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
              >
                <span>{primaryCtaLabel}</span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3.5 text-[0.94rem] font-medium text-ink-heading shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-muted active:scale-[0.98]"
              >
                <span>{secondaryCtaLabel}</span>
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-ink-muted">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden="true" />
                <span>Guardrailed execution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                <span>Human approval</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                <span>USA · UK · Canada</span>
              </li>
            </ul>
          </div>

          {/* Stage 2 Scroll-Scrubbed Convergence Statement */}
          {!reducedMotion && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-[11%] z-10 px-5 text-center will-change-transform"
              style={{
                opacity: secondCopyFade,
                transform: `translateY(${(1 - secondCopyFade) * 24}px)`,
              }}
            >
              <p className="font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-semibold leading-tight tracking-tight text-ink-heading">
                Your judgment. <span className="text-primary">Its precision.</span>
              </p>
              <p className="mx-auto mt-3 max-w-xl text-[clamp(0.95rem,1.25vw,1.08rem)] text-ink-body">
                You set the operational rules. {companyName} carries out the repetitive triage,
                drafting, and routing.{" "}
                <span className="font-medium text-ink-heading">
                  Your team approves what matters.
                </span>
              </p>
            </div>
          )}

          {/* Bottom Telemetry Rail */}
          <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between px-8 pb-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted sm:flex">
            <span className="normal-case">{companyName} · 2026</span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-px animate-pulse bg-primary/60" />
              <span>Scroll to explore</span>
            </span>
            <span className="hidden lg:inline">{tagline}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
