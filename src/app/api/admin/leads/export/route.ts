import { NextResponse } from "next/server";
import { serializeLeadsToCsv } from "@/features/leads/csv";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "leads:view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status")?.trim() || "ALL";

  const allLeads = await db.listLeads();
  const filtered =
    statusFilter === "ALL"
      ? allLeads
      : allLeads.filter((l) => l.status === statusFilter);

  const csvContent = serializeLeadsToCsv(filtered);

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "leads.export_csv",
    entityType: "lead",
    summary: `Exported ${filtered.length} lead record(s) to CSV (filter: ${statusFilter}).`,
    ipAddress: extractClientIp(request.headers),
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="omniflow-leads-${dateStamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
