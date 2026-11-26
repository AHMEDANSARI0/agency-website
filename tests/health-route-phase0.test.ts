import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { getSystemHealthReport } from "@/features/system/health";
import { extractSessionTokenFromCookieHeader, resolveAdminUserFromToken } from "@/lib/auth/server";

vi.mock("@/features/system/health", () => ({ getSystemHealthReport: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({
  extractSessionTokenFromCookieHeader: vi.fn(),
  resolveAdminUserFromToken: vi.fn(),
}));
afterEach(() => vi.resetAllMocks());

const report = {
  status: "unhealthy", httpStatus: 503, probe: "readiness", timestamp: "2026-01-01",
  application: { service: "Fixture", version: "1.0", environment: "production" },
  database: { connected: false, schemaReady: false, driver: "supabase_postgres", latencyMs: 5 },
  storage: { provider: "supabase_storage", configured: false, healthy: false },
  email: { configured: false, provider: "disabled" }, domain: { canonicalUrl: "https://example.org", https: true },
};

describe("health route isolation", () => {
  it("returns cheap liveness regardless of cookies and never reads dependencies", async () => {
    const response = await GET(new Request("http://localhost/api/health?probe=liveness", { headers: { cookie: "bad=1" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(extractSessionTokenFromCookieHeader).not.toHaveBeenCalled();
    expect(resolveAdminUserFromToken).not.toHaveBeenCalled();
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
  it("blocks unauthenticated readiness without querying dependencies", async () => {
    const response = await GET(new Request("http://localhost/api/health?probe=readiness"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ status: "unauthorized" });
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
  it("keeps anonymous default health as liveness for compatibility", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
  it("returns protected readiness diagnostics and unavailable status when dependencies fail", async () => {
    vi.mocked(extractSessionTokenFromCookieHeader).mockReturnValue("valid-token");
    vi.mocked(resolveAdminUserFromToken).mockResolvedValue({ id: "test", role: "SUPER_ADMIN" } as never);
    vi.mocked(getSystemHealthReport).mockResolvedValue(report as never);
    const response = await GET(new Request("http://localhost/api/health?probe=readiness", { headers: { cookie: "test=1" } }));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.database.schemaReady).toBe(false);
    expect(getSystemHealthReport).toHaveBeenCalledWith({ probe: "readiness" });
  });
  it("rejects malformed session cookies without leaking errors", async () => {
    vi.mocked(extractSessionTokenFromCookieHeader).mockImplementation(() => { throw new Error("malformed cookie"); });
    const response = await GET(new Request("http://localhost/api/health?probe=readiness", { headers: { cookie: "test=%" } }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ status: "unauthorized" });
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
  it("rejects authenticated non-super-admin roles without probing readiness", async () => {
    vi.mocked(extractSessionTokenFromCookieHeader).mockReturnValue("staff-token");
    vi.mocked(resolveAdminUserFromToken).mockResolvedValue({ id: "test", role: "AUTHOR" } as never);
    const response = await GET(new Request("http://localhost/api/health?probe=readiness", { headers: { cookie: "test=1" } }));
    expect(response.status).toBe(403);
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
  it("fails closed without revealing details if authentication backend fails", async () => {
    vi.mocked(extractSessionTokenFromCookieHeader).mockReturnValue("valid-token");
    vi.mocked(resolveAdminUserFromToken).mockRejectedValue(new Error("secret backend error"));
    const response = await GET(new Request("http://localhost/api/health?probe=readiness", { headers: { cookie: "test=1" } }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
    expect(getSystemHealthReport).not.toHaveBeenCalled();
  });
});
