"use client";

import React, { useEffect, useRef, useState } from "react";

interface LazyViewportBlockProps {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
  className?: string;
}

type Listener = () => void;
const observedCallbacks = new Map<Element, Listener>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedViewportObserver(rootMargin: string): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = observedCallbacks.get(entry.target);
            if (cb) {
              observedCallbacks.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
              cb();
            }
          }
        }
      },
      { rootMargin }
    );
  }
  return sharedObserver;
}

/**
 * Mounts deferred client-heavy interactive sections (Demo Lab, Process Stepper,
 * Ecosystem Visualizer, Booking Embed) via one shared IntersectionObserver just
 * before they enter the viewport, keeping TBT/INP and initial hydration minimal.
 */
export function LazyViewportBlock({
  children,
  minHeight = 320,
  rootMargin = "360px 0px",
  className = "",
}: LazyViewportBlockProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = hostRef.current;
    if (!el) return;

    const observer = getSharedViewportObserver(rootMargin);
    if (!observer) {
      setMounted(true);
      return;
    }

    observedCallbacks.set(el, () => setMounted(true));
    observer.observe(el);

    return () => {
      observedCallbacks.delete(el);
      observer.unobserve(el);
    };
  }, [mounted, rootMargin]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={!mounted ? { minHeight: `${minHeight}px` } : undefined}
    >
      {mounted ? children : null}
    </div>
  );
}
