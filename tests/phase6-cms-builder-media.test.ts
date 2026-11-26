import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import {
  DELETE as deleteCmsHandler,
  GET as getCmsHandler,
  POST as postCmsHandler,
} from "@/app/api/admin/cms/route";
import {
  DELETE as deleteMediaHandler,
  GET as getMediaHandler,
  PATCH as patchMediaHandler,
  POST as postMediaHandler,
} from "@/app/api/admin/media/route";
import {
  GET as getPagesHandler,
  PUT as putPagesHandler,
} from "@/app/api/admin/pages/route";
import { PATCH as patchRolePoliciesHandler } from "@/app/api/admin/role-policies/route";
import { PUT as putSettingsHandler } from "@/app/api/admin/settings/route";
import { POST as createUserHandler } from "@/app/api/admin/users/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase6-test-"));

function extractCookieToken(setCookieHeader: string | null): string {
  const match = (setCookieHeader || "").match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match?.[1] || "";
}

function makeJsonHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase6-db.json");
  process.env.OMNIFLOW_UPLOADS_DIR = path.join(tempDir, "uploads");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  delete process.env.OMNIFLOW_UPLOADS_DIR;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 6 — Full CMS Studio, Controlled Page Builder, Safe Media Library & Global Settings", () => {
  let adminToken = "";
  let editorToken = "";
  let authorToken = "";
  let superAdminBlogId = "";

  it("1. provisions SUPER_ADMIN, EDITOR, and AUTHOR sessions cleanly", async () => {
    const adminLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    expect(adminLogin.status).toBe(200);
    adminToken = extractCookieToken(adminLogin.headers.get("set-cookie"));
    expect(adminToken.length).toBeGreaterThan(20);

    // Create EDITOR
    const createEd = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          name: "Sara Editor",
          email: "editor6@omniflow.example",
          password: "Editor_StrongPass_2026!",
          role: "EDITOR",
        }),
      })
    );
    expect(createEd.status).toBe(201);

    const edLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "editor6@omniflow.example",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    editorToken = extractCookieToken(edLogin.headers.get("set-cookie"));

    // Create AUTHOR
    const createAu = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          name: "Bilal Author",
          email: "author6@omniflow.example",
          password: "Author_StrongPass_2026!",
          role: "AUTHOR",
        }),
      })
    );
    expect(createAu.status).toBe(201);

    const auLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "author6@omniflow.example",
          password: "Author_StrongPass_2026!",
        }),
      })
    );
    authorToken = extractCookieToken(auLogin.headers.get("set-cookie"));
    expect(authorToken.length).toBeGreaterThan(20);
  });

  it("2. enforces Controlled Page Section Builder whitelist & publish policy gating", async () => {
    // Disable editorCanPublish temporarily to test strict publish gate
    await patchRolePoliciesHandler(
      new Request("http://localhost:3000/api/admin/role-policies", {
        method: "PATCH",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          editorCanPublish: false,
          editorCanManageTheme: false,
        }),
      })
    );

    const getRes = await getPagesHandler(
      new Request("http://localhost:3000/api/admin/pages", {
        headers: makeJsonHeaders(editorToken),
      })
    );
    expect(getRes.status).toBe(200);
    const { pages, canPublish } = await getRes.json();
    expect(canPublish).toBe(false);
    expect(pages.length).toBeGreaterThan(0);

    // Reject unapproved raw_html section type
    const badSectionRes = await putPagesHandler(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          slug: "home",
          title: "Home",
          publish: false,
          sections: [
            {
              id: "sec_bad",
              type: "raw_script_widget",
              title: "Unsafe",
              isVisible: true,
              order: 1,
            },
          ],
        }),
      })
    );
    expect(badSectionRes.status).toBe(400);

    // Editor can save draft, but cannot publish when editorCanPublish=false
    const homeSections = [
      ...pages[0].sections,
      {
        id: "sec_custom_note",
        type: "rich_text",
        title: "Engineering Reliability Guarantee",
        subtitle: "Deterministic validation first",
        isVisible: true,
        order: pages[0].sections.length + 1,
        config: {
          markdown: "## Deterministic Operations\n\n- Explicit fallback queues",
        },
      },
    ];

    const editorDraftRes = await putPagesHandler(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          slug: "home",
          title: "Home",
          publish: false,
          sections: homeSections,
        }),
      })
    );
    expect(editorDraftRes.status).toBe(200);

    const editorPubRes = await putPagesHandler(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify({
          slug: "home",
          title: "Home",
          publish: true,
          sections: homeSections,
        }),
      })
    );
    expect(editorPubRes.status).toBe(403);

    // Super Admin publishes live
    const adminPubRes = await putPagesHandler(
      new Request("http://localhost:3000/api/admin/pages", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          slug: "home",
          title: "Home",
          publish: true,
          sections: homeSections,
        }),
      })
    );
    expect(adminPubRes.status).toBe(200);
    const pubJson = await adminPubRes.json();
    expect(
      pubJson.page.sections.some(
        (s: { type: string }) => s.type === "rich_text"
      )
    ).toBe(true);
  });

  it("3. enforces CMS RBAC (AUTHOR own-drafts vs SUPER_ADMIN), blog revisions, and Honest Proof gates", async () => {
    // Super Admin creates a published blog post
    const adminBlogRes = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          entity: "blog",
          slug: "deterministic-webhook-queues",
          title: "Deterministic Webhook Queues for Revenue Ops",
          excerpt: "How idempotent webhook ingestion prevents duplicate CRM records.",
          contentMarkdown:
            "## Idempotency Keys\n\nEvery webhook payload must carry a deterministic hash so retries never create duplicate deals.",
          category: "Systems Architecture",
          tags: ["Webhooks", "CRM"],
          featuredImageAlt: "Architecture flow",
          showTableOfContents: true,
          status: "published",
        }),
      })
    );
    expect(adminBlogRes.status).toBe(200);
    const adminBlogJson = await adminBlogRes.json();
    superAdminBlogId = adminBlogJson.item.id;

    // Update same post -> creates revision entry
    const updateBlogRes = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          entity: "blog",
          id: superAdminBlogId,
          slug: "deterministic-webhook-queues",
          title: "Deterministic Webhook Queues for Revenue Ops",
          excerpt: "How idempotent webhook ingestion prevents duplicate CRM records.",
          contentMarkdown:
            "## Idempotency Keys\n\nUpdated revision with dead-letter retry handling and Slack alerting.",
          category: "Systems Architecture",
          tags: ["Webhooks", "CRM"],
          featuredImageAlt: "Architecture flow",
          showTableOfContents: true,
          status: "published",
        }),
      })
    );
    const updatedBlogJson = await updateBlogRes.json();
    expect(updatedBlogJson.item.revisions.length).toBe(1);

    // AUTHOR cannot edit Super Admin's post (403)
    const authorStealEdit = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(authorToken),
        body: JSON.stringify({
          entity: "blog",
          id: superAdminBlogId,
          slug: "deterministic-webhook-queues",
          title: "Hijacked Title",
          excerpt: "Unauthorized modification attempt on another author post.",
          contentMarkdown: "## Unauthorized\n\nShould be blocked by RBAC.",
          category: "Systems Architecture",
          tags: ["Security"],
          status: "draft",
        }),
      })
    );
    expect(authorStealEdit.status).toBe(403);

    // AUTHOR can create own draft (200), but cannot publish directly (403)
    const authorDraftRes = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(authorToken),
        body: JSON.stringify({
          entity: "blog",
          slug: "author-own-draft-guide",
          title: "Practical Triage Prompts for Support Teams",
          excerpt: "Grounded ways to categorize support tickets safely.",
          contentMarkdown:
            "## Ticket Triage\n\nKeep human review in the loop for billing exceptions.",
          category: "AI Automation",
          tags: ["Support"],
          status: "draft",
        }),
      })
    );
    expect(authorDraftRes.status).toBe(200);

    const authorPublishAttempt = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(authorToken),
        body: JSON.stringify({
          entity: "blog",
          slug: "author-direct-publish",
          title: "Direct Publish Attempt",
          excerpt: "Authors should not be allowed to publish directly.",
          contentMarkdown: "## Blocked\n\nRequires editor or admin approval.",
          category: "AI Automation",
          tags: ["RBAC"],
          status: "published",
        }),
      })
    );
    expect(authorPublishAttempt.status).toBe(403);

    // AUTHOR GET /api/admin/cms only returns their own blog drafts
    const authorListRes = await getCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        headers: makeJsonHeaders(authorToken),
      })
    );
    const authorListJson = await authorListRes.json();
    expect(authorListJson.blogPosts.length).toBe(1);
    expect(authorListJson.blogPosts[0].slug).toBe("author-own-draft-guide");
    expect(authorListJson.services.length).toBe(0);

    // Honest Case Study Guardrail: verified_client without permission -> 400
    const unverifiedClientCs = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          entity: "case_study",
          slug: "unapproved-client-claim",
          title: "Unapproved Client Claim",
          workType: "verified_client",
          clientName: "Acme Corp",
          clientPermissionGranted: false,
          industry: "SaaS",
          businessType: "B2B",
          problemSummary: "Slow onboarding.",
          manualProcessBefore: ["Manual emails"],
          proposedAutomation: "Automated onboarding sequence.",
          automatedWorkflowAfter: ["Webhook trigger"],
          technologiesUsed: ["HubSpot"],
          verifiedResults: ["Faster onboarding"],
          status: "published",
        }),
      })
    );
    expect(unverifiedClientCs.status).toBe(400);

    // Honest Testimonial Gate: unverified testimonial stays hidden publicly
    const tstRes = await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          entity: "testimonial",
          authorName: "Jordan Patel",
          authorRole: "VP Operations",
          companyName: "Northstar Logistics",
          country: "Canada",
          quote: "Clean deterministic handoffs across our dispatch queue.",
          isAuthorized: true,
          isVerified: false,
          isPublished: true,
        }),
      })
    );
    expect(tstRes.status).toBe(200);
    const tstJson = await tstRes.json();
    expect((await db.listTestimonials(true)).length).toBe(0);

    // Delete temporary testimonial
    const delTst = await deleteCmsHandler(
      new Request(
        `http://localhost:3000/api/admin/cms?entity=testimonial&id=${tstJson.item.id}`,
        { method: "DELETE", headers: makeJsonHeaders(adminToken) }
      )
    );
    expect(delTst.status).toBe(200);
  });

  it("4. blocks XSS SVGs & spoofed binaries in Media Library while tracking live usedIn references", async () => {
    // 1. Malicious SVG with <script> must be rejected (400)
    const xssSvg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      "evil.svg",
      { type: "image/svg+xml" }
    );
    const badForm = new FormData();
    badForm.append("file", xssSvg);

    const xssRes = await postMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: badForm,
      })
    );
    expect(xssRes.status).toBe(400);

    // 2. Spoofed PNG (HTML text pretending to be image/png) must be rejected (400)
    const spoofedPng = new File(["<html>not a png</html>"], "fake.png", {
      type: "image/png",
    });
    const spoofForm = new FormData();
    spoofForm.append("file", spoofedPng);

    const spoofRes = await postMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: spoofForm,
      })
    );
    expect(spoofRes.status).toBe(400);

    // 3. Even a clean SVG is rejected; a raster image remains supported.
    const cleanSvg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>'],
      "clean.svg", { type: "image/svg+xml" }
    );
    const cleanSvgForm = new FormData();
    cleanSvgForm.append("file", cleanSvg);
    const cleanSvgRes = await postMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "POST", headers: { Origin: "http://localhost:3000", Host: "localhost:3000", Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` }, body: cleanSvgForm,
      })
    );
    expect(cleanSvgRes.status).toBe(400);

    const raster = new File(
      [Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a0sAAAAASUVORK5CYII=", "base64")],
      "omniflow-diagram.png", { type: "image/png" }
    );
    const goodForm = new FormData();
    goodForm.append("file", raster);
    goodForm.append("altText", "OmniFlow workflow node icon");
    goodForm.append("category", "image");

    const uploadRes = await postMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: goodForm,
      })
    );
    expect(uploadRes.status).toBe(201);
    const uploaded = (await uploadRes.json()).asset;
    expect(uploaded.url).toMatch(/^\/uploads\//);

    // Reference this uploaded asset in Super Admin's blog post -> verify live usedIn tracking!
    await postCmsHandler(
      new Request("http://localhost:3000/api/admin/cms", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          entity: "blog",
          id: superAdminBlogId,
          slug: "deterministic-webhook-queues",
          title: "Deterministic Webhook Queues for Revenue Ops",
          excerpt: "How idempotent webhook ingestion prevents duplicate CRM records.",
          contentMarkdown: "## Idempotency Keys\n\nVerified production pattern.",
          category: "Systems Architecture",
          tags: ["Webhooks"],
          featuredImageUrl: uploaded.url,
          featuredImageAlt: "OmniFlow diagram",
          status: "published",
        }),
      })
    );

    const listMediaRes = await getMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        headers: makeJsonHeaders(adminToken),
      })
    );
    const listMediaJson = await listMediaRes.json();
    const matched = listMediaJson.assets.find(
      (a: { id: string }) => a.id === uploaded.id
    );
    expect(matched.usedIn).toContain("Blog: deterministic-webhook-queues");

    // Patch altText
    const patchRes = await patchMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "PATCH",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          id: uploaded.id,
          altText: "Updated accessible diagram description",
        }),
      })
    );
    expect(patchRes.status).toBe(200);

    // Referenced asset deletion is blocked by default (409), and allowed when Super Admin passes force=true
    const blockedDelRes = await deleteMediaHandler(
      new Request(
        `http://localhost:3000/api/admin/media?id=${encodeURIComponent(uploaded.id)}`,
        { method: "DELETE", headers: makeJsonHeaders(adminToken) }
      )
    );
    expect(blockedDelRes.status).toBe(409);

    const delRes = await deleteMediaHandler(
      new Request(
        `http://localhost:3000/api/admin/media?id=${encodeURIComponent(uploaded.id)}&force=true`,
        { method: "DELETE", headers: makeJsonHeaders(adminToken) }
      )
    );
    expect(delRes.status).toBe(200);
  });

  it("5. gates Global Navigation, Footer & CTA Settings to SUPER_ADMIN", async () => {
    const current = await db.getSiteSettings();

    const editorBlocked = await putSettingsHandler(
      new Request("http://localhost:3000/api/admin/settings", {
        method: "PUT",
        headers: makeJsonHeaders(editorToken),
        body: JSON.stringify(current),
      })
    );
    expect(editorBlocked.status).toBe(403);

    const adminSave = await putSettingsHandler(
      new Request("http://localhost:3000/api/admin/settings", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          ...current,
          primaryCtaLabel: "Book Architecture Review",
        }),
      })
    );
    expect(adminSave.status).toBe(200);
    const saved = await adminSave.json();
    expect(saved.settings.primaryCtaLabel).toBe("Book Architecture Review");
  });
});
