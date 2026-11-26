import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { OwnerValuesForm } from "@/features/admin/OwnerValuesForm";
import { resolveOwnerValues } from "@/lib/owner-config";
import { db } from "@/lib/database";
import { SiteSettingsClient } from "@/features/admin/SiteSettingsClient";
import { requireAdminPageAuth } from "@/lib/auth/server";

export default async function AdminSettingsPage() {
  const { user, settings, allowed } =
    await requireAdminPageAuth("settings:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Navigation, Footer & Global CTA Settings"
      />
    );
  }

  const team = await db.listTeamMembers(true);
  const initialOwner = resolveOwnerValues(settings, team).values;
  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Global Site Architecture</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Navigation, Pricing Scopes &amp; Global CTA Manager
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure company positioning, conversion CTAs, floating top navigation links, 4-tier Engagement Scopes &amp; Pricing (&ldquo;Coming Soon&rdquo; toggle), and footer columns across all public routes.
        </p>
      </div>

      <OwnerValuesForm initial={initialOwner} />
      <SiteSettingsClient initialSettings={settings} />
    </div>
  );
}
