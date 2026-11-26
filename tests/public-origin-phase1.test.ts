import { afterEach, describe, expect, it, vi } from "vitest";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { POST as leads } from "@/app/api/leads/route";
import { POST as liveReport } from "@/app/api/admin/system/live-report/route";
import * as rate from "@/lib/security/rate-limit";

function req(headers: Record<string, string> = {}, method = "POST", url = "http://localhost:3000/api/leads") {
  return new Request(url, { method, headers });
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("public and diagnostics write Origin protection", () => {
  it("requires a non-null matching browser Origin rather than a Referer fallback", () => {
    const rejected: Record<string, string>[] = [
      { host: "localhost:3000" },
      { host: "localhost:3000", referer: "http://localhost:3000/" },
      { host: "localhost:3000", origin: "null" },
      { host: "localhost:3000", origin: "https://attacker.invalid" },
      { host: "localhost:3000", origin: "http://localhost:3000/path" },
      { host: "localhost:3000", origin: "http://localhost:3001" },
      { host: "localhost:3000", origin: "https://localhost:3000" },
      { host: "localhost:3000", origin: "http://localhost:3000", "sec-fetch-site": "cross-site" },
      { host: "localhost:3000,attacker.invalid", origin: "http://localhost:3000" },
    ];
    for (const headers of rejected) expect(verifySameOriginRequest(req(headers))).toBe(false);
    expect(verifySameOriginRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
    expect(verifySameOriginRequest(req({}, "GET"))).toBe(true);
  });
  it("ignores forged X-Forwarded-Host and requires the real public Host from the proxy", () => {
    const url = "http://internal:3000/api/leads";
    const origin = "https://agency.invalid";
    expect(verifySameOriginRequest(req({ host: "internal:3000", origin, "x-forwarded-host": "agency.invalid" }, "POST", url))).toBe(false);
    expect(verifySameOriginRequest(req({ host: "agency.invalid", origin, "x-forwarded-host": "evil.invalid" }, "POST", url))).toBe(true);
  });
  it("requires HTTPS Origin in production except the explicit localhost override", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "false");
    vi.stubEnv("OMNIFLOW_ALLOWED_WRITE_HOSTS", "agency.invalid");
    expect(verifySameOriginRequest(req({ host: "agency.invalid", origin: "http://agency.invalid" }, "POST", "http://internal:3000/api/leads"))).toBe(false);
    expect(verifySameOriginRequest(req({ host: "agency.invalid", origin: "https://agency.invalid" }, "POST", "http://internal:3000/api/leads"))).toBe(true);
    expect(verifySameOriginRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(false);
    vi.stubEnv("OMNIFLOW_ALLOW_LOCAL_DEV_DB", "true");
    expect(verifySameOriginRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
  });
  it("rejects missing or forged Origin before touching rate-limit/database handlers", async () => {
    const check = vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true });
    expect((await leads(req({ host: "localhost:3000", "x-forwarded-host": "attacker.invalid", origin: "https://attacker.invalid" }))).status).toBe(403);
    expect((await leads(req({ host: "localhost:3000" }))).status).toBe(403);
    expect((await liveReport(req({ host: "localhost:3000" }))).status).toBe(403);
    expect(check).not.toHaveBeenCalled();
    expect((await leads(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).status).toBe(503);
    expect(check).toHaveBeenCalledOnce();
  });
});
