"use client";

import React from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { PublishStatus, ServiceItem } from "@/types/content";
import {
  SERVICE_PILLAR_PRESETS,
  slugifyValue,
  type ServiceFormState,
} from "./cms-helpers";
import { SeoCompletenessBar } from "./SeoCompletenessBar";

interface ServiceEditorPanelProps {
  services: ServiceItem[];
  svcForm: ServiceFormState;
  setSvcForm: (next: ServiceFormState) => void;
  availableStatuses: PublishStatus[];
  canEditAny: boolean;
  saving: boolean;
  onSelectService: (svc: ServiceItem) => void;
  onNewService: () => void;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ServiceEditorPanel({
  services,
  svcForm,
  setSvcForm,
  availableStatuses,
  canEditAny,
  saving,
  onSelectService,
  onNewService,
  onSave,
  onDelete,
}: ServiceEditorPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-heading">
            Services ({services.length})
          </h2>
          <button
            type="button"
            onClick={onNewService}
            className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Service</span>
          </button>
        </div>

        <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
          {services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelectService(svc)}
              className={`w-full rounded-control border p-3 text-left transition-colors ${
                svcForm.id === svc.id
                  ? "border-primary bg-accent-subtle/40"
                  : "border-line bg-surface hover:bg-surface-muted"
              }`}
            >
              <span className="inline-block rounded bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">
                {svc.categoryName}
              </span>
              <p className="mt-1 text-xs font-semibold text-ink-heading">
                {svc.title}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                {svc.status} · /{svc.slug}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Service Category Pillar
            </label>
            <select
              value={svcForm.categorySlug}
              onChange={(e) => {
                const chosen = SERVICE_PILLAR_PRESETS.find(
                  (p) => p.slug === e.target.value
                );
                setSvcForm({
                  ...svcForm,
                  categorySlug: e.target.value,
                  categoryName: chosen?.name || svcForm.categoryName,
                });
              }}
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            >
              {SERVICE_PILLAR_PRESETS.map((pillar) => (
                <option key={pillar.slug} value={pillar.slug}>
                  {pillar.name}
                </option>
              ))}
              {!SERVICE_PILLAR_PRESETS.some(
                (p) => p.slug === svcForm.categorySlug
              ) && (
                <option value={svcForm.categorySlug}>
                  {svcForm.categoryName || svcForm.categorySlug}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Badge Label
            </label>
            <input
              type="text"
              value={svcForm.badgeLabel}
              onChange={(e) =>
                setSvcForm({ ...svcForm, badgeLabel: e.target.value })
              }
              placeholder="Flagship System, Core Pillar..."
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Status
            </label>
            <select
              value={svcForm.status}
              onChange={(e) =>
                setSvcForm({
                  ...svcForm,
                  status: e.target.value as PublishStatus,
                })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            >
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Service Name
            </label>
            <input
              type="text"
              value={svcForm.title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setSvcForm({
                  ...svcForm,
                  title: nextTitle,
                  slug:
                    !svcForm.id && !svcForm.slug
                      ? slugifyValue(nextTitle)
                      : svcForm.slug,
                });
              }}
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              URL Slug
            </label>
            <input
              type="text"
              value={svcForm.slug}
              onChange={(e) =>
                setSvcForm({ ...svcForm, slug: slugifyValue(e.target.value) })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Short Summary (Card View)
          </label>
          <textarea
            rows={2}
            value={svcForm.shortSummary}
            onChange={(e) =>
              setSvcForm({ ...svcForm, shortSummary: e.target.value })
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Problem Statement
            </label>
            <textarea
              rows={3}
              value={svcForm.problemStatement}
              onChange={(e) =>
                setSvcForm({ ...svcForm, problemStatement: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Solution Overview
            </label>
            <textarea
              rows={3}
              value={svcForm.solutionOverview}
              onChange={(e) =>
                setSvcForm({ ...svcForm, solutionOverview: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Engineered Benefits &amp; Outcomes (one per line)
          </label>
          <textarea
            rows={4}
            value={svcForm.benefitsText}
            onChange={(e) =>
              setSvcForm({ ...svcForm, benefitsText: e.target.value })
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              CTA Button Label
            </label>
            <input
              type="text"
              value={svcForm.ctaLabel}
              onChange={(e) =>
                setSvcForm({ ...svcForm, ctaLabel: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              CTA Destination Path
            </label>
            <input
              type="text"
              value={svcForm.ctaHref}
              onChange={(e) =>
                setSvcForm({ ...svcForm, ctaHref: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Display Order
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={svcForm.order}
              onChange={(e) =>
                setSvcForm({
                  ...svcForm,
                  order: Number(e.target.value) || 0,
                })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
              <input
                type="checkbox"
                checked={svcForm.isFlagshipPriority}
                onChange={(e) =>
                  setSvcForm({
                    ...svcForm,
                    isFlagshipPriority: e.target.checked,
                  })
                }
              />
              <span>Flagship Priority</span>
            </label>
          </div>
        </div>

        <SeoCompletenessBar
          checkInput={{
            title: svcForm.title,
            slug: svcForm.slug,
            summary: svcForm.shortSummary,
            seoTitle: svcForm.seoTitle,
            seoDescription: svcForm.seoDescription,
            bodyText: `${svcForm.problemStatement}\n${svcForm.solutionOverview}\n${svcForm.benefitsText}`,
          }}
          urlPathPreview={`/services/${svcForm.slug || "your-slug"}`}
          seoTitle={svcForm.seoTitle}
          seoDescription={svcForm.seoDescription}
          onChangeSeoTitle={(seoTitle) => setSvcForm({ ...svcForm, seoTitle })}
          onChangeSeoDescription={(seoDescription) =>
            setSvcForm({ ...svcForm, seoDescription })
          }
        />

        <div className="flex items-center justify-between border-t border-line pt-4">
          {svcForm.id && canEditAny ? (
            <button
              type="button"
              onClick={() => onDelete(svcForm.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Service</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-button hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Service"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
