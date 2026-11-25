"use client";

import React, { useState } from "react";
import { Activity, Route, SearchCheck } from "lucide-react";
import type { PageDocument, RedirectRule } from "@/types/content";
import type { SeoAuditRow } from "@/app/api/admin/seo/route";
import type { SiteSeoAuditSummary } from "@/features/seo/site-seo-inspector";
import { SeoInspectorClient } from "@/features/admin/SeoInspectorClient";
import { SeoAnalyticsClient } from "@/features/admin/SeoAnalyticsClient";

interface UnifiedSeoHubClientProps {
  initialAudit: SiteSeoAuditSummary;
  initialRedirects: RedirectRule[];
  initialAuditRows: SeoAuditRow[];
  initialPages: PageDocument[];
  initialAnalytics: {
    ga4MeasurementId: string;
    requireCookieConsent: boolean;
    enabled: boolean;
  };
  canEditSeo: boolean;
  canManageAnalytics: boolean;
}

export function UnifiedSeoHubClient({
  initialAudit,
  initialRedirects,
  initialAuditRows,
  initialPages,
  initialAnalytics,
  canEditSeo,
  canManageAnalytics,
}: UnifiedSeoHubClientProps) {
  const [activeTab, setActiveTab] = useState<"inspector" | "redirects_analytics">(
    "inspector"
  );

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-line-subtle bg-surface-card p-1.5 shadow-card">
        <button
          type="button"
          onClick={() => setActiveTab("inspector")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "inspector"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-ink-muted hover:text-ink-heading"
          }`}
        >
          <SearchCheck className="h-4 w-4" />
          Every-Page SEO Inspector &amp; 1-Click Fixes ({initialAudit.totalRoutes} Routes)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("redirects_analytics")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "redirects_analytics"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-ink-muted hover:text-ink-heading"
          }`}
        >
          <Route className="h-4 w-4" />
          301 Redirects, Sitemap &amp; Privacy Analytics
          <Activity className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>

      {activeTab === "inspector" ? (
        <SeoInspectorClient initialAudit={initialAudit} canEdit={canEditSeo} />
      ) : (
        <SeoAnalyticsClient
          initialRedirects={initialRedirects}
          initialAuditRows={initialAuditRows}
          initialPages={initialPages}
          initialAnalytics={initialAnalytics}
          canManageAnalytics={canManageAnalytics}
        />
      )}
    </div>
  );
}
