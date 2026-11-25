import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { UnifiedSeoHubClient } from "@/features/admin/UnifiedSeoHubClient";
import { runFullSiteSeoInspection } from "@/features/seo/site-seo-inspector";
import type { SeoAuditRow } from "@/app/api/admin/seo/route";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const { user, settings, allowed } = await requireAdminPageAuth("seo:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="SEO, Redirects & Analytics Hub"
      />
    );
  }

  const [initialAudit, redirects, pages] = await Promise.all([
    runFullSiteSeoInspection(),
    db.listRedirects(),
    db.listPages(),
  ]);

  const auditRows: SeoAuditRow[] = initialAudit.routes.map((r) => ({
    entityType:
      r.entityKind === "blog_post"
        ? "blog"
        : (r.entityKind as "page" | "service" | "case_study"),
    title: r.pageLabel,
    path: r.routePath,
    seoTitle: r.resolvedTitle,
    seoDescription: r.resolvedDescription,
    noIndex: r.noIndex,
    warnings: r.issues.map((i) => i.message),
  }));

  const canManageAnalytics = hasPermission(
    user.role,
    "settings:manage",
    settings.rolePolicies
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Search, Redirects &amp; Privacy Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Unified SEO, Page Metadata Inspector &amp; Analytics Hub
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Deep every-page metadata audit with live SERP/Social previews and 1-click fixes, loop-protected 301/307 redirects, XML sitemap verification, and consent-gated GA4 analytics in one unified workspace.
        </p>
      </div>

      <UnifiedSeoHubClient
        initialAudit={initialAudit}
        initialRedirects={redirects}
        initialAuditRows={auditRows}
        initialPages={pages}
        initialAnalytics={settings.analytics}
        canEditSeo={allowed}
        canManageAnalytics={canManageAnalytics}
      />
    </div>
  );
}
