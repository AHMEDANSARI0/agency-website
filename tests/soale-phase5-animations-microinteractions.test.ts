import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("Soale Redesign Phase 5 — GPU Scroll Choreography, Staggered Card Loading & Micro-Interactions", () => {
  it("1. wires single [data-reveal] primitive, MutationObserver filter support, and Lenis scrollTo/prevent in MotionRuntime", () => {
    const runtimeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/animations/MotionRuntime.tsx"),
      "utf8"
    );
    expect(runtimeSrc).toContain("[data-reveal]:not(.in)");
    expect(runtimeSrc).not.toContain(".soale-card:not(.soale-in)");
    expect(runtimeSrc).toContain("MutationObserver");
    expect(runtimeSrc).toContain("[data-lenis-prevent]");
    expect(runtimeSrc).toContain("scrollTo");
    expect(runtimeSrc).toContain("prefers-reduced-motion: reduce");
  });

  it("2. defines unified GPU [data-reveal] entrance (<= 16px, cubic-bezier(0.22, 1, 0.36, 1)), tab re-entrance keyframes, and reduced-motion overrides in globals.css", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(css).toContain('html[data-motion="ready"] [data-reveal]:not(.in)');
    expect(css).not.toContain('html[data-motion="ready"] .soale-card:not(.soale-in)');
    expect(css).toContain("@keyframes soale-filter-enter");
    expect(css).toContain("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("3. wires staggered card loading on tab switches, 01–10 scroll progress rail, and swipe/keyboard slider controls with zero heavy deps", () => {
    const workSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleWorkShowcase.tsx"
      ),
      "utf8"
    );
    expect(workSrc).toContain("soale-filter-enter");
    expect(workSrc).not.toContain("data-parallax");
    expect(workSrc).toContain("ArrowRight");

    const processSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleProcessSection.tsx"
      ),
      "utf8"
    );
    expect(processSrc).toContain("scaleX(");
    expect(processSrc).toContain("Resume scroll sync");

    const proofSrc = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/sections/soale/SoaleEditorialProof.tsx"
      ),
      "utf8"
    );
    expect(proofSrc).toContain("onPointerDown");
    expect(proofSrc).toContain("onPointerUp");
    expect(proofSrc).toContain("ArrowLeft");

    const depNames = Object.keys(pkg.dependencies);
    expect(depNames).not.toContain("framer-motion");
    expect(depNames).not.toContain("gsap");
    expect(depNames).not.toContain("three");
  });
});
