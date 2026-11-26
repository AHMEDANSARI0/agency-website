import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.resetModules(); });

describe("admin cookie policy", () => {
  it("keeps normal local HTTP development usable", async () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "false"); vi.resetModules();
    const cfg = await import("@/lib/auth/session-cookie");
    expect(cfg.SESSION_COOKIE_NAME).toBe("omniflow_session");
    expect(cfg.getSessionCookieOptions()).toMatchObject({ httpOnly: true, secure: false, sameSite: "lax", path: "/" });
    expect(cfg.getSessionCookieOptions()).not.toHaveProperty("domain");
  });
  it("uses __Host- invariants in strict mode even outside production", async () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "true"); vi.resetModules();
    const cfg = await import("@/lib/auth/session-cookie");
    expect(cfg.SESSION_COOKIE_NAME).toBe("__Host-omniflow_session");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cfg.SESSION_COOKIE_NAME, "token", cfg.getSessionCookieOptions());
    const header = response.headers.get("set-cookie")!;
    expect(header).toContain("__Host-omniflow_session=token");
    expect(header).toContain("Secure"); expect(header).toContain("HttpOnly");
    expect(header).toContain("Path=/"); expect(header).toContain("SameSite=lax");
    expect(header.toLowerCase()).not.toContain("domain=");
  });
  it("issues, checks and deletes production cookie consistently; old name alone is ignored", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "false");
    vi.stubEnv("AUTH_SECRET", "synthetic-strong-random-signing-key-value-123456789");
    vi.resetModules();
    const { db } = await import("@/lib/database");
    const { hashPassword } = await import("@/lib/security/password");
    const { createSessionToken, SESSION_COOKIE_NAME } = await import("@/lib/auth/session");
    const { extractSessionTokenFromCookieHeader } = await import("@/lib/auth/server");
    const { middleware } = await import("@/middleware");
    const { POST: login } = await import("@/app/api/admin/auth/login/route");
    const { POST: logout } = await import("@/app/api/admin/auth/logout/route");
    const rate = await import("@/lib/security/rate-limit");
    const user = { id: "cookie-test-user", email: "admin@invalid.test", name: "Tester", role: "SUPER_ADMIN" as const, passwordHash: hashPassword("SyntheticPassword9!"), isActive: true, sessionVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastLoginAt: null };
    vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
    vi.spyOn(db, "countUsers").mockResolvedValue(1);
    vi.spyOn(db, "findUserByEmail").mockResolvedValue(user);
    vi.spyOn(db, "recordUserLogin").mockResolvedValue(undefined as never);
    vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
    vi.spyOn(db, "revokeSessionsForVersion").mockResolvedValue(user);
    const res = await login(new Request("https://agency.invalid/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json", host: "agency.invalid", origin: "https://agency.invalid" }, body: JSON.stringify({ email: user.email, password: "SyntheticPassword9!" }) }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie")!;
    expect(SESSION_COOKIE_NAME).toBe("__Host-omniflow_session");
    expect(setCookie).toContain("__Host-omniflow_session=");
    for (const text of ["Secure", "HttpOnly", "Path=/", "SameSite=lax"]) expect(setCookie).toContain(text);
    expect(setCookie.toLowerCase()).not.toContain("domain=");
    const token = extractSessionTokenFromCookieHeader(setCookie)!;
    expect(token).toBeTruthy();
    expect(extractSessionTokenFromCookieHeader(`omniflow_session=${token}`)).toBeNull();
    const correct = new NextRequest("https://agency.invalid/admin", { headers: { host: "agency.invalid", cookie: `${SESSION_COOKIE_NAME}=${token}` } });
    expect((await middleware(correct)).headers.get("x-middleware-next")).toBe("1");
    const legacy = new NextRequest("https://agency.invalid/admin", { headers: { host: "agency.invalid", cookie: `omniflow_session=${createSessionToken(user)}` } });
    expect((await middleware(legacy)).status).toBe(307);
    const signout = await logout(new Request("https://agency.invalid/api/admin/auth/logout", { method: "POST", headers: { host: "agency.invalid", origin: "https://agency.invalid", cookie: `${SESSION_COOKIE_NAME}=${token}` } }));
    expect(signout.status).toBe(200);
    const clear = signout.headers.get("set-cookie")!;
    expect(clear).toContain("__Host-omniflow_session="); expect(clear).toContain("Max-Age=0"); expect(clear).toContain("Secure");
    expect(clear.toLowerCase()).not.toContain("domain=");
  });
});
