import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getLiveSiteDiagnosticsReport,
  type LiveSiteAlertSummary,
} from "@/features/system/live-site-report";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { extractClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "dashboard:view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const summaryOnly = url.searchParams.get("summary") === "1";

  const report = await getLiveSiteDiagnosticsReport();

  if (summaryOnly) {
    const summary: LiveSiteAlertSummary = {
      overallStatus: report.overallStatus,
      score: report.score,
      criticalCount: report.criticalCount,
      warningCount: report.warningCount,
      healthyCount: report.healthyCount,
      unresolvedIncidentCount: report.unresolvedIncidentCount,
      topAlertTitle: report.topAlertTitle,
      topAlertSeverity: report.topAlertSeverity,
      checkedAt: report.checkedAt,
    };
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("resolve_incident"),
    incidentId: z.string().min(1).max(64),
  }),
  z.object({
    action: z.literal("clear_incidents"),
  }),
  z.object({
    action: z.literal("record_probe_failure"),
    route: z.string().min(1).max(180),
    status: z.number().int().min(400).max(599),
  }),
]);

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request forbidden" },
      { status: 403 }
    );
  }

  const auth = await requireAdminApiAuth(request, "dashboard:view");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action payload" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.action === "resolve_incident") {
    await db.resolveSiteErrorIncidents({ incidentId: data.incidentId });
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "diagnostics.incident_resolved",
      entityType: "diagnostics",
      entityId: data.incidentId,
      summary: `Marked site error incident ${data.incidentId} as resolved.`,
      ipAddress: extractClientIp(request.headers),
    });
  } else if (data.action === "clear_incidents") {
    await db.resolveSiteErrorIncidents({ clearAll: true });
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "diagnostics.incidents_cleared",
      entityType: "diagnostics",
      summary: "Cleared site runtime error log.",
      ipAddress: extractClientIp(request.headers),
    });
  } else if (data.action === "record_probe_failure") {
    await db.recordSiteErrorIncident({
      severity: data.status >= 500 ? "critical" : "warning",
      source: "api",
      route: data.route,
      message: `Live route probe returned HTTP ${data.status}`,
    });
  }

  const report = await getLiveSiteDiagnosticsReport();
  return NextResponse.json({ ok: true, report });
}
