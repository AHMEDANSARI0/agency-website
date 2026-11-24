import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ComponentTokenOverrides, ThemeMode, ThemePreset } from "@/types/theme";
import {
  evaluateThemeContrast,
  isValidCssColor,
  sanitizeDesignSystemTokens,
  sanitizeTokenSet,
} from "@/features/themes/color-utils";
import {
  BUILT_IN_THEME_PRESETS,
  createArchivedOriginalThemeSnapshot,
  OMNIFLOW_DARK_TOKENS,
  OMNIFLOW_LIGHT_TOKENS,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  SOALE_INSPIRED_PRESET_ID,
} from "@/features/themes/presets";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { readBoundedJsonBody } from "@/lib/security/request-guards";
import { sanitizePlainText } from "@/lib/validation/common";

const MAX_THEME_PAYLOAD_BYTES = 64 * 1024;

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

const designSystemSchema = z
  .object({
    typography: z.enum(["architectural", "editorial", "technical"]).optional(),
    buttonStyle: z.enum(["pill", "rounded", "sharp"]).optional(),
    borderRadius: z.enum(["compact", "balanced", "generous"]).optional(),
    spacing: z.enum(["compact", "comfortable", "spacious"]).optional(),
    animationIntensity: z.enum(["full", "subtle", "minimal"]).optional(),
    headingWeight: z.enum(["400", "500", "600"]).optional(),
    bodyLineHeight: z.enum(["compact", "relaxed", "editorial"]).optional(),
    letterSpacing: z.enum(["tight", "normal", "editorial"]).optional(),
  })
  .strict();

const putThemeSchema = z.object({
  defaultMode: z.enum(["light", "dark", "system"]),
  activePresetId: z.string().min(1).max(80),
  designSystem: designSystemSchema.optional(),
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
    action: z.literal("restore_archived_theme"),
    publish: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("apply_preset"),
    presetId: z.string().min(1).max(80),
    publish: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("reset_preset_defaults"),
    presetId: z.string().min(1).max(80).optional(),
    publish: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("save_custom_preset"),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(180).optional(),
  }),
  z.object({
    action: z.literal("duplicate_preset"),
    presetId: z.string().min(1).max(80),
    name: z.string().trim().min(2).max(60).optional(),
    activate: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("rename_preset"),
    presetId: z.string().min(1).max(80),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(180).optional(),
  }),
  z.object({
    action: z.literal("delete_custom_preset"),
    presetId: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal("restore_version"),
    versionId: z.string().min(1).max(80),
    publish: z.boolean().optional(),
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

  const bounded = await readBoundedJsonBody(request, MAX_THEME_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json({ error: bounded.error }, { status: bounded.status });
  }

  const parsed = putThemeSchema.safeParse(bounded.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid theme payload." },
      { status: 400 }
    );
  }

  const current = await db.getThemeConfig();
  const cleanActivePresetId = sanitizePlainText(parsed.data.activePresetId, 80);
  const allPresets: ThemePreset[] = [
    ...BUILT_IN_THEME_PRESETS,
    ...current.customPresets,
  ];
  const matchedPreset = allPresets.find((p) => p.id === cleanActivePresetId);

  const safeLight = sanitizeTokenSet(
    parsed.data.light as Partial<typeof OMNIFLOW_LIGHT_TOKENS>,
    matchedPreset?.light ?? OMNIFLOW_LIGHT_TOKENS
  );
  const safeDark = sanitizeTokenSet(
    parsed.data.dark as Partial<typeof OMNIFLOW_DARK_TOKENS>,
    matchedPreset?.dark ?? OMNIFLOW_DARK_TOKENS
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
  const nextDesignSystem = sanitizeDesignSystemTokens(
    parsed.data.designSystem ?? current.designSystem
  );
  const nextDefaultMode = parsed.data.defaultMode as ThemeMode;
  const archivedOriginal = createArchivedOriginalThemeSnapshot(current);

  // Protect locked/archived presets: never allow active editor edits to overwrite "Original Agency Theme — Archived"
  const isEditingLockedArchive =
    cleanActivePresetId === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID ||
    Boolean(matchedPreset?.isLocked);

  let effectivePresetId = cleanActivePresetId;
  let nextCustomPresets = [...current.customPresets];

  if (isEditingLockedArchive) {
    const forkId = "custom_archived_working_copy";
    effectivePresetId = forkId;
    const forkPreset: ThemePreset = {
      id: forkId,
      name: "Original Agency Theme (Working Copy)",
      description:
        "Customized working copy forked automatically so 'Original Agency Theme — Archived' stays untouched.",
      isBuiltIn: false,
      defaultMode: nextDefaultMode,
      designSystem: structuredClone(nextDesignSystem),
      light: structuredClone(safeLight),
      dark: structuredClone(safeDark),
      overrides: structuredClone(safeOverrides),
    };
    const existingIdx = nextCustomPresets.findIndex((p) => p.id === forkId);
    if (existingIdx >= 0) {
      nextCustomPresets[existingIdx] = forkPreset;
    } else {
      nextCustomPresets = [...nextCustomPresets, forkPreset];
    }
  } else {
    // Keep custom preset snapshot synced when editing that custom preset directly
    const customIdx = nextCustomPresets.findIndex(
      (p) => p.id === effectivePresetId && !p.isBuiltIn && !p.isLocked
    );
    if (customIdx >= 0) {
      nextCustomPresets[customIdx] = {
        ...nextCustomPresets[customIdx],
        defaultMode: nextDefaultMode,
        designSystem: structuredClone(nextDesignSystem),
        light: structuredClone(safeLight),
        dark: structuredClone(safeDark),
        overrides: structuredClone(safeOverrides),
      };
    }
  }

  const nextBundleWithMeta = {
    ...nextDraft,
    designSystem: structuredClone(nextDesignSystem),
    defaultMode: nextDefaultMode,
  };

  const nextSavedPresetStates = {
    ...(current.savedPresetStates ?? {}),
    [effectivePresetId]: structuredClone(nextBundleWithMeta),
  };
  // Guarantee archived preset slot is never mutated in savedPresetStates
  delete nextSavedPresetStates[ORIGINAL_AGENCY_ARCHIVED_PRESET_ID];

  const activeLabel =
    nextCustomPresets.find((p) => p.id === effectivePresetId)?.name ||
    BUILT_IN_THEME_PRESETS.find((p) => p.id === effectivePresetId)?.name ||
    effectivePresetId;

  const nextVersionHistory = shouldPublish
    ? [
        {
          versionId: `ver_${randomBytes(4).toString("hex")}`,
          presetId: effectivePresetId,
          label: `Published ${activeLabel}`,
          savedAt: new Date().toISOString(),
          savedBy: auth.user.email,
          defaultMode: nextDefaultMode,
          designSystem: structuredClone(nextDesignSystem),
          snapshot: structuredClone(nextBundleWithMeta),
        },
        ...(current.versionHistory ?? []),
      ].slice(0, 15)
    : current.versionHistory;

  const nextConfig = await db.saveThemeConfig({
    ...current,
    defaultMode: nextDefaultMode,
    activePresetId: effectivePresetId,
    designSystem: nextDesignSystem,
    draft: nextBundleWithMeta,
    savedPresetStates: nextSavedPresetStates,
    archivedOriginalTheme: archivedOriginal,
    versionHistory: nextVersionHistory,
    customPresets: nextCustomPresets,
    previousPublished: shouldPublish
      ? structuredClone(current.published)
      : current.previousPublished,
    published: shouldPublish
      ? structuredClone(nextBundleWithMeta)
      : current.published,
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

  const bounded = await readBoundedJsonBody(request, MAX_THEME_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json({ error: bounded.error }, { status: bounded.status });
  }

  const parsed = actionSchema.safeParse(bounded.data);
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
      updatedBy: auth.user.email,
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

  if (data.action === "restore_archived_theme") {
    const archived = createArchivedOriginalThemeSnapshot(current);
    const nextSavedPresetStates = { ...(current.savedPresetStates ?? {}) };
    if (
      current.activePresetId &&
      current.activePresetId !== ORIGINAL_AGENCY_ARCHIVED_PRESET_ID
    ) {
      nextSavedPresetStates[current.activePresetId] = structuredClone({
        ...current.draft,
        designSystem: current.designSystem
          ? structuredClone(current.designSystem)
          : undefined,
        defaultMode: current.defaultMode,
      });
    }
    delete nextSavedPresetStates[ORIGINAL_AGENCY_ARCHIVED_PRESET_ID];

    const restoredBundle = {
      light: structuredClone(archived.light),
      dark: structuredClone(archived.dark),
      overrides: structuredClone(archived.overrides ?? {}),
      designSystem: structuredClone(archived.designSystem),
      defaultMode: archived.defaultMode,
    };

    const publishNow = Boolean(data.publish);
    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
      defaultMode: archived.defaultMode,
      designSystem: structuredClone(archived.designSystem),
      draft: restoredBundle,
      savedPresetStates: nextSavedPresetStates,
      archivedOriginalTheme: archived,
      previousPublished: publishNow
        ? structuredClone(current.published)
        : current.previousPublished,
      published: publishNow ? structuredClone(restoredBundle) : current.published,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: publishNow
        ? "theme.archived_original_published"
        : "theme.archived_original_loaded",
      entityType: "theme",
      entityId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
      summary: `${publishNow ? "Restored & published" : "Loaded"} "${archived.name}" (${archived.version}).`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, themeConfig: updated });
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

    const archived = createArchivedOriginalThemeSnapshot(current);

    // Preserve current preset's configuration so switching away never loses saved work
    const nextSavedPresetStates = { ...(current.savedPresetStates ?? {}) };
    if (
      current.activePresetId &&
      current.activePresetId !== ORIGINAL_AGENCY_ARCHIVED_PRESET_ID
    ) {
      nextSavedPresetStates[current.activePresetId] = structuredClone({
        ...current.draft,
        designSystem: current.designSystem
          ? structuredClone(current.designSystem)
          : undefined,
        defaultMode: current.defaultMode,
      });
    }
    delete nextSavedPresetStates[ORIGINAL_AGENCY_ARCHIVED_PRESET_ID];

    const isArchivedPreset =
      preset.id === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID || Boolean(preset.isArchivedOriginal);
    const rememberedBundle = !isArchivedPreset
      ? nextSavedPresetStates[preset.id]
      : undefined;

    const resolvedDesignSystem = sanitizeDesignSystemTokens(
      isArchivedPreset
        ? archived.designSystem
        : rememberedBundle?.designSystem ?? preset.designSystem ?? current.designSystem
    );
    const resolvedDefaultMode: ThemeMode = isArchivedPreset
      ? archived.defaultMode
      : rememberedBundle?.defaultMode ?? preset.defaultMode ?? current.defaultMode;

    const nextBundle = isArchivedPreset
      ? {
          light: structuredClone(archived.light),
          dark: structuredClone(archived.dark),
          overrides: structuredClone(archived.overrides ?? {}),
          designSystem: structuredClone(resolvedDesignSystem),
          defaultMode: resolvedDefaultMode,
        }
      : rememberedBundle
        ? structuredClone(rememberedBundle)
        : {
            light: structuredClone(preset.light),
            dark: structuredClone(preset.dark),
            overrides: structuredClone(preset.overrides ?? {}),
            designSystem: structuredClone(resolvedDesignSystem),
            defaultMode: resolvedDefaultMode,
          };

    const publishNow = Boolean(data.publish);
    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: preset.id,
      defaultMode: resolvedDefaultMode,
      designSystem: resolvedDesignSystem,
      draft: nextBundle,
      savedPresetStates: nextSavedPresetStates,
      archivedOriginalTheme: archived,
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

  if (data.action === "reset_preset_defaults") {
    const targetPresetId = data.presetId || current.activePresetId;
    const allPresets: ThemePreset[] = [
      ...BUILT_IN_THEME_PRESETS,
      ...current.customPresets,
    ];
    const preset = allPresets.find((p) => p.id === targetPresetId);
    if (!preset) {
      return NextResponse.json({ error: "Theme preset not found." }, { status: 404 });
    }

    const factoryDesignSystem = sanitizeDesignSystemTokens(
      preset.designSystem ?? current.designSystem
    );
    const factoryDefaultMode: ThemeMode = preset.defaultMode ?? current.defaultMode;

    const factoryBundle = {
      light: structuredClone(preset.light),
      dark: structuredClone(preset.dark),
      overrides: structuredClone(preset.overrides ?? {}),
      designSystem: structuredClone(factoryDesignSystem),
      defaultMode: factoryDefaultMode,
    };

    const nextSavedPresetStates = { ...(current.savedPresetStates ?? {}) };
    delete nextSavedPresetStates[preset.id];

    const publishNow = Boolean(data.publish);
    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: preset.id,
      defaultMode: factoryDefaultMode,
      designSystem: factoryDesignSystem,
      draft: factoryBundle,
      savedPresetStates: nextSavedPresetStates,
      previousPublished: publishNow
        ? structuredClone(current.published)
        : current.previousPublished,
      published: publishNow ? structuredClone(factoryBundle) : current.published,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "theme.preset_defaults_restored",
      entityType: "theme",
      entityId: preset.id,
      summary: `Restored factory default Light & Dark tokens for "${preset.name}".`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, themeConfig: updated });
  }

  if (data.action === "duplicate_preset") {
    const allPresets: ThemePreset[] = [
      ...BUILT_IN_THEME_PRESETS,
      ...current.customPresets,
    ];
    const source = allPresets.find((p) => p.id === data.presetId);
    if (!source) {
      return NextResponse.json({ error: "Source preset not found." }, { status: 404 });
    }

    const duplicatedName = data.name
      ? sanitizePlainText(data.name, 60)
      : sanitizePlainText(`${source.name} (Copy)`, 60);

    const isSourceArchived =
      source.id === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID ||
      Boolean(source.isArchivedOriginal);
    const archived = createArchivedOriginalThemeSnapshot(current);

    const remembered =
      !isSourceArchived && current.savedPresetStates?.[source.id]
        ? current.savedPresetStates[source.id]
        : undefined;

    const clonedDesignSystem = sanitizeDesignSystemTokens(
      isSourceArchived
        ? archived.designSystem
        : remembered?.designSystem ?? source.designSystem ?? current.designSystem
    );
    const clonedMode: ThemeMode = isSourceArchived
      ? archived.defaultMode
      : remembered?.defaultMode ?? source.defaultMode ?? current.defaultMode;

    const duplicatedPreset: ThemePreset = {
      id: `custom_${randomBytes(6).toString("hex")}`,
      name: duplicatedName,
      description: `Duplicated from "${source.name}" — unlocked custom variant.`,
      isBuiltIn: false,
      isArchivedOriginal: false,
      isLocked: false,
      sourcePresetId: source.id,
      version: "1.0.0-custom",
      defaultMode: clonedMode,
      designSystem: structuredClone(clonedDesignSystem),
      light: structuredClone(
        isSourceArchived
          ? archived.light
          : remembered?.light ?? source.light
      ),
      dark: structuredClone(
        isSourceArchived
          ? archived.dark
          : remembered?.dark ?? source.dark
      ),
      overrides: structuredClone(
        isSourceArchived
          ? archived.overrides ?? {}
          : remembered?.overrides ?? source.overrides ?? {}
      ),
    };

    const activateNow = data.activate !== false;
    const nextSavedPresetStates = { ...(current.savedPresetStates ?? {}) };
    if (
      activateNow &&
      current.activePresetId &&
      current.activePresetId !== ORIGINAL_AGENCY_ARCHIVED_PRESET_ID
    ) {
      nextSavedPresetStates[current.activePresetId] = structuredClone({
        ...current.draft,
        designSystem: current.designSystem
          ? structuredClone(current.designSystem)
          : undefined,
        defaultMode: current.defaultMode,
      });
    }
    delete nextSavedPresetStates[ORIGINAL_AGENCY_ARCHIVED_PRESET_ID];

    const nextDraft = activateNow
      ? {
          light: structuredClone(duplicatedPreset.light),
          dark: structuredClone(duplicatedPreset.dark),
          overrides: structuredClone(duplicatedPreset.overrides ?? {}),
          designSystem: structuredClone(clonedDesignSystem),
          defaultMode: clonedMode,
        }
      : current.draft;

    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: activateNow ? duplicatedPreset.id : current.activePresetId,
      defaultMode: activateNow ? clonedMode : current.defaultMode,
      designSystem: activateNow ? clonedDesignSystem : current.designSystem,
      draft: nextDraft,
      savedPresetStates: nextSavedPresetStates,
      archivedOriginalTheme: archived,
      customPresets: [...current.customPresets, duplicatedPreset],
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "theme.preset_duplicated",
      entityType: "theme",
      entityId: duplicatedPreset.id,
      summary: `Duplicated preset "${source.name}" as "${duplicatedPreset.name}".`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({
      ok: true,
      themeConfig: updated,
      preset: duplicatedPreset,
    });
  }

  if (data.action === "rename_preset") {
    const builtInMatch = BUILT_IN_THEME_PRESETS.find((p) => p.id === data.presetId);
    if (builtInMatch || data.presetId === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID) {
      return NextResponse.json(
        {
          error:
            "Built-in or archived presets cannot be renamed directly. Duplicate the preset first.",
        },
        { status: 400 }
      );
    }

    const customIdx = current.customPresets.findIndex((p) => p.id === data.presetId);
    if (customIdx < 0) {
      return NextResponse.json({ error: "Custom preset not found." }, { status: 404 });
    }

    const target = current.customPresets[customIdx];
    if (target.isLocked) {
      return NextResponse.json(
        { error: "Locked presets cannot be renamed." },
        { status: 400 }
      );
    }

    const cleanName = sanitizePlainText(data.name, 60);
    const cleanDesc =
      typeof data.description === "string"
        ? sanitizePlainText(data.description, 180)
        : target.description;

    const nextCustomPresets = [...current.customPresets];
    nextCustomPresets[customIdx] = {
      ...target,
      name: cleanName,
      description: cleanDesc || target.description,
    };

    const updated = await db.saveThemeConfig({
      ...current,
      customPresets: nextCustomPresets,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "theme.preset_renamed",
      entityType: "theme",
      entityId: target.id,
      summary: `Renamed custom preset "${target.name}" to "${cleanName}".`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({
      ok: true,
      themeConfig: updated,
      preset: nextCustomPresets[customIdx],
    });
  }

  if (data.action === "delete_custom_preset") {
    const builtInMatch = BUILT_IN_THEME_PRESETS.find((p) => p.id === data.presetId);
    if (builtInMatch || data.presetId === ORIGINAL_AGENCY_ARCHIVED_PRESET_ID) {
      return NextResponse.json(
        { error: "Built-in or archived presets cannot be deleted." },
        { status: 400 }
      );
    }

    const target = current.customPresets.find((p) => p.id === data.presetId);
    if (!target) {
      return NextResponse.json({ error: "Custom preset not found." }, { status: 404 });
    }

    const nextCustomPresets = current.customPresets.filter(
      (p) => p.id !== data.presetId
    );
    const nextSavedPresetStates = { ...(current.savedPresetStates ?? {}) };
    delete nextSavedPresetStates[data.presetId];

    let nextActivePresetId = current.activePresetId;
    let nextDraft = current.draft;
    let nextDesignSystem = current.designSystem;
    let nextDefaultMode = current.defaultMode;

    if (current.activePresetId === data.presetId) {
      const fallbackPreset =
        BUILT_IN_THEME_PRESETS.find((p) => p.id === SOALE_INSPIRED_PRESET_ID) ??
        BUILT_IN_THEME_PRESETS[0];
      nextActivePresetId = fallbackPreset.id;
      nextDesignSystem = sanitizeDesignSystemTokens(fallbackPreset.designSystem);
      nextDefaultMode = fallbackPreset.defaultMode ?? "light";
      nextDraft = {
        light: structuredClone(fallbackPreset.light),
        dark: structuredClone(fallbackPreset.dark),
        overrides: structuredClone(fallbackPreset.overrides ?? {}),
        designSystem: structuredClone(nextDesignSystem),
        defaultMode: nextDefaultMode,
      };
    }

    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: nextActivePresetId,
      defaultMode: nextDefaultMode,
      designSystem: nextDesignSystem,
      draft: nextDraft,
      savedPresetStates: nextSavedPresetStates,
      customPresets: nextCustomPresets,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "theme.custom_preset_deleted",
      entityType: "theme",
      entityId: target.id,
      summary: `Deleted custom theme preset "${target.name}".`,
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, themeConfig: updated });
  }

  if (data.action === "restore_version") {
    const entry = (current.versionHistory ?? []).find(
      (v) => v.versionId === data.versionId
    );
    if (!entry) {
      return NextResponse.json(
        { error: "Theme version snapshot not found." },
        { status: 404 }
      );
    }

    const restoredDesignSystem = sanitizeDesignSystemTokens(
      entry.designSystem ?? entry.snapshot.designSystem ?? current.designSystem
    );
    const restoredMode: ThemeMode =
      entry.defaultMode ?? entry.snapshot.defaultMode ?? current.defaultMode;

    const restoredBundle = {
      light: structuredClone(entry.snapshot.light),
      dark: structuredClone(entry.snapshot.dark),
      overrides: structuredClone(entry.snapshot.overrides ?? {}),
      designSystem: structuredClone(restoredDesignSystem),
      defaultMode: restoredMode,
    };

    const publishNow = Boolean(data.publish);
    const updated = await db.saveThemeConfig({
      ...current,
      activePresetId: entry.presetId || current.activePresetId,
      defaultMode: restoredMode,
      designSystem: restoredDesignSystem,
      draft: restoredBundle,
      previousPublished: publishNow
        ? structuredClone(current.published)
        : current.previousPublished,
      published: publishNow ? structuredClone(restoredBundle) : current.published,
      updatedBy: auth.user.email,
    });

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: publishNow ? "theme.version_published" : "theme.version_loaded",
      entityType: "theme",
      entityId: entry.versionId,
      summary: `${publishNow ? "Restored & published" : "Loaded"} theme version "${entry.label}" (${entry.versionId}).`,
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
    defaultMode: current.defaultMode,
    designSystem: sanitizeDesignSystemTokens(current.designSystem),
    light: structuredClone(current.draft.light),
    dark: structuredClone(current.draft.dark),
    overrides: structuredClone(current.draft.overrides ?? {}),
  };

  const saved = await db.saveThemeConfig({
    ...current,
    activePresetId: newPreset.id,
    customPresets: [...current.customPresets, newPreset],
    updatedBy: auth.user.email,
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
