import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("Soale Redesign Phase 5 — GPU Scroll Choreography, Staggered Card Loading & Micro-Interactions", () => {
  it("1. wires universal .soale-card scroll entrance, MutationObserver filter support, and IntersectionObserver-scoped parallax in MotionRuntime", () => {
    const runtimeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/animations/MotionRuntime.tsx"),
      "utf8"
    );
    expect(runtimeSrc).toContain(".soale-card:not(.soale-in)");
    expect(runtimeSrc).toContain("--soale-stagger");
    expect(runtimeSrc).toContain("MutationObserver");
    expect(runtimeSrc).toContain("[data-parallax]");
    expect(runtimeSrc).toContain("--soale-py");
    expect(runtimeSrc).toContain(".soale-card-interactive");
    expect(runtimeSrc).toContain("prefers-reduced-motion: reduce");
  });

  it("2. defines pure GPU card-loading entrance, tab re-entrance keyframes, pointer rim sheen, and reduced-motion overrides in globals.css", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8"
    );
    expect(css).toContain('html[data-motion="ready"] .soale-card:not(.soale-in)');
    expect(css).toContain("@keyframes soale-filter-enter");
    expect(css).toContain(".soale-card-interactive::before");
    expect(css).toContain("[data-parallax]");
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
    expect(workSrc).toContain('data-parallax="10"');
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
