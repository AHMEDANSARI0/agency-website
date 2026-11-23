import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface PageConversionBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function PageConversionBanner({
  eyebrow = "Free 25-Minute Discovery Call",
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel = "Explore Live Demos",
  secondaryHref = "/demos",
}: PageConversionBannerProps) {
  return (
    <section className="bg-surface px-3 pb-12 pt-6 sm:px-5 sm:pb-16">
      <div
        className="on-dark relative mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-white/10 px-6 py-14 text-center shadow-elevated sm:rounded-[28px] sm:px-12 sm:py-18"
        style={{
          background: "var(--of-gradient-cta-banner)",
        }}
      >
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.14em] text-white/90">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>{eyebrow}</span>
        </div>

        <h2 className="t-display mx-auto mt-4 max-w-3xl text-white">{title}</h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-control bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:bg-primary-hover"
          >
            <span>{primaryLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-control border border-slate-600/80 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <span>{secondaryLabel}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
