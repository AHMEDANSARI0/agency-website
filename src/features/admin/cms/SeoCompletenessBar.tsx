"use client";

import React from "react";
import { CheckCircle2, CircleAlert, Search } from "lucide-react";
import { computeSeoCompleteness, type SeoCheckInput } from "./cms-helpers";

interface SeoCompletenessBarProps {
  checkInput: SeoCheckInput;
  urlPathPreview: string;
  seoTitle: string;
  seoDescription: string;
  onChangeSeoTitle: (val: string) => void;
  onChangeSeoDescription: (val: string) => void;
}

export function SeoCompletenessBar({
  checkInput,
  urlPathPreview,
  seoTitle,
  seoDescription,
  onChangeSeoTitle,
  onChangeSeoDescription,
}: SeoCompletenessBarProps) {
  const report = computeSeoCompleteness(checkInput);
  const badgeColor =
    report.score >= 80
      ? "text-status-success border-status-success/40 bg-status-success/10"
      : report.score >= 50
        ? "text-status-warning border-status-warning/40 bg-status-warning/10"
        : "text-status-error border-status-error/40 bg-status-error/10";

  return (
    <div className="space-y-4 rounded-control border border-line bg-surface-muted/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
            SEO &amp; Content Readiness
          </h4>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold ${badgeColor}`}
        >
          {report.score}% Ready
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.max(6, report.score)}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid gap-2 sm:grid-cols-2">
        {report.checks.map((chk) => (
          <div
            key={chk.label}
            className="flex items-start gap-2 rounded border border-line/70 bg-surface px-2.5 py-2 text-[11px]"
          >
            {chk.passed ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-success" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" />
            )}
            <div>
              <p className="font-semibold text-ink-heading">{chk.label}</p>
              <p className="text-ink-muted">{chk.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Editable Meta Overrides */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Custom SEO Meta Title (optional override)
          </label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onChangeSeoTitle(e.target.value)}
            placeholder={checkInput.title || "Defaults to entry title"}
            maxLength={120}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Custom SEO Meta Description (optional override)
          </label>
          <input
            type="text"
            value={seoDescription}
            onChange={(e) => onChangeSeoDescription(e.target.value)}
            placeholder={checkInput.summary || "Defaults to summary excerpt"}
            maxLength={300}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>
      </div>

      {/* Live Search Snippet Preview */}
      <div className="rounded-control border border-line bg-surface p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Search Snippet Preview · {urlPathPreview}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-primary">
          {report.effectiveTitle}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-ink-body">
          {report.effectiveDescription}
        </p>
      </div>
    </div>
  );
}
