import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Phase 3 — Motion System (Smooth, Fast, Disciplined)", () => {
  it("1. sets html[data-motion='ready'] synchronously in <head> before first paint while honoring prefers-reduced-motion", () => {
    const rootLayout = fs.readFileSync(
      path.join(ROOT, "src/app/layout.tsx"),
      "utf8"
    );
    const headMatch = rootLayout.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).not.toBeNull();
    expect(headMatch![1]).toContain('id="of-motion-init"');
    expect(headMatch![1]).toContain("prefers-reduced-motion: reduce");
    expect(headMatch![1]).toContain('d.dataset.motion="ready"');
  });

  it("2. enforces single [data-reveal] primitive, removes .soale-card self-reveal, and applies unified motion tokens (350-600ms, cubic-bezier(0.22, 1, 0.36, 1), <= 18px, max 4 stagger)", () => {
    const css = fs.readFileSync(
      path.join(ROOT, "src/styles/globals.css"),
      "utf8"
    );
    expect(css).toContain("--of-ease-out: cubic-bezier(0.22, 1, 0.36, 1)");
    expect(css).toContain("--of-dur-reveal: 540ms");
    expect(css).toContain("--of-reveal-distance: 18px");
    expect(css).toContain("--of-stagger-step: 70ms");
    expect(css).toContain("calc(min(var(--d, 0), 3) * var(--of-stagger-step, 70ms))");

    expect(css).not.toContain(".soale-card:not(.soale-in)");
    expect(css).not.toContain(".soale-card.soale-in");
    expect(css).not.toContain(".lightup");
    expect(css).not.toContain("[data-parallax]");
    expect(css).not.toContain(".animate-marquee-reverse");
    expect(css).toContain('html:not([data-motion="ready"]) .animate-marquee');
  });

  it("3. configures desktop Lenis (lerp 0.2, route scroll reset, smooth #hash scrollTo, and data-lenis-prevent)", () => {
    const runtime = fs.readFileSync(
      path.join(ROOT, "src/components/animations/MotionRuntime.tsx"),
      "utf8"
    );
    expect(runtime).toContain("lerp: 0.2");
    expect(runtime).toContain("scrollTo(0, { immediate: true })");
    expect(runtime).toContain("scrollTo(targetEl");
    expect(runtime).toContain("[data-lenis-prevent]");
    expect(runtime).not.toContain("pointermove");
    expect(runtime).not.toContain("data-parallax");

    const navbar = fs.readFileSync(
      path.join(ROOT, "src/components/layout/Navbar.tsx"),
      "utf8"
    );
    expect(navbar).toContain("data-lenis-prevent");
  });

  it("4. removes OpeningSequence, AmbientSoundToggle, pointer spotlight, 2nd marquee row, and media parallax", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "src/components/animations/OpeningSequence.tsx")
      )
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(ROOT, "src/components/animations/AmbientSoundToggle.tsx")
      )
    ).toBe(false);

    const websiteLayout = fs.readFileSync(
      path.join(ROOT, "src/app/(website)/layout.tsx"),
      "utf8"
    );
    expect(websiteLayout).not.toContain("OpeningSequence");
    expect(websiteLayout).not.toContain("AmbientSoundToggle");

    const homePage = fs.readFileSync(
      path.join(ROOT, "src/app/(website)/page.tsx"),
      "utf8"
    );
    expect(homePage).not.toContain("ECOSYSTEM_ROW_2");
    expect(homePage).not.toContain("animate-marquee-reverse");
  });
});
