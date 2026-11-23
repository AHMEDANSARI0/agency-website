import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { SeoAnalyticsClient } from "@/features/admin/SeoAnalyticsClient";
import type { SeoAuditRow } from "@/app/api/admin/seo/route";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminSeoPage() {
  const { user, settings, allowed } = await requireAdminPageAuth("seo:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Technical SEO, Redirects & Analytics"
      />
    );
  }

  const [redirects, pages, services, caseStudies, blogPosts] =
    await Promise.all([
      db.listRedirects(),
      db.listPages(),
      db.listServices(true),
      db.listCaseStudies(true),
      db.listBlogPosts(true),
    ]);

  const auditRows: SeoAuditRow[] = [
    ...pages.map((p) => {
      const desc = p.seo.seoDescription || "";
      const warnings: string[] = [];
      if (!desc) warnings.push("Missing custom SEO meta description");
      return {
        entityType: "page" as const,
        title: p.title,
        path: p.slug === "home" ? "/" : `/${p.slug}`,
        seoTitle: p.seo.seoTitle || p.title,
        seoDescription: desc,
        noIndex: Boolean(p.seo.noIndex),
        warnings,
      };
    }),
    ...services.map((s) => ({
      entityType: "service" as const,
      title: s.title,
      path: `/services/${s.slug}`,
      seoTitle: s.seo.seoTitle || s.title,
      seoDescription: s.seo.seoDescription || s.shortSummary,
      noIndex: Boolean(s.seo.noIndex),
      warnings:
        (s.seo.seoTitle || s.title).length > 70
          ? ["Title exceeds 70 characters"]
          : [],
    })),
    ...caseStudies.map((c) => ({
      entityType: "case_study" as const,
      title: c.title,
      path: `/case-studies/${c.slug}`,
      seoTitle: c.seo.seoTitle || c.title,
      seoDescription: c.seo.seoDescription || c.problemSummary,
      noIndex: Boolean(c.seo.noIndex),
      warnings: [],
    })),
    ...blogPosts.map((b) => ({
      entityType: "blog" as const,
      title: b.title,
      path: `/blog/${b.slug}`,
      seoTitle: b.seo.seoTitle || b.title,
      seoDescription: b.seo.seoDescription || b.excerpt,
      noIndex: Boolean(b.seo.noIndex),
      warnings: [],
    })),
  ];

  const canManageAnalytics = hasPermission(
    user.role,
    "settings:manage",
    settings.rolePolicies
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Search &amp; Privacy Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Technical SEO, Redirects &amp; Analytics Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Audit route metadata, manage 301/307 redirects with loop protection, verify sitemap/robots output, and configure consent-aware GA4 analytics.
        </p>
      </div>

      <SeoAnalyticsClient
        initialRedirects={redirects}
        initialAuditRows={auditRows}
        initialPages={pages}
        initialAnalytics={settings.analytics}
        canManageAnalytics={canManageAnalytics}
      />
    </div>
  );
}
