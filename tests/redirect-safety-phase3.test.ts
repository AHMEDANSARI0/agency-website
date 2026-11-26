import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import { POST } from "@/app/api/admin/seo/route";
import { GET } from "@/app/api/redirects/route";
import { isSafeRedirectRule, isSafeRedirectSource, safeRedirectDestination } from "@/lib/security/redirect-safety";

vi.mock("@/lib/auth/server", () => ({ requireAdminApiAuth: vi.fn() }));
vi.mock("@/lib/cache/public-cache", async (original) => ({ ...await original<typeof import("@/lib/cache/public-cache")>(), revalidateAllPublicContent: vi.fn() }));
const seed = createInitialSeedSnapshot();
const request = (destinationPath: string, sourcePath = "/legacy") => new Request("https://agency.example/api/admin/seo", {
  method: "POST", headers: { "content-type": "application/json", origin: "https://agency.example", host: "agency.example" },
  body: JSON.stringify({ sourcePath, destinationPath, permanent: true, isActive: true }),
});
const unsafe = ["https://evil.example/path", "https://agency.example/services", "//evil.example/", "/\\evil.example/", "\\\\evil.example", "javascript:alert(1)", "mailto:x@example.com", "/%2f%2fevil.example", "/%5c%5cevil.example", "/%252f%252fevil.example", "/a/../admin", "/a/%2e%2e/admin", "/a\nLocation: https://evil.example", "/broken%2", "relative/path"];

beforeEach(() => {
  vi.restoreAllMocks(); vi.mocked(revalidateAllPublicContent).mockClear();
  vi.mocked(requireAdminApiAuth).mockResolvedValue({ ok: true, user: { id: "admin", email: "test@example.org", name: "Test", role: "SUPER_ADMIN" } as never, settings: seed.siteSettings });
  vi.spyOn(db, "listRedirects").mockResolvedValue([]);
  vi.spyOn(db, "upsertRedirect").mockImplementation(async rule => rule);
  vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("same-site custom redirect defense", () => {
  it("rejects external, malformed and ambiguous destinations; keeps useful local queries", () => {
    for (const value of unsafe) expect(safeRedirectDestination(value), value).toBeNull();
    expect(safeRedirectDestination("/contact?source=old%20page#form")).toBe("/contact?source=old%20page#form");
    expect(safeRedirectDestination("/services/%E2%9C%93")).toBe("/services/%E2%9C%93");
    for (const src of ["//host/path", "/api/foo", "/ADMIN/login", "/_next/x", "/a/../b", "/"]) expect(isSafeRedirectSource(src), src).toBe(false);
    expect(isSafeRedirectRule("/old", "/OLD?x=1")).toBe(false);
  });
  it("returns 400 without any DB mutation for unsafe destinations and source paths", async () => {
    for (const value of unsafe) expect((await POST(request(value))).status, value).toBe(400);
    for (const source of ["//evil.example", "/admin/login", "/ADMIN/login", "/a/../b"]) expect((await POST(request("/contact", source))).status, source).toBe(400);
    expect(db.upsertRedirect).not.toHaveBeenCalled(); expect(revalidateAllPublicContent).not.toHaveBeenCalled();
  });
  it("saves a same-site path and blocks query, case-insensitive and reverse loops", async () => {
    const ok = await POST(request("/contact?from=old#form")); expect(ok.status).toBe(200);
    expect(db.upsertRedirect).toHaveBeenCalledOnce(); expect(revalidateAllPublicContent).toHaveBeenCalledOnce();
    expect((await POST(request("/LEGACY?different=1"))).status).toBe(400);
    vi.mocked(db.listRedirects).mockResolvedValue([{ id: "a", sourcePath: "/contact", destinationPath: "/LEGACY?x=1", isActive: true, permanent: true, createdAt: "x" }]);
    expect((await POST(request("/CONTACT?from=old"))).status).toBe(400);
  });
  it("does not save without authorization", async () => {
    vi.mocked(requireAdminApiAuth).mockResolvedValueOnce({ ok: false, response: new Response("denied", { status: 401 }) } as never);
    expect((await POST(request("/contact"))).status).toBe(401);
    expect(db.upsertRedirect).not.toHaveBeenCalled();
    expect(revalidateAllPublicContent).not.toHaveBeenCalled();
  });
  it("public rules omit unsafe legacy records, preserve valid records and do not modify DB", async () => {
    const record = (id: string, sourcePath: string, destinationPath: string) => ({ id, sourcePath, destinationPath, isActive: true, permanent: true, createdAt: "x" });
    vi.mocked(db.listRedirects).mockResolvedValue([record("1", "/safe", "/contact?x=1"), record("2", "/bad", "https://evil.example"), record("3", "/loop", "/LOOP"), record("4", "/ADMIN", "/contact")]);
    const res = await GET(); expect(res.status).toBe(200); expect(res.headers.get("cache-control")).toContain("no-store");
    expect(await res.json()).toEqual({ rules: [{ sourcePath: "/safe", destinationPath: "/contact?x=1", permanent: true }] });
    expect(db.upsertRedirect).not.toHaveBeenCalled();
  });
  it("edge lookup independently filters malicious legacy values without discarding valid rules", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ rules: [
      { sourcePath: "/good", destinationPath: "/contact", permanent: true },
      { sourcePath: "/bad", destinationPath: "//evil.example", permanent: true },
      { sourcePath: "/loop", destinationPath: "/loop?x=1", permanent: false },
    ] }))));
    const { lookupEdgeRedirect } = await import("@/lib/security/edge-redirect-cache");
    expect(await lookupEdgeRedirect("https://agency.example", "/good")).toEqual({ destinationPath: "/contact", permanent: true });
    expect(await lookupEdgeRedirect("https://agency.example", "/bad")).toBeNull();
    expect(await lookupEdgeRedirect("https://agency.example", "/loop")).toBeNull();
  });
});
