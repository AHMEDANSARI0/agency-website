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
  eyebrow = "Workflow & Bottleneck Review",
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel = "Try Interactive Demos",
  secondaryHref = "/demos",
}: PageConversionBannerProps) {
  return (
    <section className="bg-surface px-3 pb-12 pt-6 sm:px-5 sm:pb-16">
      <div
        className="on-dark relative mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-slate-800 px-6 py-14 text-center shadow-elevated sm:rounded-[28px] sm:px-12 sm:py-18"
        style={{
          background:
            "radial-gradient(110% 95% at 50% 100%, #312E81 0%, #1E1B4B 42%, #0F172A 78%, #090D16 100%)",
        }}
      >
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.14em] text-indigo-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{eyebrow}</span>
        </div>

        <h2 className="t-display mx-auto mt-4 max-w-3xl text-white">{title}</h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-control bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:bg-indigo-500"
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
