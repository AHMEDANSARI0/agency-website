import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
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

  const themeConfig = await db.getThemeConfig();

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Design System Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Theme &amp; Color Token Manager
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Control Dark &amp; Light semantic tokens, component overrides, WCAG AA contrast checks, custom presets, and one-click rollbacks.
        </p>
      </div>

      <ThemeManagerClient
        initialConfig={themeConfig}
        builtInPresets={BUILT_IN_THEME_PRESETS}
      />
    </div>
  );
}
