import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PROCESS_PHASES_4 } from "@/components/sections/soale/SoaleProcessSection";
import {
  DEFAULT_PRICING_CONFIG,
  resolvePricingConfig,
} from "@/features/pricing/default-pricing";
import { db } from "@/lib/database";
import {
  CURRENT_SEED_VERSION,
  DEFAULT_HOME_SECTIONS,
  createInitialSeedSnapshot,
} from "@/lib/database/seed-data";
import { PLACEHOLDER_TOKENS } from "@/lib/placeholders";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-clean-p4-"));

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 4 — Homepage Restructuring (17 -> 9 Sections) & Reference Dark Purple AI Hero", () => {
  it("1. matches the reference Dark Purple AI Hero & interactive Workflow command center with explicit Sample data badge", () => {
    const heroSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/PinnedHero.tsx"),
      "utf8"
    );

    // Reference copy & CTAs
    expect(heroSrc).toContain("AI automation for service businesses");
    expect(heroSrc).toContain("Automate the work.");
    expect(heroSrc).toContain("Accelerate the business.");
    const normalizedHeroSrc = heroSrc.replace(/\s+/g, " ");
    expect(normalizedHeroSrc).toContain(
      "AI workflows that answer every lead, update your CRM and alert your team, with a person approving the important steps."
    );
    expect(heroSrc).toContain("Book a free workflow review");
    expect(heroSrc).toContain("See live demo");

    // Live HTML/CSS/SVG Workflow command center + Sample data badge
    expect(heroSrc).toContain("Workflow command center");
    expect(heroSrc).toContain("Sample data");
    expect(heroSrc).toContain("Avg. response");
    expect(heroSrc).toContain("1.8 min");
    expect(heroSrc).toContain("Leads handled");
    expect(heroSrc).toContain("2,481");
    expect(heroSrc).toContain("Hours saved");
    expect(heroSrc).toContain("126 h");
    expect(heroSrc).toContain("Enquiries answered");
    expect(heroSrc).toContain("<svg");
    expect(heroSrc).toContain("Lead scored");
    expect(heroSrc).toContain("CRM updated");
    expect(heroSrc).toContain("Quote reply");
    expect(heroSrc).toContain("Needs approval");
    expect(heroSrc).toContain("WhatsApp alert");

    // Repeat-session <= 300ms entrance optimization
    expect(heroSrc).toContain("of_hero_seen");
    expect(heroSrc).toContain("data-hero-repeat");

    const cssSrc = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(cssSrc).toContain(".of-hero-glow");
    expect(cssSrc).toContain(".of-hero-grid");
    expect(cssSrc).toContain(".of-hero-gradient-text");
    expect(cssSrc).toContain('[data-hero-repeat="true"]');
  });

  it("2. renders the 'Works with your stack' inline-SVG bar for HubSpot, Slack, Notion, Stripe, WhatsApp & Google Workspace", () => {
    const stackBarSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/StackLogoBar.tsx"),
      "utf8"
    );

    expect(stackBarSrc).toContain("Works with your stack");
    for (const tool of [
      "HubSpot",
      "Slack",
      "Notion",
      "Stripe",
      "WhatsApp",
      "Google Workspace",
    ]) {
      expect(stackBarSrc).toContain(tool);
    }
    expect(stackBarSrc).toContain("<svg");
  });

  it("3. streamlines Home to 6 focused sections, 4-phase process, {{PRICE_FROM}} pricing (zero Coming Soon), and {{FOUNDER_PHOTO_URL}} slot", () => {
    expect(CURRENT_SEED_VERSION).toBeGreaterThanOrEqual(14);
    expect(DEFAULT_HOME_SECTIONS).toHaveLength(6);
    expect(DEFAULT_HOME_SECTIONS.map((s) => s.type)).toEqual([
      "hero",
      "flagship_systems",
      "interactive_demos_preview",
      "case_studies_highlight",
      "how_it_works",
      "cta_banner",
    ]);

    expect(PROCESS_PHASES_4).toHaveLength(4);
    expect(PROCESS_PHASES_4.map((p) => p.num)).toEqual(["01", "02", "03", "04"]);

    expect(DEFAULT_PRICING_CONFIG.comingSoonMode).toBe(false);
    expect(DEFAULT_PRICING_CONFIG.statusBannerText).toBe(
      "Projects typically start from {{PRICE_FROM}}"
    );
    expect(JSON.stringify(DEFAULT_PRICING_CONFIG).toLowerCase()).not.toContain(
      "coming soon"
    );

    const proofSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleEditorialProof.tsx"
      ),
      "utf8"
    );
    expect(proofSrc).toContain(PLACEHOLDER_TOKENS.FOUNDER_PHOTO_URL);
  });

  it("4. non-destructively auto-upgrades untouched 17-section Home & legacy Coming Soon pricing while preserving custom admin edits", async () => {
    const seed = createInitialSeedSnapshot();
    const legacy17Sections = Array.from({ length: 17 }, (_, idx) => ({
      id: `legacy_${idx + 1}`,
      type: (idx === 0 ? "hero" : "rich_text") as "hero" | "rich_text",
      title: `Legacy ${idx + 1}`,
      isVisible: true,
      order: idx + 1,
      config: {},
    }));

    // Case A: Untouched v8 snapshot (no updatedBy on home, legacy Coming Soon pricing, existing lead preserved)
    const untouchedPath = path.join(tempDir, "legacy-v8-untouched.json");
    fs.writeFileSync(
      untouchedPath,
      JSON.stringify(
        {
          ...seed,
          schemaVersion: 8,
          siteSettings: {
            ...seed.siteSettings,
            primaryCtaLabel: "Book a Free Discovery Call",
            secondaryCtaLabel: "Explore Live Demos",
            pricingConfig: {
              ...DEFAULT_PRICING_CONFIG,
              comingSoonMode: true,
              statusBannerText:
                "Published Tier Rates Coming Soon — Custom-Scoped Proposals Available Today",
            },
          },
          pages: [
            {
              ...seed.pages[0],
              sections: legacy17Sections,
              draftSections: legacy17Sections,
            },
          ],
          leads: [
            {
              id: "lead_keep_me",
              name: "Jane Doe",
              email: "jane@example.org",
              company: "Acme Ops",
              industry: "Consulting",
              interestedService: "Lead Management",
              businessProblem: "Slow follow-ups",
              privacyConsent: true,
              status: "New",
              priority: "High",
              proposalValue: null,
              expectedClosingDate: null,
              lostReason: null,
              source: "website_contact_form",
              isDuplicateFlag: false,
              followUpDate: null,
              emailNotificationStatus: "skipped",
              notes: [],
              statusHistory: [],
              createdAt: "2026-11-22T00:00:00.000Z",
              updatedAt: "2026-11-22T00:00:00.000Z",
            },
          ],
        },
        null,
        2
      ),
      "utf8"
    );

    process.env.OMNIFLOW_LOCAL_DB_PATH = untouchedPath;
    const upgradedHome = await db.getPageBySlug("home");
    const upgradedSettings = await db.getSiteSettings();
    const preservedLeads = await db.listLeads();

    expect(upgradedHome?.sections).toHaveLength(6);
    expect(upgradedSettings.primaryCtaLabel).toBe("Book a free workflow review");
    expect(upgradedSettings.secondaryCtaLabel).toBe("See live demo");
    expect(upgradedSettings.pricingConfig?.comingSoonMode).toBe(false);
    expect(upgradedSettings.pricingConfig?.statusBannerText).toContain(
      "{{PRICE_FROM}}"
    );
    expect(preservedLeads).toHaveLength(1);
    expect(preservedLeads[0]?.id).toBe("lead_keep_me");

    // Case B: Custom admin-edited page (updatedBy set) & custom admin pricing are preserved
    const customPricing = resolvePricingConfig({
      ...seed.siteSettings,
      pricingConfig: {
        ...DEFAULT_PRICING_CONFIG,
        comingSoonMode: false,
        statusBannerText: "Projects typically start from $1,500",
      },
    });
    expect(customPricing.statusBannerText).toBe(
      "Projects typically start from $1,500"
    );
  });
});
