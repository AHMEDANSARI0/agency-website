"use client";

import React from "react";
import Link from "next/link";

interface PageSeoPanelProps {
  routePath: string;
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogImageUrl: string;
  scheduledFor: string;
  noIndex: boolean;
  onChangePageTitle: (v: string) => void;
  onChangeSeoTitle: (v: string) => void;
  onChangeSeoDescription: (v: string) => void;
  onChangeCanonicalUrl: (v: string) => void;
  onChangeOgTitle: (v: string) => void;
  onChangeOgImageUrl: (v: string) => void;
  onChangeScheduledFor: (v: string) => void;
  onChangeNoIndex: (v: boolean) => void;
}

export function PageSeoPanel({
  routePath,
  pageTitle,
  seoTitle,
  seoDescription,
  canonicalUrl,
  ogTitle,
  ogImageUrl,
  scheduledFor,
  noIndex,
  onChangePageTitle,
  onChangeSeoTitle,
  onChangeSeoDescription,
  onChangeCanonicalUrl,
  onChangeOgTitle,
  onChangeOgImageUrl,
  onChangeScheduledFor,
  onChangeNoIndex,
}: PageSeoPanelProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5">
        <div>
          <p className="text-xs font-semibold text-ink-heading">
            Metadata Override for {routePath}
          </p>
          <p className="text-[11px] text-ink-muted">
            Saved overrides apply dynamically via generateMetadata().
          </p>
        </div>
        <Link
          href="/admin/seo"
          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
        >
          SEO Hub
        </Link>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Internal Page Label
        </label>
        <input
          value={pageTitle}
          onChange={(e) => onChangePageTitle(e.target.value)}
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
        />
      </div>

      <div>
        <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <span>SEO Title Tag</span>
          <span
            className={
              seoTitle.length > 60 ? "text-amber-400" : "text-emerald-400"
            }
          >
            {seoTitle.length}/60
          </span>
        </div>
        <input
          value={seoTitle}
          onChange={(e) => onChangeSeoTitle(e.target.value)}
          placeholder="Custom <title> override (recommended 30–60 chars)"
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
        />
      </div>

      <div>
        <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <span>Meta Description</span>
          <span
            className={
              seoDescription.length > 160
                ? "text-amber-400"
                : "text-emerald-400"
            }
          >
            {seoDescription.length}/160
          </span>
        </div>
        <textarea
          rows={3}
          value={seoDescription}
          onChange={(e) => onChangeSeoDescription(e.target.value)}
          placeholder="Compelling SERP summary (recommended 110–160 chars)..."
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-body"
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Canonical URL Override (Optional)
        </label>
        <input
          value={canonicalUrl}
          onChange={(e) => onChangeCanonicalUrl(e.target.value)}
          placeholder={routePath}
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Open Graph Title
          </label>
          <input
            value={ogTitle}
            onChange={(e) => onChangeOgTitle(e.target.value)}
            placeholder="Defaults to SEO Title"
            className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            OG Share Image URL
          </label>
          <input
            value={ogImageUrl}
            onChange={(e) => onChangeOgImageUrl(e.target.value)}
            placeholder="/opengraph-image"
            className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Schedule Publication (Optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => onChangeScheduledFor(e.target.value)}
          className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2.5 text-xs text-ink-body">
        <span>
          Exclude from Google &amp; Sitemap (<code>noindex, nofollow</code>)
        </span>
        <input
          type="checkbox"
          checked={noIndex}
          onChange={(e) => onChangeNoIndex(e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
      </label>
    </div>
  );
}
