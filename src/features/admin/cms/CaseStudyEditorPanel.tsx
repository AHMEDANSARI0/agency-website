"use client";

import React from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type {
  CaseStudyItem,
  PublishStatus,
  WorkVerificationType,
} from "@/types/content";
import {
  slugifyValue,
  WORK_VERIFICATION_LABELS,
  type CaseStudyFormState,
} from "./cms-helpers";
import { SeoCompletenessBar } from "./SeoCompletenessBar";

interface CaseStudyEditorPanelProps {
  caseStudies: CaseStudyItem[];
  csForm: CaseStudyFormState;
  setCsForm: (next: CaseStudyFormState) => void;
  availableStatuses: PublishStatus[];
  canEditAny: boolean;
  saving: boolean;
  onSelectCaseStudy: (cs: CaseStudyItem) => void;
  onNewBlueprint: () => void;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CaseStudyEditorPanel({
  caseStudies,
  csForm,
  setCsForm,
  availableStatuses,
  canEditAny,
  saving,
  onSelectCaseStudy,
  onNewBlueprint,
  onSave,
  onDelete,
}: CaseStudyEditorPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-heading">
            Work &amp; Case Studies ({caseStudies.length})
          </h2>
          <button
            type="button"
            onClick={onNewBlueprint}
            className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Blueprint</span>
          </button>
        </div>

        <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
          {caseStudies.map((cs) => (
            <button
              key={cs.id}
              type="button"
              onClick={() => onSelectCaseStudy(cs)}
              className={`w-full rounded-control border p-3 text-left transition-colors ${
                csForm.id === cs.id
                  ? "border-primary bg-accent-subtle/40"
                  : "border-line bg-surface hover:bg-surface-muted"
              }`}
            >
              <span className="inline-block rounded bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">
                {WORK_VERIFICATION_LABELS[cs.workType]}
              </span>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink-heading">
                {cs.title}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                {cs.status} · {cs.industry}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
        <div className="rounded-control border border-primary/25 bg-accent-subtle/40 p-3 text-xs text-ink-body">
          <strong>Truthful Work Classification:</strong> Select{" "}
          <em>Verified Client Case Study</em> only when written client
          permission is on file. Otherwise use{" "}
          <em>Reference Architecture / Concept Demo</em> or{" "}
          <em>Internal Workflow Blueprint</em>.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Work Classification Badge
            </label>
            <select
              value={csForm.workType}
              onChange={(e) =>
                setCsForm({
                  ...csForm,
                  workType: e.target.value as WorkVerificationType,
                })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            >
              {(
                Object.keys(WORK_VERIFICATION_LABELS) as WorkVerificationType[]
              ).map((wt) => (
                <option key={wt} value={wt}>
                  {WORK_VERIFICATION_LABELS[wt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Industry
            </label>
            <input
              type="text"
              value={csForm.industry}
              onChange={(e) =>
                setCsForm({ ...csForm, industry: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Workflow Status
            </label>
            <select
              value={csForm.status}
              onChange={(e) =>
                setCsForm({
                  ...csForm,
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
              Title
            </label>
            <input
              type="text"
              value={csForm.title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setCsForm({
                  ...csForm,
                  title: nextTitle,
                  slug:
                    !csForm.id && !csForm.slug
                      ? slugifyValue(nextTitle)
                      : csForm.slug,
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
              value={csForm.slug}
              onChange={(e) =>
                setCsForm({ ...csForm, slug: slugifyValue(e.target.value) })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Business Type
            </label>
            <input
              type="text"
              value={csForm.businessType}
              onChange={(e) =>
                setCsForm({ ...csForm, businessType: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Project Duration
            </label>
            <input
              type="text"
              value={csForm.projectDuration}
              onChange={(e) =>
                setCsForm({ ...csForm, projectDuration: e.target.value })
              }
              placeholder="2–3 Weeks"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Client Name (optional)
            </label>
            <input
              type="text"
              value={csForm.clientName}
              onChange={(e) =>
                setCsForm({ ...csForm, clientName: e.target.value })
              }
              placeholder="Only if authorized"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
          <input
            type="checkbox"
            checked={csForm.clientPermissionGranted}
            onChange={(e) =>
              setCsForm({
                ...csForm,
                clientPermissionGranted: e.target.checked,
              })
            }
          />
          <span>
            Written client permission is on file (required when workType is
            Verified Client Case Study)
          </span>
        </label>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Problem Summary
          </label>
          <textarea
            rows={2}
            value={csForm.problemSummary}
            onChange={(e) =>
              setCsForm({ ...csForm, problemSummary: e.target.value })
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Proposed Automation Architecture
          </label>
          <textarea
            rows={3}
            value={csForm.proposedAutomation}
            onChange={(e) =>
              setCsForm({ ...csForm, proposedAutomation: e.target.value })
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Manual Process Before (one step per line)
            </label>
            <textarea
              rows={4}
              value={csForm.manualProcessBeforeText}
              onChange={(e) =>
                setCsForm({
                  ...csForm,
                  manualProcessBeforeText: e.target.value,
                })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Automated Workflow After (one step per line)
            </label>
            <textarea
              rows={4}
              value={csForm.automatedWorkflowAfterText}
              onChange={(e) =>
                setCsForm({
                  ...csForm,
                  automatedWorkflowAfterText: e.target.value,
                })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Verified / Expected Results (one per line)
            </label>
            <textarea
              rows={3}
              value={csForm.verifiedResultsText}
              onChange={(e) =>
                setCsForm({ ...csForm, verifiedResultsText: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Technologies Used (comma-separated)
              </label>
              <input
                type="text"
                value={csForm.technologiesUsedText}
                onChange={(e) =>
                  setCsForm({
                    ...csForm,
                    technologiesUsedText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Related Service Slugs (comma-separated)
              </label>
              <input
                type="text"
                value={csForm.relatedServiceSlugsText}
                onChange={(e) =>
                  setCsForm({
                    ...csForm,
                    relatedServiceSlugsText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-heading"
              />
            </div>
          </div>
        </div>

        <SeoCompletenessBar
          checkInput={{
            title: csForm.title,
            slug: csForm.slug,
            summary: csForm.problemSummary,
            seoTitle: csForm.seoTitle,
            seoDescription: csForm.seoDescription,
            bodyText: `${csForm.problemSummary}\n${csForm.proposedAutomation}\n${csForm.automatedWorkflowAfterText}`,
          }}
          urlPathPreview={`/work/${csForm.slug || "your-slug"}`}
          seoTitle={csForm.seoTitle}
          seoDescription={csForm.seoDescription}
          onChangeSeoTitle={(seoTitle) => setCsForm({ ...csForm, seoTitle })}
          onChangeSeoDescription={(seoDescription) =>
            setCsForm({ ...csForm, seoDescription })
          }
        />

        <div className="flex items-center justify-between border-t border-line pt-4">
          {csForm.id && canEditAny ? (
            <button
              type="button"
              onClick={() => onDelete(csForm.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Entry</span>
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
            <span>{saving ? "Saving..." : "Save Work Entry"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
