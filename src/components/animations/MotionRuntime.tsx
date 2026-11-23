"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function MotionRuntime() {
  const pathname = usePathname();

  // Lenis inertial smooth wheel scrolling on public website routes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
    });

    let rafId = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Re-bind [data-reveal] IntersectionObserver & .spot radial pointer tracker on route changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    const targets = document.querySelectorAll("[data-reveal]:not(.in)");
    targets.forEach((el) => revealObserver.observe(el));

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
        card.style.setProperty("--mx", `${ev.clientX - rect.left}px`);
        card.style.setProperty("--my", `${ev.clientY - rect.top}px`);
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
