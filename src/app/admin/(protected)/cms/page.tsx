import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { CmsWorkspaceClient } from "@/features/admin/CmsWorkspaceClient";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminCmsPage() {
  const { user, settings, allowed } = await requireAdminPageAuth(
    "content:create_draft"
  );
  if (!allowed) {
    return (
      <AccessDeniedCard role={user.role} moduleName="CMS Content Studio" />
    );
  }

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
      <div>
        <p className="t-eyebrow text-primary">Content Operations</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          CMS Content Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage Blog Insights (with revision history), Case Studies &amp; Concept Blueprints, Services, FAQs, Verified Testimonials, and Team Profiles under strict honesty and role guardrails.
        </p>
      </div>

      <CmsWorkspaceClient
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
