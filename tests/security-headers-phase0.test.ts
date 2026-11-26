import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function loadRules(env: "production" | "development", strict = false) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", env);
  vi.stubEnv("ENABLE_STRICT_FRAME_HEADERS", strict ? "true" : "false");
  const { default: config } = await import("../next.config");
  return config.headers!();
}

function value(headers: { key: string; value: string }[], key: string) {
  return headers.filter(h => h.key.toLowerCase() === key.toLowerCase()).at(-1)?.value;
}

describe("security response headers", () => {
  it("locks down production admin framing without preloading subdomains", async () => {
    const rules = await loadRules("production");
    const global = rules.find(r => r.source === "/(.*)")!;
    const admin = rules.find(r => r.source === "/admin/:path*")!;
    expect(value(global.headers, "Strict-Transport-Security")).toBe("max-age=31536000");
    expect(value(global.headers, "X-Frame-Options")).toBe("SAMEORIGIN");
    expect(value(global.headers, "Content-Security-Policy")).toContain("frame-ancestors 'self'");
    expect(value(admin.headers, "X-Frame-Options")).toBe("DENY");
    expect(value(admin.headers, "Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(value(admin.headers, "Content-Security-Policy")).not.toContain("'unsafe-eval'");
    expect(value(admin.headers, "Cache-Control")).toBe("no-store, max-age=0");
  });

  it("keeps local development preview framing compatible", async () => {
    const rules = await loadRules("development");
    const admin = rules.find(r => r.source === "/admin/:path*")!;
    expect(value(admin.headers, "Content-Security-Policy")).not.toContain("frame-ancestors");
    expect(value(admin.headers, "X-Frame-Options")).toBeUndefined();
    expect(value(admin.headers, "Strict-Transport-Security")).toBeUndefined();
  });

  it("allows opt-in strict development framing", async () => {
    const rules = await loadRules("development", true);
    const admin = rules.find(r => r.source === "/admin/:path*")!;
    expect(value(admin.headers, "Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(value(admin.headers, "X-Frame-Options")).toBe("DENY");
  });
});
