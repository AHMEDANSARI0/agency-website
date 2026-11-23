"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Plus,
  Route,
  Save,
  SearchCheck,
  Trash2,
} from "lucide-react";
import type { PageDocument, RedirectRule } from "@/types/content";
import type { SeoAuditRow } from "@/app/api/admin/seo/route";

interface SeoAnalyticsClientProps {
  initialRedirects: RedirectRule[];
  initialAuditRows: SeoAuditRow[];
  initialPages: PageDocument[];
  initialAnalytics: {
    ga4MeasurementId: string;
    requireCookieConsent: boolean;
    enabled: boolean;
  };
  canManageAnalytics: boolean;
}

export function SeoAnalyticsClient({
  initialRedirects,
  initialAuditRows,
  initialPages,
  initialAnalytics,
  canManageAnalytics,
}: SeoAnalyticsClientProps) {
  const [redirects, setRedirects] = useState<RedirectRule[]>(initialRedirects);
  const [auditRows, setAuditRows] = useState<SeoAuditRow[]>(initialAuditRows);
  const [pages, setPages] = useState<PageDocument[]>(initialPages);
  const [analytics, setAnalytics] = useState(initialAnalytics);

  // Page SEO editor state
  const [selectedPageSlug, setSelectedPageSlug] = useState(
    initialPages[0]?.slug || "home"
  );
  const activePage =
    pages.find((p) => p.slug === selectedPageSlug) ?? pages[0] ?? null;

  const [seoTitle, setSeoTitle] = useState(activePage?.seo?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    activePage?.seo?.seoDescription || ""
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    activePage?.seo?.canonicalUrl || ""
  );
  const [noIndex, setNoIndex] = useState(Boolean(activePage?.seo?.noIndex));

  // New Redirect state
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("/services");
  const [permanent, setPermanent] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function selectPageForSeo(slug: string) {
    setSelectedPageSlug(slug);
    const found = pages.find((p) => p.slug === slug);
    if (found) {
      setSeoTitle(found.seo?.seoTitle || "");
      setSeoDescription(found.seo?.seoDescription || "");
      setCanonicalUrl(found.seo?.canonicalUrl || "");
      setNoIndex(Boolean(found.seo?.noIndex));
    }
  }

  async function savePageSeo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "page_seo",
          pageSeo: {
            pageSlug: selectedPageSlug,
            seoTitle,
            seoDescription,
            canonicalUrl,
            noIndex,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Failed to save page SEO metadata.",
        });
        return;
      }

      const updated: PageDocument = json.page;
      setPages((prev) =>
        prev.map((p) => (p.slug === updated.slug ? updated : p))
      );
      setAuditRows((prev) =>
        prev.map((row) =>
          row.entityType === "page" &&
          row.path === (updated.slug === "home" ? "/" : `/${updated.slug}`)
            ? {
                ...row,
                seoTitle: updated.seo.seoTitle || updated.title,
                seoDescription: updated.seo.seoDescription || "",
                noIndex: Boolean(updated.seo.noIndex),
                warnings: updated.seo.seoDescription
                  ? []
                  : ["Missing custom SEO meta description"],
              }
            : row
        )
      );
      setFeedback({
        type: "success",
        text: `Updated SEO metadata for "${updated.title}".`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRedirect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          destinationPath,
          permanent,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Invalid redirect rule.",
        });
        return;
      }
      const saved: RedirectRule = json.redirect;
      setRedirects((prev) => [
        saved,
        ...prev.filter(
          (r) => r.id !== saved.id && r.sourcePath !== saved.sourcePath
        ),
      ]);
      setSourcePath("");
      setFeedback({
        type: "success",
        text: `Saved redirect ${saved.sourcePath} → ${saved.destinationPath}.`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRedirect(id: string) {
    const res = await fetch(
      `/api/admin/seo?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setRedirects((prev) => prev.filter((r) => r.id !== id));
      setFeedback({ type: "success", text: "Removed redirect rule." });
    }
  }

  async function saveAnalyticsConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "analytics",
          analytics,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not update analytics configuration.",
        });
        return;
      }
      setAnalytics(json.analytics);
      setFeedback({
        type: "success",
        text: "Saved privacy-first Analytics & Cookie Consent settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  const warningCount = auditRows.filter((r) => r.warnings.length > 0).length;

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-card border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-ink-heading"
              : "border-red-500/30 bg-red-500/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Quick Crawl Endpoints */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface-card p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-primary">
            Crawler &amp; Structured Data Readiness
          </p>
          <p className="mt-1 text-sm text-ink-body">
            JSON-LD schemas (`Organization`, `WebSite`, `Service`, `Article`,
            `FAQPage`, `BreadcrumbList`) are active across public routes with
            zero synthetic review ratings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 font-mono text-xs text-ink-heading hover:bg-surface-muted"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>/sitemap.xml</span>
            <ExternalLink className="h-3 w-3 text-ink-muted" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 font-mono text-xs text-ink-heading hover:bg-surface-muted"
          >
            <SearchCheck className="h-3.5 w-3.5 text-primary" />
            <span>/robots.txt</span>
            <ExternalLink className="h-3 w-3 text-ink-muted" />
          </a>
        </div>
      </div>

      {/* Page SEO Controls + Privacy-First Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={savePageSeo}
          className="space-y-4 rounded-card border border-line bg-surface-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-heading">
              Structured Page SEO &amp; Indexing Control
            </h2>
            <select
              value={selectedPageSlug}
              onChange={(e) => selectPageForSeo(e.target.value)}
              className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-heading"
            >
              {pages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title} ({p.slug === "home" ? "/" : `/${p.slug}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              SEO Title Override ({seoTitle.length}/70 chars)
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="OmniFlow — AI Automation & Business Solutions"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Meta Description ({seoDescription.length}/160 recommended)
            </label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Automate the work. Accelerate the business. Grounded AI & deterministic workflow automation for US, UK, and Canadian teams."
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Canonical URL Override (optional)
            </label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://omniflow.example"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-heading"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
            <input
              type="checkbox"
              checked={noIndex}
              onChange={(e) => setNoIndex(e.target.checked)}
            />
            <span>
              Set <code>noindex, nofollow</code> and exclude this page from{" "}
              <code>sitemap.xml</code>
            </span>
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Page SEO</span>
            </button>
          </div>
        </form>

        {/* Privacy-First Analytics & Consent */}
        <form
          onSubmit={saveAnalyticsConfig}
          className="space-y-4 rounded-card border border-line bg-surface-card p-6"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-ink-heading">
              Privacy-First GA4 &amp; Cookie Consent
            </h2>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            OmniFlow never displays fabricated visitor counters. When enabled
            with a valid <code>G-XXXXXXXXXX</code> ID, Google Analytics loads
            cleanly on public pages only after visitor cookie consent (when
            consent mode is active).
          </p>

          <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
            <input
              type="checkbox"
              disabled={!canManageAnalytics}
              checked={analytics.enabled}
              onChange={(e) =>
                setAnalytics({ ...analytics, enabled: e.target.checked })
              }
            />
            <span>Enable Google Analytics 4 (GA4) script injection</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              GA4 Measurement ID
            </label>
            <input
              type="text"
              disabled={!canManageAnalytics}
              value={analytics.ga4MeasurementId}
              onChange={(e) =>
                setAnalytics({
                  ...analytics,
                  ga4MeasurementId: e.target.value.toUpperCase(),
                })
              }
              placeholder="G-XXXXXXXXXX"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading disabled:opacity-60"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
            <input
              type="checkbox"
              disabled={!canManageAnalytics}
              checked={analytics.requireCookieConsent}
              onChange={(e) =>
                setAnalytics({
                  ...analytics,
                  requireCookieConsent: e.target.checked,
                })
              }
            />
            <span>
              Require explicit visitor Cookie Consent before loading GA4
              (recommended for UK/GDPR &amp; Canada PIPEDA compliance)
            </span>
          </label>

          {canManageAnalytics ? (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Analytics Policy</span>
              </button>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-ink-muted">
              Read-only for Editor role · Super Admin required to alter global
              tracking scripts.
            </p>
          )}
        </form>
      </div>

      {/* 301 / 307 Redirects Manager */}
      <div className="space-y-4 rounded-card border border-line bg-surface-card p-6">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-ink-heading">
            301 / 307 URL Redirects Manager ({redirects.length})
          </h2>
        </div>
        <p className="text-xs text-ink-muted">
          Preserve SEO link equity when renaming slugs or migrating legacy URLs.
          Loop detection and <code>/admin</code> route protection are enforced
          automatically.
        </p>

        <form
          onSubmit={handleAddRedirect}
          className="grid gap-3 sm:grid-cols-4 sm:items-end"
        >
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Legacy Source Path
            </label>
            <input
              type="text"
              required
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder="/old-automation-page"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Destination Path or URL
            </label>
            <input
              type="text"
              required
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              placeholder="/services/workflow-automation"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Redirect Status
            </label>
            <select
              value={permanent ? "permanent" : "temporary"}
              onChange={(e) => setPermanent(e.target.value === "permanent")}
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            >
              <option value="permanent">Permanent (308 / 301 SEO)</option>
              <option value="temporary">Temporary (307)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Redirect</span>
          </button>
        </form>

        {redirects.length > 0 && (
          <div className="divide-y divide-line border-t border-line pt-2">
            {redirects.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="font-semibold text-ink-heading">
                    {rule.sourcePath}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  <span className="text-ink-body">{rule.destinationPath}</span>
                  <span className="rounded bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {rule.permanent ? "PERMANENT" : "TEMPORARY"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteRedirect(rule.id)}
                  className="inline-flex items-center gap-1 rounded-control border border-red-500/30 px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Route SEO Audit Matrix */}
      <div className="space-y-4 rounded-card border border-line bg-surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Live Route Metadata &amp; Indexability Matrix ({auditRows.length}{" "}
              routes)
            </h2>
            <p className="text-xs text-ink-muted">
              Automated check of effective SEO titles, meta descriptions, and
              crawler directives across published routes.
            </p>
          </div>
          <span className="rounded-full border border-line bg-surface-muted px-3 py-1 font-mono text-xs text-ink-heading">
            {warningCount === 0
              ? "0 Warnings · All Clear"
              : `${warningCount} route(s) with recommendations`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase text-ink-muted">
                <th className="py-2.5 pr-4">Route</th>
                <th className="py-2.5 pr-4">Type</th>
                <th className="py-2.5 pr-4">Effective SEO Title</th>
                <th className="py-2.5 pr-4">Indexing</th>
                <th className="py-2.5">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {auditRows.map((row) => (
                <tr key={`${row.entityType}:${row.path}`}>
                  <td className="py-3 pr-4 font-mono text-ink-heading">
                    {row.path}
                  </td>
                  <td className="py-3 pr-4 capitalize text-ink-muted">
                    {row.entityType.replace("_", " ")}
                  </td>
                  <td className="max-w-xs truncate py-3 pr-4 text-ink-body">
                    {row.seoTitle}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                        row.noIndex
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {row.noIndex ? "NOINDEX" : "INDEX"}
                    </span>
                  </td>
                  <td className="py-3">
                    {row.warnings.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Optimal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{row.warnings[0]}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
