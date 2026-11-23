import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { PageBuilderClient } from "@/features/admin/PageBuilderClient";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminPageBuilderPage() {
  const { user, settings, allowed } =
    await requireAdminPageAuth("content:edit_any");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Controlled Page Section Builder"
      />
    );
  }

  const pages = await db.listPages();
  const canPublish = hasPermission(
    user.role,
    "content:publish",
    settings.rolePolicies
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Layout Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Controlled Page Section Builder
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Drag-and-drop approved design-system sections, toggle visibility, insert structured editorial Markdown blocks, save drafts, and publish safely without raw HTML/JS injection.
        </p>
      </div>

      <PageBuilderClient initialPages={pages} canPublish={canPublish} />
    </div>
  );
}
