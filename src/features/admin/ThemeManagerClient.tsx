"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import type {
  ComponentTokenOverrides,
  ResolvedThemeMode,
  SemanticColorTokens,
  ThemeConfiguration,
  ThemeMode,
  ThemePreset,
} from "@/types/theme";
import {
  evaluateThemeContrast,
  getContrastRatio,
  isValidCssColor,
} from "@/features/themes/color-utils";

interface ThemeManagerClientProps {
  initialConfig: ThemeConfiguration;
  builtInPresets: ThemePreset[];
}

const COLOR_FIELDS: Array<{
  key: keyof SemanticColorTokens;
  label: string;
  group: "Brand & CTA" | "Surfaces & Borders" | "Typography & Status";
}> = [
  { key: "primary", label: "Primary Accent (Indigo / Brand)", group: "Brand & CTA" },
  { key: "primaryHover", label: "Primary Hover", group: "Brand & CTA" },
  { key: "primaryActive", label: "Primary Active", group: "Brand & CTA" },
  { key: "primaryForeground", label: "Primary Button Text", group: "Brand & CTA" },
  { key: "secondary", label: "Secondary Pill Bg", group: "Brand & CTA" },
  { key: "secondaryForeground", label: "Secondary Pill Text", group: "Brand & CTA" },
  { key: "accent", label: "Highlight Accent (Violet / Blue)", group: "Brand & CTA" },
  { key: "link", label: "Link Color", group: "Brand & CTA" },
  { key: "background", label: "Page Canvas Background", group: "Surfaces & Borders" },
  { key: "surface", label: "Primary Surface", group: "Surfaces & Borders" },
  { key: "surfaceElevated", label: "Elevated Surface", group: "Surfaces & Borders" },
  { key: "surfaceMuted", label: "Muted Section Surface", group: "Surfaces & Borders" },
  { key: "border", label: "Subtle Hairline Border", group: "Surfaces & Borders" },
  { key: "borderStrong", label: "Strong Control Border", group: "Surfaces & Borders" },
  { key: "heading", label: "Heading Text (Charcoal / Alabaster)", group: "Typography & Status" },
  { key: "body", label: "Body Copy Text", group: "Typography & Status" },
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
  return /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim() : "#4F46E5";
}

export function ThemeManagerClient({
  initialConfig,
  builtInPresets,
}: ThemeManagerClientProps) {
  const [config, setConfig] = useState<ThemeConfiguration>(initialConfig);
  const [editingMode, setEditingMode] = useState<ResolvedThemeMode>("light");
  const [customPresetName, setCustomPresetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const activeTokens =
    editingMode === "dark" ? config.draft.dark : config.draft.light;
  const activeOverrides =
    (editingMode === "dark"
      ? config.draft.overrides?.dark
      : config.draft.overrides?.light) ?? {};

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
          ? "Theme tokens published live across the public website!"
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

  async function applyPreset(presetId: string, publishNow: boolean) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_preset",
          presetId,
          publish: publishNow,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        themeConfig?: ThemeConfiguration;
      };
      if (!res.ok || !data.themeConfig) {
        setFeedback({
          type: "error",
          text: data.error || "Failed to load preset.",
        });
        setBusy(false);
        return;
      }
      setConfig(data.themeConfig);
      setFeedback({
        type: "success",
        text: publishNow
          ? "Preset loaded and published live!"
          : "Preset loaded into draft editor.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRollback() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        themeConfig?: ThemeConfiguration;
      };
      if (!res.ok || !data.themeConfig) {
        setFeedback({
          type: "error",
          text: data.error || "No previous published snapshot available.",
        });
        setBusy(false);
        return;
      }
      setConfig(data.themeConfig);
      setFeedback({
        type: "success",
        text: "Restored previous published theme snapshot.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCustomPreset(e: React.FormEvent) {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_custom_preset",
          name: customPresetName.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        themeConfig?: ThemeConfiguration;
      };
      if (res.ok && data.themeConfig) {
        setConfig(data.themeConfig);
        setCustomPresetName("");
        setFeedback({
          type: "success",
          text: "Saved current tokens as a reusable custom preset.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const previewCardBg =
    activeOverrides.cardBg && isValidCssColor(activeOverrides.cardBg)
      ? activeOverrides.cardBg
      : activeTokens.components.cardBg;
  const previewPrimaryBg =
    activeOverrides.primaryButtonBg &&
    isValidCssColor(activeOverrides.primaryButtonBg)
      ? activeOverrides.primaryButtonBg
      : activeTokens.colors.primary;

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
            <option value="light">Light Mode First (#F8FAFC Clean Alabaster — Recommended)</option>
            <option value="dark">Dark Mode First (#090D16 Midnight Charcoal-Navy)</option>
            <option value="system">Match Visitor OS Preference</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {config.previousPublished && (
            <button
              type="button"
              disabled={busy}
              onClick={handleRollback}
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

      {/* Presets Strip */}
      <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Built-In &amp; Custom Theme Presets
            </h2>
            <p className="text-xs text-ink-muted">
              Load a curated palette into your draft or publish immediately.
            </p>
          </div>
          <form onSubmit={handleSaveCustomPreset} className="flex gap-2">
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
              + Save Preset
            </button>
          </form>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {allPresets.map((preset) => {
            const isActive = config.activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                className={`flex flex-col justify-between rounded-control border p-4 ${
                  isActive
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink-heading">
                      {preset.name}
                    </h3>
                    <div className="flex gap-1">
                      {[
                        preset.dark.colors.background,
                        preset.dark.colors.primary,
                        preset.dark.colors.heading,
                        preset.light.colors.background,
                      ].map((hex, i) => (
                        <span
                          key={i}
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">{preset.description}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => applyPreset(preset.id, false)}
                    className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-ink-heading hover:bg-surface-muted"
                  >
                    Load Draft
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => applyPreset(preset.id, true)}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Apply &amp; Publish
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Token Editor + Live Preview Split */}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 rounded-card border border-line bg-surface-card p-6 shadow-card xl:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-ink-heading">
                Semantic &amp; Component Tokens
              </h2>
            </div>

            <div className="inline-flex rounded-full border border-line bg-surface p-1">
              {(["dark", "light"] as const).map((m) => (
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

        {/* Live Interactive Preview Stage */}
        <div className="xl:col-span-5">
          <div className="sticky top-24 space-y-4 rounded-card border border-line bg-surface-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Live {editingMode.toUpperCase()} Draft Preview
              </p>
              <span className="font-mono text-[11px] text-primary">
                Zero reload required
              </span>
            </div>

            <div
              className="overflow-hidden rounded-[22px] border p-6 transition-colors"
              style={{
                backgroundColor: activeTokens.colors.background,
                borderColor: activeTokens.colors.border,
                color: activeTokens.colors.body,
              }}
            >
              {/* Simulated Floating Top Pill */}
              <div
                className="mx-auto mb-6 flex max-w-xs items-center justify-between rounded-full border px-4 py-2 text-xs shadow-sm"
                style={{
                  backgroundColor:
                    activeOverrides.navbarBg || activeTokens.components.navbarBg,
                  borderColor: activeTokens.components.navbarBorder,
                  color:
                    activeTokens.components.navbarText || activeTokens.colors.heading,
                }}
              >
                <span className="font-medium">
                  OmniFlow<span style={{ color: previewPrimaryBg }}>.</span>
                </span>
                <span className="opacity-75">Services · Demos</span>
              </div>

              <p
                className="font-mono text-[11px] uppercase tracking-[0.16em]"
                style={{ color: activeTokens.colors.muted }}
              >
                01 — Preview Stage
              </p>
              <h3
                className="mt-2 text-2xl font-medium tracking-tight"
                style={{ color: activeTokens.colors.heading }}
              >
                Automate the work.{" "}
                <em style={{ color: previewPrimaryBg }}>Accelerate growth.</em>
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: activeTokens.colors.body }}
              >
                Verify heading contrast, card surfaces, input borders, and button states
                before publishing to visitors.
              </p>

              {/* Simulated Card */}
              <div
                className="mt-5 rounded-2xl border p-4"
                style={{
                  backgroundColor: previewCardBg,
                  borderColor: activeTokens.components.cardBorder,
                }}
              >
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px]"
                  style={{
                    backgroundColor:
                      activeOverrides.badgeBg || activeTokens.components.badgeBg,
                    color: activeTokens.components.badgeText,
                  }}
                >
                  Flagship System
                </span>
                <p
                  className="mt-2 text-sm font-medium"
                  style={{ color: activeTokens.colors.heading }}
                >
                  Lead Qualification &amp; Routing
                </p>
                <input
                  type="text"
                  readOnly
                  value="Sample input field preview"
                  className="mt-3 w-full rounded-lg border px-3 py-1.5 text-xs"
                  style={{
                    backgroundColor: activeTokens.components.inputBg,
                    borderColor: activeTokens.components.inputBorder,
                    color: activeTokens.colors.heading,
                  }}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className="inline-flex rounded-full px-4 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: previewPrimaryBg,
                      color: activeTokens.colors.primaryForeground,
                    }}
                  >
                    Primary CTA →
                  </span>
                  <span
                    className="inline-flex rounded-full px-4 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: activeTokens.colors.secondary,
                      color: activeTokens.colors.secondaryForeground,
                    }}
                  >
                    Secondary Pill
                  </span>
                </div>
              </div>
            </div>

            {/* Live WCAG Contrast Scorecard */}
            <div className="rounded-xl border border-line bg-surface-muted/60 p-3.5">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                WCAG 2.1 Live Contrast Telemetry ({editingMode.toUpperCase()})
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    label: "Heading / Canvas",
                    ratio: getContrastRatio(
                      activeTokens.colors.heading,
                      activeTokens.colors.background
                    ),
                  },
                  {
                    label: "Body / Card",
                    ratio: getContrastRatio(activeTokens.colors.body, previewCardBg),
                  },
                  {
                    label: "Muted / Canvas",
                    ratio: getContrastRatio(
                      activeTokens.colors.muted,
                      activeTokens.colors.background
                    ),
                  },
                  {
                    label: "CTA Text / Primary",
                    ratio: getContrastRatio(
                      activeTokens.colors.primaryForeground,
                      previewPrimaryBg
                    ),
                  },
                ].map((pair) => {
                  const passAA = pair.ratio !== null && pair.ratio >= 4.5;
                  const passAAA = pair.ratio !== null && pair.ratio >= 7;
                  return (
                    <div
                      key={pair.label}
                      className="flex items-center justify-between rounded-lg border border-line bg-surface px-2.5 py-1.5"
                    >
                      <span className="truncate text-[11px] text-ink-body">
                        {pair.label}
                      </span>
                      <span
                        className={`ml-2 shrink-0 font-mono text-[11px] font-bold ${
                          passAA ? "text-status-success" : "text-status-warning"
                        }`}
                      >
                        {pair.ratio ? `${pair.ratio}:1` : "—"}{" "}
                        {passAAA ? "AAA" : passAA ? "AA" : "LOW"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
