import { NextResponse } from "next/server";
import { getSystemHealthReport } from "@/features/system/health";

export async function GET(request: Request) {
  let probe: "liveness" | "readiness" = "readiness";
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("probe") === "liveness") {
      probe = "liveness";
    }
  } catch {
    probe = "readiness";
  }

  const report = await getSystemHealthReport({ probe });

  // Public health payload intentionally omits credentials, tokens, internal paths, and stack traces
  return NextResponse.json(
    {
      status: report.status === "healthy" ? "ok" : report.status,
      healthState: report.status,
      probe: report.probe,
      service: report.application.service,
      version: report.application.version,
      phase: 7,
      securityProfile: "csp-csrf-ratelimit-idempotent-v8",
      environment: report.application.environment,
      databaseMode: report.database.driver,
      database: {
        connected: report.database.connected,
        schemaReady: report.database.schemaReady,
        driver: report.database.driver,
        latencyMs: report.database.latencyMs,
      },
      storageMode: report.storage.provider,
      storage: {
        provider: report.storage.provider,
        configured: report.storage.configured,
        healthy: report.storage.healthy,
      },
      email: {
        configured: report.email.configured,
        provider: report.email.provider,
      },
      domain: {
        canonicalUrl: report.domain.canonicalUrl,
        https: report.domain.https,
      },
      timestamp: report.timestamp,
    },
    {
      status: report.httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
