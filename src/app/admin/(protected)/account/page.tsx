import React from "react";
import { AccountSecurityClient } from "@/features/admin/AccountSecurityClient";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminAccountSecurityPage() {
  const { user, settings } = await requireAdminPageAuth(undefined, {
    allowUnchangedBootstrapPassword: true,
  });

  const canManageBackups =
    !user.mustChangePassword &&
    hasPermission(user.role, "settings:manage", settings.rolePolicies);

  const backups = canManageBackups ? await db.listBackups() : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Staff Credentials, Sessions & Backups
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading">
          Account Security & Disaster Recovery
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Rotate credentials, revoke active browser sessions, and manage verified database backups.
        </p>
      </div>

      <AccountSecurityClient
        user={user}
        initialBackups={backups}
        canManageBackups={canManageBackups}
      />
    </div>
  );
}
