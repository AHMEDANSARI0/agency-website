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

    const heroHalo = document.querySelector<HTMLElement>(
      ".soale-hero-circle-wrapper"
    );
    const cmdWindow = document.querySelector<HTMLElement>(
      ".of-command-window-3d"
    );
    const deckCards = Array.from(
      document.querySelectorAll<HTMLElement>(".soale-sticky-deck-card")
    );
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-card]")
    );
    let rafId = 0;

    const updateScrollChoreography = () => {
      rafId = 0;
      const vh = window.innerHeight || 1;
      const scrollY = window.scrollY || 0;
      let heroProgress: string | null = null;
      let commandProgress: string | null = null;
      const deckProgress: Array<[HTMLElement, string]> = [];
      const activeCards: Array<[HTMLElement, boolean]> = [];

      if (heroHalo) {
        heroProgress = Math.min(1, Math.max(0, scrollY / (vh * 0.85))).toFixed(3);
      }
      if (cmdWindow) {
        const rect = cmdWindow.getBoundingClientRect();
        const entered = Math.min(
          1,
          Math.max(0, (vh - rect.top) / (vh * 0.65))
        );
        commandProgress = entered.toFixed(3);
      }

      // 2. Sticky Stacking Deck Cards (desktop >= 1024px)
      if (window.innerWidth >= 1024) {
        for (let i = 0; i < deckCards.length; i++) {
          const current = deckCards[i];
          const next = deckCards[i + 1];
          if (!next) {
            deckProgress.push([current, "0"]);
            continue;
          }
          const curRect = current.getBoundingClientRect();
          const nextRect = next.getBoundingClientRect();
          const overlap = Math.max(0, curRect.bottom - nextRect.top);
          const ratio =
            curRect.height > 0
              ? Math.min(1, Math.max(0, overlap / (curRect.height * 0.75)))
              : 0;
          deckProgress.push([current, ratio.toFixed(3)]);
        }
      }

      // 3. Active Scroll Card Horizon Sweep
      const focusBandTop = vh * 0.16;
      const focusBandBottom = vh * 0.76;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const center = r.top + r.height * 0.35;
        activeCards.push([
          card,
          center >= focusBandTop && center <= focusBandBottom,
        ]);
      });

      // Apply mutations only after all geometry reads to avoid forced layout.
      if (heroHalo && heroProgress !== null &&
          heroHalo.style.getPropertyValue("--hero-scroll") !== heroProgress) {
        heroHalo.style.setProperty("--hero-scroll", heroProgress);
      }
      if (cmdWindow && commandProgress !== null &&
          cmdWindow.style.getPropertyValue("--hero-card-progress") !== commandProgress) {
        cmdWindow.style.setProperty("--hero-card-progress", commandProgress);
      }
      for (const [card, progress] of deckProgress) {
        if (card.style.getPropertyValue("--deck-covered") !== progress) {
          card.style.setProperty("--deck-covered", progress);
        }
      }
      for (const [card, isActive] of activeCards) {
        if (isActive && card.dataset.cardActive !== "true") {
          card.dataset.cardActive = "true";
        } else if (!isActive && card.dataset.cardActive === "true") {
          delete card.dataset.cardActive;
        }
      }
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
