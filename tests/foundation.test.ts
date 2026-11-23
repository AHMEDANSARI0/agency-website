import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildThemeCssVariables,
  evaluateThemeContrast,
  getContrastRatio,
  isValidCssColor,
  sanitizeTokenSet,
} from "@/features/themes/color-utils";
import { OMNIFLOW_DARK_TOKENS, OMNIFLOW_LIGHT_TOKENS } from "@/features/themes/presets";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/security/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { canEditContentEntity, hasPermission } from "@/lib/auth/rbac";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizePlainText, sanitizeSafeUrl } from "@/lib/validation/common";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-test-"));

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "test-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 1 — Theme Token & Accessibility Engine", () => {
  it("validates HEX, RGB, and HSL colors while blocking injection strings", () => {
    expect(isValidCssColor("#4F46E5")).toBe(true);
    expect(isValidCssColor("rgba(15, 23, 42, 0.85)")).toBe(true);
    expect(isValidCssColor("hsl(239, 84%, 67%)")).toBe(true);
    expect(isValidCssColor("#4F46E5; background: url(evil)")).toBe(false);
    expect(isValidCssColor("expression(alert(1))")).toBe(false);
    expect(isValidCssColor("")).toBe(false);
  });

  it("maintains WCAG AA contrast across default OmniFlow light and dark presets", () => {
    const lightWarnings = evaluateThemeContrast("light", OMNIFLOW_LIGHT_TOKENS);
    const darkWarnings = evaluateThemeContrast("dark", OMNIFLOW_DARK_TOKENS);
    expect(lightWarnings).toEqual([]);
    expect(darkWarnings).toEqual([]);
  });

  it("detects low-contrast text/background combinations", () => {
    const ratio = getContrastRatio("#CBD5E1", "#FFFFFF");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeLessThan(2);

    const brokenSet = sanitizeTokenSet(
      {
        colors: {
          ...OMNIFLOW_LIGHT_TOKENS.colors,
          body: "#CBD5E1",
          background: "#FFFFFF",
        },
      },
      OMNIFLOW_LIGHT_TOKENS
    );
    const warnings = evaluateThemeContrast("light", brokenSet);
    expect(warnings.some((w) => w.pairLabel.includes("Body Text"))).toBe(true);
  });

  it("falls back safely when malformed theme config is supplied", () => {
    const css = buildThemeCssVariables(null);
    expect(css).toContain(`--of-color-primary: ${OMNIFLOW_LIGHT_TOKENS.colors.primary};`);
    expect(css).toContain('[data-theme="dark"]');
  });
});

describe("Phase 1 — Security, Auth & RBAC Boundaries", () => {
  it("hashes passwords with scrypt and rejects invalid passwords", () => {
    const hash = hashPassword("StrongPass2026!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("StrongPass2026!");
    expect(verifyPassword("StrongPass2026!", hash)).toBe(true);
    expect(verifyPassword("WrongPass2026!", hash)).toBe(false);
    expect(validatePasswordStrength("weak").valid).toBe(false);
    expect(validatePasswordStrength("ValidPass123").valid).toBe(true);
  });

  it("signs session tokens and rejects tampered or expired tokens", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(
      {
        id: "usr_1",
        email: "admin@omniflow.example",
        name: "Ahmed Ansari",
        role: "SUPER_ADMIN",
        isActive: true,
        createdAt: new Date(now).toISOString(),
      },
      2,
      now
    );

    const verified = verifySessionToken(token, now + 60_000);
    expect(verified?.userId).toBe("usr_1");
    expect(verified?.role).toBe("SUPER_ADMIN");

    // Tamper signature
    const tampered = `${token.slice(0, -4)}abcd`;
    expect(verifySessionToken(tampered, now + 60_000)).toBeNull();

    // Expired after 3 hours
    expect(verifySessionToken(token, now + 3 * 60 * 60 * 1000)).toBeNull();
  });

  it("enforces strict RBAC boundaries for SUPER_ADMIN, EDITOR, and AUTHOR", () => {
    expect(hasPermission("SUPER_ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "theme:manage")).toBe(true);

    expect(hasPermission("EDITOR", "users:manage")).toBe(false);
    expect(hasPermission("EDITOR", "settings:manage")).toBe(false);
    expect(
      hasPermission("EDITOR", "content:publish", {
        editorCanPublish: true,
        editorCanManageTheme: false,
      })
    ).toBe(true);
    expect(
      hasPermission("EDITOR", "content:publish", {
        editorCanPublish: false,
        editorCanManageTheme: false,
      })
    ).toBe(false);

    expect(hasPermission("AUTHOR", "content:create_draft")).toBe(true);
    expect(hasPermission("AUTHOR", "content:publish")).toBe(false);
    expect(hasPermission("AUTHOR", "leads:view")).toBe(false);

    expect(canEditContentEntity({ id: "a1", role: "AUTHOR" }, "a1")).toBe(true);
    expect(canEditContentEntity({ id: "a1", role: "AUTHOR" }, "other_author")).toBe(false);
    expect(canEditContentEntity({ id: "e1", role: "EDITOR" }, "other_author")).toBe(true);
  });

  it("enforces sliding-window rate limits and sanitizes untrusted inputs", () => {
    const key = "test-ip-1";
    expect(checkRateLimit(key, 2, 60_000, 1000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000, 2000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 2, 60_000, 3000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    expect(sanitizePlainText("<script>alert(1)</script>Hello")).toBe("alert(1)Hello");
    expect(sanitizeSafeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeSafeUrl("https://omniflow.example/contact")).toBe("https://omniflow.example/contact");
  });
});

describe("Phase 1 — Seeded Database Integrity & Honest Content Rules", () => {
  it("loads 5 service pillars, 3 flagship priorities, labeled concept work, and zero fake testimonials", async () => {
    const [pillars, services, caseStudies, testimonials, settings] = await Promise.all([
      db.getServicePillars(),
      db.listServices(true),
      db.listCaseStudies(true),
      db.listTestimonials(true),
      db.getSiteSettings(),
    ]);

    expect(settings.companyName).toBe("OmniFlow");
    expect(settings.founderName).toBe("Ahmed Ansari");
    expect(pillars).toHaveLength(5);
    expect(services.filter((s) => s.isFlagshipPriority)).toHaveLength(3);
    expect(testimonials).toHaveLength(0);
    expect(caseStudies.every((c) => c.workType !== "verified_client" || c.clientPermissionGranted)).toBe(true);

    const log = await db.recordAuditLog({
      actorId: "usr_founder_admin",
      actorEmail: "admin@omniflow.example",
      actorRole: "SUPER_ADMIN",
      action: "TEST_AUDIT",
      entityType: "system",
      summary: "Verified audit log persistence",
    });
    expect(log.id.startsWith("aud_")).toBe(true);
    const logs = await db.listAuditLogs(5);
    expect(logs.some((l) => l.action === "TEST_AUDIT")).toBe(true);
  });
});
