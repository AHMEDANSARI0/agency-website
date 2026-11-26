import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import { db } from "@/lib/database";
import { applyOwnerValues, resolveOwnerValues } from "@/lib/owner-config";
import { PUT } from "@/app/api/admin/owner-values/route";
import { requireAdminApiAuth } from "@/lib/auth/server";

vi.mock("@/lib/auth/server", () => ({ requireAdminApiAuth: vi.fn() }));
vi.mock("@/lib/cache/public-cache", () => ({ revalidateAllPublicContent: vi.fn() }));
const values = { contactEmail: "owner@example.org", priceFrom: "USD 250", founderPhotoUrl: "/media/founder.png" };
const request = (body: unknown) => new Request("http://localhost/api/admin/owner-values", { method: "PUT", headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" }, body: JSON.stringify(body) });

describe("Owner launch settings", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("applies saved public values without mutating existing CMS settings", () => {
    const { siteSettings, teamMembers } = createInitialSeedSnapshot();
    const settings = { ...siteSettings, ownerValues: values };
    const applied = applyOwnerValues(settings, teamMembers);
    expect(resolveOwnerValues(settings, teamMembers, {}).missing).toEqual([]);
    expect(applied.settings.contactEmail).toBe(values.contactEmail);
    expect(applied.settings.pricingConfig?.packages[0].projectPriceLabel).toBe(values.priceFrom);
    expect(JSON.stringify(applied.settings.pricingConfig)).not.toContain("{{PRICE_FROM}}");
    expect(applied.team.find(member => member.isFounder)?.avatarUrl).toBe(values.founderPhotoUrl);
    expect(siteSettings.contactEmail).toContain("{{CONTACT_EMAIL}}");
    expect(teamMembers.find(member => member.isFounder)?.avatarUrl).toBeNull();
  });
  it("requires authorization and rejects placeholders and invalid image URLs", async () => {
    expect((await PUT(new Request("http://localhost/api/admin/owner-values", { method: "PUT" }))).status).toBe(403);
    vi.mocked(requireAdminApiAuth).mockResolvedValueOnce({ ok: false, response: new Response("Unauthorized", { status: 401 }) as never });
    expect((await PUT(request(values))).status).toBe(401);
    const { siteSettings } = createInitialSeedSnapshot();
    vi.mocked(requireAdminApiAuth).mockResolvedValue({ ok: true, user: { id: "1", email: "admin@example.org", role: "super_admin" } as never, settings: siteSettings });
    const spy = vi.spyOn(db, "saveSiteSettings");
    for (const bad of [{ ...values, priceFrom: "{{PRICE_FROM}}" }, { ...values, contactEmail: "not-an-email" }, { ...values, founderPhotoUrl: "javascript:alert(1)" }]) {
      expect((await PUT(request(bad))).status).toBe(400);
    }
    expect(spy).not.toHaveBeenCalled();
  });
  it("saves to site settings, invalidates public cache and reports missing published founder", async () => {
    const { siteSettings } = createInitialSeedSnapshot();
    vi.mocked(requireAdminApiAuth).mockResolvedValue({ ok: true, user: { id: "1", email: "admin@example.org", role: "super_admin" } as never, settings: siteSettings });
    const save = vi.spyOn(db, "saveSiteSettings").mockImplementation(async settings => settings);
    vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
    vi.spyOn(db, "listTeamMembers").mockResolvedValue([]);
    const response = await PUT(request(values));
    expect(response.status).toBe(200);
    expect(save.mock.calls[0][0].ownerValues).toEqual(values);
    expect((await response.json()).missing).toContain("published founder photo");
    const { revalidateAllPublicContent } = await import("@/lib/cache/public-cache");
    expect(revalidateAllPublicContent).toHaveBeenCalled();
  });
});
