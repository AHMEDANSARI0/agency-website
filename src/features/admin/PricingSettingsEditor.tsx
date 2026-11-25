"use client";

import React, { useState } from "react";
import { Clock, Plus, Sparkles, Trash2 } from "lucide-react";
import type { PricingConfig, PricingPackageItem } from "@/types/content";
import { PLACEHOLDER_TOKENS } from "@/lib/placeholders";

interface PricingSettingsEditorProps {
  pricing: PricingConfig;
  onChange: (next: PricingConfig) => void;
}

export function PricingSettingsEditor({
  pricing,
  onChange,
}: PricingSettingsEditorProps) {
  const [quickStartingRate, setQuickStartingRate] = useState("");
  const hasUnfilledPriceToken = JSON.stringify(pricing).includes(
    PLACEHOLDER_TOKENS.PRICE_FROM
  );

  function applyStartingPriceToken() {
    const clean = quickStartingRate.trim();
    if (!clean) return;
    const replaced = JSON.parse(
      JSON.stringify(pricing).replaceAll(PLACEHOLDER_TOKENS.PRICE_FROM, clean)
    ) as PricingConfig;
    onChange(replaced);
    setQuickStartingRate("");
  }

  function updateField<K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K]
  ) {
    onChange({
      ...pricing,
      [key]: value,
    });
  }

  function updatePackage(
    index: number,
    patch: Partial<PricingPackageItem>
  ) {
    const nextPackages = pricing.packages.map((pkg, idx) =>
      idx === index ? { ...pkg, ...patch } : pkg
    );
    onChange({
      ...pricing,
      packages: nextPackages,
    });
  }

  function addPackage() {
    if (pricing.packages.length >= 6) return;
    const nextPkg: PricingPackageItem = {
      id: `tier_${Date.now().toString(36)}`,
      name: "Custom Tier",
      badge: "Scoped Build",
      isPopular: false,
      targetAudience: "Service teams automating recurring operations",
      projectPriceLabel: "Custom Fixed Scope",
      retainerPriceLabel: "Optional Monthly Care",
      comingSoonNote: "Fixed written quote after free review",
      summary:
        "Practical workflow design, staging walkthrough, and clean handover.",
      deliverables: [
        "Written workflow review & fixed scope",
        "End-to-end staging build & testing",
        "100% client ownership & plain-English guide",
      ],
      ctaLabel: "Book a free workflow review",
      ctaHref: "/contact?intent=call",
    };
    onChange({
      ...pricing,
      packages: [...pricing.packages, nextPkg],
    });
  }

  function removePackage(index: number) {
    if (pricing.packages.length <= 1) return;
    onChange({
      ...pricing,
      packages: pricing.packages.filter((_, idx) => idx !== index),
    });
  }

  return (
    <section
      id="pricing"
      className="space-y-5 rounded-card border border-line bg-surface-card p-5 shadow-card"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-ink-heading">
              Engagement Scopes &amp; Pricing Studio
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            Control the homepage &amp; <code className="font-mono">/pricing</code>{" "}
            4-tier scope cards, toggle <strong>Coming Soon</strong> mode, or publish
            explicit project &amp; retainer labels whenever ready.
          </p>
        </div>

        {/* One-Click Coming Soon Mode Toggle */}
        <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-primary/35 bg-accent-subtle px-4 py-2 text-xs font-semibold text-ink-heading">
          <input
            type="checkbox"
            checked={pricing.comingSoonMode}
            onChange={(e) => updateField("comingSoonMode", e.target.checked)}
            className="h-4 w-4 accent-[var(--of-color-primary)]"
          />
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>
            Coming Soon Mode: {pricing.comingSoonMode ? "ON" : "OFF (Live Rates)"}
          </span>
        </label>
      </div>

      {/* Section Copy & Scope Toggle Labels */}
      {hasUnfilledPriceToken && (
        <div className="flex flex-col justify-between gap-3 rounded-control border border-primary/35 bg-accent-subtle/60 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-ink-heading">
              Owner Placeholder Active:{" "}
              <code className="font-mono text-primary">
                {PLACEHOLDER_TOKENS.PRICE_FROM}
              </code>
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Enter your starting project rate once (for example{" "}
              <code>$1,200</code> or <code>£950</code>) to replace{" "}
              <code>{PLACEHOLDER_TOKENS.PRICE_FROM}</code> across all pricing
              banners and cards, then click <strong>Save Settings</strong>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="text"
              value={quickStartingRate}
              onChange={(e) => setQuickStartingRate(e.target.value)}
              placeholder="e.g. $1,200"
              aria-label="Starting project rate"
              className="w-32 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-heading"
            />
            <button
              type="button"
              disabled={!quickStartingRate.trim()}
              onClick={applyStartingPriceToken}
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              Apply Starting Rate
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Section Eyebrow
          </label>
          <input
            type="text"
            value={pricing.sectionEyebrow}
            onChange={(e) => updateField("sectionEyebrow", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Section Headline
          </label>
          <input
            type="text"
            value={pricing.sectionTitle}
            onChange={(e) => updateField("sectionTitle", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-ink-muted">
            Section Subtitle
          </label>
          <textarea
            rows={2}
            value={pricing.sectionSubtitle}
            onChange={(e) => updateField("sectionSubtitle", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Primary Scope Tab Label
          </label>
          <input
            type="text"
            value={pricing.projectToggleLabel}
            onChange={(e) => updateField("projectToggleLabel", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Secondary Scope Tab Label
          </label>
          <input
            type="text"
            value={pricing.retainerToggleLabel}
            onChange={(e) => updateField("retainerToggleLabel", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-ink-muted">
            Coming Soon Status Banner Notice
          </label>
          <input
            type="text"
            value={pricing.statusBannerText}
            onChange={(e) => updateField("statusBannerText", e.target.value)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>
      </div>

      {/* Package Tier Cards Editor */}
      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-heading">
            Tier Cards ({pricing.packages.length} / 6)
          </h3>
          {pricing.packages.length < 6 && (
            <button
              type="button"
              onClick={addPackage}
              className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1.5 text-xs font-medium text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tier</span>
            </button>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {pricing.packages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="space-y-3 rounded-control border border-line bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) =>
                      updatePackage(idx, { name: e.target.value })
                    }
                    aria-label={`Tier ${idx + 1} name`}
                    className="w-40 rounded border border-line bg-surface-card px-2.5 py-1 text-xs font-semibold text-ink-heading"
                  />
                  <input
                    type="text"
                    value={pkg.badge ?? ""}
                    onChange={(e) =>
                      updatePackage(idx, { badge: e.target.value })
                    }
                    placeholder="Badge label"
                    aria-label={`Tier ${idx + 1} badge`}
                    className="w-36 rounded border border-line bg-surface-card px-2.5 py-1 font-mono text-[11px] text-ink-heading"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-ink-body">
                    <input
                      type="checkbox"
                      checked={Boolean(pkg.isPopular)}
                      onChange={(e) =>
                        updatePackage(idx, { isPopular: e.target.checked })
                      }
                    />
                    <span>Featured</span>
                  </label>
                  {pricing.packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(idx)}
                      title="Remove tier"
                      className="rounded border border-line p-1 text-ink-muted hover:text-status-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    Project Price / Scope Label
                  </label>
                  <input
                    type="text"
                    value={pkg.projectPriceLabel}
                    onChange={(e) =>
                      updatePackage(idx, { projectPriceLabel: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    Retainer / Care Label
                  </label>
                  <input
                    type="text"
                    value={pkg.retainerPriceLabel}
                    onChange={(e) =>
                      updatePackage(idx, { retainerPriceLabel: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                  />
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={pkg.targetAudience}
                    onChange={(e) =>
                      updatePackage(idx, { targetAudience: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    Coming Soon Sub-Note
                  </label>
                  <input
                    type="text"
                    value={pkg.comingSoonNote}
                    onChange={(e) =>
                      updatePackage(idx, { comingSoonNote: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-ink-muted">
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={pkg.summary}
                  onChange={(e) =>
                    updatePackage(idx, { summary: e.target.value })
                  }
                  className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                />
              </div>

              <div>
                <label className="block text-[11px] text-ink-muted">
                  Deliverables (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={pkg.deliverables.join("\n")}
                  onChange={(e) =>
                    updatePackage(idx, {
                      deliverables: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={pkg.ctaLabel}
                    onChange={(e) =>
                      updatePackage(idx, { ctaLabel: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-muted">
                    CTA Destination Path
                  </label>
                  <input
                    type="text"
                    value={pkg.ctaHref}
                    onChange={(e) =>
                      updatePackage(idx, { ctaHref: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-line bg-surface-card px-2.5 py-1.5 font-mono text-xs text-ink-heading"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
