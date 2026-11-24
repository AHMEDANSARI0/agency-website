import React from "react";
import Link from "next/link";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { CmsWorkspaceClient } from "@/features/admin/CmsWorkspaceClient";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

const VALID_TABS = new Set([
  "blog",
  "case_study",
  "service",
  "faq",
  "testimonial",
  "team",
]);

interface AdminCmsPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function AdminCmsPage({ searchParams }: AdminCmsPageProps) {
  const { user, settings, allowed } = await requireAdminPageAuth(
    "content:create_draft"
  );
  if (!allowed) {
    return (
      <AccessDeniedCard role={user.role} moduleName="CMS Content Studio" />
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const requestedTab =
    resolvedParams.tab && VALID_TABS.has(resolvedParams.tab)
      ? (resolvedParams.tab as
          | "blog"
          | "case_study"
          | "service"
          | "faq"
          | "testimonial"
          | "team")
      : "blog";

  const canEditAny = hasPermission(
    user.role,
    "content:edit_any",
    settings.rolePolicies
  );
  const canPublish = hasPermission(
    user.role,
    "content:publish",
    settings.rolePolicies
  );

  const [allPosts, caseStudies, services, faqs, testimonials, teamMembers] =
    await Promise.all([
      db.listBlogPosts(false),
      canEditAny ? db.listCaseStudies(false) : Promise.resolve([]),
      canEditAny ? db.listServices(false) : Promise.resolve([]),
      canEditAny ? db.listFaqs(false) : Promise.resolve([]),
      canEditAny ? db.listTestimonials(false) : Promise.resolve([]),
      canEditAny ? db.listTeamMembers(false) : Promise.resolve([]),
    ]);

  const visiblePosts = canEditAny
    ? allPosts
    : allPosts.filter((p) => p.authorId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="t-eyebrow text-primary">Content Operations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading">
            CMS Content Studio
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage Blog Insights (with live Markdown preview &amp; revision history), Case Studies &amp; Concept Blueprints, 8 Core Services, FAQs, Verified Testimonials, and Team Profiles under strict honesty and role guardrails.
          </p>
        </div>
        {canEditAny && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/admin/settings#pricing"
              className="rounded-full border border-line-strong bg-surface-card px-3.5 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
            >
              Pricing &amp; Coming Soon Studio →
            </Link>
            <Link
              href="/admin/theme"
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-heading"
            >
              Theme Library →
            </Link>
          </div>
        )}
      </div>

      <CmsWorkspaceClient
        initialTab={canEditAny ? requestedTab : "blog"}
        initialBlogPosts={visiblePosts}
        initialCaseStudies={caseStudies}
        initialServices={services}
        initialFaqs={faqs}
        initialTestimonials={testimonials}
        initialTeamMembers={teamMembers}
        canEditAny={canEditAny}
        canPublish={canPublish}
      />
    </div>
  );
}
