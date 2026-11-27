"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  History,
  Palette,
  Pencil,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type {
  BodyLineHeightPreset,
  ButtonShapeStyle,
  ComponentTokenOverrides,
  HeadingWeightPreset,
  LetterSpacingPreset,
  MotionIntensityPreset,
  RadiusDensityPreset,
  ResolvedThemeMode,
  SemanticColorTokens,
  SpacingDensityPreset,
  ThemeConfiguration,
  ThemeDesignTokens,
  ThemeMode,
  ThemePreset,
  TypographyScalePreset,
} from "@/types/theme";
import {
  evaluateThemeContrast,
  isValidCssColor,
  sanitizeDesignSystemTokens,
} from "@/features/themes/color-utils";
import {
  OMNIFLOW_DARK_PURPLE_AI_PRESET_ID,
  ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
  SOALE_CREATIVE_AI_PRESET_ID,
} from "@/features/themes/presets";

interface ThemeManagerClientProps {
  initialConfig: ThemeConfiguration;
  builtInPresets: ThemePreset[];
}

const COLOR_FIELDS: Array<{
  key: keyof SemanticColorTokens;
  label: string;
  group: "Brand & CTA" | "Surfaces & Borders" | "Typography & Status";
}> = [
  { key: "primary", label: "Primary Accent (Brand)", group: "Brand & CTA" },
  { key: "primaryHover", label: "Primary Hover", group: "Brand & CTA" },
  { key: "primaryActive", label: "Primary Active", group: "Brand & CTA" },
  { key: "primaryForeground", label: "Primary Button Text", group: "Brand & CTA" },
  { key: "secondary", label: "Secondary Button Bg", group: "Brand & CTA" },
  { key: "secondaryForeground", label: "Secondary Button Text", group: "Brand & CTA" },
  { key: "accent", label: "Highlight Accent", group: "Brand & CTA" },
  { key: "link", label: "Link Color", group: "Brand & CTA" },
  { key: "background", label: "Page Canvas Background", group: "Surfaces & Borders" },
  { key: "surface", label: "Primary Surface", group: "Surfaces & Borders" },
  { key: "surfaceElevated", label: "Elevated Surface", group: "Surfaces & Borders" },
  { key: "surfaceMuted", label: "Tertiary / Muted Surface", group: "Surfaces & Borders" },
  { key: "border", label: "Primary Hairline Border", group: "Surfaces & Borders" },
  { key: "borderStrong", label: "Strong Control Border", group: "Surfaces & Borders" },
  { key: "heading", label: "Heading Text (Primary)", group: "Typography & Status" },
  { key: "body", label: "Body Copy Text (Secondary)", group: "Typography & Status" },
  { key: "muted", label: "Muted / Eyebrow Text", group: "Typography & Status" },
  { key: "success", label: "Success Status", group: "Typography & Status" },
  { key: "warning", label: "Warning Status", group: "Typography & Status" },
  { key: "error", label: "Error Status", group: "Typography & Status" },
];

const OVERRIDE_KEYS: Array<{
  key: keyof ComponentTokenOverrides;
  label: string;
}> = [
  { key: "primaryButtonBg", label: "Primary Button Bg Override" },
  { key: "navbarBg", label: "Floating Navbar Bg Override" },
  { key: "footerBg", label: "Footer Bg Override" },
  { key: "cardBg", label: "Card Surface Bg Override" },
  { key: "badgeBg", label: "Badge Bg Override" },
];

function toHexInputFallback(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim() : "#6D199C";
}

export function ThemeManagerClient({
  initialConfig,
  builtInPresets,
}: ThemeManagerClientProps) {
  const [config, setConfig] = useState<ThemeConfiguration>(initialConfig);
  const [editingMode, setEditingMode] = useState<ResolvedThemeMode>(
    initialConfig.defaultMode === "light" ? "light" : "dark"
  );
  const [customPresetName, setCustomPresetName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const livePreviewRef = useRef<HTMLIFrameElement | null>(null);

  const activeTokens =
    editingMode === "dark" ? config.draft.dark : config.draft.light;
  const activeOverrides =
    (editingMode === "dark"
      ? config.draft.overrides?.dark
      : config.draft.overrides?.light) ?? {};

  const designSystem = sanitizeDesignSystemTokens(config.designSystem);

  const syncLivePreview = useCallback(() => {
    livePreviewRef.current?.contentWindow?.postMessage(
      {
        type: "OMNIFLOW_THEME_PREVIEW",
        themeMode: editingMode,
        themePreview: {
          activePresetId: config.activePresetId,
          draft: config.draft,
          designSystem,
        },
      },
      window.location.origin
    );
  }, [config.activePresetId, config.draft, designSystem, editingMode]);

  useEffect(() => {
    syncLivePreview();
  }, [syncLivePreview]);

  useEffect(() => {
    const onPreviewReady = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "OMNIFLOW_VE_READY"
      ) {
        syncLivePreview();
      }
    };
    window.addEventListener("message", onPreviewReady);
    return () => window.removeEventListener("message", onPreviewReady);
  }, [syncLivePreview]);

  function updateDesignSystem(patch: Partial<ThemeDesignTokens>) {
    setConfig((prev) => ({
      ...prev,
      designSystem: sanitizeDesignSystemTokens({
        ...prev.designSystem,
        ...patch,
      }),
    }));
  }

  const allPresets = useMemo(
    () => [...builtInPresets, ...config.customPresets],
    [builtInPresets, config.customPresets]
  );

  const contrastWarnings = useMemo(
    () => [
      ...evaluateThemeContrast("dark", config.draft.dark),
      ...evaluateThemeContrast("light", config.draft.light),
    ],
    [config.draft.dark, config.draft.light]
  );

  function updateColor(key: keyof SemanticColorTokens, value: string) {
    setConfig((prev) => {
      const target = editingMode === "dark" ? prev.draft.dark : prev.draft.light;
      const updatedTarget = {
        ...target,
        colors: {
          ...target.colors,
          [key]: value,
        },
      };
      return {
        ...prev,
        draft: {
          ...prev.draft,
          [editingMode]: updatedTarget,
        },
      };
    });
  }

  function updateOverride(key: keyof ComponentTokenOverrides, value: string) {
    setConfig((prev) => {
      const currentModeOverrides = {
        ...(editingMode === "dark"
          ? prev.draft.overrides?.dark
          : prev.draft.overrides?.light),
      };
      if (!value.trim()) {
        delete currentModeOverrides[key];
      } else {
        currentModeOverrides[key] = value;
      }
      return {
        ...prev,
        draft: {
          ...prev.draft,
          overrides: {
            ...(prev.draft.overrides ?? {}),
            [editingMode]: currentModeOverrides,
          },
        },
      };
    });
  }

  async function postThemeAction(
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        themeConfig?: ThemeConfiguration;
      };
      if (!res.ok || !data.themeConfig) {
        setFeedback({
          type: "error",
          text: data.error || "Theme action could not be completed.",
        });
        return false;
      }
      setConfig(data.themeConfig);
      setFeedback({ type: "success", text: successMessage });
      return true;
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while communicating with Theme API.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveTheme(publish: boolean) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultMode: config.defaultMode,
          activePresetId: config.activePresetId,
          designSystem,
          light: config.draft.light,
          dark: config.draft.dark,
          overrides: config.draft.overrides,
          publish,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        themeConfig?: ThemeConfiguration;
      };
      if (!res.ok || !data.themeConfig) {
        setFeedback({
          type: "error",
          text: data.error || "Unable to save theme configuration.",
        });
        setBusy(false);
        return;
      }
      setConfig(data.themeConfig);
      setFeedback({
        type: "success",
        text: publish
          ? "Theme tokens & Inter typography settings published live across the public website!"
          : "Draft tokens saved without changing the live public theme.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving theme.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCustomPreset(e: React.FormEvent) {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    const ok = await postThemeAction(
      {
        action: "save_custom_preset",
        name: customPresetName.trim(),
      },
      `Saved "${customPresetName.trim()}" as a reusable custom preset.`
    );
    if (ok) {
      setCustomPresetName("");
    }
  }

  async function handleCommitRename(presetId: string) {
    if (!renameDraft.trim() || renameDraft.trim().length < 2) return;
    const ok = await postThemeAction(
      {
        action: "rename_preset",
        presetId,
        name: renameDraft.trim(),
      },
      `Renamed custom preset to "${renameDraft.trim()}".`
    );
    if (ok) {
      setRenamingId(null);
      setRenameDraft("");
    }
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-control border p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-status-success/40 bg-status-success/10 text-ink-heading"
              : "border-status-error/40 bg-status-error/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface-card p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Default Visitor Mode:
          </label>
          <select
            value={config.defaultMode}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                defaultMode: e.target.value as ThemeMode,
              }))
            }
            className="rounded-control border border-line bg-surface-input px-3 py-1.5 text-xs font-semibold text-ink-heading"
          >
            <option value="dark">Dark Mode First (Dark Purple AI — Default)</option>
            <option value="light">Light Mode First (Crisp Alabaster)</option>
            <option value="system">Automatic / Match Visitor OS Preference</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                {
                  action: "reset_preset_defaults",
                  presetId: config.activePresetId,
                  publish: false,
                },
                "Restored factory default Light, Dark & typography tokens in draft."
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Preset Defaults</span>
          </button>

          {config.previousPublished && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                postThemeAction(
                  { action: "rollback" },
                  "Rolled back published theme configuration to previous snapshot."
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rollback Previous</span>
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => saveTheme(false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => saveTheme(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Publish Theme Live</span>
          </button>
        </div>
      </div>

      {/* Archived Original Theme Vault */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-line-strong bg-surface-muted/60 p-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/35 bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Archived Original · Overwrite Protected
            </span>
            <span className="font-mono text-[11px] text-ink-muted">
              {config.archivedOriginalTheme?.version || "1.0.0-archived"}
            </span>
          </div>
          <h2 className="mt-1.5 text-sm font-semibold text-ink-heading">
            {config.archivedOriginalTheme?.name || "Original Agency Theme — Archived"}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Immutable pre-redesign snapshot (Light &amp; Dark palettes, glass surfaces, typography, spacing, radii &amp; shadows). Saving edits automatically forks a safe working copy so the archive is never overwritten.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                { action: "restore_archived_theme", publish: false },
                'Loaded "Original Agency Theme — Archived" into draft preview.'
              )
            }
            className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-heading hover:bg-surface-card"
          >
            Preview Archived
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                {
                  action: "duplicate_preset",
                  presetId: ORIGINAL_AGENCY_ARCHIVED_PRESET_ID,
                  activate: true,
                },
                "Duplicated Archived Original Theme into an editable custom preset."
              )
            }
            className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-heading hover:bg-surface-card"
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate to Edit</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                { action: "restore_archived_theme", publish: true },
                'Restored and published "Original Agency Theme — Archived" live across the website.'
              )
            }
            className="rounded-full bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Restore &amp; Activate Original
          </button>
        </div>
      </div>

      {/* Featured Soale Creative AI Dual-Mode Theme Content Library Card */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-primary/35 bg-accent-subtle/35 p-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Saved in Theme Content Library · Dark &amp; Light
            </span>
            {config.activePresetId === SOALE_CREATIVE_AI_PRESET_ID && (
              <span className="rounded-full border border-primary/40 bg-surface px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                Currently Active
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-sm font-semibold text-ink-heading">
            Soale Creative AI — Orbital Glow (Dark &amp; Light)
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Obsidian (#060609) &amp; daylight alabaster (#FAF8F6) dual-mode system with the rotating sunset-orange → rose-pink → electric-orchid (#FF7023 → #BF4A91 → #C823FF) hero orbital halo, sticky scroll cards, and WCAG AA contrast.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                {
                  action: "duplicate_preset",
                  sourcePresetId: SOALE_CREATIVE_AI_PRESET_ID,
                  name: "Soale Creative AI (Custom Copy)",
                },
                'Saved a customizable copy of "Soale Creative AI" in your Theme Content Library.'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
          >
            <Copy className="h-3 w-3" />
            <span>Save Custom Copy</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              postThemeAction(
                {
                  action: "apply_preset",
                  presetId: SOALE_CREATIVE_AI_PRESET_ID,
                  publish: true,
                },
                'Applied & published "Soale Creative AI — Orbital Glow (Dark & Light)" live across the website.'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Apply &amp; Publish Soale UI</span>
          </button>
        </div>
      </div>

      {/* Extended Theme Content Library */}
      <section className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Theme Content Library ({allPresets.length} Saved Presets)
            </h2>
            <p className="text-xs text-ink-muted">
              Activate, duplicate, rename, edit, reset, or save custom Light &amp; Dark palettes without losing prior work.
            </p>
          </div>
          <form onSubmit={handleSaveCustomPreset} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customPresetName}
              onChange={(e) => setCustomPresetName(e.target.value)}
              placeholder="Save current draft as preset..."
              className="rounded-control border border-line bg-surface-input px-3 py-1.5 text-xs text-ink-heading"
            />
            <button
              type="submit"
              disabled={busy || !customPresetName.trim()}
              className="rounded-control border border-line-strong px-3 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted disabled:opacity-50"
            >
              + Save New Preset
            </button>
          </form>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allPresets.map((preset) => {
            const isActive = config.activePresetId === preset.id;
            const isRenaming = renamingId === preset.id;
            const canRenameOrDelete = !preset.isBuiltIn && !preset.isLocked;

            return (
              <div
                key={preset.id}
                className={`flex flex-col justify-between rounded-control border p-4 transition-colors ${
                  isActive
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            aria-label="New preset name"
                            className="w-full rounded border border-primary bg-surface-input px-2 py-1 text-xs font-semibold text-ink-heading"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleCommitRename(preset.id)}
                            title="Save preset name"
                            className="rounded border border-line p-1 text-status-success hover:bg-surface-muted"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(null);
                              setRenameDraft("");
                            }}
                            title="Cancel rename"
                            className="rounded border border-line p-1 text-ink-muted hover:bg-surface-muted"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-ink-heading">
                            {preset.name}
                          </h3>
                          {preset.id === OMNIFLOW_DARK_PURPLE_AI_PRESET_ID && (
                            <span className="rounded-full border border-primary/35 bg-accent-subtle px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                              Default SaaS
                            </span>
                          )}
                          {preset.id === SOALE_CREATIVE_AI_PRESET_ID && (
                            <span className="rounded-full border border-primary/35 bg-accent-subtle px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                              Soale Orbital · Dark &amp; Light
                            </span>
                          )}
                          {isActive && (
                            <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                              Active
                            </span>
                          )}
                          {preset.isArchivedOriginal && (
                            <span className="rounded-full border border-line-strong bg-surface-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-heading">
                              Locked Archive
                            </span>
                          )}
                          {!preset.isBuiltIn && (
                            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                              Custom
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dual Light + Dark Swatch Pills */}
                    <div
                      className="flex shrink-0 items-center gap-1"
                      title="Light & Dark Swatch Preview"
                    >
                      {[
                        preset.light.colors.background,
                        preset.light.colors.primary,
                        preset.dark.colors.background,
                        preset.dark.colors.primary,
                      ].map((hex, i) => (
                        <span
                          key={i}
                          className="h-4 w-4 rounded-full border border-black/15 dark:border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-ink-muted">{preset.description}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      postThemeAction(
                        {
                          action: "apply_preset",
                          presetId: preset.id,
                          publish: false,
                        },
                        `Loaded "${preset.name}" into draft editor.`
                      )
                    }
                    className="rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-medium text-ink-heading hover:bg-surface-muted"
                  >
                    Edit Draft
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      postThemeAction(
                        {
                          action: "apply_preset",
                          presetId: preset.id,
                          publish: true,
                        },
                        `Activated and published "${preset.name}" live!`
                      )
                    }
                    className="rounded-full bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    Activate Live
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      postThemeAction(
                        {
                          action: "duplicate_preset",
                          presetId: preset.id,
                          activate: true,
                        },
                        `Duplicated "${preset.name}" into an editable custom preset.`
                      )
                    }
                    title={`Duplicate ${preset.name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:text-ink-heading"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Duplicate</span>
                  </button>

                  {preset.isBuiltIn && !preset.isArchivedOriginal && isActive && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        postThemeAction(
                          {
                            action: "reset_preset_defaults",
                            presetId: preset.id,
                            publish: false,
                          },
                          `Reset "${preset.name}" to factory defaults.`
                        )
                      }
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:text-ink-heading"
                    >
                      Reset
                    </button>
                  )}

                  {canRenameOrDelete && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setRenamingId(preset.id);
                          setRenameDraft(preset.name);
                        }}
                        title="Rename custom preset"
                        className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:text-ink-heading"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Rename</span>
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          postThemeAction(
                            {
                              action: "delete_custom_preset",
                              presetId: preset.id,
                            },
                            `Deleted custom preset "${preset.name}".`
                          )
                        }
                        title="Delete custom preset"
                        className="inline-flex items-center rounded-full border border-line p-1 text-ink-muted hover:border-status-error hover:text-status-error"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Controlled Design System & Inter Typography Tokens */}
      <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
        <div className="flex items-center gap-2 border-b border-line pb-4">
          <Sliders className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Inter Typography &amp; Architecture Tokens
            </h2>
            <p className="text-xs text-ink-muted">
              Fine-tune Inter heading weight, letter-spacing, body line-height, button geometry, card radius density, section rhythm, and motion intensity.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Typography Preset
            </label>
            <select
              aria-label="Typography preset"
              value={designSystem.typography}
              onChange={(e) =>
                updateDesignSystem({
                  typography: e.target.value as TypographyScalePreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="editorial">Soale Inter Editorial (Recommended)</option>
              <option value="architectural">Architectural Display</option>
              <option value="technical">Technical Tight</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Heading Font Weight
            </label>
            <select
              aria-label="Heading font weight"
              value={designSystem.headingWeight ?? "600"}
              onChange={(e) =>
                updateDesignSystem({
                  headingWeight: e.target.value as HeadingWeightPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="600">600 — Semibold Crisp (Default)</option>
              <option value="500">500 — Medium Editorial</option>
              <option value="400">400 — Regular Light Display</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Heading Letter-Spacing
            </label>
            <select
              aria-label="Heading letter spacing"
              value={designSystem.letterSpacing ?? "normal"}
              onChange={(e) =>
                updateDesignSystem({
                  letterSpacing: e.target.value as LetterSpacingPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="tight">Tight (-0.036em)</option>
              <option value="normal">Balanced (-0.026em)</option>
              <option value="editorial">Open Editorial (-0.018em)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Body Line-Height
            </label>
            <select
              aria-label="Body line height"
              value={designSystem.bodyLineHeight ?? "relaxed"}
              onChange={(e) =>
                updateDesignSystem({
                  bodyLineHeight: e.target.value as BodyLineHeightPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="compact">Compact (1.54)</option>
              <option value="relaxed">Balanced Reading (1.65)</option>
              <option value="editorial">Spacious Editorial (1.74)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Button Geometry
            </label>
            <select
              aria-label="Button geometry"
              value={designSystem.buttonStyle}
              onChange={(e) =>
                updateDesignSystem({
                  buttonStyle: e.target.value as ButtonShapeStyle,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="rounded">Soale Rounded (Recommended)</option>
              <option value="pill">Pill Capsule</option>
              <option value="sharp">Architectural Sharp (6px)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Card Radius Scale
            </label>
            <select
              aria-label="Card radius scale"
              value={designSystem.borderRadius}
              onChange={(e) =>
                updateDesignSystem({
                  borderRadius: e.target.value as RadiusDensityPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="generous">Generous Soale (22–24px)</option>
              <option value="balanced">Balanced (16px)</option>
              <option value="compact">Compact (10px)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Section Spacing
            </label>
            <select
              aria-label="Section spacing"
              value={designSystem.spacing}
              onChange={(e) =>
                updateDesignSystem({
                  spacing: e.target.value as SpacingDensityPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="spacious">Spacious Executive</option>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact Rhythm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted">
              Motion Intensity
            </label>
            <select
              aria-label="Motion intensity"
              value={designSystem.animationIntensity}
              onChange={(e) =>
                updateDesignSystem({
                  animationIntensity: e.target.value as MotionIntensityPreset,
                })
              }
              className="mt-1.5 w-full rounded-control border border-line bg-surface-input px-3 py-2 text-xs font-medium text-ink-heading"
            >
              <option value="full">Full GPU Hardware Motion</option>
              <option value="subtle">Subtle Transitions</option>
              <option value="minimal">Minimal (Static First)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Contrast Warnings */}
      {contrastWarnings.length > 0 && (
        <div className="rounded-card border border-status-warning/50 bg-status-warning/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-heading">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <span>WCAG AA Contrast Warnings ({contrastWarnings.length})</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-ink-body">
            {contrastWarnings.map((w, idx) => (
              <li key={idx}>
                <strong>[{w.mode.toUpperCase()}]</strong> {w.pairLabel}: ratio{" "}
                <strong>{w.ratio}:1</strong> (recommended minimum {w.minimumRequired}:1)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Token Editor + Real Component Live Preview Split */}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 rounded-card border border-line bg-surface-card p-6 shadow-card xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-ink-heading">
                Semantic &amp; Component Color Tokens
              </h2>
            </div>

            <div className="inline-flex rounded-full border border-line bg-surface p-1">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEditingMode(m)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold capitalize transition-colors ${
                    editingMode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-ink-muted hover:text-ink-heading"
                  }`}
                >
                  {m} Mode Tokens
                </button>
              ))}
            </div>
          </div>

          {(["Brand & CTA", "Surfaces & Borders", "Typography & Status"] as const).map(
            (group) => (
              <div key={group} className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  {group}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COLOR_FIELDS.filter((f) => f.group === group).map((field) => {
                    const val = activeTokens.colors[field.key];
                    const valid = isValidCssColor(val);
                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between gap-2 rounded-control border border-line bg-surface p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink-heading">
                            {field.label}
                          </p>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => updateColor(field.key, e.target.value)}
                            aria-label={`${editingMode} ${field.label}`}
                            className={`mt-1 w-full rounded border px-2 py-1 font-mono text-xs ${
                              valid
                                ? "border-line bg-surface-input text-ink-heading"
                                : "border-status-error bg-status-error/10 text-ink-heading"
                            }`}
                          />
                        </div>
                        <input
                          type="color"
                          value={toHexInputFallback(val)}
                          onChange={(e) => updateColor(field.key, e.target.value)}
                          aria-label={`Color picker for ${field.label}`}
                          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-line bg-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Component-Specific Overrides */}
          <div className="space-y-3 border-t border-line pt-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Component Overrides ({editingMode} mode)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {OVERRIDE_KEYS.map((ov) => {
                const currentVal = activeOverrides[ov.key] ?? "";
                const isOverridden = Boolean(currentVal.trim());
                return (
                  <div
                    key={ov.key}
                    className="rounded-control border border-line bg-surface p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-ink-heading">
                        {ov.label}
                      </span>
                      {isOverridden && (
                        <span className="rounded-full bg-accent-subtle px-2 py-0.5 font-mono text-[10px] text-primary">
                          Overridden
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) => updateOverride(ov.key, e.target.value)}
                        placeholder="Inherits global token"
                        className="flex-1 rounded border border-line bg-surface-input px-2 py-1 font-mono text-xs text-ink-heading"
                      />
                      {isOverridden && (
                        <button
                          type="button"
                          onClick={() => updateOverride(ov.key, "")}
                          className="rounded border border-line px-2 text-[11px] text-ink-muted hover:text-ink-heading"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actual storefront responds to unsaved theme draft edits. */}
        <div className="xl:col-span-5 xl:sticky xl:top-20">
          <div className="overflow-hidden rounded-xl border border-line bg-surface-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-ink-heading">Live storefront</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Draft colors update instantly before publishing.</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setEditingMode(mode)}
                    aria-pressed={editingMode === mode}
                    className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                      editingMode === mode
                        ? "bg-surface-muted font-semibold text-ink-heading"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <iframe
              ref={livePreviewRef}
              src="/?ve=1"
              title="Live theme preview"
              onLoad={syncLivePreview}
              className="h-[68vh] min-h-[540px] w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Published Version History Vault */}
      {config.versionHistory && config.versionHistory.length > 0 && (
        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <History className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-ink-heading">
                Published Theme Version History ({config.versionHistory.length})
              </h2>
              <p className="text-xs text-ink-muted">
                Every published change is versioned automatically for 1-click audit recovery.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line">
            {config.versionHistory.map((ver) => (
              <div
                key={ver.versionId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-heading">
                      {ver.label}
                    </span>
                    <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                      {ver.versionId}
                    </span>
                    <span className="font-mono text-[11px] uppercase text-primary">
                      {ver.defaultMode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Saved {new Date(ver.savedAt).toLocaleString()}{" "}
                    {ver.savedBy ? `by ${ver.savedBy}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      postThemeAction(
                        {
                          action: "restore_version",
                          versionId: ver.versionId,
                          publish: false,
                        },
                        `Loaded snapshot "${ver.versionId}" into draft editor.`
                      )
                    }
                    className="rounded-full border border-line-strong px-3 py-1 text-[11px] font-medium text-ink-heading hover:bg-surface-muted"
                  >
                    Load Draft
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      postThemeAction(
                        {
                          action: "restore_version",
                          versionId: ver.versionId,
                          publish: true,
                        },
                        `Restored & published snapshot "${ver.versionId}".`
                      )
                    }
                    className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    Restore &amp; Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
