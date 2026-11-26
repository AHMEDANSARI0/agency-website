import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rules: vi.fn(), notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }), redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }), permanent: vi.fn((url: string) => { throw new Error(`PERMANENT:${url}`); }) }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect, permanentRedirect: mocks.permanent }));
vi.mock("@/lib/cache/public-cache", () => ({
  getCachedActiveRedirects: mocks.rules,
  getCachedServiceBySlug: vi.fn(async () => null),
  getCachedPublishedServices: vi.fn(async () => []),
  getCachedPublishedCaseStudies: vi.fn(async () => []),
  getCachedSiteSettings: vi.fn(async () => ({})),
}));
import ServiceDetailPage from "@/app/(website)/services/[slug]/page";

beforeEach(() => vi.clearAllMocks());
describe("service fallback rejects unsafe pre-existing redirects", () => {
  it("does not execute an external rule even if an old cached reader returns it", async () => {
    mocks.rules.mockResolvedValue([{ sourcePath: "/services/legacy", destinationPath: "https://evil.example", permanent: true }]);
    await expect(ServiceDetailPage({ params: Promise.resolve({ slug: "legacy" }) })).rejects.toThrow("NOT_FOUND");
    expect(mocks.permanent).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("still executes a safe local legacy rule", async () => {
    mocks.rules.mockResolvedValue([{ sourcePath: "/services/legacy", destinationPath: "/contact?service=old", permanent: true }]);
    await expect(ServiceDetailPage({ params: Promise.resolve({ slug: "legacy" }) })).rejects.toThrow("PERMANENT:/contact?service=old");
    expect(mocks.permanent).toHaveBeenCalledWith("/contact?service=old");
  });
});
