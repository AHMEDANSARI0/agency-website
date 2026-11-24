"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

interface NavigatorConnectionLike {
  saveData?: boolean;
}

/**
 * Hardware-aware, Core-Web-Vitals-safe Soale & OmniFlow Motion Runtime:
 * 1. Progressive enhancement via html[data-motion="ready"] so SSR/No-JS/Lighthouse never hide [data-reveal] or .soale-card elements.
 * 2. Automatic staggered scroll-loading choreography on [data-reveal] AND .soale-card across all routes + dynamic tab/filter switches.
 * 3. Zero-reflow IntersectionObserver-gated GPU parallax on [data-parallax] media layers.
 * 4. Lenis smooth wheel scrolling enabled only on fine-pointer desktop hardware without Save-Data,
 *    automatically pausing RAF ticks when the browser tab is hidden.
 * 5. RAF-throttled radial spotlight (.spot & .soale-card-interactive) tracking on hover-capable devices.
 */
function isMotionSuppressedByThemeOrOs(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  const scaleRaw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--of-motion-scale")
    .trim();
  if (scaleRaw !== "" && Number(scaleRaw) <= 0) {
    return true;
  }
  return false;
}

export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isMotionSuppressedByThemeOrOs()) {
      delete document.documentElement.dataset.motion;
      return;
    }

    document.documentElement.dataset.motion = "ready";

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const conn = (
      navigator as Navigator & { connection?: NavigatorConnectionLike }
    ).connection;
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

    const prefersReduced = isMotionSuppressedByThemeOrOs();

    const revealAllImmediately = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.in)")
        .forEach((el) => el.classList.add("in"));
      document
        .querySelectorAll<HTMLElement>(".soale-card:not(.soale-in)")
        .forEach((el) => el.classList.add("soale-in"));
    };

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      revealAllImmediately();
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.hasAttribute("data-reveal")) {
              target.classList.add("in");
            }
            if (target.classList.contains("soale-card")) {
              target.classList.add("soale-in");
            }
            revealObserver.unobserve(target);
          }
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
    );

    const registerUnrevealedNodes = () => {
      const vh = window.innerHeight || 800;

      const revealNodes = document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not(.in)"
      );
      revealNodes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.93 && rect.bottom > 0) {
          el.classList.add("in");
        } else {
          revealObserver.observe(el);
        }
      });

      const cardNodes = document.querySelectorAll<HTMLElement>(
        ".soale-card:not(.soale-in)"
      );
      cardNodes.forEach((card) => {
        if (!card.style.getPropertyValue("--soale-stagger")) {
          const parent = card.parentElement;
          const grandParent = parent?.parentElement;
          const container =
            parent && parent.children.length > 1 ? parent : grandParent;
          if (container) {
            const siblings = Array.from(
              container.querySelectorAll<HTMLElement>(":scope > .soale-card, :scope > * > .soale-card")
            );
            const idx = siblings.indexOf(card);
            if (idx >= 0) {
              card.style.setProperty("--soale-stagger", String(idx % 4));
            }
          }
        }

        const rect = card.getBoundingClientRect();
        if (rect.top < vh * 0.93 && rect.bottom > 0) {
          card.classList.add("soale-in");
        } else {
          revealObserver.observe(card);
        }
      });
    };

    registerUnrevealedNodes();

    // Watch main content for dynamic filter/tab/pagination card insertions
    const mainEl = document.getElementById("main-content");
    let mutationRaf = 0;
    const domObserver =
      mainEl && typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            if (mutationRaf) return;
            mutationRaf = window.requestAnimationFrame(() => {
              mutationRaf = 0;
              registerUnrevealedNodes();
            });
          })
        : null;

    if (domObserver && mainEl) {
      domObserver.observe(mainEl, { childList: true, subtree: true });
    }

    // Subtle GPU Parallax scoped strictly to visible [data-parallax] nodes
    const visibleParallax = new Set<HTMLElement>();
    const parallaxObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visibleParallax.add(el);
          } else {
            visibleParallax.delete(el);
          }
        }
      },
      { rootMargin: "120px 0px 120px 0px", threshold: 0 }
    );

    document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
      parallaxObserver.observe(el);
    });

    let scrollRaf = 0;
    const updateParallax = () => {
      scrollRaf = 0;
      if (visibleParallax.size === 0 || document.hidden) return;
      const vh = window.innerHeight || 800;
      const halfVh = vh * 0.5;
      visibleParallax.forEach((el) => {
        const speed = Number(el.dataset.parallax || "12");
        const rect = el.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height * 0.5 - halfVh) / vh;
        const clamped = Math.max(-1, Math.min(1, centerOffset));
        const shiftPx = (-clamped * speed).toFixed(2);
        el.style.setProperty("--soale-py", `${shiftPx}px`);
      });
    };

    const onScroll = () => {
      if (!scrollRaf && visibleParallax.size > 0) {
        scrollRaf = window.requestAnimationFrame(updateParallax);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax();

    // Pointer-tracked soft spotlight on hover-capable hardware
    const supportsFineHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

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
        const card = ev.target.closest<HTMLElement>(
          ".spot, .soale-card-interactive"
        );
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${Math.round(ev.clientX - rect.left)}px`);
        card.style.setProperty("--my", `${Math.round(ev.clientY - rect.top)}px`);
      });
    };

    if (supportsFineHover) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    return () => {
      revealObserver.disconnect();
      parallaxObserver.disconnect();
      domObserver?.disconnect();
      if (mutationRaf) window.cancelAnimationFrame(mutationRaf);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      if (supportsFineHover) {
        window.removeEventListener("pointermove", onPointerMove);
      }
    };
  }, [pathname]);

  return null;
}
