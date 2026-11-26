import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/auth/setup/route";
import { db } from "@/lib/database";
import * as rate from "@/lib/security/rate-limit";

const valid = "0123456789abcdef".repeat(4); // synthetic; real tokens must be randomly generated
const other = "fedcba9876543210".repeat(4);
const request = (setupToken?: string) => new Request("https://agency.invalid/api/admin/auth/setup", {
  method: "POST", headers: { host: "agency.invalid", origin: "https://agency.invalid", "content-type": "application/json" },
  body: JSON.stringify({ name: "Test Admin", email: "admin@invalid.test", password: "SyntheticPassword9!", setupToken }),
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("dedicated production setup token", () => {
  it("fails closed without a valid separate setup token and never accepts signing keys", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false"); vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "agency.invalid");
    vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
    const count = vi.spyOn(db, "countUsers").mockResolvedValue(1);
    vi.stubEnv("AUTH_SECRET", valid); vi.stubEnv("SESSION_SECRET", other);
    for (const configured of ["", "replace-with-random-one-time-setup-token", "a".repeat(63), valid, other]) {
      vi.stubEnv("ADMIN_SETUP_TOKEN", configured);
      expect((await POST(request(configured || valid))).status, configured).toBe(403);
    }
    vi.stubEnv("ADMIN_SETUP_TOKEN", valid); vi.stubEnv("AUTH_SECRET", "another-signing-secret"); vi.stubEnv("SESSION_SECRET", "another-session-secret");
    expect((await POST(request(other))).status).toBe(403);
    expect((await POST(request())).status).toBe(403);
    expect(count).not.toHaveBeenCalled();
    expect((await POST(request(valid))).status).toBe(409); // authorized; existing account locks setup
    expect(count).toHaveBeenCalledOnce();
  });
  it("permits a properly authorized first setup", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false"); vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "agency.invalid");
    vi.stubEnv("ADMIN_SETUP_TOKEN", valid); vi.stubEnv("AUTH_SECRET", "test-signing-secret-distinct-from-the-setup-token-123456"); vi.stubEnv("SESSION_SECRET", "");
    vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
    vi.spyOn(db, "countUsers").mockResolvedValue(0);
    const user = { id: "setup-test", email: "admin@invalid.test", name: "Test Admin", role: "SUPER_ADMIN" as const, mustChangePassword: false, passwordHash: "unused", isActive: true, sessionVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastLoginAt: null };
    const create = vi.spyOn(db, "createInitialSuperAdminAtomically").mockResolvedValue({status: "created", user});
    vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
    const result = await POST(request(valid));
    expect(result.status).toBe(201); expect(create).toHaveBeenCalledOnce();
    expect(result.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("retains local development setup behavior", async () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "false"); vi.stubEnv("ADMIN_SETUP_TOKEN", "");
    vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
    const count = vi.spyOn(db, "countUsers").mockResolvedValue(1);
    const r = new Request("http://localhost:3000/api/admin/auth/setup", {method: "POST", headers: {host: "localhost:3000", origin: "http://localhost:3000", "content-type": "application/json"}, body: JSON.stringify({ name: "Test Admin", email: "admin@invalid.test", password: "SyntheticPassword9!" })});
    expect((await POST(r)).status).toBe(409); expect(count).toHaveBeenCalledOnce();
  });
});
