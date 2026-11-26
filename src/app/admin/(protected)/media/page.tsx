import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { MediaLibraryClient } from "@/features/admin/MediaLibraryClient";
import {
  FREE_TIER_QUOTA_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/features/media/storage";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminMediaPage() {
  const { user, allowed } = await requireAdminPageAuth("media:manage");
  if (!allowed) {
    return (
      <AccessDeniedCard role={user.role} moduleName="Media Asset Library" />
    );
  }

  const assets = await db.listMediaAssets();

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow text-primary">Asset Governance</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink-heading">
          Media Library &amp; Safe Upload Studio
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Upload raster images, brand marks, and PDF documents with basic binary header checks, live usage tracking, and Supabase Storage / local fallback. New SVG uploads are disabled.
        </p>
      </div>

      <MediaLibraryClient
        initialAssets={assets}
        quotaBytes={FREE_TIER_QUOTA_BYTES}
        maxSingleUploadBytes={MAX_UPLOAD_BYTES}
      />
    </div>
  );
}
