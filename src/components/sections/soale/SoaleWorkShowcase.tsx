"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers, ShieldCheck, Workflow } from "lucide-react";
import type { CaseStudyItem } from "@/types/content";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleSectionHeader,
} from "@/components/ui/soale";

interface SoaleWorkShowcaseProps {
  caseStudies: CaseStudyItem[];
}

type WorkCategoryFilter = "all" | "lead" | "support" | "workflow";

const WORK_TABS: Array<{ id: WorkCategoryFilter; label: string }> = [
  { id: "all", label: "All Systems" },
  { id: "lead", label: "Lead & CRM Systems" },
  { id: "support", label: "AI Support & Triage" },
  { id: "workflow", label: "Workflow & Ops" },
];

function matchesWorkFilter(
  study: CaseStudyItem,
  filter: WorkCategoryFilter
): boolean {
  if (filter === "all") return true;
  const slugs = study.relatedServiceSlugs.join(" ").toLowerCase();
  const text = `${study.title} ${study.industry} ${study.proposedAutomation}`.toLowerCase();
  if (filter === "lead") {
    return (
      slugs.includes("lead") ||
      slugs.includes("sales") ||
      text.includes("lead") ||
      text.includes("crm")
    );
  }
  if (filter === "support") {
    return (
      slugs.includes("support") ||
      slugs.includes("customer") ||
      text.includes("support") ||
      text.includes("triage")
    );
  }
  return (
    slugs.includes("workflow") ||
    slugs.includes("operations") ||
    slugs.includes("analytics") ||
    slugs.includes("custom") ||
    text.includes("workflow") ||
    text.includes("onboarding")
  );
}

export function SoaleWorkShowcase({ caseStudies }: SoaleWorkShowcaseProps) {
  const [activeTab, setActiveTab] = useState<WorkCategoryFilter>("all");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = useMemo(() => {
    return caseStudies.filter((cs) => matchesWorkFilter(cs, activeTab));
  }, [caseStudies, activeTab]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + delta + WORK_TABS.length) % WORK_TABS.length;
    const nextTab = WORK_TABS[nextIdx];
    if (nextTab) {
      setActiveTab(nextTab.id);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div>
      <SoaleSectionHeader
        align="split"
        eyebrow="Selected Blueprints & Work"
        title="Engineered workflow architectures with transparent verification."
        description="Every engagement and reference blueprint is badged honestly — inspect the exact manual bottleneck, deterministic pipeline, and verified operational outcome."
        action={
          <SoaleArrowButton href="/case-studies" variant="surface">
            Explore All Case Studies
          </SoaleArrowButton>
        }
      />

      {/* Signature Soale Top-Bordered Uppercase Category Filter Tabs */}
      <div
        role="group"
        aria-label="Filter work blueprints by category"
        className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
      >
        {WORK_TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              aria-pressed={isActive}
              data-active={isActive ? "true" : "false"}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className="soale-work-tab text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p role="status" className="mt-8 text-sm text-ink-muted">No published blueprints in this category yet. Select another category to explore.</p>
      )}

      {/* 2-Column Soale Portfolio Cards with Staggered Tab Loading & GPU Parallax */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {filtered.slice(0, 4).map((study, idx) => {
          const meta = WORK_TYPE_META[study.workType];
          const primarySteps = study.automatedWorkflowAfter.slice(0, 3);

          return (
            <SoaleCard motionId={"components-sections-soale-SoaleWorkShowcase.tsx:1" + ":" + String(study.id)}
              key={`${activeTab}-${study.id}`}
              as="article"
              interactive
              staggerIndex={idx}
              className="soale-filter-enter group flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                {/* 22px Soale Media Frame + Parallax Pipeline Canvas + Frosted Hover Overlay */}
                <div className="soale-media-frame aspect-[16/10] border border-line">
                  <div className="soale-media-zoom relative flex h-full w-full flex-col justify-between bg-gradient-to-br from-accent-subtle via-surface to-surface-muted p-5 sm:p-7">
                    <div
                      aria-hidden="true"
                      className="architectural-grid-perspective pointer-events-none absolute inset-0 opacity-55"
                    />

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-heading">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {meta.label}
                      </span>
                      <span className="rounded-full border border-line bg-surface/85 px-3 py-1 font-mono text-[0.68rem] text-ink-muted">
                        0{idx + 1} · {study.industry}
                      </span>
                    </div>

                    {/* Pipeline Preview Nodes */}
                    <div className="relative z-10 my-auto space-y-2 py-3">
                      {primarySteps.map((stepText, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="flex items-center gap-3 rounded-2xl border border-line/90 bg-surface px-3.5 py-2.5 shadow-sm"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-[0.66rem] font-semibold text-primary-foreground">
                            0{stepIdx + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-ink-heading sm:text-[0.82rem]">
                            {stepText}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wider">
                        <Workflow className="h-3.5 w-3.5 text-primary" />
                        {study.businessType}
                      </span>
                      {study.projectDuration && (
                        <span className="font-mono text-[0.68rem]">
                          {study.projectDuration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Signature Soale Frosted Blur Hover Overlay + Scaling CTA */}
                  <div className="soale-frosted-overlay">
                    <div className="soale-frosted-cta">
                      <SoaleArrowButton
                        href={`/case-studies/${study.slug}`}
                        variant="primary"
                      >
                        Inspect Blueprint
                      </SoaleArrowButton>
                    </div>
                  </div>
                </div>

                {/* Card Copy Below Media Frame */}
                <div className="mt-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="soale-h3 text-ink-heading">
                      <Link
                        href={`/case-studies/${study.slug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {study.title}
                      </Link>
                    </h3>
                    <Link
                      href={`/case-studies/${study.slug}`}
                      aria-label={`Open ${study.title}`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-line bg-surface-muted text-ink-heading transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-body">
                    {study.problemSummary}
                  </p>
                </div>
              </div>

              {/* 14px Soale Capability / Stack Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Layers
                  className="mr-1 h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
                {study.technologiesUsed.slice(0, 4).map((tech) => (
                  <SoaleChip key={tech}>{tech}</SoaleChip>
                ))}
              </div>
            </SoaleCard>
          );
        })}
      </div>
    </div>
  );
}
