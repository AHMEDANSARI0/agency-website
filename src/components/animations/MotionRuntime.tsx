"use client";

import { useReducedMotionChange } from "@/components/animations/useReducedMotionChange";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface NavigatorConnectionLike {
  saveData?: boolean;
}

interface LenisLike {
  raf: (time: number) => void;
  scrollTo: (
    target: number | string | HTMLElement,
    options?: {
      offset?: number;
      duration?: number;
      immediate?: boolean;
    }
  ) => void;
  destroy: () => void;
}

/**
 * Phase 3 — Disciplined, Core-Web-Vitals-Safe Motion Runtime:
 * 1. Single `[data-reveal]` scroll-reveal primitive (`<= 16px` offset, `480ms`,
 *    `cubic-bezier(0.22, 1, 0.36, 1)`, `60ms` stagger capped at max 4 items: `0..3`).
 *    Zero `.soale-card` self-reveal, zero pointer spotlight listeners, zero media parallax.
 * 2. Desktop fine-pointer Lenis (`lerp: 0.2`, idle-loaded via `requestIdleCallback`),
 *    with route-change scroll reset, smooth `#hash` `scrollTo`, and `data-lenis-prevent`.
 * 3. Automatic tab-hidden (`html[data-tab-hidden="true"]`) and offscreen
 *    (`[data-offscreen="true"]`) animation pausing.
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
  const motionPreferenceVersion = useReducedMotionChange();
  const pathname = usePathname();
  const [themeMotionRevision, setThemeMotionRevision] = useState(0);
  const lenisRef = useRef<LenisLike | null>(null);
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      setThemeMotionRevision((revision) => revision + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabVisibility = () => {
      if (document.hidden) {
        document.documentElement.dataset.tabHidden = "true";
      } else {
        delete document.documentElement.dataset.tabHidden;
      }
    };
    syncTabVisibility();

    if (isMotionSuppressedByThemeOrOs()) {
      delete document.documentElement.dataset.motion;
      document.addEventListener("visibilitychange", syncTabVisibility);
      return () =>
        document.removeEventListener("visibilitychange", syncTabVisibility);
    }

    document.documentElement.dataset.motion = "ready";

    const isCoarsePointer =
      window.matchMedia("(pointer: coarse)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const conn = (
      navigator as Navigator & { connection?: NavigatorConnectionLike }
    ).connection;
    const saveData = Boolean(conn?.saveData);
    const lowCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 2;

    if (isCoarsePointer || saveData || lowCores) {
      document.addEventListener("visibilitychange", syncTabVisibility);
      return () =>
        document.removeEventListener("visibilitychange", syncTabVisibility);
    }

    let cancelled = false;
    let rafId = 0;

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const startLoop = () => {
      if (rafId || document.hidden || !lenisRef.current) return;
      const tick = (time: number) => {
        if (!lenisRef.current || document.hidden) {
          rafId = 0;
          return;
        }
        lenisRef.current.raf(time);
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      syncTabVisibility();
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Smooth same-page #hash anchor scrolling via Lenis when active
    const onAnchorClick = (e: MouseEvent) => {
      // Keep keyboard-activated links native so the destination receives normal focus.
      if (!lenisRef.current || e.defaultPrevented || e.button !== 0 || e.detail === 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!link) return;
      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref === "#") return;

      let url: URL;
      try {
        url = new URL(rawHref, window.location.href);
      } catch {
        return;
      }
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        url.search !== window.location.search ||
        !url.hash
      ) {
        return;
      }

      let id: string;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
      const targetEl = document.getElementById(id);
      if (!targetEl) return;

      e.preventDefault();
      window.history.pushState(null, "", url.hash);
      lenisRef.current.scrollTo(targetEl, { offset: -88, duration: 0.65 });
    };
    document.addEventListener("click", onAnchorClick);

    const scheduleIdle =
      "requestIdleCallback" in window
        ? (cb: () => void) =>
            (
              window as Window & {
                requestIdleCallback: (
                  fn: () => void,
                  opts?: { timeout: number }
                ) => number;
              }
            ).requestIdleCallback(cb, { timeout: 1500 })
        : (cb: () => void) => window.setTimeout(cb, 180);

    scheduleIdle(() => {
      if (cancelled) return;
      import("lenis")
        .then(({ default: Lenis }) => {
          if (cancelled) return;
          const instance = new Lenis({
            lerp: 0.2,
            smoothWheel: true,
            syncTouch: false,
            prevent: (node: HTMLElement) =>
              Boolean(node?.closest?.("[data-lenis-prevent]")),
          });
          lenisRef.current = instance;
          startLoop();
        })
        .catch(() => {
          // Graceful fallback to native browser scrolling
        });
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", onAnchorClick);
      stopLoop();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [motionPreferenceVersion, themeMotionRevision]);

  // Reset Lenis & window scroll cleanly on route changes (when not navigating to a #hash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (!window.location.hash) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = isMotionSuppressedByThemeOrOs();

    const revealAllImmediately = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.in)")
        .forEach((el) => el.classList.add("in"));
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
            target.classList.add("in");
            revealObserver.unobserve(target);
          }
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
    );

    const animViewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            delete el.dataset.offscreen;
          } else {
            el.dataset.offscreen = "true";
          }
        }
      },
      { rootMargin: "80px 0px 80px 0px", threshold: 0 }
    );

    const registerUnrevealedNodes = () => {
      const vh = window.innerHeight || 800;

      const revealNodes = document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not(.in)"
      );
      revealNodes.forEach((el) => {
        // Auto-stagger sibling [data-reveal] items (capped at max 4 items: 0..3)
        if (!el.style.getPropertyValue("--d")) {
          const parent = el.parentElement;
          if (parent && parent.children.length > 1) {
            const siblings = Array.from(
              parent.querySelectorAll<HTMLElement>(":scope > [data-reveal]")
            );
            const idx = siblings.indexOf(el);
            if (idx > 0) {
              el.style.setProperty("--d", String(Math.min(idx % 4, 3)));
            }
          }
        }

        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.93 && rect.bottom > 0) {
          el.classList.add("in");
        } else {
          revealObserver.observe(el);
        }
      });

      document
        .querySelectorAll<HTMLElement>(
          ".animate-marquee, .animate-signal-flow, [data-anim-viewport]"
        )
        .forEach((el) => animViewportObserver.observe(el));
    };

    registerUnrevealedNodes();
    document.documentElement.dataset.motionRuntime = "ready";

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

    return () => {
      delete document.documentElement.dataset.motionRuntime;
      revealObserver.disconnect();
      animViewportObserver.disconnect();
      domObserver?.disconnect();
      if (mutationRaf) window.cancelAnimationFrame(mutationRaf);
    };
  }, [pathname, motionPreferenceVersion]);

  return null;
}
