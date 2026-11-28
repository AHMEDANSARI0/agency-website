import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SoaleFaqAccordion } from "@/components/sections/soale/SoaleFaqAccordion";
import { LazySoaleFaqAccordion, LazySoalePricingSection, LazySoaleProcessSection } from "@/components/sections/LazyClientIslands";
import { SoaleWorkShowcase } from "@/components/sections/soale/SoaleWorkShowcase";
import { FooterLinkGroup } from "@/components/layout/FooterLinkGroup";
import { SoaleArrowButton } from "@/components/ui/soale/SoaleArrowButton";
import { DEFAULT_PRICING_CONFIG } from "@/features/pricing/default-pricing";
import type { FaqItem } from "@/types/content";

const faq = [{id:"one",question:"How does this work?",answer:"It starts with a review."}, {id:"two",question:"Who owns it?",answer:"You do."}] as FaqItem[];
const src = (name: string) => fs.readFileSync(path.join(process.cwd(), name), "utf8");
describe("homepage progressive accessibility", () => {
  it("renders native independently operable FAQ details and answers without JavaScript", () => {
    const html = renderToStaticMarkup(React.createElement(SoaleFaqAccordion, {faqs: faq, contactEmail: ""}));
    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html.match(/<summary/g)).toHaveLength(2);
    expect(html).toContain("How does this work?"); expect(html).toContain("You do.");
    expect(html).not.toContain('role="region"');
  });
  it("server-renders important homepage content instead of blank viewport placeholders", () => {
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(LazySoaleFaqAccordion, {faqs: faq, contactEmail: ""}), React.createElement(LazySoaleProcessSection, {}), React.createElement(LazySoalePricingSection, {pricing: DEFAULT_PRICING_CONFIG})));
    expect(html).toContain("Who owns it?");
    expect(html).toContain("Four clear phases");
    expect(html).toContain(DEFAULT_PRICING_CONFIG.sectionTitle);
  });
  it("uses buttons for selectable filters, exposes empty results and hides the unfired top button from tab order", () => {
    const work = renderToStaticMarkup(React.createElement(SoaleWorkShowcase, {caseStudies: []}));
    expect(work).toContain('aria-pressed="true"');
    expect(work).toContain("No published blueprints");
    expect(work).not.toContain('role="tab"');
    const hero = src("src/components/sections/PinnedHero.tsx");
    const pricing = src("src/components/sections/soale/SoalePricingSection.tsx");
    const process = src("src/components/sections/soale/SoaleProcessSection.tsx");
    for (const text of [hero, pricing, process]) expect(text).toContain("aria-pressed=");
    expect(process).toContain("onFocusCapture={() => setUserPinned(true)}");
    const top = src("src/components/animations/ScrollProgressBar.tsx");
    expect(top).toContain("tabIndex={showTopBtn ? 0 : -1}");
    expect(top).toContain("aria-hidden={!showTopBtn}");
  });
  it("keeps keyboard hash navigation native and focused reveal content visible", () => {
    const motion = src("src/components/animations/MotionRuntime.tsx");
    expect(motion).toContain("e.detail === 0"); expect(motion).toContain("url.search !== window.location.search");
    expect(motion).toContain("decodeURIComponent"); expect(motion).toContain("catch { return; }");
    expect(src("src/styles/globals.css")).toContain('[data-reveal]:not(.in):focus-within');
    expect(src("src/components/animations/useReducedMotionChange.ts")).toContain('addEventListener("change"');
    for (const file of ["MotionRuntime.tsx", "ScrollCardChoreography.tsx", "InteractiveGlobeCanvas.tsx"]) {
      expect(src(`src/components/animations/${file}`)).toContain("motionPreferenceVersion");
    }
  });
  it("uses native required-field validation and button semantics for contact intent", () => {
    const form = src("src/components/sections/ContactForm.tsx");
    expect(form).not.toContain("noValidate");
    expect(form).toContain('role="group"');
    expect(form).not.toContain('role="tablist"');
    expect(form).toContain("aria-pressed={enquiryMode ===");
  });
  it("keeps footer groups collapsed on mobile and scales CTA controls without reducing touch targets", () => {
    const footerGroup = renderToStaticMarkup(
      React.createElement(FooterLinkGroup, {
        id: "footer-services",
        title: "Services",
        children: React.createElement(
          "ul",
          null,
          React.createElement("li", null, "Automation")
        ),
      })
    );
    expect(footerGroup).toContain('aria-expanded="false"');
    expect(footerGroup).toContain('aria-controls="footer-services"');
    expect(footerGroup).toContain('class="hidden lg:mt-4 lg:block"');

    const cta = renderToStaticMarkup(
      React.createElement(SoaleArrowButton, {
        href: "/contact",
        children: "Book a free review",
      })
    );
    expect(cta).toContain("soale-arrow-btn-md");
    expect(src("src/styles/globals.css")).toContain(
      ".soale-arrow-btn-md .soale-arrow-box"
    );
    expect(src("src/components/ui/soale/SoaleArrowButton.tsx")).toContain(
      "!h-11 !w-11"
    );
  });
});
