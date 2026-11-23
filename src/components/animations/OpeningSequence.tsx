"use client";

import React, { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "omniflow_intro_seen_v3";

interface OpeningSequenceProps {
  brandName: string;
  tagline: string;
}

/**
 * Core-Web-Vitals-safe, non-blocking top architectural entrance (~900ms, once per session).
 * Never covers the Hero H1 or blocks pointer interaction — keeping LCP at 0ms penalty and CLS = 0.
 */
export function OpeningSequence({ brandName, tagline }: OpeningSequenceProps) {
  const [dismissed, setDismissed] = useState(true);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  const finishIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage errors
    }
    setPhase(2);
    window.setTimeout(() => {
      setDismissed(true);
    }, 260);
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

    const t1 = window.setTimeout(() => setPhase(1), 40);
    const t2 = window.setTimeout(() => finishIntro(), 920);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finishIntro();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finishIntro]);

  if (dismissed) return null;

  const isClosing = phase === 2;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[90] transition-opacity duration-250 ease-[var(--of-ease-balance)] ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Top 2px GPU-composited architectural sweep */}
      <div className="h-[2.5px] w-full overflow-hidden bg-transparent">
        <div
          className="h-full w-full origin-left bg-brand-gradient transition-transform duration-[860ms] ease-out will-change-transform"
          style={{ transform: phase >= 1 ? "scaleX(1)" : "scaleX(0)" }}
        />
      </div>

      {/* Subtle floating non-blocking status pill below navbar */}
      <div className="mx-auto mt-20 flex max-w-fit justify-center px-4">
        <div
          className={`pointer-events-auto inline-flex items-center gap-2.5 rounded-full border border-line surface-glass px-3.5 py-1.5 text-xs shadow-card transition-all duration-300 ease-[var(--of-ease-balance)] ${
            phase >= 1
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-semibold text-ink-heading">{brandName}</span>
          <span className="hidden text-ink-muted sm:inline">· {tagline}</span>
        </div>
      </div>
    </div>
  );
}
