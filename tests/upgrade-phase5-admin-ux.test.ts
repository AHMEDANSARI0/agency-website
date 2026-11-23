import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/rbac";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getContrastRatio } from "@/features/themes/color-utils";
import { OMNIFLOW_DARK_TOKENS, OMNIFLOW_LIGHT_TOKENS } from "@/features/themes/presets";
import { escapeCsvCell } from "@/features/leads/csv";
import type { RolePolicyConfig } from "@/types/auth";

const DEFAULT_POLICIES: RolePolicyConfig = {
  editorCanPublish: true,
  editorCanManageTheme: false,
};

describe("Upgrade Phase 5 — Admin Console, CRM, CMS & Theme Studio UX", () => {
  it("enforces grouped AdminShell RBAC navigation boundaries for SUPER_ADMIN, EDITOR, and AUTHOR", () => {
    expect(hasPermission("SUPER_ADMIN", "users:manage", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "theme:manage", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "audit:view", DEFAULT_POLICIES)).toBe(true);

    expect(hasPermission("EDITOR", "leads:manage", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("EDITOR", "content:edit_any", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("EDITOR", "users:manage", DEFAULT_POLICIES)).toBe(false);
    expect(hasPermission("EDITOR", "theme:manage", DEFAULT_POLICIES)).toBe(false);

    expect(hasPermission("AUTHOR", "dashboard:view", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("AUTHOR", "content:create_draft", DEFAULT_POLICIES)).toBe(true);
    expect(hasPermission("AUTHOR", "leads:view", DEFAULT_POLICIES)).toBe(false);
    expect(hasPermission("AUTHOR", "content:edit_any", DEFAULT_POLICIES)).toBe(false);
  });

  it("parses CMS live Markdown preview blocks safely while stripping raw HTML tags", () => {
    const sample = [
      "## Architecture Overview",
      "### Webhook Idempotency",
      "Every event uses a deterministic key <script>alert(1)</script> before writes.",
      "- Validate payload signature",
      "- Persist before side effects",
      "> Deterministic SOP execution beats fragile black-box prompts.",
    ].join("\n");

    const blocks = parseSafeMarkdown(sample);
    expect(blocks.some((b) => b.type === "h2" && b.text === "Architecture Overview")).toBe(
      true
    );
    expect(blocks.some((b) => b.type === "h3" && b.text === "Webhook Idempotency")).toBe(
      true
    );
    expect(blocks.some((b) => b.type === "ul" && b.items.length === 2)).toBe(true);
    expect(blocks.some((b) => b.type === "blockquote")).toBe(true);
    expect(JSON.stringify(blocks)).not.toContain("<script>");
  });

  it("computes WCAG AA/AAA live contrast ratios for Theme Studio light and dark presets", () => {
    const lightHeadingRatio = getContrastRatio(
      OMNIFLOW_LIGHT_TOKENS.colors.heading,
      OMNIFLOW_LIGHT_TOKENS.colors.background
    );
    const lightButtonRatio = getContrastRatio(
      OMNIFLOW_LIGHT_TOKENS.colors.primaryForeground,
      OMNIFLOW_LIGHT_TOKENS.colors.primary
    );
    const darkHeadingRatio = getContrastRatio(
      OMNIFLOW_DARK_TOKENS.colors.heading,
      OMNIFLOW_DARK_TOKENS.colors.background
    );

    expect(lightHeadingRatio).not.toBeNull();
    expect(lightHeadingRatio!).toBeGreaterThanOrEqual(7);
    expect(lightButtonRatio!).toBeGreaterThanOrEqual(4.5);
    expect(darkHeadingRatio!).toBeGreaterThanOrEqual(7);
  });

  it("neutralizes spreadsheet formula injection in CRM CSV exports", () => {
    expect(escapeCsvCell("=CMD|' /C calc'!A0")).toContain("'=CMD");
    expect(escapeCsvCell("+SUM(A1:A2)")).toContain("'+SUM");
    expect(escapeCsvCell("Acme Logistics")).toContain("Acme Logistics");
  });
});
