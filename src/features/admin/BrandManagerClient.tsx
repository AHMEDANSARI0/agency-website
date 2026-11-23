"use client";

import React, { useState } from "react";
import { CheckCircle2, Image as ImageIcon, Save } from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import { BrandMark } from "@/components/ui/BrandMark";

interface BrandManagerClientProps {
  initialBrand: BrandAssetConfig;
}

export function BrandManagerClient({ initialBrand }: BrandManagerClientProps) {
  const [brand, setBrand] = useState<BrandAssetConfig>(initialBrand);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.brandName,
          tagline: brand.tagline,
          altText: brand.altText,
          lightLogoUrl: brand.lightLogoUrl || null,
          darkLogoUrl: brand.darkLogoUrl || null,
          symbolUrl: brand.symbolUrl || null,
          faviconUrl: brand.faviconUrl || null,
          ogImageUrl: brand.ogImageUrl || null,
          showTextFallback: brand.showTextFallback,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        brandAssets?: BrandAssetConfig;
      };
      if (!res.ok || !data.brandAssets) {
        setFeedback({
          type: "error",
          text: data.error || "Unable to update brand assets.",
        });
        setSaving(false);
        return;
      }
      setBrand(data.brandAssets);
      setFeedback({
        type: "success",
        text: "Brand identity & replaceable logo slots saved.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving brand identity.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 rounded-card border border-line bg-surface-card p-6 shadow-card lg:col-span-7">
        {feedback && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-control border p-3 text-xs font-medium ${
              feedback.type === "success"
                ? "border-status-success/40 bg-status-success/10 text-ink-heading"
                : "border-status-error/40 bg-status-error/10 text-ink-heading"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="brand-name"
              className="mb-1 block text-xs font-semibold text-ink-muted"
            >
              Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              required
              value={brand.brandName}
              onChange={(e) => setBrand({ ...brand, brandName: e.target.value })}
              className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading"
            />
          </div>

          <div>
            <label
              htmlFor="brand-alt"
              className="mb-1 block text-xs font-semibold text-ink-muted"
            >
              Logo Accessible Alt Text
            </label>
            <input
              id="brand-alt"
              type="text"
              required
              value={brand.altText}
              onChange={(e) => setBrand({ ...brand, altText: e.target.value })}
              className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="brand-tagline"
            className="mb-1 block text-xs font-semibold text-ink-muted"
          >
            Brand Tagline
          </label>
          <input
            id="brand-tagline"
            type="text"
            required
            value={brand.tagline}
            onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
            className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading"
          />
        </div>

        <div className="space-y-4 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink-heading">
              Replaceable Logo &amp; Icon Asset URLs (Optional)
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
            Leave blank to use the clean OmniFlow typographic wordmark fallback. When ready, supply uploaded `/uploads/...` or `https://...` SVG/PNG/WebP URLs.
          </p>

          {[
            {
              key: "lightLogoUrl" as const,
              label: "Light-Surface Logo URL",
              placeholder: "/uploads/omniflow-logo-light.svg",
            },
            {
              key: "darkLogoUrl" as const,
              label: "Dark-Surface Logo URL (Used in Notched Navbar & Footer)",
              placeholder: "/uploads/omniflow-logo-dark.svg",
            },
            {
              key: "symbolUrl" as const,
              label: "Compact Brand Symbol / Icon URL",
              placeholder: "/uploads/omniflow-symbol.svg",
            },
            {
              key: "faviconUrl" as const,
              label: "Favicon URL",
              placeholder: "/uploads/favicon.png",
            },
            {
              key: "ogImageUrl" as const,
              label: "Default Social OpenGraph Image URL (1200×630)",
              placeholder: "/uploads/omniflow-og.png",
            },
          ].map((slot) => (
            <div key={slot.key}>
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                {slot.label}
              </label>
              <input
                type="text"
                value={brand[slot.key] ?? ""}
                onChange={(e) =>
                  setBrand({ ...brand, [slot.key]: e.target.value || null })
                }
                placeholder={slot.placeholder}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 font-mono text-xs text-ink-heading"
              />
            </div>
          ))}

          <label className="flex items-center gap-2.5 pt-2 text-xs text-ink-heading">
            <input
              type="checkbox"
              checked={brand.showTextFallback}
              onChange={(e) =>
                setBrand({ ...brand, showTextFallback: e.target.checked })
              }
              className="h-4 w-4 rounded border-line text-primary"
            />
            <span>Show brand wordmark text next to symbol when full logo is omitted</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving..." : "Save Brand Assets"}</span>
        </button>
      </div>

      {/* Live Brand Slot Preview */}
      <div className="space-y-4 lg:col-span-5">
        <div className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            Dark Surface / Notched Navbar Preview
          </p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#050404] p-5">
            <BrandMark brand={brand} href="/admin/brand" tone="inverse" />
            <span className="font-mono text-[11px] text-[#B9AE9F]">Header Slot</span>
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink-muted">
            Editorial Paper Light Surface Preview
          </p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#DCD0BC] bg-[#F5EFE3] p-5 text-[#15110D]">
            <BrandMark brand={brand} href="/admin/brand" tone="auto" />
            <span className="font-mono text-[11px] text-[#5B5147]">Light Slot</span>
          </div>
        </div>
      </div>
    </form>
  );
}
