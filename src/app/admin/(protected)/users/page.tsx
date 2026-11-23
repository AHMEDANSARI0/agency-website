import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { UsersManagerClient } from "@/features/admin/UsersManagerClient";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminUsersPage() {
  const { user, settings, allowed } = await requireAdminPageAuth("users:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard
        role={user.role}
        moduleName="Users & Role Policy Manager"
      />
    );
  }

  const users = await db.listUsers();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Identity & Least-Privilege Governance
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading">
          Users & Role Policies
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Provision staff accounts across Super Admin, Editor, and Author roles and configure server-enforced publishing permissions.
        </p>
      </div>

      <UsersManagerClient
        initialUsers={users}
        initialPolicies={settings.rolePolicies}
        currentUserId={user.id}
      />
    </div>
  );
}
