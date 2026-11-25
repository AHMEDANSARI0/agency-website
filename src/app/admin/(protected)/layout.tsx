import React from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  getLiveSiteDiagnosticsReport,
  type LiveSiteAlertSummary,
} from "@/features/system/live-site-report";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, settings } = await requireAdminPageAuth("dashboard:view");
  const canViewLeads = hasPermission(
    user.role,
    "leads:view",
    settings.rolePolicies
  );

  const [brand, leads, diagnostics] = await Promise.all([
    db.getBrandAssets(),
    canViewLeads ? db.listLeads() : Promise.resolve([]),
    getLiveSiteDiagnosticsReport(),
  ]);

  const newLeadCount = leads.filter((l) => l.status === "New").length;

  const initialAlertSummary: LiveSiteAlertSummary = {
    overallStatus: diagnostics.overallStatus,
    score: diagnostics.score,
    criticalCount: diagnostics.criticalCount,
    warningCount: diagnostics.warningCount,
    healthyCount: diagnostics.healthyCount,
    unresolvedIncidentCount: diagnostics.unresolvedIncidentCount,
    topAlertTitle: diagnostics.topAlertTitle,
    topAlertSeverity: diagnostics.topAlertSeverity,
    checkedAt: diagnostics.checkedAt,
  };

  return (
    <AdminShell
      user={user}
      companyName={settings.companyName}
      brand={brand}
      rolePolicies={settings.rolePolicies}
      persistenceDriver={db.getMode()}
      newLeadCount={newLeadCount}
      initialAlertSummary={initialAlertSummary}
    >
      {children}
    </AdminShell>
  );
}
