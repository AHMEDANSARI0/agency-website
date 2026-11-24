"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { ServiceItem } from "@/types/content";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleSectionHeader,
} from "@/components/ui/soale";

interface SoaleServicesShowcaseProps {
  services: ServiceItem[];
}

type ServiceViewFilter = "all" | "flagship" | "pillars";

export function SoaleServicesShowcase({
  services,
}: SoaleServicesShowcaseProps) {
  const [view, setView] = useState<ServiceViewFilter>("all");
  const [pageIndex, setPageIndex] = useState(0);

  const filtered = useMemo(() => {
    const sorted = [...services].sort((a, b) => a.order - b.order);
    if (view === "flagship") return sorted.filter((s) => s.isFlagshipPriority);
    if (view === "pillars") return sorted.filter((s) => !s.isFlagshipPriority);
    return sorted;
  }, [services, view]);

  const pageSize = 3;
  const maxPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const clampedPage = Math.min(pageIndex, maxPage);
  const visibleSlice =
    view === "flagship"
      ? filtered
      : filtered.slice(
          clampedPage * pageSize,
          clampedPage * pageSize + pageSize
        );

  return (
    <div>
      <SoaleSectionHeader
        align="split"
        eyebrow="8 Specialized Automation Systems"
        title="Practical AI & workflow architecture built around measurable reliability."
        description="Start with our 3 flagship operational systems or explore all 8 practice areas — every engagement includes deterministic guardrails and 100% client ownership."
        action={
          <SoaleArrowButton href="/services" variant="primary">
            View All 8 Services
          </SoaleArrowButton>
        }
      />

      {/* Filter Pills + Carousel Controls */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter automation services"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-line bg-surface-card p-1.5 shadow-sm"
        >
          {[
            { id: "all" as const, label: `All ${services.length} Systems` },
            { id: "flagship" as const, label: "Flagship Priority (3)" },
            { id: "pillars" as const, label: "Practice Pillars (5)" },
          ].map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setView(tab.id);
                  setPageIndex(0);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-ink-body hover:text-ink-heading"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {view !== "flagship" && maxPage > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-ink-muted">
              0{clampedPage + 1} / 0{maxPage + 1}
            </span>
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              aria-label="Previous services group"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-card text-ink-heading transition-colors hover:border-primary disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.min(maxPage, p + 1))}
              disabled={clampedPage >= maxPage}
              aria-label="Next services group"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-card text-ink-heading transition-colors hover:border-primary disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3-Column Soale 24px Service Showcase Cards with Staggered Card Loading */}
      <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-3">
        {visibleSlice.map((srv, idx) => (
          <SoaleCard
            key={`${view}-${clampedPage}-${srv.id}`}
            as="article"
            interactive
            staggerIndex={idx}
            className="soale-filter-enter flex flex-col justify-between p-6 sm:p-7"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  0{srv.order} · {srv.categoryName}
                </span>
                {srv.isFlagshipPriority && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 font-mono text-[0.68rem] font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    {srv.badgeLabel}
                  </span>
                )}
              </div>

              <h3 className="soale-h3 mt-5 text-ink-heading">
                <Link
                  href={`/services/${srv.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {srv.title}
                </Link>
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-ink-body">
                {srv.shortSummary}
              </p>

              {/* Key Verified Benefits */}
              <ul className="mt-5 space-y-2 border-t border-line pt-4">
                {srv.benefits.slice(0, 3).map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-body sm:text-[0.83rem]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <SoaleChip>{srv.processSteps.length} Delivery Stages</SoaleChip>
              <SoaleArrowButton
                href={`/services/${srv.slug}`}
                variant="outline"
                size="sm"
              >
                Explore System
              </SoaleArrowButton>
            </div>
          </SoaleCard>
        ))}
      </div>
    </div>
  );
}
