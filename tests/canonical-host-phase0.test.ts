import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { canonicalHostDestination } from "@/lib/security/canonical-host";
import { middleware } from "@/middleware";

afterEach(() => vi.unstubAllEnvs());
const lookup = (request: string, site = "https://agency.example", enabled = true, env?: string) =>
  canonicalHostDestination(new URL(request), site, enabled, env)?.toString() ?? null;

describe("opt-in canonical website host redirect", () => {
  it("maps only the exact www/apex pair and preserves path and query", () => {
    expect(lookup("http://www.agency.example/services?q=hello%20world&n=2")).toBe("https://agency.example/services?q=hello%20world&n=2");
    expect(lookup("https://agency.example/contact?x=1", "https://www.agency.example")).toBe("https://www.agency.example/contact?x=1");
    expect(lookup("https://agency.example/services")).toBeNull();
    expect(lookup("https://evil-agency.example/services")).toBeNull();
    expect(lookup("https://www.agency.example:444/services")).toBeNull();
  });
  it("uses the Host header while never copying an internal port to the target", () => {
    const local = new URL("http://localhost:3138/a?x=1");
    expect(canonicalHostDestination(local, "https://agency.example", true, "production", "www.agency.example")?.toString()).toBe("https://agency.example/a?x=1");
    expect(canonicalHostDestination(local, "https://agency.example", true, "production", "www.agency.example.evil.test")).toBeNull();
    expect(canonicalHostDestination(local, "https://agency.example", true, "production", "www.agency.example:3138")).toBeNull();
  });
  it("requires explicit opt-in, a valid HTTPS origin and non-preview deployment", () => {
    expect(lookup("https://www.agency.example/a", "https://agency.example", false)).toBeNull();
    for (const value of ["", "not a url", "http://agency.example", "https://agency.example/path", "https://agency.example?x=1", "https://u:p@agency.example", "https://agency.example:444", "https://127.0.0.1", "https://project.vercel.app"]) {
      expect(lookup("https://www.agency.example/a", value), value).toBeNull();
    }
    expect(lookup("https://www.agency.example/a", "https://agency.example", true, "preview")).toBeNull();
    expect(lookup("https://www.agency.example/a", "https://agency.example", true, "development")).toBeNull();
    expect(lookup("https://www.agency.example/a", "https://agency.example", true, "production")).toBe("https://agency.example/a");
  });
  it("middleware redirects the alternate host before admin auth and emits no-store", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_CANONICAL_REDIRECT", "true");
    vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agency.example");
    const res = await middleware(new NextRequest("https://www.agency.example/admin/login?next=%2Fadmin"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://agency.example/admin/login?next=%2Fadmin");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it("middleware does not redirect when disabled or on Vercel preview", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agency.example");
    vi.stubEnv("OMNIFLOW_CANONICAL_REDIRECT", "false"); vi.stubEnv("VERCEL_ENV", "production");
    expect((await middleware(new NextRequest("https://www.agency.example/"))).status).toBe(200);
    vi.stubEnv("OMNIFLOW_CANONICAL_REDIRECT", "true"); vi.stubEnv("VERCEL_ENV", "preview");
    expect((await middleware(new NextRequest("https://www.agency.example/"))).status).toBe(200);
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL_ENV", "production");
    expect((await middleware(new NextRequest("https://www.agency.example/"))).status).toBe(200);
  });
});
