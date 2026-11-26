import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { GET, dynamic } from "@/app/api/redirects/route";
import { NextRequest } from "next/server";

const rule = (destinationPath: string) => ({ sourcePath: "/OLD/", destinationPath, permanent: true });
const response = (destinationPath: string) => new Response(JSON.stringify({ rules: [rule(destinationPath)] }), { status: 200 });

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("redirect refresh and caching", () => {
  it("serves active rules directly with no-store and returns a no-store 503 on DB errors", async () => {
    vi.spyOn(db, "listRedirects").mockResolvedValue([
      { id: "one", sourcePath: "/old", destinationPath: "/new", permanent: true, isActive: true, createdAt: "2025-01-01" },
      { id: "two", sourcePath: "/hidden", destinationPath: "/new", permanent: false, isActive: false, createdAt: "2025-01-01" },
    ] as never);
    const result = await GET();
    expect(dynamic).toBe("force-dynamic"); expect(result.headers.get("cache-control")).toContain("no-store");
    expect(await result.json()).toEqual({ rules: [{ sourcePath: "/old", destinationPath: "/new", permanent: true }] });
    vi.mocked(db.listRedirects).mockRejectedValue(new Error("offline"));
    const failed = await GET(); expect(failed.status).toBe(503); expect(failed.headers.get("cache-control")).toContain("no-store");
  });
  it("does not override the redirect API no-store header in production config", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { default: config } = await import("../next.config");
    const rules = await config.headers!();
    const matching = rules.filter(rule => rule.source === "/api/redirects");
    const header = matching.flatMap(rule => rule.headers).filter(h => h.key.toLowerCase() === "cache-control").at(-1);
    expect(header?.value).toBe("no-store, max-age=0");
  });
  it("reuses rules briefly, refreshes on expiry, and passes no-store to fetch", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response("/first")).mockResolvedValueOnce(response("/second"));
    vi.stubGlobal("fetch", fetcher);
    const { lookupEdgeRedirect } = await import("@/lib/security/edge-redirect-cache");
    expect(await lookupEdgeRedirect("https://site.example", "/old")).toEqual({ destinationPath: "/first", permanent: true });
    expect(await lookupEdgeRedirect("https://site.example", "/old/")).toEqual({ destinationPath: "/first", permanent: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store" });
    vi.advanceTimersByTime(15_000);
    expect(await lookupEdgeRedirect("https://site.example", "/old")).toEqual({ destinationPath: "/second", permanent: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("drops stale rules after failure and retries after a short backoff", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response("/first")).mockResolvedValueOnce(new Response("bad", { status: 503 })).mockResolvedValueOnce(response("/fixed"));
    vi.stubGlobal("fetch", fetcher);
    const { lookupEdgeRedirect } = await import("@/lib/security/edge-redirect-cache");
    await lookupEdgeRedirect("https://site.example", "/old"); vi.advanceTimersByTime(15_000);
    expect(await lookupEdgeRedirect("https://site.example", "/old")).toBeNull();
    expect(await lookupEdgeRedirect("https://site.example", "/old")).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2_000);
    expect(await lookupEdgeRedirect("https://site.example", "/old")).toEqual({ destinationPath: "/fixed", permanent: true });
  });
  it("coalesces concurrent lookups and does not reuse another origin's rules", async () => {
    let complete!: (value: Response) => void;
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { complete = resolve; })).mockResolvedValueOnce(response("/other"));
    vi.stubGlobal("fetch", fetcher);
    const { lookupEdgeRedirect } = await import("@/lib/security/edge-redirect-cache");
    const a = lookupEdgeRedirect("https://one.example", "/old");
    const b = lookupEdgeRedirect("https://one.example", "/old");
    expect(fetcher).toHaveBeenCalledTimes(1); complete(response("/one"));
    expect((await a)?.destinationPath).toBe("/one"); expect((await b)?.destinationPath).toBe("/one");
    expect((await lookupEdgeRedirect("https://two.example", "/old"))?.destinationPath).toBe("/other"); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("times out a failed fetch without retaining an old redirect", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response("/before"))
      .mockImplementationOnce((_url: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }));
    vi.stubGlobal("fetch", fetcher);
    const { lookupEdgeRedirect } = await import("@/lib/security/edge-redirect-cache");
    await lookupEdgeRedirect("https://site.example", "/old"); vi.advanceTimersByTime(15_000);
    const next = lookupEdgeRedirect("https://site.example", "/old");
    await vi.advanceTimersByTimeAsync(600);
    expect(await next).toBeNull();
  });
  it("does not apply malformed data, and editable 308 responses have no-store", async () => {
    vi.stubEnv("VITEST", ""); vi.stubEnv("NODE_ENV", "production");
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ rules: [{ sourcePath: "/old" }] })) ).mockResolvedValueOnce(response("/new"));
    vi.stubGlobal("fetch", fetcher);
    const { middleware } = await import("@/middleware");
    const first = await middleware(new NextRequest("https://site.example/old")); expect(first.status).toBe(200);
    vi.advanceTimersByTime(2_000);
    const second = await middleware(new NextRequest("https://site.example/old"));
    expect(second.status).toBe(308); expect(second.headers.get("location")).toBe("https://site.example/new");
    expect(second.headers.get("cache-control")).toContain("no-store");
  });
});
