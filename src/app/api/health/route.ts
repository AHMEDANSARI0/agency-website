import { NextResponse } from "next/server";
import { getSystemHealthReport } from "@/features/system/health";
import {
  extractSessionTokenFromCookieHeader,
  resolveAdminUserFromToken,
} from "@/lib/auth/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

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

  let isAuthenticatedAdmin = false;
  try {
    const token = extractSessionTokenFromCookieHeader(
      request.headers.get("cookie")
    );
    if (token) {
      const adminUser = await resolveAdminUserFromToken(token);
      isAuthenticatedAdmin = Boolean(adminUser);
    }
  } catch {
    isAuthenticatedAdmin = false;
  }

  const report = await getSystemHealthReport({ probe });
  const normalizedStatus: "ok" | "degraded" =
    report.status === "healthy" ? "ok" : "degraded";

  // Public unauthenticated probe exposes strictly ok/degraded with zero internal details.
  if (!isAuthenticatedAdmin) {
    return NextResponse.json(
      { status: normalizedStatus },
      {
        status: report.httpStatus,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  // Authenticated staff diagnostics
  return NextResponse.json(
    {
      status: normalizedStatus,
      healthState: report.status,
      probe: report.probe,
      service: report.application.service,
      version: report.application.version,
      phase: 7,
      securityProfile: "csp-csrf-ratelimit-atomic-idempotent-v8.4",
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
      headers: NO_STORE_HEADERS,
    }
  );
}
