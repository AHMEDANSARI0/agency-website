import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { BrandManagerClient } from "@/features/admin/BrandManagerClient";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminBrandPage() {
  const { user, allowed } = await requireAdminPageAuth("brand:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard role={user.role} moduleName="Brand Identity & Assets" />
    );
  }

  const brandAssets = await db.getBrandAssets();

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Replaceable Identity System</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Brand Identity &amp; Logo Assets
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure Light/Dark logos, symbol icon, favicon, and social OpenGraph assets without code edits.
        </p>
      </div>

      <BrandManagerClient initialBrand={brandAssets} />
    </div>
  );
}
