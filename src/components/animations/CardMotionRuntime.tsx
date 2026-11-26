"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { normalizeCardMotion, type CardEffect } from "@/features/card-motion/config";
import { findPublicCards } from "@/features/card-motion/catalog";
import { useReducedMotionChange } from "./useReducedMotionChange";

const choices: CardEffect[] = ["fade-up", "from-left", "from-right", "pop"];
export function CardMotionRuntime({ settings }: { settings: unknown }) {
  const pathname = usePathname();
  const preference = useReducedMotionChange();
  useEffect(() => {
    const config = normalizeCardMotion(settings);
    const scale = getComputedStyle(document.documentElement).getPropertyValue("--of-motion-scale").trim();
    if (!config.enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        (scale !== "" && Number(scale) <= 0) || typeof IntersectionObserver === "undefined") return;
    const observed = new WeakSet<Element>();
    const marked = new Set<HTMLElement>();
    const timers = new Set<number>();
    let observer: IntersectionObserver;
    const clear = (el: HTMLElement) => {
      delete el.dataset.cardMotion; delete el.dataset.cardEffect;
      el.style.removeProperty("--card-motion-duration"); marked.delete(el);
    };
    const reveal = (el: HTMLElement) => {
      if (el.dataset.cardMotion !== "waiting") return;
      el.dataset.cardMotion = "done";
      observer.unobserve(el);
      const timer = window.setTimeout(() => { timers.delete(timer); clear(el); }, config.durationMs + 150);
      timers.add(timer);
    };
    try {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    } catch { return; } // Unsupported observer configuration: leave content visible.
    const scan = () => {
      for (const { id, element, duplicate } of findPublicCards(document, pathname)) {
        if (observed.has(element)) continue;
        observed.add(element);
        const effect = (duplicate ? undefined : config.overrides[id]) ?? config.defaultEffect;
        if (effect === "none") continue;
        const rect = element.getBoundingClientRect();
        // Never hide already visible cards or cards above the current viewport.
        if (rect.top < window.innerHeight || rect.bottom <= 0) continue;
        try { observer.observe(element); } catch { continue; }
        element.dataset.cardEffect = effect === "random" ? choices[Math.floor(Math.random() * choices.length)] : effect;
        element.dataset.cardMotion = "waiting";
        element.style.setProperty("--card-motion-duration", `${config.durationMs}ms`);
        marked.add(element);
      }
    };
    scan();
    let pending = 0, scrollFrame = 0;
    const mutation = new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan(); }); });
    const main = document.getElementById("main-content");
    if (main) mutation.observe(main, { childList: true, subtree: true });
    // A conservative fallback when an observer misses an entry, e.g. an unusually tall card.
    const checkVisible = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        for (const el of marked) {
          if (!el.isConnected) { clear(el); continue; }
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) reveal(el);
        }
      });
    };
    window.addEventListener("scroll", checkVisible, { passive: true });
    window.addEventListener("resize", checkVisible, { passive: true });
    return () => {
      observer.disconnect(); mutation.disconnect();
      window.removeEventListener("scroll", checkVisible); window.removeEventListener("resize", checkVisible);
      if (pending) cancelAnimationFrame(pending);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      for (const timer of timers) clearTimeout(timer);
      for (const el of marked) clear(el);
    };
  }, [pathname, settings, preference]);
  return null;
}
