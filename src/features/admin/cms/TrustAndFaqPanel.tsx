"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import type { FaqItem, TeamMember, TestimonialItem } from "@/types/content";
import { MediaPickerModal } from "./MediaPickerModal";

export interface FaqFormState {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

export interface TestimonialFormState {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  country: string;
  isVerified: boolean;
  isAuthorized: boolean;
  isPublished: boolean;
}

export interface TeamFormState {
  id: string;
  name: string;
  role: string;
  isFounder: boolean;
  bio: string;
  focusAreasText: string;
  regionsServedText: string;
  avatarUrl: string;
  linkedinUrl: string;
  order: number;
  isPublished: boolean;
}

export function FaqEditorPanel({
  faqs,
  faqForm,
  setFaqForm,
  canEditAny,
  saving,
  onSave,
  onDelete,
}: {
  faqs: FaqItem[];
  faqForm: FaqFormState;
  setFaqForm: (next: FaqFormState) => void;
  canEditAny: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-heading">
            FAQs ({faqs.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              setFaqForm({
                id: "",
                question: "",
                answer: "",
                category: "Services & Scope",
                order: faqs.length + 1,
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New FAQ</span>
          </button>
        </div>

        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {faqs.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() =>
                setFaqForm({
                  id: f.id,
                  question: f.question,
                  answer: f.answer,
                  category: f.category,
                  order: f.order,
                  isPublished: f.isPublished,
                })
              }
              className={`w-full rounded-control border p-3 text-left ${
                faqForm.id === f.id
                  ? "border-primary bg-accent-subtle/40"
                  : "border-line bg-surface"
              }`}
            >
              <p className="line-clamp-2 text-xs font-semibold text-ink-heading">
                {f.question}
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">
                {f.category} · {f.isPublished ? "Published" : "Hidden"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Question
          </label>
          <input
            type="text"
            value={faqForm.question}
            onChange={(e) =>
              setFaqForm({ ...faqForm, question: e.target.value })
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Answer
          </label>
          <textarea
            rows={5}
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Category
            </label>
            <input
              type="text"
              value={faqForm.category}
              onChange={(e) =>
                setFaqForm({ ...faqForm, category: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Order
            </label>
            <input
              type="number"
              value={faqForm.order}
              onChange={(e) =>
                setFaqForm({
                  ...faqForm,
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
                checked={faqForm.isPublished}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, isPublished: e.target.checked })
                }
              />
              <span>Published on /faq</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          {faqForm.id && canEditAny ? (
            <button
              type="button"
              onClick={() => onDelete(faqForm.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete FAQ</span>
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
            <span>Save FAQ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TestimonialEditorPanel({
  testimonials,
  tmForm,
  setTmForm,
  canEditAny,
  canPublish,
  saving,
  onSave,
  onDelete,
}: {
  testimonials: TestimonialItem[];
  tmForm: TestimonialFormState;
  setTmForm: (next: TestimonialFormState) => void;
  canEditAny: boolean;
  canPublish: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-heading">
            Verified Testimonials ({testimonials.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              setTmForm({
                id: "",
                quote: "",
                authorName: "",
                authorRole: "",
                companyName: "",
                country: "United States",
                isVerified: false,
                isAuthorized: false,
                isPublished: false,
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Real Quote</span>
          </button>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          No fake testimonials are seeded by default. Until at least one
          verified &amp; authorized quote is published here, the public
          testimonials section automatically stays hidden.
        </p>
        <div className="space-y-2">
          {testimonials.map((tm) => (
            <button
              key={tm.id}
              type="button"
              onClick={() =>
                setTmForm({
                  id: tm.id,
                  quote: tm.quote,
                  authorName: tm.authorName,
                  authorRole: tm.authorRole,
                  companyName: tm.companyName,
                  country: tm.country || "United States",
                  isVerified: tm.isVerified,
                  isAuthorized: tm.isAuthorized,
                  isPublished: tm.isPublished,
                })
              }
              className={`w-full rounded-control border p-3 text-left ${
                tmForm.id === tm.id
                  ? "border-primary bg-accent-subtle/40"
                  : "border-line bg-surface"
              }`}
            >
              <p className="text-xs font-semibold text-ink-heading">
                {tm.authorName} — {tm.companyName}
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">
                {tm.isPublished && tm.isAuthorized && tm.isVerified
                  ? "Publicly Visible"
                  : "Draft / Unverified"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Client Quote (Verbatim)
          </label>
          <textarea
            rows={4}
            value={tmForm.quote}
            onChange={(e) => setTmForm({ ...tmForm, quote: e.target.value })}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Author Name
            </label>
            <input
              type="text"
              value={tmForm.authorName}
              onChange={(e) =>
                setTmForm({ ...tmForm, authorName: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Author Role
            </label>
            <input
              type="text"
              value={tmForm.authorRole}
              onChange={(e) =>
                setTmForm({ ...tmForm, authorRole: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Company Name
            </label>
            <input
              type="text"
              value={tmForm.companyName}
              onChange={(e) =>
                setTmForm({ ...tmForm, companyName: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Country / Market
            </label>
            <input
              type="text"
              value={tmForm.country}
              onChange={(e) =>
                setTmForm({ ...tmForm, country: e.target.value })
              }
              placeholder="United States, UK, Canada..."
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
            />
          </div>
        </div>

        <div className="space-y-2 rounded-control border border-line bg-surface-muted/40 p-3 text-xs">
          <label className="flex items-center gap-2 text-ink-heading">
            <input
              type="checkbox"
              checked={tmForm.isVerified}
              onChange={(e) =>
                setTmForm({ ...tmForm, isVerified: e.target.checked })
              }
            />
            <span>
              I confirm this quote came from a real, verifiable client
              engagement.
            </span>
          </label>
          <label className="flex items-center gap-2 text-ink-heading">
            <input
              type="checkbox"
              checked={tmForm.isAuthorized}
              onChange={(e) =>
                setTmForm({ ...tmForm, isAuthorized: e.target.checked })
              }
            />
            <span>
              Written client authorization is on file to display this quote
              publicly.
            </span>
          </label>
          {canPublish && (
            <label className="flex items-center gap-2 font-semibold text-primary">
              <input
                type="checkbox"
                checked={tmForm.isPublished}
                onChange={(e) =>
                  setTmForm({ ...tmForm, isPublished: e.target.checked })
                }
              />
              <span>
                Publish to public website (requires both checks above)
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          {tmForm.id && canEditAny ? (
            <button
              type="button"
              onClick={() => onDelete(tmForm.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Quote</span>
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
            <span>Save Testimonial</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamEditorPanel({
  team,
  memberForm,
  setMemberForm,
  canEditAny,
  canPublish,
  saving,
  onSave,
  onDelete,
}: {
  team: TeamMember[];
  memberForm: TeamFormState;
  setMemberForm: (next: TeamFormState) => void;
  canEditAny: boolean;
  canPublish: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  return (
    <>
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) =>
          setMemberForm({ ...memberForm, avatarUrl: asset.url })
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-heading">
              Team Profiles ({team.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setMemberForm({
                  id: "",
                  name: "",
                  role: "",
                  isFounder: false,
                  bio: "",
                  focusAreasText: "AI Workflow Automation, Systems Integration",
                  regionsServedText: "United States, United Kingdom, Canada",
                  avatarUrl: "",
                  linkedinUrl: "",
                  order: team.length + 1,
                  isPublished: false,
                })
              }
              className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </button>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            No fake headshots or fictional staff are displayed by default. Add
            real founders and engineers here when ready to publish on /about.
          </p>
          <div className="space-y-2">
            {team.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  setMemberForm({
                    id: m.id,
                    name: m.name,
                    role: m.role,
                    isFounder: m.isFounder,
                    bio: m.bio,
                    focusAreasText: m.focusAreas.join(", "),
                    regionsServedText: m.regionsServed.join(", "),
                    avatarUrl: m.avatarUrl || "",
                    linkedinUrl: m.linkedinUrl || "",
                    order: m.order,
                    isPublished: m.isPublished,
                  })
                }
                className={`w-full rounded-control border p-3 text-left ${
                  memberForm.id === m.id
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface"
                }`}
              >
                <p className="text-xs font-semibold text-ink-heading">
                  {m.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
                  {m.role} · {m.isPublished ? "Published" : "Draft"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Full Name
              </label>
              <input
                type="text"
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Role / Title
              </label>
              <input
                type="text"
                value={memberForm.role}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, role: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Engineering Bio
            </label>
            <textarea
              rows={4}
              value={memberForm.bio}
              onChange={(e) =>
                setMemberForm({ ...memberForm, bio: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Focus Areas (comma-separated)
              </label>
              <input
                type="text"
                value={memberForm.focusAreasText}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    focusAreasText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Regions Served (comma-separated)
              </label>
              <input
                type="text"
                value={memberForm.regionsServedText}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    regionsServedText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-ink-muted">
                  Avatar URL (optional)
                </label>
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Choose from Media</span>
                </button>
              </div>
              <input
                type="text"
                value={memberForm.avatarUrl}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, avatarUrl: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                LinkedIn URL (optional)
              </label>
              <input
                type="text"
                value={memberForm.linkedinUrl}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    linkedinUrl: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
              <input
                type="checkbox"
                checked={memberForm.isFounder}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    isFounder: e.target.checked,
                  })
                }
              />
              <span>Founder / Principal Engineer</span>
            </label>

            {canPublish && (
              <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
                <input
                  type="checkbox"
                  checked={memberForm.isPublished}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      isPublished: e.target.checked,
                    })
                  }
                />
                <span>Publish member profile on /about</span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            {memberForm.id && canEditAny ? (
              <button
                type="button"
                onClick={() => onDelete(memberForm.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Member</span>
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
              <span>Save Member</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
