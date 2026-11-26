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
  const requestedProbe = new URL(request.url).searchParams.get("probe");
  // Liveness never calls the database, storage, or authentication.
  if (requestedProbe === "liveness") {
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE_HEADERS });
  }

  let token: string | null = null;
  try { token = extractSessionTokenFromCookieHeader(request.headers.get("cookie")); }
  catch { return NextResponse.json({ status: "unauthorized" }, { status: 401, headers: NO_STORE_HEADERS }); }
  let isAuthenticatedAdmin = false;
  if (token) {
    try {
      const user = await resolveAdminUserFromToken(token);
      if (user && (user.role !== "SUPER_ADMIN" || user.mustChangePassword)) {
        return NextResponse.json({ status: "forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
      }
      isAuthenticatedAdmin = Boolean(user);
    } catch {
      return NextResponse.json({ status: "unavailable" }, { status: 503, headers: NO_STORE_HEADERS });
    }
  }
  if (!isAuthenticatedAdmin) {
    if (requestedProbe === "readiness") {
      return NextResponse.json({ status: "unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    // Legacy default URL doubles as cheap liveness when unauthenticated.
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE_HEADERS });
  }
  const probe = "readiness" as const;

  const report = await getSystemHealthReport({ probe });
  const normalizedStatus: "ok" | "degraded" =
    report.status === "healthy" ? "ok" : "degraded";

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
        missingTables: report.database.missingTables,
        missingColumns: report.database.missingColumns,
        missingMigrations: report.database.missingMigrations ?? [],
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
