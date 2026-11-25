"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers, ShieldCheck, Workflow } from "lucide-react";
import type { CaseStudyItem, WorkVerificationType } from "@/types/content";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
} from "@/components/ui/soale";

const FILTERS: Array<{ value: "all" | WorkVerificationType; label: string }> = [
  { value: "all", label: "All Work & Blueprints" },
  { value: "verified_client", label: "Verified Client Work" },
  { value: "internal_experiment", label: "Internal Prototypes" },
  { value: "concept_demo", label: "Concept Architectures" },
];

export function WorkFilterGrid({ items }: { items: CaseStudyItem[] }) {
  const [filter, setFilter] = useState<"all" | WorkVerificationType>("all");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered =
    filter === "all" ? items : items.filter((item) => item.workType === filter);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + delta + FILTERS.length) % FILTERS.length;
    const nextFilter = FILTERS[nextIdx];
    if (nextFilter) {
      setFilter(nextFilter.value);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div>
      {/* Signature Soale Top-Bordered Uppercase Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter portfolio by verification type"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
      >
        {FILTERS.map((f, idx) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              tabIndex={active ? 0 : -1}
              aria-selected={active}
              data-active={active ? "true" : "false"}
              onClick={() => setFilter(f.value)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className="soale-work-tab text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <SoaleCard className="soale-filter-enter mt-10 p-10 text-center">
          <p className="text-base font-semibold text-ink-heading">
            No items currently published in this category.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            OmniFlow publishes client engagements strictly after formal written
            client authorization is granted.
          </p>
        </SoaleCard>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {filtered.map((item, idx) => {
            const meta = WORK_TYPE_META[item.workType];
            const previewSteps = item.automatedWorkflowAfter.slice(0, 3);

            return (
              <SoaleCard
                key={`${filter}-${item.id}`}
                as="article"
                interactive
                staggerIndex={idx}
                className="soale-filter-enter group flex flex-col justify-between p-5 sm:p-6"
              >
                <div>
                  {/* 22px Soale Media Frame + Parallax Nodes + Frosted Blur Hover CTA */}
                  <div className="soale-media-frame aspect-[16/10] border border-line">
                    <div className="soale-media-zoom relative flex h-full w-full flex-col justify-between bg-gradient-to-br from-accent-subtle via-surface to-surface-muted p-5 sm:p-6">
                      <div
                        aria-hidden="true"
                        className="architectural-grid-perspective pointer-events-none absolute inset-0 opacity-55"
                      />

                      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-heading">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          {meta.label}
                        </span>
                        <span className="rounded-full border border-line bg-surface/85 px-3 py-1 font-mono text-[0.68rem] text-ink-muted">
                          0{idx + 1} · {item.industry}
                        </span>
                      </div>

                      <div className="relative z-10 my-auto space-y-2 py-3">
                        {previewSteps.map((stepText, stepIdx) => (
                          <div
                            key={stepIdx}
                            className="flex items-center gap-3 rounded-2xl border border-line/90 bg-surface/92 px-3.5 py-2 shadow-sm"
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-[0.65rem] font-semibold text-primary-foreground">
                              0{stepIdx + 1}
                            </span>
                            <span className="truncate text-xs font-medium text-ink-heading">
                              {stepText}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="relative z-10 flex items-center justify-between gap-2 font-mono text-[0.68rem] text-ink-muted">
                        <span className="inline-flex items-center gap-1.5 uppercase tracking-wider">
                          <Workflow className="h-3.5 w-3.5 text-primary" />
                          {item.businessType}
                        </span>
                        {item.projectDuration && (
                          <span>{item.projectDuration}</span>
                        )}
                      </div>
                    </div>

                    <div className="soale-frosted-overlay">
                      <div className="soale-frosted-cta">
                        <SoaleArrowButton
                          href={`/case-studies/${item.slug}`}
                          variant="primary"
                        >
                          Inspect Blueprint
                        </SoaleArrowButton>
                      </div>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div className="mt-6 flex items-start justify-between gap-4">
                    <h2 className="soale-h3 text-ink-heading">
                      <Link
                        href={`/case-studies/${item.slug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    </h2>
                    <Link
                      href={`/case-studies/${item.slug}`}
                      aria-label={`Open ${item.title}`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-line bg-surface-muted text-ink-heading transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {item.problemSummary}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Layers className="mr-0.5 h-3.5 w-3.5 text-primary" />
                    {item.technologiesUsed.map((tech) => (
                      <SoaleChip key={tech}>{tech}</SoaleChip>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs">
                  <span className="text-ink-muted">{meta.disclosure}</span>
                </div>
              </SoaleCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
