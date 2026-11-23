"use client";

import React, { useEffect, useRef } from "react";

interface LightUpTextProps {
  text: string;
  accentWords?: string[];
  className?: string;
}

export function LightUpText({
  text,
  accentWords = [],
  className = "",
}: LightUpTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".w").forEach((span) => span.classList.add("on"));
      return;
    }

    const words = Array.from(el.querySelectorAll(".w"));
    let ticking = false;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (vh * 0.84 - rect.top) / (rect.height + vh * 0.34))
      );
      const litCount = Math.round(progress * words.length);
      words.forEach((w, idx) => {
        w.classList.toggle("on", idx < litCount);
      });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [text]);

  const tokens = text.split(" ");

  return (
    <p ref={containerRef} className={`lightup ${className}`}>
      {tokens.map((word, idx) => {
        const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isAccent = accentWords.some((a) => clean.includes(a.toLowerCase()));
        return (
          <span key={`${word}-${idx}`} className={`w ${isAccent ? "accent" : ""}`}>
            {word}{" "}
          </span>
        );
      })}
    </p>
  );
}
