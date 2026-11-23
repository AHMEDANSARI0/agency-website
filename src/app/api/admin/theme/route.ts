import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ComponentTokenOverrides, ThemeMode, ThemePreset } from "@/types/theme";
import {
  evaluateThemeContrast,
  isValidCssColor,
  sanitizeTokenSet,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  OMNIFLOW_DARK_TOKENS,
  OMNIFLOW_LIGHT_TOKENS,
} from "@/features/themes/presets";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

function sanitizeOverrides(
  raw?: ComponentTokenOverrides
): ComponentTokenOverrides {
  if (!raw || typeof raw !== "object") return {};
  const keys: Array<keyof ComponentTokenOverrides> = [
    "primaryButtonBg",
    "navbarBg",
    "footerBg",
    "cardBg",
    "badgeBg",
  ];
  const clean: ComponentTokenOverrides = {};
  for (const k of keys) {
    const val = raw[k];
    if (isValidCssColor(val)) {
      clean[k] = val.trim();
    }
  }
  return clean;
}

const putThemeSchema = z.object({
  defaultMode: z.enum(["light", "dark", "system"]),
  activePresetId: z.string().min(1).max(80),
  light: z.record(z.unknown()),
  dark: z.record(z.unknown()),
  overrides: z
    .object({
      light: z.record(z.string()).optional(),
      dark: z.record(z.string()).optional(),
    })
    .optional(),
  publish: z.boolean().optional(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rollback") }),
  z.object({
    action: z.literal("apply_preset"),
    presetId: z.string().min(1).max(80),
    publish: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("save_custom_preset"),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(180).optional(),
  }),
]);

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "theme:manage");
  if (!auth.ok) return auth.response;

  const themeConfig = await db.getThemeConfig();
  const warnings = [
    ...evaluateThemeContrast("light", themeConfig.draft.light),
    ...evaluateThemeContrast("dark", themeConfig.draft.dark),
  ];

  return NextResponse.json({
    themeConfig,
    builtInPresets: BUILT_IN_THEME_PRESETS,
    warnings,
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApiAuth(request, "theme:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = putThemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid theme payload." },
      { status: 400 }
    );
  }

  const current = await db.getThemeConfig();
  const safeLight = sanitizeTokenSet(
    parsed.data.light as Partial<typeof OMNIFLOW_LIGHT_TOKENS>,
    OMNIFLOW_LIGHT_TOKENS
  );
  const safeDark = sanitizeTokenSet(
    parsed.data.dark as Partial<typeof OMNIFLOW_DARK_TOKENS>,
    OMNIFLOW_DARK_TOKENS
  );
  const safeOverrides = {
    light: sanitizeOverrides(parsed.data.overrides?.light),
    dark: sanitizeOverrides(parsed.data.overrides?.dark),
  };

  const nextDraft = {
    light: safeLight,
    dark: safeDark,
    overrides: safeOverrides,
  };

  const shouldPublish = Boolean(parsed.data.publish);
  const nextConfig = await db.saveThemeConfig({
    ...current,
    defaultMode: parsed.data.defaultMode as ThemeMode,
    activePresetId: sanitizePlainText(parsed.data.activePresetId, 80),
    draft: nextDraft,
    previousPublished: shouldPublish
      ? structuredClone(current.published)
      : current.previousPublished,
    published: shouldPublish ? structuredClone(nextDraft) : current.published,
    updatedBy: auth.user.email,
  });

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: shouldPublish ? "theme.published" : "theme.draft_saved",
    entityType: "theme",
    summary: shouldPublish
      ? `Published Light & Dark theme tokens (default mode: ${nextConfig.defaultMode}).`
      : "Saved theme draft tokens.",
    ipAddress: extractClientIp(request.headers),
  });

  const warnings = [
    ...evaluateThemeContrast("light", nextConfig.draft.light),
    ...evaluateThemeContrast("dark", nextConfig.draft.dark),
  ];

  return NextResponse.json({ ok: true, themeConfig: nextConfig, warnings });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "theme:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid theme action request." },
      { status: 400 }
    );
  }

  const current = await db.getThemeConfig();
  const data = parsed.data;

  if (data.action === "rollback") {
    if (!current.previousPublished) {
      return NextResponse.json(
        { error: "No previous published theme snapshot is available to roll back." },
        { status: 400 }
      );
    }
    const restored = await db.saveThemeConfig({
      ...current,
      published: structuredClone(current.previousPublished),
      draft: structuredClone(current.previousPublished),
      previousPublished: null,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "theme.rollback",
      entityType: "theme",
      summary: "Rolled back published theme configuration to previous snapshot.",
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, themeConfig: restored });
  }

  if (data.action === "apply_preset") {
    const allPresets: ThemePreset[] = [
      ...BUILT_IN_THEME_PRESETS,
      ...current.customPresets,
    ];
    const preset = allPresets.find((p) => p.id === data.presetId);
    if (!preset) {
      return NextResponse.json({ error: "Theme preset not found." }, { status: 404 });
    }
    const nextBundle = {
      light: structuredClone(preset.light),
      dark: structuredClone(preset.dark),
      overrides: {},
    };
    const publishNow = Boolean(data.publish);
    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: preset.id,
      draft: nextBundle,
      previousPublished: publishNow
        ? structuredClone(current.published)
        : current.previousPublished,
      published: publishNow ? structuredClone(nextBundle) : current.published,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: publishNow ? "theme.preset_published" : "theme.preset_loaded",
      entityType: "theme",
      entityId: preset.id,
      summary: `${publishNow ? "Published" : "Loaded"} theme preset "${preset.name}".`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, themeConfig: updated });
  }

  // save_custom_preset
  const presetName = sanitizePlainText(data.name, 60);
  const presetDesc = data.description
    ? sanitizePlainText(data.description, 180)
    : "Custom saved OmniFlow palette.";

  const newPreset: ThemePreset = {
    id: `custom_${randomBytes(6).toString("hex")}`,
    name: presetName,
    description: presetDesc,
    isBuiltIn: false,
    light: structuredClone(current.draft.light),
    dark: structuredClone(current.draft.dark),
  };

  const saved = await db.saveThemeConfig({
    ...current,
    activePresetId: newPreset.id,
    customPresets: [...current.customPresets, newPreset],
  });

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "theme.custom_preset_saved",
    entityType: "theme",
    entityId: newPreset.id,
    summary: `Saved custom theme preset "${newPreset.name}".`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, themeConfig: saved, preset: newPreset });
}
