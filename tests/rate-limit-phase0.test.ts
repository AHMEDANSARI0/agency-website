import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { checkDistributedRateLimit } from "@/lib/security/rate-limit";
import { POST as leads } from "@/app/api/leads/route";
import { POST as login } from "@/app/api/admin/auth/login/route";
import { POST as setup } from "@/app/api/admin/auth/setup/route";
import { POST as recover } from "@/app/api/admin/auth/recover/route";
import { POST as reset } from "@/app/api/admin/auth/reset-password/route";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const request = (path: string, body: unknown) => new Request(`http://localhost:3000${path}`, {
  method: "POST", headers: { host: "localhost:3000", origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(body),
});

describe("production distributed rate limiter", () => {
  it("fails closed on missing or throwing database bucket, while development can use memory", async () => {
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "true");
    const spy = vi.spyOn(db, "checkDistributedRateLimitBucket").mockResolvedValue(null);
    expect(await checkDistributedRateLimit("fixture-a", 5, 1000)).toMatchObject({ allowed: false, unavailable: true });
    spy.mockRejectedValue(new Error("private database error"));
    expect(await checkDistributedRateLimit("fixture-b", 5, 1000)).toMatchObject({ allowed: false, unavailable: true });
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "false");
    vi.stubEnv("NODE_ENV", "test");
    spy.mockResolvedValue(null);
    expect(await checkDistributedRateLimit("fixture-c", 5, 1000)).toMatchObject({ allowed: true });
  });
  it("returns generic 503 for protected public request flows when storage is unavailable", async () => {
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "true");
    vi.spyOn(db, "checkDistributedRateLimitBucket").mockResolvedValue(null);
    const cases = [
      [leads, request("/api/leads", {})],
      [login, request("/api/admin/auth/login", { email: "staff@example.org", password: "test" })],
      [setup, request("/api/admin/auth/setup", {})],
      [recover, request("/api/admin/auth/recover", {})],
      [reset, request("/api/admin/auth/reset-password", {})],
    ] as const;
    for (const [handler, req] of cases) {
      const response = await handler(req);
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.code).toBe("RATE_LIMIT_UNAVAILABLE");
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
  });
  it("rejects an authenticated admin write with 503 when the limiter fails", async () => {
    const user = createInitialSeedSnapshot().users[0];
    expect(user).toBeDefined();
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "true");
    vi.stubEnv("AUTH_SECRET", "fixture-secret-long-enough-for-testing-only");
    vi.spyOn(db, "findUserById").mockResolvedValue({ ...user, mustChangePassword: false });
    vi.spyOn(db, "checkDistributedRateLimitBucket").mockResolvedValue(null);
    const token = createSessionToken({ ...user, mustChangePassword: false });
    const req = request("/api/admin/owner-values", {});
    req.headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
    const result = await requireAdminApiAuth(req, "settings:manage");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
  });
});
