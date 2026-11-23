"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Progressive-enhancement scroll reveal wrapper:
 * Renders visible by default during SSR so LCP/crawlers are never blocked,
 * and subtly animates off-screen blocks using GPU translate3d + opacity.
 */
export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hiddenUntilInView, setHiddenUntilInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    if (rect.top < vh * 0.92) {
      // Already in or near initial viewport — keep visible immediately
      return;
    }

    setHiddenUntilInView(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHiddenUntilInView(false);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`transition-[opacity,transform] duration-500 ease-[var(--of-ease-balance)] will-change-[opacity,transform] ${
        hiddenUntilInView
          ? "translate-y-3 opacity-0"
          : "translate-y-0 opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}
