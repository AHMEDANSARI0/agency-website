import React from "react";
import type { Metadata } from "next";
import { LiveSiteReportClient } from "@/features/admin/LiveSiteReportClient";
import { getLiveSiteDiagnosticsReport } from "@/features/system/live-site-report";
import { requireAdminPageAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Site Report & Diagnostics | OmniFlow Admin",
};

export default async function AdminLiveSiteDiagnosticsPage() {
  await requireAdminPageAuth("dashboard:view");
  const initialReport = await getLiveSiteDiagnosticsReport();

  return <LiveSiteReportClient initialReport={initialReport} />;
}
