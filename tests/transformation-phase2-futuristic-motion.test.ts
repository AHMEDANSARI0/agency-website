import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../package.json";
import {
  buildThemeCssVariables,
  evaluateThemeContrast,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  createDefaultThemeConfiguration,
} from "@/features/themes/presets";

describe("Transformation Phase 2 — Futuristic Design System, Interactive Visualizers & GPU Motion", () => {
  it("1. defines electric-blue, subtle-cyan, and 3D depth tokens while maintaining 0 WCAG AA contrast warnings across all built-in presets", () => {
    expect(BUILT_IN_THEME_PRESETS.some((p) => p.id === "omniflow-cyber-architect")).toBe(true);
    expect(BUILT_IN_THEME_PRESETS.some((p) => p.id === "omniflow-red-glass")).toBe(true);
    expect(BUILT_IN_THEME_PRESETS).toHaveLength(6);

    for (const preset of BUILT_IN_THEME_PRESETS) {
      expect(
        evaluateThemeContrast("light", preset.light),
        `Light WCAG AA warnings in ${preset.id}`
      ).toEqual([]);
      expect(
        evaluateThemeContrast("dark", preset.dark),
        `Dark WCAG AA warnings in ${preset.id}`
      ).toEqual([]);
    }

    const cssVars = buildThemeCssVariables(createDefaultThemeConfiguration());
    expect(cssVars).toContain("--of-color-electric:");
    expect(cssVars).toContain("--of-color-cyan:");
    expect(cssVars).toContain("--of-color-cyan-subtle:");

    const globalsCss = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(globalsCss).toContain(".surface-3d");
    expect(globalsCss).toContain(".card-3d");
    expect(globalsCss).toContain(".architectural-grid-perspective");
    expect(globalsCss).toContain(".animate-signal-flow");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("2. implements interactive Before/After Workflow Visualizer with keyboard navigation and conversion links", () => {
    const compareSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/BeforeAfterWorkflowCompare.tsx"),
      "utf8"
    );

    expect(compareSrc).toContain("Before vs. After");
    expect(compareSrc).toContain("Manual (Before)");
    expect(compareSrc).toContain("Automated (After)");
    expect(compareSrc).toContain("ArrowRight");
    expect(compareSrc).toContain("ArrowLeft");
    expect(compareSrc).toContain("before_after_");

    const homeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/(website)/page.tsx"),
      "utf8"
    );
    expect(homeSrc).toContain("BeforeAfterWorkflowCompare");
    expect(homeSrc).toContain("IntegrationEcosystemVisualizer");
  });

  it("3. implements Integration Ecosystem Visualizer across 6 connected business categories", () => {
    const ecoSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/IntegrationEcosystemVisualizer.tsx"),
      "utf8"
    );

    const expectedCategories = [
      "CRM & Sales Pipeline",
      "Messaging & Team Alerts",
      "Email & Call Scheduling",
      "Helpdesk & Knowledge",
      "Project & Client Delivery",
      "Billing, SQL & Custom APIs",
    ];

    for (const cat of expectedCategories) {
      expect(ecoSrc).toContain(cat);
    }
    expect(ecoSrc).toContain("OmniFlow Connected Orchestration Core");
  });

  it("4. implements 5-stage AI Customer Support Conversation Simulator reusing the deterministic demo engine", () => {
    const simSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/AiConversationSimulator.tsx"),
      "utf8"
    );

    expect(simSrc).toContain("@/features/demos/engine");
    expect(simSrc).toContain("generateGroundedSupportReply");
    expect(simSrc).toContain("Incoming customer message");
    expect(simSrc).toContain("AI analysis");
    expect(simSrc).toContain("Knowledge retrieval");
    expect(simSrc).toContain("Generated response");
    expect(simSrc).toContain("Human escalation");
    expect(simSrc).toContain("prefers-reduced-motion: reduce");

    const labPreviewSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/HomeAutomationLabPreview.tsx"),
      "utf8"
    );
    expect(labPreviewSrc).toContain("AiConversationSimulator");
    expect(labPreviewSrc).toContain("AI Support Simulator");
  });

  it("5. introduces zero bloated external animation libraries and preserves lightweight dependencies", () => {
    const depNames = Object.keys(pkg.dependencies);
    expect(depNames).not.toContain("framer-motion");
    expect(depNames).not.toContain("gsap");
    expect(depNames).not.toContain("three");
    expect(depNames).not.toContain("animejs");
  });
});
