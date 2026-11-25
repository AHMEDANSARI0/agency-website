import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { SeoInspectorClient } from "@/features/admin/SeoInspectorClient";
import { runFullSiteSeoInspection } from "@/features/seo/site-seo-inspector";
import { requireAdminPageAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminSeoInspectorPage() {
  const { user, allowed } = await requireAdminPageAuth("seo:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Every-Page SEO & Metadata Inspector"
      />
    );
  }

  const initialAudit = await runFullSiteSeoInspection();

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Search &amp; Metadata Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Every-Page SEO &amp; Metadata Inspector
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Deep audit across every static route, service blueprint, case study, and blog guide — checking Title/Meta lengths, cross-site duplicates, H1 hierarchy, Canonical URLs, Open Graph social cards, JSON-LD Schema, and Sitemap indexing with 1-click live fixes.
        </p>
      </div>

      <SeoInspectorClient initialAudit={initialAudit} canEdit={allowed} />
    </div>
  );
}
