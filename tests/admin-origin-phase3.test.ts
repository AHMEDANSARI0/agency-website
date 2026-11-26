import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyAdminWriteOrigin } from "@/lib/security/admin-origin";
import { db } from "@/lib/database";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST as cmsPost } from "@/app/api/admin/cms/route";
import { POST as login } from "@/app/api/admin/auth/login/route";
import { POST as logout } from "@/app/api/admin/auth/logout/route";
import { POST as setup } from "@/app/api/admin/auth/setup/route";
import { POST as recover } from "@/app/api/admin/auth/recover/route";
import { POST as reset } from "@/app/api/admin/auth/reset-password/route";

const origin = "http://localhost:3000";
function req(method: string, headers: Record<string, string> = {}, body?: unknown) {
  return new Request(`${origin}/api/admin/cms`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
}
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("admin write origin verification", () => {
  it("requires matching Origin for mutations but leaves reads unchanged", () => {
    expect(verifyAdminWriteOrigin(req("GET"))).toBe(true);
    expect(verifyAdminWriteOrigin(req("POST"))).toBe(false);
    expect(verifyAdminWriteOrigin(req("POST", { referer: `${origin}/admin` }))).toBe(false);
    expect(verifyAdminWriteOrigin(req("POST", { origin: "null" }))).toBe(false);
    expect(verifyAdminWriteOrigin(req("POST", { origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
    expect(verifyAdminWriteOrigin(req("POST", { origin, host: "localhost:3000" }))).toBe(true);
    expect(verifyAdminWriteOrigin(req("POST", { origin, host: "localhost:3000", "sec-fetch-site": "cross-site" }))).toBe(false);
  });
  it("rejects forged forwarded hosts, invalid origin shapes, mismatched schemes and ports", () => {
    expect(verifyAdminWriteOrigin(req("POST", { host: "localhost:3000", "x-forwarded-host": "evil.example", origin: "https://evil.example" }))).toBe(false);
    for (const bad of ["http://localhost:3000/path", "http://u:p@localhost:3000", "http://localhost:3000?x=1", "https://localhost:3000", "http://localhost:3001", "https://evil.example,http://localhost:3000"]) {
      expect(verifyAdminWriteOrigin(req("POST", { origin: bad, host: "localhost:3000" })), bad).toBe(false);
    }
    expect(verifyAdminWriteOrigin(req("POST", { origin, host: "localhost:3000,evil.example" }))).toBe(false);
  });
  it("requires HTTPS in production except explicitly enabled loopback development", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false");
    expect(verifyAdminWriteOrigin(req("POST", { origin, host: "localhost:3000" }))).toBe(false);
    vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "true");
    expect(verifyAdminWriteOrigin(req("POST", { origin, host: "localhost:3000" }))).toBe(true);
    const localUrl = new Request("http://internal:3000/api", { method: "POST", headers: { host: "agency.example", origin: "https://agency.example" } });
    expect(verifyAdminWriteOrigin(localUrl)).toBe(true);
    const httpPublic = new Request("http://internal:3000/api", { method: "POST", headers: { host: "agency.example", origin: "http://agency.example" } });
    expect(verifyAdminWriteOrigin(httpPublic)).toBe(false);
  });
  it("blocks missing Origin before login, setup, recovery, reset and logout handlers", async () => {
    for (const handler of [login, setup, recover, reset, logout]) {
      const res = await handler(req("POST", { host: "localhost:3000", "content-type": "application/json" }, {}));
      expect(res.status).toBe(403);
    }
    const badLogin = await login(req("POST", { host: "localhost:3000", origin, "content-type": "application/json" }, {}));
    expect(badLogin.status).toBe(400);
  });
  it("protects a real authenticated CMS write while allowing matching browser Origin", async () => {
    const existing = await db.findUserByEmail("admin@omniflow.example"); expect(existing).not.toBeNull();
    const user = await db.updateUser(existing!.id, { mustChangePassword: false }); expect(user).not.toBeNull();
    const token = createSessionToken(user!);
    const headers = { "content-type": "application/json", host: "localhost:3000", cookie: `${SESSION_COOKIE_NAME}=${token}` };
    const payload = { entity: "faq", question: "Why is origin verified?", answer: "This is a synthetic test answer.", category: "General", order: 1, isPublished: false };
    const before = (await db.listFaqs(false)).length;
    expect((await cmsPost(req("POST", headers, payload))).status).toBe(403);
    expect((await db.listFaqs(false)).length).toBe(before);
    expect((await cmsPost(req("POST", { ...headers, origin: "https://evil.example" }, payload))).status).toBe(403);
    expect((await db.listFaqs(false)).length).toBe(before);
    expect((await cmsPost(req("POST", { ...headers, origin }, payload))).status).toBe(200);
    expect((await db.listFaqs(false)).length).toBe(before + 1);
  });
});
