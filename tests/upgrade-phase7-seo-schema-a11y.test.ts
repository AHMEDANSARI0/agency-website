import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET as getRssFeed } from "@/app/feed.xml/route";
import { alt, contentType, size } from "@/app/opengraph-image";
import {
  buildCaseStudyJsonLd,
  buildInteractiveDemosJsonLd,
  buildOrganizationAndWebsiteJsonLd,
  escapeXml,
  serializeJsonLd,
} from "@/features/seo/json-ld";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { db } from "@/lib/database";

describe("Upgrade Phase 7 — Technical SEO, RSS 2.0, OpenGraph, Truthful Schema & Consent Controls", () => {
  it("1. serves valid XML-escaped RSS 2.0 syndication at /feed.xml", async () => {
    expect(escapeXml('<script>alert("x" & \'y\')</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot; &amp; &apos;y&apos;)&lt;/script&gt;"
    );

    const res = await getRssFeed();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("/feed.xml");
    expect(xml).toContain("<item>");
  });

  it("2. builds truthful TechArticle & WebApplication JSON-LD with zero fake ratings", async () => {
    const [settings, brand, studies] = await Promise.all([
      db.getSiteSettings(),
      db.getBrandAssets(),
      db.listCaseStudies(true),
    ]);

    const orgGraph = buildOrganizationAndWebsiteJsonLd(
      settings,
      brand,
      "https://omniflow.example"
    );
    const orgSerialized = serializeJsonLd(orgGraph);
    expect(orgSerialized).toContain("ContactPoint");
    expect(orgSerialized).toContain("Lead Qualification");
    expect(orgSerialized).not.toContain("aggregateRating");

    const sampleStudy = studies[0];
    expect(sampleStudy).toBeDefined();
    const csSchema = buildCaseStudyJsonLd(
      sampleStudy!,
      WORK_TYPE_META[sampleStudy!.workType].label,
      settings,
      "https://omniflow.example"
    );
    expect(csSchema["@type"]).toBe("TechArticle");
    expect(JSON.stringify(csSchema)).not.toContain("aggregateRating");

    const demoSchema = buildInteractiveDemosJsonLd(
      settings,
      "https://omniflow.example"
    );
    expect(demoSchema["@type"]).toBe("WebApplication");
    expect(demoSchema.offers.price).toBe("0");
    expect(JSON.stringify(demoSchema)).not.toContain("aggregateRating");
  });

  it("3. configures 1200x630 dynamic OpenGraph social image metadata", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toContain("OmniFlow");
  });

  it("4. wires Consent Mode v2 and re-openable Cookie Preferences in Footer & Cookie Policy", () => {
    const consentSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/analytics/AnalyticsConsentManager.tsx"
      ),
      "utf8"
    );
    expect(consentSrc).toContain("omniflow:open-cookie-preferences");
    expect(consentSrc).toContain("ad_storage: 'denied'");
    expect(consentSrc).toContain("ad_personalization: 'denied'");

    const footerSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/Footer.tsx"),
      "utf8"
    );
    expect(footerSrc).toContain("CookiePreferencesButton");
    expect(footerSrc).toContain("/feed.xml");
  });
});
