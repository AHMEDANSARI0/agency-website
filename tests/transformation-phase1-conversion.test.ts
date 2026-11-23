import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot, CURRENT_SEED_VERSION } from "@/lib/database/seed-data";
import { getServiceConversionBlueprint } from "@/features/services/blueprint";
import { POST as submitLeadPost } from "@/app/api/leads/route";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-trans-p1-"));

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "trans-p1-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Transformation Phase 1 — Brand Positioning, Hero Command Center & Conversion Funnel", () => {
  it("1. configures outcome-driven Discovery Call & Live Demo CTAs and upgrades v7 snapshots cleanly", async () => {
    expect(CURRENT_SEED_VERSION).toBeGreaterThanOrEqual(8);
    const seed = createInitialSeedSnapshot();
    expect(seed.siteSettings.primaryCtaLabel).toBe("Book a Free Discovery Call");
    expect(seed.siteSettings.secondaryCtaLabel).toBe("Explore Live Demos");

    // Simulate legacy v7 snapshot with old default CTA labels
    const legacyPath = path.join(tempDir, "legacy-v7.json");
    const legacySnap = {
      ...seed,
      schemaVersion: 7,
      siteSettings: {
        ...seed.siteSettings,
        primaryCtaLabel: "Request an Automation Audit",
        primaryCtaHref: "/contact",
        secondaryCtaLabel: "Try Interactive Demos",
      },
    };
    fs.writeFileSync(legacyPath, JSON.stringify(legacySnap, null, 2), "utf8");

    process.env.OMNIFLOW_LOCAL_DB_PATH = legacyPath;
    const upgraded = await db.getSiteSettings();
    expect(upgraded.primaryCtaLabel).toBe("Book a Free Discovery Call");
    expect(upgraded.primaryCtaHref).toBe("/contact?intent=call");
    expect(upgraded.secondaryCtaLabel).toBe("Explore Live Demos");

    process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "trans-p1-db.json");
  });

  it("2. renders all 7 real-world automation steps in the Homepage Hero Command Center", () => {
    const heroSource = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/PinnedHero.tsx"),
      "utf8"
    );

    const requiredSteps = [
      "Incoming customer enquiry",
      "AI analysis",
      "Lead qualification",
      "CRM update",
      "WhatsApp / email notification",
      "Optional human approval",
      "Completed workflow",
    ];

    for (const stepLabel of requiredSteps) {
      expect(heroSource).toContain(stepLabel);
    }

    expect(heroSource).toContain("prefers-reduced-motion: reduce");
    expect(heroSource).toContain("document.hidden");
    expect(heroSource).toContain("Book a Free Discovery Call");
    expect(heroSource).toContain("Explore Live Demos");
  });

  it("3. accepts minimal frictionless enquiries AND persists Discovery Call slot preferences in CRM", async () => {
    // Minimal 3-field quick enquiry (no company/industry/service required upfront)
    const quickReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "198.51.100.81",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Jordan Hayes",
        email: "jordan@hayesconsulting.ca",
        businessProblem: "We spend 10 hours weekly copying client intake emails into Notion and HubSpot.",
        privacyConsent: true,
      }),
    });

    const quickRes = await submitLeadPost(quickReq);
    expect(quickRes.status).toBe(201);

    // Discovery Call booking request with timezone, call window, and source attribution
    const callReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "198.51.100.82",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Sophie Bennett",
        email: "sophie@londonpractice.co.uk",
        company: "Bennett Advisory LLP",
        enquiryType: "discovery_call",
        preferredCallWindow: "Next 2–3 Business Days · Morning",
        timezone: "United Kingdom (GMT / BST)",
        businessProblem: "Missed after-hours enquiries need instant qualification and WhatsApp owner alerts.",
        source: "hero_command_center:call",
        privacyConsent: true,
      }),
    });

    const callRes = await submitLeadPost(callReq);
    expect(callRes.status).toBe(201);
    const callJson = (await callRes.json()) as {
      ok: boolean;
      leadId: string;
      enquiryType: string;
    };
    expect(callJson.ok).toBe(true);
    expect(callJson.enquiryType).toBe("discovery_call");

    const leads = await db.listLeads();
    const savedCallLead = leads.find((l) => l.id === callJson.leadId);
    expect(savedCallLead).toBeDefined();
    expect(savedCallLead?.source).toBe("hero_command_center:call");
    expect(savedCallLead?.additionalDetails).toContain("Free 25-Min Discovery Call");
    expect(savedCallLead?.additionalDetails).toContain("United Kingdom (GMT / BST)");

    const savedQuickLead = leads.find((l) => l.email === "jordan@hayesconsulting.ca");
    expect(savedQuickLead?.company).toBe("Independent / Not Specified");
    expect(savedQuickLead?.interestedService).toBe("Discovery Call & Workflow Review");
  });

  it("4. maps all 8 published services to complete 10-point conversion blueprints and live demos", async () => {
    const services = await db.listServices(true);
    expect(services).toHaveLength(8);

    for (const service of services) {
      const bp = getServiceConversionBlueprint(service);
      expect(bp.whatGetsAutomated.length).toBeGreaterThanOrEqual(3);
      expect(bp.staysHumanControlled.length).toBeGreaterThanOrEqual(2);
      expect(bp.integrations.length).toBeGreaterThanOrEqual(3);
      expect(bp.implementationProcess).toHaveLength(4);
      expect(bp.demo.tabId.length).toBeGreaterThan(3);
    }

    const servicePageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/services/[slug]/page.tsx"),
      "utf8"
    );
    expect(servicePageSource).toContain("What Gets Automated vs. What Stays With Your Team");
    expect(servicePageSource).toContain("Relevant Integrations");
    expect(servicePageSource).toContain("Implementation Process");
    expect(servicePageSource).toContain("PageConversionBanner");
  });
});
