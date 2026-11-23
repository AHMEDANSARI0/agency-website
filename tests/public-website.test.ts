import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import {
  extractTableOfContents,
  parseSafeMarkdown,
  tokenizeInlineFormatting,
} from "@/features/blog/markdown";
import { POST as submitLeadPost } from "@/app/api/leads/route";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase2-test-"));

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase2-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 2 — Public Routes Data & Seamless v1-to-v2 Snapshot Upgrade", () => {
  it("resolves all 3 flagship services and all 5 service category slugs", async () => {
    const requiredSlugs = [
      "lead-management",
      "ai-customer-support",
      "workflow-automation",
      "ai-sales-intelligence",
      "ai-customer-experience",
      "ai-operations",
      "ai-analytics",
      "custom-ai-systems",
    ];

    for (const slug of requiredSlugs) {
      const srv = await db.getServiceBySlug(slug);
      expect(srv, `Expected service slug "${slug}" to exist`).not.toBeNull();
      expect(srv?.status).toBe("published");
      expect(srv?.processSteps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("publishes full multi-page navigation and keeps zero fake testimonials", async () => {
    const [settings, caseStudies, posts, testimonials] = await Promise.all([
      db.getSiteSettings(),
      db.listCaseStudies(true),
      db.listBlogPosts(true),
      db.listTestimonials(true),
    ]);

    const navHrefs = settings.navigation.map((n) => n.href);
    expect(navHrefs).toContain("/services");
    expect(navHrefs).toContain("/solutions");
    expect(navHrefs).toContain("/how-it-works");
    expect(navHrefs).toContain("/work");
    expect(navHrefs).toContain("/case-studies");
    expect(navHrefs).toContain("/about");
    expect(navHrefs).toContain("/blog");
    expect(navHrefs).toContain("/contact");

    expect(caseStudies.length).toBeGreaterThanOrEqual(3);
    expect(posts.length).toBeGreaterThanOrEqual(3);
    expect(testimonials).toHaveLength(0);
  });

  it("auto-upgrades a Phase 1 local DB file without losing custom records", async () => {
    const legacyDbPath = path.join(tempDir, "legacy-v1-db.json");
    const currentRaw = JSON.parse(
      fs.readFileSync(path.join(tempDir, "phase2-db.json"), "utf8")
    );
    // Simulate Phase 1 snapshot (no schemaVersion, anchor-only nav, only 5 services)
    delete currentRaw.schemaVersion;
    currentRaw.siteSettings.navigation = [
      { id: "nav-home", label: "Overview", href: "/#capabilities", isVisible: true, order: 1 },
    ];
    currentRaw.services = currentRaw.services.slice(0, 5);
    fs.writeFileSync(legacyDbPath, JSON.stringify(currentRaw, null, 2), "utf8");

    process.env.OMNIFLOW_LOCAL_DB_PATH = legacyDbPath;
    const upgradedSettings = await db.getSiteSettings();
    const upgradedServices = await db.listServices(true);

    expect(upgradedSettings.navigation.some((n) => n.href === "/services")).toBe(true);
    expect(upgradedServices).toHaveLength(8);

    // Restore test DB path
    process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase2-db.json");
  });
});

describe("Phase 2 — Safe Blog Markdown & Table of Contents Parser", () => {
  it("extracts headings for TOC and strips unsafe HTML/script tags", () => {
    const md = `## First Section\n\nSafe paragraph with **bold** and \`code\` <script>alert(1)</script>.\n\n### Sub Topic\n\n- Bullet one\n- Bullet <b>two</b>`;
    const toc = extractTableOfContents(md);
    expect(toc).toEqual([
      { id: "first-section", text: "First Section", level: 2 },
      { id: "sub-topic", text: "Sub Topic", level: 3 },
    ]);

    const blocks = parseSafeMarkdown(md);
    expect(blocks.some((b) => b.type === "p" && !b.text.includes("<script>"))).toBe(true);

    const inline = tokenizeInlineFormatting("Use **deterministic** rules and `zod` <img onerror=1>");
    expect(inline.some((t) => t.kind === "strong" && t.value === "deterministic")).toBe(true);
    expect(inline.some((t) => t.kind === "code" && t.value === "zod")).toBe(true);
    expect(inline.every((t) => !t.value.includes("<img"))).toBe(true);
  });
});

describe("Phase 2 — Contact & Lead Capture API (/api/leads)", () => {
  it("rejects cross-origin requests and invalid payloads", async () => {
    const badOriginReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://evil.example.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const badOriginRes = await submitLeadPost(badOriginReq);
    expect(badOriginRes.status).toBe(403);

    const invalidReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.0.0.11",
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "A", email: "not-an-email" }),
    });
    const invalidRes = await submitLeadPost(invalidReq);
    expect(invalidRes.status).toBe(400);
  });

  it("drops honeypot bot spam silently without storing a lead", async () => {
    const beforeCount = (await db.listLeads()).length;
    const botReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.0.0.12",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Spam Bot",
        email: "bot@spam.example",
        company: "Spam Co",
        industry: "Other",
        interestedService: "Lead Management",
        businessProblem: "Automated spam message with more than twenty characters.",
        privacyConsent: true,
        honeypot: "http://spam-link.example",
      }),
    });
    const res = await submitLeadPost(botReq);
    expect(res.status).toBe(200);
    const afterCount = (await db.listLeads()).length;
    expect(afterCount).toBe(beforeCount);
  });

  it("stores valid enquiries in CRM with fallback email status and flags duplicates", async () => {
    const validPayload = {
      name: "Claire Bennett",
      email: "claire@northbridge-advisory.co.uk",
      company: "Northbridge Advisory Ltd",
      website: "northbridge-advisory.co.uk",
      industry: "Consulting & Advisory Practice",
      interestedService: "Lead Management & Qualification Systems",
      businessProblem:
        "Inbound enquiries arrive across UK and US hours and sit in a shared mailbox before manual CRM entry.",
      budgetRange: "$1,500 – $3,500 USD (Core system implementation)",
      timeline: "Immediate (Within 2–4 weeks)",
      privacyConsent: true,
    };

    const firstReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.0.0.13",
        "content-type": "application/json",
      },
      body: JSON.stringify(validPayload),
    });
    const firstRes = await submitLeadPost(firstReq);
    expect(firstRes.status).toBe(201);

    // Submit second enquiry with same email to verify duplicate detection
    const secondReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.0.0.14",
        "content-type": "application/json",
      },
      body: JSON.stringify(validPayload),
    });
    const secondRes = await submitLeadPost(secondReq);
    expect(secondRes.status).toBe(201);

    const leads = await db.listLeads();
    expect(leads.length).toBe(2);
    expect(leads[0]?.isDuplicateFlag).toBe(true);
    expect(leads[0]?.status).toBe("New");
    expect(leads[0]?.emailNotificationStatus).toBe("skipped_unconfigured");
    expect(leads[1]?.isDuplicateFlag).toBe(false);
  });
});
