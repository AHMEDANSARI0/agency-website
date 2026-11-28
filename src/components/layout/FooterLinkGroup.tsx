"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FooterLinkGroupProps {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function FooterLinkGroup({
  id,
  title,
  className = "",
  children,
}: FooterLinkGroupProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <h2 className="hidden font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)] lg:block">
        {title}
      </h2>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((open) => !open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-[var(--of-color-border)] py-2 text-left font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] lg:hidden"
      >
        {title}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={id}
        className={expanded ? "mt-3 lg:mt-4" : "hidden lg:mt-4 lg:block"}
      >
        {children}
      </div>
    </div>
  );
}
