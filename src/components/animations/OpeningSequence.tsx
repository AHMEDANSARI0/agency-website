"use client";

import React, { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "omniflow_intro_seen_v1";

interface OpeningSequenceProps {
  brandName: string;
  tagline: string;
}

export function OpeningSequence({ brandName, tagline }: OpeningSequenceProps) {
  const [dismissed, setDismissed] = useState(true);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  const finishIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage errors
    }
    setPhase(4);
    window.setTimeout(() => {
      setDismissed(true);
    }, 680);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      return;
    }

    setDismissed(false);
    setPhase(0);

    const t1 = window.setTimeout(() => setPhase(1), 180);
    const t2 = window.setTimeout(() => setPhase(2), 1650);
    const t3 = window.setTimeout(() => setPhase(3), 3200);
    const t4 = window.setTimeout(() => finishIntro(), 4900);

    const onKeyDown = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) {
        finishIntro();
      }
    };
    const onSkipGesture = () => finishIntro();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onSkipGesture, { passive: true });
    window.addEventListener("touchmove", onSkipGesture, { passive: true });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onSkipGesture);
      window.removeEventListener("touchmove", onSkipGesture);
    };
  }, [finishIntro]);

  if (dismissed) return null;

  const isClosing = phase === 4;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${brandName} opening sequence`}
      onClick={finishIntro}
      className="on-dark fixed inset-0 z-[100] select-none overflow-hidden"
    >
      {/* Top & Bottom Obsidian Curtains */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 bg-[#0B0908] transition-transform duration-700 ease-[var(--of-ease-balance)] ${
          isClosing ? "-translate-y-full" : "translate-y-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 bg-[#0B0908] transition-transform duration-700 ease-[var(--of-ease-balance)] ${
          isClosing ? "translate-y-full" : "translate-y-0"
        }`}
      />

      {/* Stage Content */}
      <div
        className={`grain absolute inset-0 transition-opacity duration-500 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background:
            "radial-gradient(85% 70% at 50% 45%, #9C240E 0%, #571309 40%, #180B07 72%, #0B0908 100%)",
        }}
      >
        {/* Center Original OmniFlow Twin-Orbit Geometry (No Yin-Yang / No copied logo) */}
        <div className="absolute inset-0 grid place-items-center">
          <div
            className={`relative transition-all duration-1000 ease-[var(--of-ease-balance)] ${
              phase >= 3 ? "-translate-y-14 scale-75" : "scale-100"
            }`}
          >
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{
                background: "radial-gradient(circle, rgba(240,106,42,0.42), transparent 65%)",
              }}
            />
            <svg
              viewBox="0 0 140 140"
              className="relative h-[min(46vmin,300px)] w-[min(46vmin,300px)] overflow-visible"
              aria-hidden="true"
            >
              {/* Outer Calibration Ring */}
              <circle
                cx="70"
                cy="70"
                r="56"
                fill="none"
                stroke="#F2EADB"
                strokeOpacity="0.24"
                strokeWidth="1"
              />
              {/* Twin Opposing Kinetic Arcs */}
              <path
                d="M 70 14 A 56 56 0 0 1 126 70"
                fill="none"
                stroke="#F2EADB"
                strokeWidth="1.8"
                strokeLinecap="round"
                className=" origin-center transition-transform duration-1000 ease-[var(--of-ease-balance)]"
                style={{
                  transform: phase >= 2 ? "rotate(90deg)" : "rotate(0deg)",
                  transformOrigin: "70px 70px",
                }}
              />
              <path
                d="M 70 126 A 56 56 0 0 1 14 70"
                fill="none"
                stroke="#F06A2A"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="transition-transform duration-1000 ease-[var(--of-ease-balance)]"
                style={{
                  transform: phase >= 2 ? "rotate(90deg)" : "rotate(0deg)",
                  transformOrigin: "70px 70px",
                }}
              />
              {/* Inner Precision Diamond / Flow Axis */}
              <rect
                x="44"
                y="44"
                width="52"
                height="52"
                rx="14"
                fill="none"
                stroke="#E6A92E"
                strokeOpacity={phase >= 2 ? "0.7" : "0.25"}
                strokeWidth="1"
                style={{
                  transform: phase >= 2 ? "rotate(45deg)" : "rotate(12deg)",
                  transformOrigin: "70px 70px",
                  transition: "all 1s var(--of-ease-balance)",
                }}
              />
              {/* Core Vermilion Pulse Node */}
              <circle
                cx="70"
                cy="70"
                r={phase >= 2 ? "8" : "4"}
                fill="#D23A1F"
                style={{ transition: "all 0.6s var(--of-ease-balance)" }}
              />
            </svg>
          </div>
        </div>

        {/* Phase 1 Caption */}
        <p
          className={`absolute inset-x-0 bottom-[22%] px-6 text-center font-mono text-sm tracking-wide text-[#F2EADB] transition-all duration-500 sm:text-base ${
            phase === 1 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          Every reliable workflow begins with human direction.
        </p>

        {/* Phase 2 Dual Captions */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center justify-between gap-6 px-8 transition-all duration-500 lg:flex-row lg:px-[7vw] ${
            phase === 2 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-2xl italic tracking-tight text-[#F2EADB] sm:text-4xl">
            Human judgment.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#E6A92E] sm:text-sm">
            Machine precision.
          </p>
        </div>

        {/* Phase 3 Brand Reveal */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-[56%] px-6 text-center transition-all duration-700 ease-[var(--of-ease-balance)] ${
            phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="text-4xl font-medium tracking-tight text-[#F2EADB] sm:text-6xl">
            {brandName}
            <span className="text-[#D23A1F]">.</span>
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#CFC4B4]">
            {tagline}
          </p>
        </div>

        {/* Progress Bar & Skip Button */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-6 pb-6 sm:px-10">
          <div className="h-px flex-1 bg-[#F2EADB]/15">
            <div
              className="h-px origin-left bg-[#D23A1F] transition-transform duration-[4600ms] ease-linear"
              style={{ transform: phase >= 1 ? "scaleX(1)" : "scaleX(0)" }}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finishIntro();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#F2EADB]/25 bg-[#050404]/70 px-4 py-2 text-xs font-medium text-[#F2EADB] backdrop-blur transition-colors hover:border-[#F2EADB]/50"
          >
            <span>Skip intro</span>
            <span className="font-mono text-[11px] text-[#B9AE9F]">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
}
