"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * GPU-composited top reading-progress hairline + floating Back-to-Top trigger.
 * Uses transform: scaleX() via ref to avoid React re-renders on every scroll frame.
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let lastShow = false;

    const update = () => {
      rafId = 0;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      const shouldShow = scrollTop > 720;
      if (shouldShow !== lastShow) {
        lastShow = shouldShow;
        setShowTopBtn(shouldShow);
      }
    };

    const onScrollOrResize = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  function handleScrollTop() {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent"
      >
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-brand-gradient will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <button
        type="button"
        onClick={handleScrollTop}
        aria-label="Scroll back to top"
        className={`fixed bottom-5 right-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong surface-glass text-ink-heading shadow-card transition-all duration-300 ease-[var(--of-ease-balance)] hover:border-primary/40 hover:text-primary ${
          showTopBtn
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  );
}
