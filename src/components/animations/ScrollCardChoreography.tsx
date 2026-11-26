"use client";

import { useReducedMotionChange } from "@/components/animations/useReducedMotionChange";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Drives Soale-style scroll-linked hero halo drift, 3D command-card settle,
 * sticky card deck depth (`--deck-covered`), and `[data-scroll-card]` active glow
 * using passive scroll + single-RAF batching. Automatically disabled when
 * `prefers-reduced-motion: reduce` is active.
 */
export function ScrollCardChoreography() {
  const motionPreferenceVersion = useReducedMotionChange();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;

    const updateScrollChoreography = () => {
      rafId = 0;
      const vh = window.innerHeight || 1;
      const scrollY = window.scrollY || 0;

      // 1. Hero Orbital Halo Ring & Command Center 3D settle
      const heroHalo = document.querySelector<HTMLElement>(
        ".soale-hero-circle-wrapper"
      );
      if (heroHalo) {
        const progress = Math.min(1, Math.max(0, scrollY / (vh * 0.85)));
        heroHalo.style.setProperty("--hero-scroll", progress.toFixed(3));
      }

      const cmdWindow = document.querySelector<HTMLElement>(
        ".of-command-window-3d"
      );
      if (cmdWindow) {
        const rect = cmdWindow.getBoundingClientRect();
        const entered = Math.min(
          1,
          Math.max(0, (vh - rect.top) / (vh * 0.65))
        );
        cmdWindow.style.setProperty(
          "--hero-card-progress",
          entered.toFixed(3)
        );
      }

      // 2. Sticky Stacking Deck Cards (desktop >= 1024px)
      if (window.innerWidth >= 1024) {
        const deckCards = Array.from(
          document.querySelectorAll<HTMLElement>(".soale-sticky-deck-card")
        );
        for (let i = 0; i < deckCards.length; i++) {
          const current = deckCards[i];
          const next = deckCards[i + 1];
          if (!next) {
            current.style.setProperty("--deck-covered", "0");
            continue;
          }
          const curRect = current.getBoundingClientRect();
          const nextRect = next.getBoundingClientRect();
          const overlap = Math.max(0, curRect.bottom - nextRect.top);
          const ratio =
            curRect.height > 0
              ? Math.min(1, Math.max(0, overlap / (curRect.height * 0.75)))
              : 0;
          current.style.setProperty("--deck-covered", ratio.toFixed(3));
        }
      }

      // 3. Active Scroll Card Horizon Sweep
      const cards = document.querySelectorAll<HTMLElement>("[data-scroll-card]");
      const focusBandTop = vh * 0.16;
      const focusBandBottom = vh * 0.76;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const center = r.top + r.height * 0.35;
        const isActive = center >= focusBandTop && center <= focusBandBottom;
        if (isActive) {
          card.dataset.cardActive = "true";
        } else {
          delete card.dataset.cardActive;
        }
      });
    };

    const onScrollOrResize = () => {
      if (rafId || document.hidden) return;
      rafId = window.requestAnimationFrame(updateScrollChoreography);
    };

    updateScrollChoreography();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [pathname, motionPreferenceVersion]);

  return null;
}
