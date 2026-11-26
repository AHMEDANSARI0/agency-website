import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeIpCandidate, extractClientIp } from "@/lib/security/rate-limit";
import * as rate from "@/lib/security/rate-limit";
import { POST as leads } from "@/app/api/leads/route";
import { POST as recover } from "@/app/api/admin/auth/recover/route";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
function headers(real: string, cf = "203.0.113.44") {
  return new Headers({ "x-real-ip": real, "cf-connecting-ip": cf, "x-forwarded-for": "192.0.2.10, 192.0.2.11" });
}
function req(path: string, spoof: string) {
  return new Request(`http://localhost:3000${path}`, { method: "POST", headers: { host: "localhost:3000", origin: "http://localhost:3000", "content-type": "application/json", "x-forwarded-for": spoof, "x-real-ip": spoof }, body: "{}" });
}
describe("client IP trust boundaries", () => {
  it("does not trust any forwarded IP header by default, even in production", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "");
    expect(extractClientIp(headers("203.0.113.7"))).toBe("unknown");
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "x-forwarded-for");
    expect(extractClientIp(headers("203.0.113.7"))).toBe("unknown");
  });
  it("uses only one explicitly configured exact header and rejects lists/ports", () => {
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "x-real-ip");
    expect(extractClientIp(headers("203.0.113.7"))).toBe("203.0.113.7");
    for (const invalid of ["203.0.113.7, 192.0.2.1", "203.0.113.7:3000", "[2001:db8::1]", "999.0.0.1", ":"]) {
      expect(extractClientIp(headers(invalid)), invalid).toBe("unknown");
    }
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "cf-connecting-ip");
    expect(extractClientIp(headers("203.0.113.7"))).toBe("203.0.113.44");
    expect(extractClientIp(new Headers({ "x-real-ip": "203.0.113.7" }))).toBe("unknown");
  });
  it("canonicalizes IPv6 and IPv4-mapped IPv6, without truncation", () => {
    expect(sanitizeIpCandidate("2001:0DB8:0:0:0:0:0:1")).toBe("2001:db8::1");
    expect(sanitizeIpCandidate("::ffff:192.0.2.1")).toBe("192.0.2.1");
    expect(sanitizeIpCandidate("::ffff:c000:201")).toBe("192.0.2.1");
    expect(sanitizeIpCandidate("2001:db8::1%eth0")).toBe("unknown");
    expect(sanitizeIpCandidate("203.0.113.7".repeat(8))).toBe("unknown");
  });
  it("uses the same conservative shared bucket even as client headers are rotated", async () => {
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "");
    const check = vi.spyOn(rate, "checkDistributedRateLimit").mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true });
    for (const ip of ["192.0.2.10", "192.0.2.11"]) {
      expect((await leads(req("/api/leads", ip))).status).toBe(503);
      expect((await recover(req("/api/admin/auth/recover", ip))).status).toBe(503);
    }
    expect(check.mock.calls.map(c => c[0])).toEqual(["lead_submit:unknown", "admin_recover:unknown", "lead_submit:unknown", "admin_recover:unknown"]);
  });
});
