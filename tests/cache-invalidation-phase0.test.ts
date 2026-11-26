import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { POST as cmsSave, DELETE as cmsDelete } from "@/app/api/admin/cms/route";
import { POST as themeAction } from "@/app/api/admin/theme/route";
import { POST as seoRedirect, DELETE as seoDelete } from "@/app/api/admin/seo/route";
import { POST as backupAction } from "@/app/api/admin/system/backups/route";
import { PUT as brandSave } from "@/app/api/admin/brand/route";
import { PUT as settingsSave } from "@/app/api/admin/settings/route";
import { PUT as pageSave } from "@/app/api/admin/pages/route";

vi.mock("@/lib/auth/server", () => ({ requireAdminApiAuth: vi.fn() }));
vi.mock("@/lib/cache/public-cache", async (loadOriginal) => {
  const actual = await loadOriginal<typeof import("@/lib/cache/public-cache")>();
  return { ...actual, revalidateAllPublicContent: vi.fn() };
});
const req = (path: string, body: unknown, method = "POST") => new Request(`http://localhost:3000${path}`, {
  method, headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000" }, body: JSON.stringify(body),
});
const clean = () => vi.mocked(revalidateAllPublicContent).mockClear();
const seed = createInitialSeedSnapshot();

beforeEach(() => {
  vi.restoreAllMocks(); clean();
  vi.mocked(requireAdminApiAuth).mockResolvedValue({ ok: true, user: { id: "admin", email: "test@example.org", name: "Test", role: "SUPER_ADMIN" } as never, settings: seed.siteSettings });
  vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
});

const content = [
  { entity: "blog", slug: "article-test", title: "Test Article", excerpt: "A sufficiently long excerpt.", contentMarkdown: "A sufficiently long article body for testing.", category: "Test", status: "draft" },
  { entity: "case_study", slug: "case-test", title: "Test case", workType: "concept_demo", clientPermissionGranted: false, industry: "Agency", businessType: "Services", problemSummary: "A suitably long problem.", manualProcessBefore: ["Manual"], proposedAutomation: "An automated process.", automatedWorkflowAfter: ["Automated"], technologiesUsed: ["Tools"], verifiedResults: ["No claims"], status: "draft" },
  { entity: "service", slug: "test-service", title: "Test service", categorySlug: "test", categoryName: "Test", isFlagshipPriority: false, badgeLabel: "Test", shortSummary: "A suitable summary.", problemStatement: "A suitable problem.", solutionOverview: "A suitable solution.", benefits: ["Benefit"], ctaLabel: "Contact", ctaHref: "/contact", order: 1, status: "draft" },
  { entity: "faq", question: "What is this?", answer: "A meaningful answer.", category: "General", order: 1, isPublished: true },
  { entity: "testimonial", authorName: "Test Person", authorRole: "Founder", companyName: "Test Co", country: "UK", quote: "This is a synthetic test quote.", isAuthorized: false, isVerified: false, isPublished: false },
  { entity: "team", name: "Test Person", role: "Engineer", isFounder: false, bio: "An appropriate test biography.", focusAreas: ["Systems"], regionsServed: ["UK"], order: 1, isPublished: false },
];

describe("public cache invalidation after admin mutations", () => {
  it("invalidates after each CMS entity save and successful delete, but not invalid input", async () => {
    vi.spyOn(db, "listCaseStudies").mockResolvedValue([]); vi.spyOn(db, "listServices").mockResolvedValue([]);
    vi.spyOn(db, "upsertBlogPost").mockImplementation(async x => x);
    vi.spyOn(db, "upsertCaseStudy").mockImplementation(async x => x);
    vi.spyOn(db, "upsertService").mockImplementation(async x => x);
    vi.spyOn(db, "upsertFaq").mockImplementation(async x => x);
    vi.spyOn(db, "upsertTestimonial").mockImplementation(async x => x);
    vi.spyOn(db, "upsertTeamMember").mockImplementation(async x => x);
    for (const item of content) {
      clean(); const response = await cmsSave(req("/api/admin/cms", item));
      expect(response.status, item.entity).toBe(200);
      expect(revalidateAllPublicContent, item.entity).toHaveBeenCalledTimes(1);
    }
    vi.spyOn(db, "deleteBlogPost").mockResolvedValue(true); vi.spyOn(db, "deleteCaseStudy").mockResolvedValue(true);
    vi.spyOn(db, "deleteService").mockResolvedValue(true); vi.spyOn(db, "deleteFaq").mockResolvedValue(true);
    vi.spyOn(db, "deleteTestimonial").mockResolvedValue(true); vi.spyOn(db, "deleteTeamMember").mockResolvedValue(true);
    for (const item of content) {
      clean(); const response = await cmsDelete(new Request(`http://localhost:3000/api/admin/cms?entity=${item.entity}&id=fixture`, { method: "DELETE" }));
      expect(response.status, item.entity).toBe(200); expect(revalidateAllPublicContent, item.entity).toHaveBeenCalledTimes(1);
    }
    clean(); expect((await cmsSave(req("/api/admin/cms", {}))).status).toBe(400); expect(revalidateAllPublicContent).not.toHaveBeenCalled();
  });
  it("invalidates a successful save before attempting audit logging", async () => {
    vi.spyOn(db, "upsertFaq").mockImplementation(async x => x);
    vi.spyOn(db, "recordAuditLog").mockRejectedValue(new Error("audit unavailable"));
    await expect(cmsSave(req("/api/admin/cms", content[3]))).rejects.toThrow("audit unavailable");
    expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
  });
  it("invalidates theme changes, redirect edits, backup restore, page, brand and settings saves", async () => {
    vi.spyOn(db, "getThemeConfig").mockResolvedValue(seed.themeConfig);
    vi.spyOn(db, "saveThemeConfig").mockImplementation(async x => x);
    let res = await themeAction(req("/api/admin/theme", { action: "apply_preset", presetId: "soale-creative-ai-dual", publish: true }));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "listRedirects").mockResolvedValue([]); vi.spyOn(db, "upsertRedirect").mockImplementation(async x => x);
    res = await seoRedirect(req("/api/admin/seo", { sourcePath: "/test-source", destinationPath: "/contact", permanent: false, isActive: true }));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "deleteRedirect").mockResolvedValue(true);
    res = await seoDelete(new Request("http://localhost:3000/api/admin/seo?id=test", { method: "DELETE" }));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "restoreBackup").mockResolvedValue({ restoredId: "test", safetyBackupId: "safe" });
    res = await backupAction(req("/api/admin/system/backups", { action: "restore", backupId: "test" }));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "saveBrandAssets").mockImplementation(async x => x);
    res = await brandSave(req("/api/admin/brand", seed.brandAssets, "PUT"));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "saveSiteSettings").mockImplementation(async x => x);
    res = await settingsSave(req("/api/admin/settings", seed.siteSettings, "PUT"));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
    clean(); vi.spyOn(db, "getPageBySlug").mockResolvedValue(null); vi.spyOn(db, "savePage").mockImplementation(async x => x);
    res = await pageSave(req("/api/admin/pages", { slug: "new-page", title: "Test page", sections: [{ id: "one", type: "rich_text", title: "Text", order: 0, isVisible: true, config: {} }], publish: true }, "PUT"));
    expect(res.status).toBe(200); expect(revalidateAllPublicContent).toHaveBeenCalledTimes(1);
  });
  it("does not invalidate when authentication or the mutation fails", async () => {
    vi.mocked(requireAdminApiAuth).mockResolvedValueOnce({ ok: false, response: new Response("Denied", { status: 401 }) } as never);
    expect((await cmsSave(req("/api/admin/cms", content[3]))).status).toBe(401);
    expect(revalidateAllPublicContent).not.toHaveBeenCalled();
    vi.spyOn(db, "upsertFaq").mockRejectedValue(new Error("write failed"));
    await expect(cmsSave(req("/api/admin/cms", content[3]))).rejects.toThrow("write failed");
    expect(revalidateAllPublicContent).not.toHaveBeenCalled();
    vi.spyOn(db, "restoreBackup").mockRejectedValue(new Error("restore failed"));
    expect((await backupAction(req("/api/admin/system/backups", { action: "restore", backupId: "test" }))).status).toBe(400);
    expect(revalidateAllPublicContent).not.toHaveBeenCalled();
  });

});
