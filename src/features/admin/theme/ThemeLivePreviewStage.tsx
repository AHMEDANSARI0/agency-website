"use client";

import React from "react";
import { ArrowUpRight, Moon, Sparkles, Sun } from "lucide-react";
import type {
  ComponentTokenOverrides,
  ResolvedThemeMode,
  ThemeDesignTokens,
  ThemeTokenSet,
} from "@/types/theme";
import { getContrastRatio, isValidCssColor } from "@/features/themes/color-utils";

interface ThemeLivePreviewStageProps {
  editingMode: ResolvedThemeMode;
  onSelectMode: (mode: ResolvedThemeMode) => void;
  activeTokens: ThemeTokenSet;
  activeOverrides: ComponentTokenOverrides;
  designSystem: ThemeDesignTokens;
}

export function ThemeLivePreviewStage({
  editingMode,
  onSelectMode,
  activeTokens,
  activeOverrides,
  designSystem,
}: ThemeLivePreviewStageProps) {
  const previewCardBg =
    activeOverrides.cardBg && isValidCssColor(activeOverrides.cardBg)
      ? activeOverrides.cardBg
      : activeTokens.components.cardBg;

  const previewPrimaryBg =
    activeOverrides.primaryButtonBg &&
    isValidCssColor(activeOverrides.primaryButtonBg)
      ? activeOverrides.primaryButtonBg
      : activeTokens.components.primaryButtonBg &&
          isValidCssColor(activeTokens.components.primaryButtonBg)
        ? activeTokens.components.primaryButtonBg
        : activeTokens.colors.primary;

  const previewBadgeBg =
    activeOverrides.badgeBg && isValidCssColor(activeOverrides.badgeBg)
      ? activeOverrides.badgeBg
      : activeTokens.components.badgeBg;

  const headingWeight =
    designSystem.headingWeight === "400"
      ? 400
      : designSystem.headingWeight === "500"
        ? 500
        : 600;

  const headingTracking =
    designSystem.letterSpacing === "tight"
      ? "-0.036em"
      : designSystem.letterSpacing === "editorial"
        ? "-0.018em"
        : designSystem.letterSpacing === "normal"
          ? "-0.026em"
          : designSystem.typography === "editorial"
            ? "-0.028em"
            : designSystem.typography === "technical"
              ? "-0.036em"
              : "-0.028em";

  const bodyLineHeight =
    designSystem.bodyLineHeight === "compact"
      ? 1.54
      : designSystem.bodyLineHeight === "editorial"
        ? 1.74
        : 1.65;

  const cardRadius =
    designSystem.borderRadius === "compact"
      ? "12px"
      : designSystem.borderRadius === "generous"
        ? "24px"
        : "18px";

  const secondaryBtnRadius =
    designSystem.buttonStyle === "sharp"
      ? "8px"
      : designSystem.buttonStyle === "rounded"
        ? "14px"
        : "9999px";

  return (
    <div className="sticky top-24 space-y-4 rounded-card border border-line bg-surface-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Real Component Live Preview
          </p>
          <p className="text-[11px] text-ink-muted">
            Zero reload · Instant Light/Dark &amp; Inter token telemetry
          </p>
        </div>

        <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => onSelectMode("light")}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              editingMode === "light"
                ? "bg-primary text-primary-foreground"
                : "text-ink-muted hover:text-ink-heading"
            }`}
          >
            <Sun className="h-3 w-3" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectMode("dark")}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              editingMode === "dark"
                ? "bg-primary text-primary-foreground"
                : "text-ink-muted hover:text-ink-heading"
            }`}
          >
            <Moon className="h-3 w-3" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[24px] border p-5 transition-colors sm:p-6"
        style={{
          backgroundColor: activeTokens.colors.background,
          borderColor: activeTokens.colors.border,
          color: activeTokens.colors.body,
        }}
      >
        {/* Simulated Retained Floating Glass Navbar */}
        <div
          className="mb-5 flex items-center justify-between rounded-full border px-4 py-2 text-xs backdrop-blur-md"
          style={{
            backgroundColor:
              activeOverrides.navbarBg || activeTokens.components.navbarBg,
            borderColor: activeTokens.components.navbarBorder,
            color:
              activeTokens.components.navbarText || activeTokens.colors.heading,
          }}
        >
          <span className="font-semibold tracking-tight">
            OmniFlow<span style={{ color: previewPrimaryBg }}>.</span>
          </span>
          <span className="font-mono text-[10px] opacity-75">
            Services · Work · Pricing
          </span>
        </div>

        {/* Real Soale 100px Eyebrow Pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{
            backgroundColor: previewBadgeBg,
            borderColor: activeTokens.colors.border,
            color: activeTokens.colors.primary,
          }}
        >
          <Sparkles className="h-3 w-3" />
          <span>01 — Soale Component Stage</span>
        </div>

        {/* Inter Display Headline with Live Weight & Tracking */}
        <h3
          className="mt-3 text-2xl leading-[1.12] transition-all"
          style={{
            color: activeTokens.colors.heading,
            fontWeight: headingWeight,
            letterSpacing: headingTracking,
          }}
        >
          Automate the work.{" "}
          <span style={{ color: previewPrimaryBg }}>Accelerate growth.</span>
        </h3>

        <p
          className="mt-2.5 text-xs transition-all"
          style={{
            color: activeTokens.colors.body,
            lineHeight: bodyLineHeight,
          }}
        >
          Verify Inter heading weight ({headingWeight}), body line-height (
          {bodyLineHeight}), card surfaces, and dual-arrow CTA contrast before
          publishing live.
        </p>

        {/* Real Soale Interactive Card + Capability Chips + Dual-Arrow CTA */}
        <div
          className="mt-5 border p-4 transition-all"
          style={{
            backgroundColor: previewCardBg,
            borderColor: activeTokens.components.cardBorder,
            borderRadius: cardRadius,
            boxShadow: activeTokens.components.shadowCard,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="inline-block rounded-[10px] px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                backgroundColor: previewBadgeBg,
                color: activeTokens.components.badgeText,
              }}
            >
              Flagship System · {designSystem.typography}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: activeTokens.colors.muted }}
            >
              SLA &lt; 60s
            </span>
          </div>

          <p
            className="mt-2.5 text-sm"
            style={{
              color: activeTokens.colors.heading,
              fontWeight: headingWeight,
              letterSpacing: headingTracking,
            }}
          >
            AI Lead Qualification &amp; CRM Routing
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["Deterministic Webhooks", "Audit Trail", "Zero Lock-in"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-[10px] border px-2 py-0.5 text-[10px]"
                  style={{
                    backgroundColor: activeTokens.colors.surfaceMuted,
                    borderColor: activeTokens.colors.border,
                    color: activeTokens.colors.body,
                  }}
                >
                  {chip}
                </span>
              )
            )}
          </div>

          <input
            type="text"
            readOnly
            value="Sample form input surface & border preview"
            aria-label="Sample form input preview"
            className="mt-3 w-full rounded-[12px] border px-3 py-1.5 text-xs"
            style={{
              backgroundColor: activeTokens.components.inputBg,
              borderColor: activeTokens.components.inputBorder,
              color: activeTokens.colors.heading,
            }}
          />

          {/* Signature Connected 17px Pill + 45x45 Dual-Arrow Hover CTA */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="group inline-flex cursor-pointer items-center gap-1">
              <span
                className="inline-flex h-9 items-center rounded-[14px] px-4 text-xs font-medium transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{
                  backgroundColor: previewPrimaryBg,
                  color: activeTokens.colors.primaryForeground,
                }}
              >
                Scope System
              </span>
              <span
                className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-[14px]"
                style={{
                  backgroundColor: previewPrimaryBg,
                  color: activeTokens.colors.primaryForeground,
                }}
              >
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-5 group-hover:translate-x-5" />
                <ArrowUpRight className="absolute h-3.5 w-3.5 -translate-x-5 translate-y-5 transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0" />
              </span>
            </span>

            <span
              className="inline-flex h-9 items-center px-3.5 text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTokens.colors.secondary,
                color: activeTokens.colors.secondaryForeground,
                borderRadius: secondaryBtnRadius,
              }}
            >
              Secondary CTA
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
              minTarget: 4.5,
            },
            {
              label: "Body / Card",
              ratio: getContrastRatio(activeTokens.colors.body, previewCardBg),
              minTarget: 4.5,
            },
            {
              label: "Muted / Canvas",
              ratio: getContrastRatio(
                activeTokens.colors.muted,
                activeTokens.colors.background
              ),
              minTarget: 3.0,
            },
            {
              label: "CTA Text / Primary",
              ratio: getContrastRatio(
                activeTokens.colors.primaryForeground,
                previewPrimaryBg
              ),
              minTarget: 3.0,
            },
          ].map((pair) => {
            const passNormalAA = pair.ratio !== null && pair.ratio >= 4.5;
            const passTarget = pair.ratio !== null && pair.ratio >= pair.minTarget;
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
                    passTarget ? "text-status-success" : "text-status-warning"
                  }`}
                >
                  {pair.ratio ? `${pair.ratio}:1` : "—"}{" "}
                  {passAAA ? "AAA" : passNormalAA ? "AA" : passTarget ? "UI AA" : "LOW"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
