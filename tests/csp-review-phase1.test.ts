import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
async function load(env: "production" | "development", strict = false) {
  vi.stubEnv("NODE_ENV", env); vi.stubEnv("ENABLE_STRICT_FRAME_HEADERS", strict ? "true" : "false"); vi.resetModules();
  const { default: config } = await import("../next.config");
  const rules = await config.headers!();
  const get = (route: string) => rules.find(r => r.source === route)!.headers.filter(h => h.key.toLowerCase() === "content-security-policy").at(-1)!.value;
  return { publicCsp: get("/(.*)"), adminCsp: get("/admin/:path*") };
}
function directive(csp: string, name: string) {
  return csp.split(";").map(x => x.trim()).find(x => x.startsWith(`${name} `)) || "";
}
describe("CSP review and narrow hardening", () => {
  it("limits admin script and connections without breaking public analytics allowlist", async () => {
    const { publicCsp, adminCsp } = await load("production");
    expect(directive(adminCsp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(adminCsp, "connect-src")).toBe("connect-src 'self'");
    expect(directive(publicCsp, "script-src")).toContain("https://www.googletagmanager.com");
    expect(directive(publicCsp, "connect-src")).toContain("https://www.google-analytics.com");
    expect(directive(adminCsp, "form-action")).toBe("form-action 'self'");
    expect(directive(publicCsp, "form-action")).toBe("form-action 'self'");
    expect(directive(adminCsp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(publicCsp, "frame-ancestors")).toBe("frame-ancestors 'self'");
    expect(adminCsp).not.toContain("'unsafe-eval'");
    expect(publicCsp).not.toContain("'unsafe-eval'");
    expect(directive(adminCsp, "object-src")).toBe("object-src 'none'");
  });
  it("preserves development compatibility and separately supports strict admin framing", async () => {
    const dev = await load("development");
    expect(dev.publicCsp).toContain("'unsafe-eval'");
    expect(dev.publicCsp).not.toContain("frame-ancestors");
    expect(directive(dev.publicCsp, "form-action")).toBe("form-action 'self'");
    const strict = await load("development", true);
    expect(directive(strict.adminCsp, "script-src")).not.toContain("googletagmanager");
    expect(directive(strict.adminCsp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(strict.adminCsp, "frame-ancestors")).toBe("frame-ancestors 'none'");
  });
});
