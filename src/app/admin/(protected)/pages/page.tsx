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
        <p className="t-eyebrow text-primary">Shopify-Grade Visual Customizer</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Live Website Studio, Drag-and-Drop Sections &amp; 3D Globe Hero
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Drag-and-drop sections on the left, customize the interactive 3D Globe Hero (Quip Quantum Sphere, BlueOrbit Rising Horizon, or Soale Orbital Halo), and preview changes live on the right-side website canvas before saving or publishing.
        </p>
      </div>

      <PageBuilderClient initialPages={pages} canPublish={canPublish} />
    </div>
  );
}
