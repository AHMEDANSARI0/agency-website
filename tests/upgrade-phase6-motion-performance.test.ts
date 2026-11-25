import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("Upgrade Phase 6 — Motion, Micro-Interactions & Core Web Vitals Polish", () => {
  it("1. removes legacy OpeningSequence curtain and sets pre-paint motion flag in <head>", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/components/animations/OpeningSequence.tsx")
      )
    ).toBe(false);
    const rootLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8"
    );
    expect(rootLayout).toContain('id="of-motion-init"');
    expect(rootLayout).toContain("prefers-reduced-motion: reduce");
  });

  it("2. enforces hardware-aware progressive motion & visibility pause in MotionRuntime", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/animations/MotionRuntime.tsx"),
      "utf8"
    );
    expect(src).toContain('dataset.motion = "ready"');
    expect(src).toContain("(pointer: coarse)");
    expect(src).toContain("saveData");
    expect(src).toContain("visibilitychange");
    expect(src).toContain("document.hidden");
  });

  it("3. configures progressive-enhancement [data-reveal], offscreen animation pause, and marquee hover-pause in globals.css", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(css).toContain('html[data-motion="ready"] [data-reveal]:not(.in)');
    expect(css).toContain("translate3d");
    expect(css).not.toContain("content-visibility: auto");
    expect(css).toContain('html[data-tab-hidden="true"]');
    expect(css).toContain("animation-play-state: paused");
  });

  it("4. wires GPU ScrollProgressBar and keyboard-navigable WorkflowDiagram with Auto-Walkthrough", () => {
    const progressSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/animations/ScrollProgressBar.tsx"),
      "utf8"
    );
    expect(progressSrc).toContain("scaleX(");
    expect(progressSrc).toContain("Scroll back to top");

    const wfSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/WorkflowDiagram.tsx"),
      "utf8"
    );
    expect(wfSrc).toContain("ArrowRight");
    expect(wfSrc).toContain("ArrowLeft");
    expect(wfSrc).toContain("Auto-Walkthrough");
  });

  it("5. enables bundle tree-shaking, compression, and modern image formats in next.config.ts", () => {
    expect(nextConfig.compress).toBe(true);
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);
    expect(nextConfig.experimental?.optimizePackageImports).toContain(
      "lucide-react"
    );
  });
});
