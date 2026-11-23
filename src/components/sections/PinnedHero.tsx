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

    const animate = () => {
      computeTarget();
      const diff = targetP - currentP;
      if (Math.abs(diff) > 0.0008) {
        currentP += diff * 0.16;
        setProgress(currentP);
      } else if (currentP !== targetP) {
        currentP = targetP;
        setProgress(currentP);
      }
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  // Choreography math across scroll progress [0..1]
  const converge = clamp01(progress / 0.52); // 0 -> 1 during first half of scroll
  const firstCopyFade = 1 - clamp01(progress / 0.36);
  const secondCopyFade = clamp01((progress - 0.54) / 0.24);
  const ringOpacity = clamp01((progress - 0.44) / 0.2);

  const arcOffset = (1 - converge) * 76;
  const arcRotate = (1 - converge) * -26;
  const glowScale = 1 + converge * 0.38;

  return (
    <section
      ref={trackRef}
      aria-label="Introduction"
      className={reducedMotion ? "relative p-2 sm:p-3" : "relative h-[205svh]"}
    >
      <div
        className={
          reducedMotion
            ? "h-[92svh] min-h-[620px]"
            : "sticky top-0 h-[100svh] min-h-[620px] p-2 sm:p-3"
        }
      >
        <div
          className="on-dark grain relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[22px] sm:rounded-[28px]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, #B52A14 0%, #6D170B 38%, #1A0C08 72%, #0B0908 100%)",
          }}
        >
          {/* Ambient Ember Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[44%] h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
            style={{
              opacity: 0.48 + converge * 0.36,
              transform: `translate(-50%, -50%) scale(${glowScale})`,
              background:
                "radial-gradient(circle, rgba(240, 106, 42, 0.55), transparent 62%)",
            }}
          />

          {/* Original OmniFlow Twin-Orbit Precision Geometry (Zero copied Po logo) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 160 160"
            className="pointer-events-none absolute left-1/2 top-[44%] h-[min(58vmin,500px)] w-[min(58vmin,500px)] -translate-x-1/2 -translate-y-1/2 overflow-visible will-change-transform"
          >
            <defs>
              <linearGradient id="of-hero-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFB27A" stopOpacity="0.88" />
                <stop offset="50%" stopColor="#F06A2A" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#FFB27A" stopOpacity="0.72" />
              </linearGradient>
            </defs>

            {/* Left / Upper Human-Strategy Orbit */}
            <g
              style={{
                transform: `translate(${-arcOffset}px, ${-arcOffset * 0.52}px) rotate(${arcRotate}deg)`,
                transformOrigin: "80px 80px",
              }}
            >
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.8"
                strokeDasharray="180 150"
              />
              <rect
                x="48"
                y="48"
                width="64"
                height="64"
                rx="18"
                fill="#120A07"
                fillOpacity="0.55"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.7"
              />
              <circle cx="80" cy="48" r="4.5" fill="#F2EADB" fillOpacity="0.85" />
            </g>

            {/* Right / Lower Machine-Execution Orbit */}
            <g
              style={{
                transform: `translate(${arcOffset}px, ${arcOffset * 0.52}px) rotate(${-arcRotate}deg)`,
                transformOrigin: "80px 80px",
              }}
            >
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="url(#of-hero-rim)"
                strokeWidth="0.8"
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
                stroke="#E6A92E"
                strokeOpacity="0.55"
                strokeWidth="0.75"
                transform="rotate(45 80 80)"
              />
              <circle cx="80" cy="112" r="4.5" fill="#F06A2A" />
            </g>

            {/* Converged Precision Ring & Concentric Harmonic Ripples */}
            <g style={{ opacity: reducedMotion ? 0.35 : ringOpacity }}>
              <circle
                cx="80"
                cy="80"
                r="62"
                fill="none"
                stroke="#F2EADB"
                strokeOpacity="0.65"
                strokeWidth="1.2"
              />
              {[22, 34, 46].map((r) => (
                <circle
                  key={r}
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke="#E6A92E"
                  strokeOpacity="0.24"
                  strokeWidth="0.5"
                />
              ))}
              <circle
                cx="80"
                cy="80"
                r={reducedMotion ? 6 : 6 * ringOpacity}
                fill="#D23A1F"
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
                    transform: `translateY(${(1 - firstCopyFade) * -48}px)`,
                    pointerEvents: firstCopyFade < 0.15 ? "none" : "auto",
                  }
            }
          >
            <Link
              href="/demos"
              className="group mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#F2EADB]/18 bg-black/25 py-1.5 pl-1.5 pr-4 text-[0.8rem] text-[#F2EADB]/85 backdrop-blur transition-colors hover:border-[#F2EADB]/40 hover:text-[#F2EADB]"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-[#D23A1F] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-wider text-[#F2EADB]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F2EADB] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F2EADB]" />
                </span>
                Live
              </span>
              <span>Interactive AI workflow demos — test with your own inputs</span>
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <h1 className="t-hero text-[#F2EADB] [text-shadow:0_0_40px_rgba(255,200,170,0.3)]">
              Automate the work.
              <br />
              <em className="shine">Accelerate the business.</em>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-[clamp(1rem,1.35vw,1.18rem)] font-light leading-relaxed text-[#F2EADB]/90">
              {companyName} connects deterministic automation and policy-grounded AI to your
              everyday operations — so repetitive handoffs run themselves while your team
              focuses on clients and growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={secondaryCtaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-[#F2EADB] px-6 py-3.5 text-[0.94rem] font-medium text-[#0B0908] transition-all duration-200 hover:bg-[#FFE3CC] active:scale-[0.97]"
              >
                <span>{secondaryCtaLabel}</span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              <Link
                href={primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#F2EADB]/30 bg-black/15 px-6 py-3.5 text-[0.94rem] font-medium text-[#F2EADB] backdrop-blur transition-colors hover:bg-[#F2EADB]/10 active:scale-[0.97]"
              >
                <span>{primaryCtaLabel}</span>
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#F2EADB]/80">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3C8F6A]" aria-hidden="true" />
                <span>Guardrailed execution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E6A92E]" aria-hidden="true" />
                <span>Human approval</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F06A2A]" aria-hidden="true" />
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
                transform: `translateY(${(1 - secondCopyFade) * 26}px)`,
              }}
            >
              <p className="text-[clamp(1.9rem,4.4vw,3.5rem)] font-medium leading-tight tracking-tight text-[#F2EADB]">
                Your judgment. <em className="text-[#F06A2A]">Its precision.</em>
              </p>
              <p className="mx-auto mt-3 max-w-xl text-[clamp(0.95rem,1.35vw,1.08rem)] font-light text-[#F2EADB]/85">
                You set the operational rules. {companyName} carries out the repetitive triage,
                drafting, and routing.{" "}
                <span className="font-normal text-[#F2EADB]">
                  Your team approves what matters.
                </span>
              </p>
            </div>
          )}

          {/* Bottom Telemetry Rail */}
          <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between px-8 pb-5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[#F2EADB]/70 sm:flex">
            <span className="normal-case">{companyName} · 2026</span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-5 w-px animate-pulse bg-[#F2EADB]/50" />
              <span>Scroll to explore</span>
            </span>
            <span className="hidden lg:inline">{tagline}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
