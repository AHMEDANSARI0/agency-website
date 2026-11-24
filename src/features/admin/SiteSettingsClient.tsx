"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { NavItem, SiteSettings } from "@/types/content";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { PricingSettingsEditor } from "./PricingSettingsEditor";

interface SiteSettingsClientProps {
  initialSettings: SiteSettings;
}

export function SiteSettingsClient({
  initialSettings,
}: SiteSettingsClientProps) {
  const [settings, setSettings] = useState<SiteSettings>(() => ({
    ...initialSettings,
    pricingConfig: resolvePricingConfig(initialSettings),
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function moveNav(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= settings.navigation.length) return;
    const copy = [...settings.navigation];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setSettings({
      ...settings,
      navigation: copy.map((n, i) => ({ ...n, order: i + 1 })),
    });
  }

  function addNavItem() {
    const next: NavItem = {
      id: `nav_${Date.now().toString(36)}`,
      label: "Resources",
      href: "/blog",
      isVisible: true,
      order: settings.navigation.length + 1,
    };
    setSettings({ ...settings, navigation: [...settings.navigation, next] });
  }

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not save site settings.",
        });
        return;
      }
      setSettings({
        ...json.settings,
        pricingConfig: resolvePricingConfig(json.settings),
      });
      setFeedback({
        type: "success",
        text: "Updated global Navigation, Footer columns, Pricing Studio, and CTA settings.",
      });
    } catch {
      setFeedback({ type: "error", text: "Network error saving settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveAll} className="space-y-6">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-card border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-ink-heading"
              : "border-red-500/30 bg-red-500/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Company Identity & Global CTAs */}
      <div className="grid gap-6 rounded-card border border-line bg-surface-card p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-heading">
            Company Positioning &amp; Contact
          </h2>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Company Name
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) =>
                setSettings({ ...settings, companyName: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Positioning Line
            </label>
            <input
              type="text"
              value={settings.positioning}
              onChange={(e) =>
                setSettings({ ...settings, positioning: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Primary Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) =>
                setSettings({ ...settings, tagline: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Support Hours
              </label>
              <input
                type="text"
                value={settings.supportHours}
                onChange={(e) =>
                  setSettings({ ...settings, supportHours: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-heading">
            Global Conversion CTAs &amp; Booking
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Primary CTA Label
              </label>
              <input
                type="text"
                value={settings.primaryCtaLabel}
                onChange={(e) =>
                  setSettings({ ...settings, primaryCtaLabel: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Primary CTA Destination
              </label>
              <input
                type="text"
                value={settings.primaryCtaHref}
                onChange={(e) =>
                  setSettings({ ...settings, primaryCtaHref: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Secondary CTA Label
              </label>
              <input
                type="text"
                value={settings.secondaryCtaLabel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    secondaryCtaLabel: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Secondary CTA Destination
              </label>
              <input
                type="text"
                value={settings.secondaryCtaHref}
                onChange={(e) =>
                  setSettings({ ...settings, secondaryCtaHref: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Discovery Booking Link
            </label>
            <input
              type="text"
              value={settings.bookingUrl}
              onChange={(e) =>
                setSettings({ ...settings, bookingUrl: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
            />
          </div>
        </div>
      </div>

      {/* Top Navigation Capsule Builder */}
      <div className="space-y-3 rounded-card border border-line bg-surface-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-heading">
              Top Notched Navbar Links ({settings.navigation.length})
            </h2>
            <p className="text-xs text-ink-muted">
              Reorder, rename, or toggle links inside the floating top navigation capsule.
            </p>
          </div>
          <button
            type="button"
            onClick={addNavItem}
            className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1.5 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="space-y-2">
          {settings.navigation.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-surface p-3"
            >
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const copy = [...settings.navigation];
                  copy[idx] = { ...item, label: e.target.value };
                  setSettings({ ...settings, navigation: copy });
                }}
                className="w-40 rounded border border-line bg-surface-card px-2.5 py-1.5 text-xs font-medium text-ink-heading"
              />
              <input
                type="text"
                value={item.href}
                onChange={(e) => {
                  const copy = [...settings.navigation];
                  copy[idx] = { ...item, href: e.target.value };
                  setSettings({ ...settings, navigation: copy });
                }}
                className="min-w-[180px] flex-1 rounded border border-line bg-surface-card px-2.5 py-1.5 font-mono text-xs text-ink-heading"
              />
              <label className="flex items-center gap-1.5 text-xs text-ink-body">
                <input
                  type="checkbox"
                  checked={item.isVisible}
                  onChange={(e) => {
                    const copy = [...settings.navigation];
                    copy[idx] = { ...item, isVisible: e.target.checked };
                    setSettings({ ...settings, navigation: copy });
                  }}
                />
                <span>Visible</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveNav(idx, -1)}
                  disabled={idx === 0}
                  className="rounded border border-line p-1 text-ink-muted disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveNav(idx, 1)}
                  disabled={idx === settings.navigation.length - 1}
                  className="rounded border border-line p-1 text-ink-muted disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                {settings.navigation.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        navigation: settings.navigation.filter(
                          (n) => n.id !== item.id
                        ),
                      })
                    }
                    className="rounded border border-line p-1 text-ink-muted hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Scopes & Pricing Studio */}
      <PricingSettingsEditor
        pricing={resolvePricingConfig(settings)}
        onChange={(nextPricing) =>
          setSettings({
            ...settings,
            pricingConfig: nextPricing,
          })
        }
      />

      {/* Footer Link Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {(["services", "company", "legal"] as const).map((colKey) => (
          <div
            key={colKey}
            className="space-y-2.5 rounded-card border border-line bg-surface-card p-4"
          >
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-heading">
              Footer · {colKey}
            </h3>
            {settings.footerLinks[colKey].map((link, idx) => (
              <div key={link.id} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const col = [...settings.footerLinks[colKey]];
                    col[idx] = { ...link, label: e.target.value };
                    setSettings({
                      ...settings,
                      footerLinks: { ...settings.footerLinks, [colKey]: col },
                    });
                  }}
                  className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink-heading"
                />
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => {
                    const col = [...settings.footerLinks[colKey]];
                    col[idx] = { ...link, href: e.target.value };
                    setSettings({
                      ...settings,
                      footerLinks: { ...settings.footerLinks, [colKey]: col },
                    });
                  }}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-xs text-ink-heading"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving..." : "Save Global Site Settings"}</span>
        </button>
      </div>
    </form>
  );
}
