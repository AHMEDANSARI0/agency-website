import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/telemetry/error/route";
import { db } from "@/lib/database";
import * as limits from "@/lib/security/rate-limit";

const payload = JSON.stringify({ source: "client_runtime", severity: "warning", route: "/pricing", message: "Synthetic error" });
const allowed = { allowed: true, remaining: 119, retryAfterSeconds: 0 };
function req(body: BodyInit = payload, headers: Record<string, string> = { "content-type": "application/json" }) {
  return new Request("http://localhost:3000/api/telemetry/error", { method: "POST", headers, body });
}
beforeEach(() => {
  vi.spyOn(limits, "checkRateLimit").mockReturnValue(allowed);
  vi.spyOn(limits, "checkDistributedRateLimit").mockResolvedValue(allowed);
  vi.spyOn(db, "recordSiteErrorIncident").mockResolvedValue({} as never);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("bounded public error telemetry", () => {
  it("records a valid event using fixed global limiter keys without trusting client IP", async () => {
    const res = await POST(req(payload, { "content-type": "application/json; charset=utf-8", "x-forwarded-for": "1.2.3.4" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(limits.checkRateLimit).toHaveBeenCalledWith("telemetry_error_global_local_v1", 120, 60000);
    expect(limits.checkDistributedRateLimit).toHaveBeenCalledWith("telemetry_error_global_v1", 120, 60000);
    expect(db.recordSiteErrorIncident).toHaveBeenCalledOnce();
  });
  it("rejects invalid content type, bad JSON and invalid schema", async () => {
    expect((await POST(req(payload, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(req("{"))).status).toBe(400);
    expect((await POST(req('{}'))).status).toBe(400);
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
  });
  it("enforces byte limit for declared, absent, and falsely small lengths", async () => {
    expect((await POST(req("{}", { "content-type": "application/json", "content-length": "4097" }))).status).toBe(413);
    expect((await POST(req("x".repeat(4097)))).status).toBe(413);
    expect((await POST(req("x".repeat(4097), { "content-type": "application/json", "content-length": "5" }))).status).toBe(413);
    expect((await POST(req('"' + 'é'.repeat(2048) + '"'))).status).toBe(413);
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
  });
  it("blocks early at per-process guard and returns retry guidance", async () => {
    vi.mocked(limits.checkRateLimit).mockReturnValue({ allowed: false, remaining: 0, retryAfterSeconds: 8 });
    const res = await POST(req());
    expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBe("8");
    expect(limits.checkDistributedRateLimit).not.toHaveBeenCalled();
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
  });
  it("blocks shared limit and fails closed when production limiter is unavailable", async () => {
    vi.mocked(limits.checkDistributedRateLimit).mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 9 });
    const blocked = await POST(req()); expect(blocked.status).toBe(429); expect(blocked.headers.get("retry-after")).toBe("9");
    vi.mocked(limits.checkDistributedRateLimit).mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60, unavailable: true });
    const unavailable = await POST(req()); expect(unavailable.status).toBe(503);
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
  });
  it("uses the real production fail-closed path when the shared store is unavailable", async () => {
    vi.mocked(limits.checkDistributedRateLimit).mockRestore();
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(db, "checkDistributedRateLimitBucket").mockResolvedValue(null);
    expect((await POST(req())).status).toBe(503);
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
  });
  it("enforces the real local fixed-key limit over 121 requests", async () => {
    vi.mocked(limits.checkRateLimit).mockRestore();
    vi.mocked(limits.checkDistributedRateLimit).mockRestore();
    vi.spyOn(db, "checkDistributedRateLimitBucket").mockResolvedValue(null);
    for (let n = 0; n < 120; n++) expect((await POST(req())).status).toBe(200);
    expect((await POST(req())).status).toBe(429);
    expect(db.recordSiteErrorIncident).toHaveBeenCalledTimes(120);
  });
  it("ignores benign noise and stays best-effort on storage failure", async () => {
    const noise = JSON.stringify({ route: "/", message: "ResizeObserver loop limit exceeded" });
    expect(await (await POST(req(noise))).json()).toMatchObject({ ignored: true });
    expect(db.recordSiteErrorIncident).not.toHaveBeenCalled();
    vi.mocked(db.recordSiteErrorIncident).mockRejectedValue(new Error("down"));
    expect((await POST(req())).status).toBe(200);
  });
});
