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
  const [view, setView] = useState<ServiceViewFilter>("flagship");
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
        eyebrow="Flagship Services"
        title="Three core workflows that remove daily busywork."
        description="Start with the bottleneck costing your team the most time — or browse all 8 automation services. Every build includes human approval gates and 100% client ownership."
        action={
          <SoaleArrowButton href="/services" variant="primary">
            View all services
          </SoaleArrowButton>
        }
      />

      {/* Filter Pills + Carousel Controls (Mobile Scrollable / Wrappable) */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 sm:mt-10">
        <div
          role="tablist"
          aria-label="Filter automation services"
          className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-surface-card p-1.5 shadow-sm sm:rounded-full"
        >
          {[
            { id: "flagship" as const, label: "3 Flagship Workflows" },
            { id: "all" as const, label: `All ${services.length} Services` },
            { id: "pillars" as const, label: "Additional Services (5)" },
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
                className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 ${
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

      {view === "flagship" ? (
        /* Soale Sticky Stacking Scroll Deck on Desktop (`lg:sticky`), Static Clean Flow on Mobile */
        <div className="mt-8 flex flex-col gap-6 sm:gap-8">
          {visibleSlice.map((srv, idx) => (
            <article
              key={srv.id}
              data-reveal="card"
              data-scroll-card="stack"
              style={
                {
                  "--d": Math.min(idx, 3),
                  "--deck-index": idx,
                } as React.CSSProperties
              }
              className="soale-card soale-sticky-deck-card overflow-hidden p-5 sm:p-8 lg:p-9"
            >
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-9">
                {/* Left Narrative Column (.service-grid .7fr) */}
                <div className="flex flex-col justify-between lg:col-span-7">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
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

                    <h3 className="soale-h3 mt-4 text-ink-heading sm:mt-5">
                      <Link
                        href={`/services/${srv.slug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {srv.title}
                      </Link>
                    </h3>

                    <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-ink-body sm:text-[0.95rem]">
                      {srv.shortSummary}
                    </p>

                    <ul className="mt-5 grid grid-cols-1 gap-2.5 border-t border-line pt-4 sm:grid-cols-2">
                      {srv.benefits.slice(0, 4).map((benefit) => (
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

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <SoaleChip>
                        {srv.processSteps.length} Delivery Stages
                      </SoaleChip>
                      <SoaleChip>Human Approval Gates</SoaleChip>
                    </div>
                    <SoaleArrowButton
                      href={`/services/${srv.slug}`}
                      variant="secondary"
                      size="sm"
                    >
                      Explore System
                    </SoaleArrowButton>
                  </div>
                </div>

                {/* Right Live Workflow Stage Blueprint Panel (.service-grid 1fr) */}
                <div className="flex flex-col justify-between rounded-[20px] border border-line bg-surface-muted/75 p-4 sm:p-6 lg:col-span-5">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                    <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Execution Architecture
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] font-semibold text-status-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      100% Client Owned
                    </span>
                  </div>

                  <ol className="my-4 space-y-2.5">
                    {srv.processSteps.slice(0, 4).map((step, sIdx) => (
                      <li
                        key={step.title}
                        className="flex items-start gap-3 rounded-xl border border-line bg-surface-card px-3.5 py-2.5 shadow-2xs"
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7023]/20 via-[#BF4A91]/20 to-[#C823FF]/25 font-mono text-[0.68rem] font-bold text-ink-heading">
                          0{sIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-heading">
                            {step.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[0.73rem] leading-relaxed text-ink-muted">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-center justify-between text-[0.72rem] text-ink-muted">
                    <span>Works with your existing stack</span>
                    <Link
                      href={`/services/${srv.slug}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      Full specification →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* 3-Column Soale Service Cards when browsing All 8 or Additional Pillars */
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
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
                <SoaleChip>
                  {srv.processSteps.length} Delivery Stages
                </SoaleChip>
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
      )}
    </div>
  );
}
