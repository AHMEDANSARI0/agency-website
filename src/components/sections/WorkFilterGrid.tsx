"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CaseStudyItem, WorkVerificationType } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { WORK_TYPE_META } from "@/features/case-studies/constants";

const FILTERS: Array<{ value: "all" | WorkVerificationType; label: string }> = [
  { value: "all", label: "All Work & Blueprints" },
  { value: "verified_client", label: "Verified Client Work" },
  { value: "internal_experiment", label: "Internal Prototypes" },
  { value: "concept_demo", label: "Concept Architectures" },
];

export function WorkFilterGrid({ items }: { items: CaseStudyItem[] }) {
  const [filter, setFilter] = useState<"all" | WorkVerificationType>("all");

  const filtered =
    filter === "all" ? items : items.filter((item) => item.workType === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter portfolio by verification type">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-line bg-surface text-ink-body hover:text-ink-heading"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-surface-card p-10 text-center">
          <p className="text-sm font-semibold text-ink-heading">
            No items currently published in this category.
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            OmniFlow publishes client engagements only after formal client authorization is granted.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filtered.map((item) => {
            const meta = WORK_TYPE_META[item.workType];
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{meta.label}</Badge>
                    <Badge variant="status">{item.industry}</Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-ink-heading">
                    <Link href={`/case-studies/${item.slug}`} className="hover:text-link-hover">
                      {item.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {item.problemSummary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.technologiesUsed.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                  <span className="text-ink-muted">{meta.disclosure}</span>
                  <Link
                    href={`/case-studies/${item.slug}`}
                    className="inline-flex shrink-0 items-center gap-1 font-semibold text-link hover:text-link-hover"
                  >
                    Inspect blueprint
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
