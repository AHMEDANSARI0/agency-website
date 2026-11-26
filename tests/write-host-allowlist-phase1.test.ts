import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedProductionWriteHost } from "@/lib/security/write-host";
import { verifyAdminWriteOrigin } from "@/lib/security/admin-origin";
import { POST as leads } from "@/app/api/leads/route";
import { POST as login } from "@/app/api/admin/auth/login/route";
import * as rate from "@/lib/security/rate-limit";

const req = (path: string, host: string, origin: string, headers: Record<string,string> = {}) => new Request(`http://internal:3000${path}`, {
  method: "POST", headers: { host, origin, "content-type": "application/json", ...headers }, body: "{}",
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("production write host allowlist", () => {
  it("accepts only exact normalized authorities and rejects malformed configuration", () => {
    expect(isAllowedProductionWriteHost("Agency.invalid:443", "agency.invalid,www.agency.invalid")).toBe(true);
    expect(isAllowedProductionWriteHost("agency.invalid:8443", "agency.invalid:8443")).toBe(true);
    expect(isAllowedProductionWriteHost("agency.invalid:8443", "agency.invalid")).toBe(false);
    for (const bad of ["", "agency.invalid,", "agency.invalid,*", "https://agency.invalid", "agency.invalid/path", "*.agency.invalid", "agency.invalid:99999"]) {
      expect(isAllowedProductionWriteHost("agency.invalid", bad), bad).toBe(false);
    }
    for (const badHost of ["agency.invalid.evil.test", "agency.invalid,evil.test", "evil.test", "user@agency.invalid", "agency.invalid/path"]) {
      expect(isAllowedProductionWriteHost(badHost, "agency.invalid")).toBe(false);
    }
    expect(isAllowedProductionWriteHost(null, "agency.invalid")).toBe(false);
  });
  it("fails closed in production when unset or invalid and rejects attacker-controlled Host+Origin pairs", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false");
    vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "");
    expect(verifyAdminWriteOrigin(req("/api/leads", "agency.invalid", "https://agency.invalid"))).toBe(false);
    vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "agency.invalid,www.agency.invalid");
    expect(verifyAdminWriteOrigin(req("/api/leads", "agency.invalid", "https://agency.invalid"))).toBe(true);
    expect(verifyAdminWriteOrigin(req("/api/leads", "www.agency.invalid", "https://www.agency.invalid"))).toBe(true);
    expect(verifyAdminWriteOrigin(req("/api/leads", "attacker.invalid", "https://attacker.invalid", { "x-forwarded-host": "agency.invalid" }))).toBe(false);
    expect(verifyAdminWriteOrigin(req("/api/leads", "internal:3000", "https://agency.invalid", { "x-forwarded-host": "agency.invalid" }))).toBe(false);
  });
  it("blocks public lead and login before invoking limiters unless allowed", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false"); vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "agency.invalid");
    const limiter = vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true });
    expect((await leads(req("/api/leads", "attacker.invalid", "https://attacker.invalid"))).status).toBe(403);
    expect((await login(req("/api/admin/auth/login", "attacker.invalid", "https://attacker.invalid"))).status).toBe(403);
    expect(limiter).not.toHaveBeenCalled();
    expect((await leads(req("/api/leads", "agency.invalid", "https://agency.invalid"))).status).toBe(503);
    expect(limiter).toHaveBeenCalledOnce();
  });
  it("preserves non-production local dev; explicit local HTTP override works in production mode", () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "");
    expect(verifyAdminWriteOrigin(new Request("http://localhost:3000/api", { method: "POST", headers: { host: "localhost:3000", origin: "http://localhost:3000" } }))).toBe(true);
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "true");
    expect(verifyAdminWriteOrigin(new Request("http://localhost:3000/api", { method: "POST", headers: { host: "localhost:3000", origin: "http://localhost:3000" } }))).toBe(true);
  });
});
