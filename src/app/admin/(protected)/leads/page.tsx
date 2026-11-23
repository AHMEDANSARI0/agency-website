import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { LeadsCrmClient } from "@/features/admin/LeadsCrmClient";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminLeadsPage() {
  const { user, settings, allowed } = await requireAdminPageAuth("leads:view");
  if (!allowed) {
    return <AccessDeniedCard role={user.role} moduleName="Lead & Enquiry CRM" />;
  }

  const leads = await db.listLeads();
  const canManageLeads = hasPermission(
    user.role,
    "leads:manage",
    settings.rolePolicies
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Enquiry Pipeline & Follow-Up Tracking
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading">
          Lead & Enquiry CRM
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Triage inbound discovery enquiries across New, Contacted, Qualified, Proposal Sent, Won, and Lost stages with internal notes and formula-safe CSV export.
        </p>
      </div>

      <LeadsCrmClient initialLeads={leads} canManageLeads={canManageLeads} />
    </div>
  );
}
