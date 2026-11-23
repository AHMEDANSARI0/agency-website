"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

interface NavigatorConnectionLike {
  saveData?: boolean;
}

/**
 * Hardware-aware, Core-Web-Vitals-safe public motion runtime:
 * 1. Progressive enhancement via html[data-motion="ready"] so SSR/No-JS/Lighthouse never hide [data-reveal] elements.
 * 2. Lenis smooth wheel scrolling enabled only on fine-pointer desktop hardware without Save-Data,
 *    automatically pausing RAF ticks when the browser tab is hidden.
 * 3. RAF-throttled radial spotlight (.spot) tracking restricted to hover-capable devices.
 */
export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      delete document.documentElement.dataset.motion;
      return;
    }

    document.documentElement.dataset.motion = "ready";

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const conn = (navigator as Navigator & { connection?: NavigatorConnectionLike })
      .connection;
    const saveData = Boolean(conn?.saveData);
    const lowCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 2;

    if (isCoarsePointer || saveData || lowCores) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
    });

    let rafId = 0;
    const startLoop = () => {
      if (rafId || document.hidden) return;
      const tick = (time: number) => {
        lenis.raf(time);
        if (!document.hidden) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = 0;
        }
      };
      rafId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    startLoop();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopLoop();
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.in)"
    );

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const vh = window.innerHeight || 800;
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        el.classList.add("in");
      } else {
        revealObserver.observe(el);
      }
    });

    const supportsFineHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    if (!supportsFineHover) {
      return () => revealObserver.disconnect();
    }

    let pendingEvent: PointerEvent | null = null;
    const onPointerMove = (e: PointerEvent) => {
      if (pendingEvent) {
        pendingEvent = e;
        return;
      }
      pendingEvent = e;
      window.requestAnimationFrame(() => {
        const ev = pendingEvent;
        pendingEvent = null;
        if (!ev || !(ev.target instanceof Element)) return;
        const card = ev.target.closest<HTMLElement>(".spot");
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${Math.round(ev.clientX - rect.left)}px`);
        card.style.setProperty("--my", `${Math.round(ev.clientY - rect.top)}px`);
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [pathname]);

  return null;
}
