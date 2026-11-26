import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { CardMotionManager } from "@/features/admin/CardMotionManager";
import { ThemeManagerClient } from "@/features/admin/ThemeManagerClient";
import { BUILT_IN_THEME_PRESETS } from "@/features/themes/presets";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminThemePage() {
  const { user, allowed } = await requireAdminPageAuth("theme:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Theme & Color System Manager"
      />
    );
  }

  const [themeConfig, cardMotion] = await Promise.all([db.getThemeConfig(), db.getCardMotion()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Design System Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Extended Theme Library &amp; Token Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Activate, duplicate, rename, edit, or reset Light &amp; Dark palettes, adjust Inter typography weights/line-heights, inspect real Soale components live, and restore the overwrite-protected Original Agency Theme in one click.
        </p>
      </div>

      <CardMotionManager initial={cardMotion} />
      <ThemeManagerClient
        initialConfig={themeConfig}
        builtInPresets={BUILT_IN_THEME_PRESETS}
      />
    </div>
  );
}
