import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST } from "@/app/api/admin/auth/logout/route";

const origin = "http://localhost:3000";
const user = { id: "logout-test", email: "test@example.invalid", name: "Test", role: "EDITOR" as const, sessionVersion: 1 };
const token = createSessionToken(user);
function req(cookie = `${SESSION_COOKIE_NAME}=${token}`, givenOrigin = origin) {
  return new Request(`${origin}/api/admin/auth/logout`, { method: "POST", headers: { host: "localhost:3000", origin: givenOrigin, cookie } });
}
afterEach(() => vi.restoreAllMocks());
describe("logout revocation", () => {
  it("revokes the signed session version before deleting the cookie", async () => {
    const revoke = vi.spyOn(db, "revokeSessionsForVersion").mockResolvedValue(user);
    const audit = vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(revoke).toHaveBeenCalledWith(user.id, 1);
    expect(audit).toHaveBeenCalledOnce();
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it("does not touch the database for invalid or malformed cookies", async () => {
    const revoke = vi.spyOn(db, "revokeSessionsForVersion");
    expect((await POST(req(`${SESSION_COOKIE_NAME}=bogus`))).status).toBe(200);
    expect((await POST(req(`${SESSION_COOKIE_NAME}=%ZZ`))).status).toBe(200);
    expect(revoke).not.toHaveBeenCalled();
  });
  it("rejects cross-origin logout before revocation", async () => {
    const revoke = vi.spyOn(db, "revokeSessionsForVersion");
    expect((await POST(req(undefined, "https://evil.example"))).status).toBe(403);
    expect(revoke).not.toHaveBeenCalled();
  });
  it("does not claim success or delete the cookie if the database fails", async () => {
    vi.spyOn(db, "revokeSessionsForVersion").mockRejectedValue(new Error("db down"));
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
  it("reports audit failure separately after successful revocation", async () => {
    vi.spyOn(db, "revokeSessionsForVersion").mockResolvedValue(user);
    vi.spyOn(db, "recordAuditLog").mockRejectedValue(new Error("audit down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, auditRecorded: false });
    expect(log).toHaveBeenCalledOnce();
  });
  it("does not audit repeated or stale logout", async () => {
    vi.spyOn(db, "revokeSessionsForVersion").mockResolvedValue(null);
    const audit = vi.spyOn(db, "recordAuditLog");
    expect((await POST(req())).status).toBe(200);
    expect(audit).not.toHaveBeenCalled();
  });
  it("fails closed with local JSON for a valid session", async () => {
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
