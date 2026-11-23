import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { AuditLogsClient } from "@/features/admin/AuditLogsClient";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminAuditLogsPage() {
  const { user, allowed } = await requireAdminPageAuth("audit:view");
  if (!allowed) {
    return (
      <AccessDeniedCard role={user.role} moduleName="Security Audit Logs" />
    );
  }

  const entries = await db.listAuditLogs(200);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Compliance & Security Visibility
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading">
          Security Audit Logs
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Chronological record of authentication attempts, lead pipeline updates, CSV exports, user provisioning, and role policy changes.
        </p>
      </div>

      <AuditLogsClient entries={entries} />
    </div>
  );
}
