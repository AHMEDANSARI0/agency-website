"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Code2,
  ExternalLink,
  EyeOff,
  FileCheck2,
  Globe,
  RefreshCw,
  Save,
  Search,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type {
  AuditedRouteSeoRecord,
  SiteSeoAuditSummary,
} from "@/features/seo/site-seo-inspector";

interface SeoInspectorClientProps {
  initialAudit: SiteSeoAuditSummary;
  canEdit: boolean;
}

type GroupFilter =
  | "ALL"
  | "Core Pages"
  | "Services"
  | "Case Studies"
  | "Blog & Guides"
  | "Legal";

type StatusFilter = "ALL" | "ISSUES" | "PASS" | "NOINDEX";

export function SeoInspectorClient({
  initialAudit,
  canEdit,
}: SeoInspectorClientProps) {
  const [audit, setAudit] = useState<SiteSeoAuditSummary>(initialAudit);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>(
    initialAudit.routes.find((r) => r.issues.length > 0)?.key ??
      initialAudit.routes[0]?.key ??
      "page:home"
  );

  const selectedRoute = useMemo(
    () =>
      audit.routes.find((r) => r.key === selectedKey) ??
      audit.routes[0] ??
      null,
    [audit.routes, selectedKey]
  );

  // Inline Editor Form State synced to selectedRoute
  const [seoTitle, setSeoTitle] = useState(
    selectedRoute?.rawSeo.seoTitle ?? ""
  );
  const [seoDescription, setSeoDescription] = useState(
    selectedRoute?.rawSeo.seoDescription ?? ""
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    selectedRoute?.rawSeo.canonicalUrl ?? ""
  );
  const [ogTitle, setOgTitle] = useState(selectedRoute?.rawSeo.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(
    selectedRoute?.rawSeo.ogDescription ?? ""
  );
  const [ogImageUrl, setOgImageUrl] = useState(
    selectedRoute?.rawSeo.ogImageUrl ?? ""
  );
  const [noIndex, setNoIndex] = useState(
    Boolean(selectedRoute?.rawSeo.noIndex)
  );

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectRoute = (rec: AuditedRouteSeoRecord) => {
    setSelectedKey(rec.key);
    setSeoTitle(rec.rawSeo.seoTitle ?? "");
    setSeoDescription(rec.rawSeo.seoDescription ?? "");
    setCanonicalUrl(rec.rawSeo.canonicalUrl ?? "");
    setOgTitle(rec.rawSeo.ogTitle ?? "");
    setOgDescription(rec.rawSeo.ogDescription ?? "");
    setOgImageUrl(rec.rawSeo.ogImageUrl ?? "");
    setNoIndex(Boolean(rec.rawSeo.noIndex));
    setFeedback(null);
  };

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.routes.filter((r) => {
      if (groupFilter !== "ALL" && r.groupLabel !== groupFilter) return false;
      if (statusFilter === "ISSUES" && r.issues.length === 0) return false;
      if (statusFilter === "PASS" && r.issues.length > 0) return false;
      if (statusFilter === "NOINDEX" && !r.noIndex) return false;
      if (
        q &&
        !r.routePath.toLowerCase().includes(q) &&
        !r.pageLabel.toLowerCase().includes(q) &&
        !r.resolvedTitle.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [audit.routes, groupFilter, statusFilter, query]);

  const refreshAudit = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/seo/inspector", {
        cache: "no-store",
      });
      if (res.ok) {
        const nextAudit: SiteSeoAuditSummary = await res.json();
        setAudit(nextAudit);
        const updatedSel = nextAudit.routes.find((r) => r.key === selectedKey);
        if (updatedSel) {
          selectRoute(updatedSel);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  const saveInlineMetadata = async () => {
    if (!selectedRoute) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/seo/inspector", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityKind: selectedRoute.entityKind,
          entitySlug: selectedRoute.entitySlug,
          seo: {
            seoTitle,
            seoDescription,
            canonicalUrl,
            ogTitle,
            ogDescription,
            ogImageUrl,
            noIndex,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: json.error || "Failed to update page SEO metadata.",
        });
      } else {
        setAudit(json.audit);
        setFeedback({
          type: "success",
          message: `Published live metadata fix for ${json.routePath} and revalidated sitemap.`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error while saving metadata.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Live Preview Computations
  const liveSerpTitle = selectedRoute
    ? seoTitle.trim()
      ? selectedRoute.entitySlug === "home"
        ? seoTitle.trim().includes("OmniFlow")
          ? seoTitle.trim()
          : `OmniFlow — ${seoTitle.trim()}`
        : `${seoTitle.trim().replace(/\s*\|\s*OmniFlow$/i, "")} | OmniFlow`
      : selectedRoute.resolvedTitle
    : "";

  const liveSerpDesc = selectedRoute
    ? seoDescription.trim() || selectedRoute.resolvedDescription
    : "";

  const liveCanonical = selectedRoute
    ? canonicalUrl.trim() || selectedRoute.canonicalUrl
    : "";

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. EXECUTIVE SITEWIDE SEO KPI STRIP
         ===================================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Site SEO Score
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                audit.overallScore >= 90
                  ? "text-emerald-400"
                  : audit.overallScore >= 75
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {audit.overallScore}
            </span>
            <span className="text-xs text-ink-muted">/ 100</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Audited Pages
          </span>
          <div className="mt-1.5 text-2xl font-bold text-ink-heading">
            {audit.totalRoutes}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/6 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            Healthy Routes
          </span>
          <div className="mt-1.5 text-2xl font-bold text-emerald-400">
            {audit.healthyRoutes}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/6 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
            Warnings
          </span>
          <div className="mt-1.5 text-2xl font-bold text-amber-400">
            {audit.warningRoutes}
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/25 bg-red-500/6 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
            Critical Alerts
          </span>
          <div className="mt-1.5 text-2xl font-bold text-red-400">
            {audit.criticalRoutes}
          </div>
        </div>

        <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Duplicate Tags
          </span>
          <div className="mt-1.5 text-2xl font-bold text-ink-heading">
            {audit.duplicateTitleGroups.length +
              audit.duplicateDescriptionGroups.length}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. PROACTIVE SEO ALERT BANNER (WHEN ANY ROUTE HAS AN ISSUE)
         ===================================================================== */}
      {audit.topAlerts.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Active Per-Page SEO &amp; Metadata Alerts ({audit.topAlerts.length})
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={refreshAudit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-heading hover:border-primary/40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Re-Scan All {audit.totalRoutes} Pages
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {audit.topAlerts.slice(0, 6).map((alert, i) => {
              const targetRec = audit.routes.find(
                (r) => r.routePath === alert.routePath
              );
              return (
                <button
                  key={`${alert.routePath}-${i}`}
                  type="button"
                  onClick={() => targetRec && selectRoute(targetRec)}
                  className="flex items-start justify-between gap-2 rounded-xl border border-line-subtle bg-surface-card p-3 text-left transition hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          alert.severity === "critical"
                            ? "bg-red-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <span className="truncate font-mono text-xs font-semibold text-ink-heading">
                        {alert.routePath}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted">
                      {alert.message}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-primary/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    Fix
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            All {audit.totalRoutes} public routes pass Title, Meta Description,
            H1, Canonical, OpenGraph, JSON-LD Schema, and Sitemap checks with 0
            duplicates.
          </div>
          <button
            type="button"
            disabled={refreshing}
            onClick={refreshAudit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-heading"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Re-Scan All Pages
          </button>
        </div>
      )}

      {/* =====================================================================
          3. FILTER & SEARCH TOOLBAR
         ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-subtle bg-surface-card p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              "ALL",
              "Core Pages",
              "Services",
              "Case Studies",
              "Blog & Guides",
              "Legal",
            ] as GroupFilter[]
          ).map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setGroupFilter(grp)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                groupFilter === grp
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-elevated text-ink-muted hover:text-ink-heading"
              }`}
            >
              {grp === "ALL" ? `All (${audit.totalRoutes})` : grp}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by SEO health status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-line-subtle bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink-heading"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUES">Needs Attention ({audit.warningRoutes + audit.criticalRoutes})</option>
            <option value="PASS">Healthy (100%)</option>
            <option value="NOINDEX">Marked noindex ({audit.noIndexRoutes})</option>
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter URL or title..."
              className="w-52 rounded-xl border border-line-subtle bg-surface-elevated py-1.5 pl-8 pr-3 text-xs text-ink-heading focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. SPLIT MASTER-DETAIL WORKBENCH: EVERY-PAGE LIST + LIVE FIX EDITOR
         ===================================================================== */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* LEFT: EVERY-PAGE AUDIT TABLE */}
        <div className="rounded-2xl border border-line-subtle bg-surface-card shadow-card lg:col-span-5 lg:max-h-[82vh] overflow-y-auto divide-y divide-line-subtle">
          {filteredRoutes.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No routes match your current filter.
            </div>
          ) : (
            filteredRoutes.map((rec) => {
              const isSelected = rec.key === selectedRoute?.key;
              return (
                <button
                  key={rec.key}
                  type="button"
                  onClick={() => selectRoute(rec)}
                  className={`flex w-full items-start justify-between gap-3 p-3.5 text-left transition ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-inset ring-primary/40"
                      : "hover:bg-surface-elevated/70"
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-ink-heading">
                        {rec.routePath}
                      </span>
                      <span className="rounded-md border border-line-subtle bg-surface-elevated px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-muted">
                        {rec.groupLabel}
                      </span>
                      {rec.noIndex && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-red-400">
                          <EyeOff className="h-2.5 w-2.5" />
                          noindex
                        </span>
                      )}
                      {rec.hasCustomOverride && (
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                          Custom SEO
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs text-ink-body">
                      {rec.resolvedTitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-ink-muted">
                      <span>Title: {rec.titleLength}c</span>
                      <span>·</span>
                      <span>Desc: {rec.descriptionLength}c</span>
                      <span>·</span>
                      <span>Schema: {rec.jsonLdTypes.length}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        rec.status === "pass"
                          ? "bg-emerald-500/12 text-emerald-400"
                          : rec.status === "warning"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {rec.score}%
                    </span>
                    {rec.issues.length > 0 && (
                      <span className="font-mono text-[10px] text-amber-400">
                        {rec.issues.length} issue
                        {rec.issues.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT: SELECTED PAGE DEEP DIAGNOSTIC + GOOGLE SERP PREVIEW + INLINE FIX */}
        {selectedRoute && (
          <div className="space-y-4 lg:col-span-7">
            {/* Header Bar */}
            <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {selectedRoute.groupLabel}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      {selectedRoute.routePath}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold text-ink-heading">
                    {selectedRoute.pageLabel}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/storefront?tab=pages"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line-subtle bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink-body hover:text-ink-heading"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Open in Visual Studio
                  </Link>
                  <a
                    href={selectedRoute.routePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line-subtle bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink-body hover:text-ink-heading"
                  >
                    View Live Page
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Technical Signals Matrix */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-xl border border-line-subtle bg-surface-elevated p-2.5">
                  <span className="block font-mono text-[10px] uppercase text-ink-muted">
                    Primary H1
                  </span>
                  <span
                    className="mt-1 block truncate text-xs font-medium text-ink-heading"
                    title={selectedRoute.primaryH1}
                  >
                    {selectedRoute.primaryH1}
                  </span>
                </div>
                <div className="rounded-xl border border-line-subtle bg-surface-elevated p-2.5">
                  <span className="block font-mono text-[10px] uppercase text-ink-muted">
                    Sitemap &amp; Robots
                  </span>
                  <span
                    className={`mt-1 block text-xs font-semibold ${
                      selectedRoute.inSitemap
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedRoute.inSitemap
                      ? "Index, Follow · In Sitemap"
                      : "noindex · Excluded"}
                  </span>
                </div>
                <div className="rounded-xl border border-line-subtle bg-surface-elevated p-2.5 sm:col-span-2">
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-ink-muted">
                    <Code2 className="h-3 w-3 text-primary" />
                    Active JSON-LD Structured Data
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedRoute.jsonLdTypes.map((schema) => (
                      <span
                        key={schema}
                        className="rounded-md bg-primary/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary"
                      >
                        {schema}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Per-Page Issues List */}
              {selectedRoute.issues.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedRoute.issues.map((iss) => (
                    <div
                      key={iss.id}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
                        iss.severity === "critical"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {iss.severity === "critical" ? (
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        )}
                        <div>
                          <div className="font-semibold">{iss.message}</div>
                          <div className="mt-0.5 text-[11px] opacity-85">
                            {iss.recommendation}
                          </div>
                        </div>
                      </div>
                      {iss.field === "title" && (
                        <button
                          type="button"
                          onClick={() =>
                            setSeoTitle(selectedRoute.suggestedSeoTitle)
                          }
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-primary"
                        >
                          <Wand2 className="h-3 w-3" />
                          Auto-Trim
                        </button>
                      )}
                      {iss.field === "description" && (
                        <button
                          type="button"
                          onClick={() =>
                            setSeoDescription(
                              selectedRoute.suggestedSeoDescription
                            )
                          }
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-primary"
                        >
                          <Wand2 className="h-3 w-3" />
                          Auto-Trim
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Google SERP + Social Share Preview */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Live Google Search Result Preview
                </div>
                <div className="mt-3 rounded-xl border border-line-subtle bg-surface-elevated p-3.5">
                  <div className="truncate text-[11px] text-emerald-400">
                    {liveCanonical}
                  </div>
                  <div className="mt-1 line-clamp-1 text-sm font-semibold text-[#8AB4F8]">
                    {liveSerpTitle}
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-body">
                    {liveSerpDesc}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  Open Graph / LinkedIn / X Card
                </div>
                <div className="mt-3 rounded-xl border border-line-subtle bg-surface-elevated p-3.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-ink-muted">
                    <span>twitter: summary_large_image</span>
                    <span className="truncate max-w-[140px]">
                      {ogImageUrl.trim() || "/opengraph-image"}
                    </span>
                  </div>
                  <div className="mt-1.5 line-clamp-1 text-xs font-semibold text-ink-heading">
                    {ogTitle.trim() || liveSerpTitle}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted">
                    {ogDescription.trim() || liveSerpDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline 1-Click Metadata Fix Editor */}
            <div className="rounded-2xl border border-line-subtle bg-surface-card p-4 shadow-card space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-ink-heading">
                    Inline Metadata Override Editor ({selectedRoute.routePath})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSeoTitle(selectedRoute.suggestedSeoTitle);
                    setSeoDescription(selectedRoute.suggestedSeoDescription);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15"
                >
                  <Wand2 className="h-3 w-3" />
                  Fill Optimal Suggested Copy
                </button>
              </div>

              {feedback && (
                <div
                  className={`rounded-xl border px-3.5 py-2 text-xs ${
                    feedback.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <span>
                    SEO Title Override (Brand suffix{" "}
                    <code>| OmniFlow</code> added automatically)
                  </span>
                  <span
                    className={
                      liveSerpTitle.length > 65
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    Resolved: {liveSerpTitle.length}/65 chars
                  </span>
                </div>
                <input
                  value={seoTitle}
                  disabled={!canEdit}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={selectedRoute.suggestedSeoTitle}
                  className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <span>Meta Description Override</span>
                  <span
                    className={
                      liveSerpDesc.length > 165 || liveSerpDesc.length < 70
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    Resolved: {liveSerpDesc.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  disabled={!canEdit}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={selectedRoute.resolvedDescription}
                  className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-body focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Canonical URL Override (Optional)
                  </label>
                  <input
                    value={canonicalUrl}
                    disabled={!canEdit}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={selectedRoute.canonicalUrl}
                    className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Open Graph Image URL (Optional)
                  </label>
                  <input
                    value={ogImageUrl}
                    disabled={!canEdit}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    placeholder="/opengraph-image"
                    className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Open Graph Title (Optional)
                  </label>
                  <input
                    value={ogTitle}
                    disabled={!canEdit}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="Defaults to SEO Title"
                    className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Open Graph Description (Optional)
                  </label>
                  <input
                    value={ogDescription}
                    disabled={!canEdit}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="Defaults to Meta Description"
                    className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-body">
                  <input
                    type="checkbox"
                    checked={noIndex}
                    disabled={!canEdit}
                    onChange={(e) => setNoIndex(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>
                    Mark <code>noindex, nofollow</code> (removes{" "}
                    <strong>{selectedRoute.routePath}</strong> from sitemap.xml)
                  </span>
                </label>

                {canEdit && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveInlineMetadata}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Publishing Fix…" : "Save & Publish Metadata Fix"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
