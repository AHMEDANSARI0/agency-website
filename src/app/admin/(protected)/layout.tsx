import React from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, settings } = await requireAdminPageAuth("dashboard:view", {
    allowUnchangedBootstrapPassword: true,
  });
  const [brand, leads] = await Promise.all([
    db.getBrandAssets(),
    user.mustChangePassword ? Promise.resolve([]) : db.listLeads(),
  ]);
  const newLeadsCount = leads.filter((l) => l.status === "New").length;

  return (
    <AdminShell
      user={user}
      rolePolicies={settings.rolePolicies}
      brand={brand}
      databaseMode={db.getMode()}
      newLeadsCount={newLeadsCount}
    >
      {children}
    </AdminShell>
  );
}
