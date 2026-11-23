"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import type { PageDocument, PageSectionBlock, PageSectionType } from "@/types/content";

interface PageBuilderClientProps {
  initialPages: PageDocument[];
  canPublish: boolean;
}

const SECTION_CATALOG: {
  type: PageSectionType;
  label: string;
  description: string;
  allowMultiple?: boolean;
}[] = [
  {
    type: "hero",
    label: "Pinned Kinetic Hero + Marquee",
    description: "Two-stage scroll-pinned hero card, Purpose LightUp, and integration marquee.",
  },
  {
    type: "problems_outcomes",
    label: "Operational Bottlenecks (01)",
    description: "5-point operational leaks breakdown with interactive spotlight rows.",
  },
  {
    type: "services_overview",
    label: "Flagship & Core Services (02)",
    description: "Priority AI Automation + Business Automation pillars and service cards.",
  },
  {
    type: "workflow_demo",
    label: "Interactive Workflow Execution Trace",
    description: "9s vs 4m comparison bar and live simulated workflow trace.",
  },
  {
    type: "how_it_works",
    label: "Engineering Delivery Process (03)",
    description: "4-stage deterministic audit, architecture, verification, and handover.",
  },
  {
    type: "industry_use_cases",
    label: "Industry Playbooks",
    description: "Cross-market US, UK, and Canada operational use cases.",
  },
  {
    type: "case_studies_highlight",
    label: "Case Studies & Architecture Blueprints (04)",
    description: "Transparently badged workflow case studies and system blueprints.",
  },
  {
    type: "founder_intro",
    label: "Founder & Insights Preview (05)",
    description: "Founder profile card and latest published engineering articles.",
  },
  {
    type: "testimonials",
    label: "Verified Client Testimonials",
    description: "Renders only when authorized + verified testimonials exist.",
  },
  {
    type: "faq_section",
    label: "FAQ Accordion",
    description: "Expandable answers for common technical and engagement questions.",
  },
  {
    type: "cta_banner",
    label: "Closing Vermilion Conversion Island",
    description: "High-contrast warm obsidian CTA banner with discovery action.",
  },
  {
    type: "rich_text",
    label: "Custom Editorial Markdown Block",
    description: "Safe structured Markdown block (headings, paragraphs, bullet lists, quotes).",
    allowMultiple: true,
  },
];

export function PageBuilderClient({
  initialPages,
  canPublish,
}: PageBuilderClientProps) {
  const [pages, setPages] = useState<PageDocument[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialPages[0]?.slug || "home"
  );

  const activePage =
    pages.find((p) => p.slug === selectedSlug) ?? pages[0] ?? null;

  const [title, setTitle] = useState(activePage?.title || "Home");
  const [seoTitle, setSeoTitle] = useState(activePage?.seo?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    activePage?.seo?.seoDescription || ""
  );
  const [sections, setSections] = useState<PageSectionBlock[]>(
    activePage?.draftSections?.length
      ? activePage.draftSections
      : activePage?.sections ?? []
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [newSectionType, setNewSectionType] =
    useState<PageSectionType>("rich_text");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function selectPage(slug: string) {
    const found = pages.find((p) => p.slug === slug);
    setSelectedSlug(slug);
    if (found) {
      setTitle(found.title);
      setSeoTitle(found.seo?.seoTitle || "");
      setSeoDescription(found.seo?.seoDescription || "");
      setSections(
        found.draftSections?.length ? found.draftSections : found.sections
      );
      setFeedback(null);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setSections(copy.map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function handleDrop(targetIdx: number) {
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      return;
    }
    const copy = [...sections];
    const [moved] = copy.splice(dragIndex, 1);
    copy.splice(targetIdx, 0, moved);
    setSections(copy.map((s, idx) => ({ ...s, order: idx + 1 })));
    setDragIndex(null);
  }

  function addApprovedSection() {
    const meta = SECTION_CATALOG.find((c) => c.type === newSectionType);
    if (!meta) return;

    if (!meta.allowMultiple && sections.some((s) => s.type === newSectionType)) {
      setFeedback({
        type: "error",
        text: `"${meta.label}" is already in this page layout. Toggle its visibility or drag to reorder it.`,
      });
      return;
    }

    const block: PageSectionBlock = {
      id: `sec_${Date.now().toString(36)}`,
      type: newSectionType,
      title:
        newSectionType === "rich_text"
          ? "Operational Reliability Commitment"
          : meta.label,
      subtitle:
        newSectionType === "rich_text"
          ? "Structured engineering principles for cross-market teams"
          : undefined,
      isVisible: true,
      order: sections.length + 1,
      config:
        newSectionType === "rich_text"
          ? {
              markdown:
                "## Deterministic Guardrails First\n\nEvery OmniFlow workflow combines strict schema validation, human approval checkpoints, and full execution logging.\n\n- Zero black-box silent failures\n- Complete handover documentation for US, UK, and Canadian teams",
            }
          : {},
    };

    setSections([...sections, block]);
    setFeedback(null);
  }

  function updateSection(id: string, patch: Partial<PageSectionBlock>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function removeSection(id: string) {
    if (sections.length <= 1) return;
    setSections((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  }

  async function saveLayout(publish: boolean) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activePage?.id,
          slug: selectedSlug,
          title,
          sections,
          publish,
          seo: {
            seoTitle: seoTitle || undefined,
            seoDescription: seoDescription || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Failed to save page layout.",
        });
        return;
      }

      const saved: PageDocument = json.page;
      setPages((prev) =>
        prev.map((p) => (p.slug === saved.slug ? saved : p))
      );
      setSections(saved.draftSections);
      setFeedback({
        type: "success",
        text: publish
          ? `Published "${saved.title}" live (${saved.sections.length} approved blocks).`
          : `Saved draft layout for "${saved.title}". Public visitors still see the last published layout until published.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving page sections.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Top Controls Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-line bg-surface-card p-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Target Page
          </label>
          <select
            value={selectedSlug}
            onChange={(e) => selectPage(e.target.value)}
            className="rounded-control border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-heading"
          >
            {pages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title} (/{p.slug === "home" ? "" : p.slug}) — {p.status}
              </option>
            ))}
          </select>
          <span className="rounded-full border border-line bg-surface-muted px-3 py-1 font-mono text-[11px] text-ink-muted">
            Safe Design-System Mode · No Raw HTML/JS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveLayout(false)}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-medium text-ink-heading transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          {canPublish && (
            <button
              type="button"
              disabled={saving}
              onClick={() => saveLayout(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publish Live Layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Page Metadata & Add Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-card border border-line bg-surface-card p-5">
          <h2 className="text-sm font-semibold text-ink-heading">
            Page Metadata &amp; SEO
          </h2>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Page Display Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              SEO Title Override
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Optional custom <title>"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted">
              SEO Meta Description
            </label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Concise summary for search engines and social cards"
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Insert Approved Section Block
            </h3>
            <select
              value={newSectionType}
              onChange={(e) =>
                setNewSectionType(e.target.value as PageSectionType)
              }
              className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            >
              {SECTION_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-muted">
              {
                SECTION_CATALOG.find((c) => c.type === newSectionType)
                  ?.description
              }
            </p>
            <button
              type="button"
              onClick={addApprovedSection}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface-muted px-3 py-2 text-xs font-medium text-ink-heading hover:bg-surface"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Approved Block</span>
            </button>
          </div>
        </div>

        {/* Drag-and-Drop Section Stack */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-heading">
              <Layers className="h-4 w-4 text-primary" />
              <span>
                Ordered Section Stack ({sections.length} blocks — drag rows or
                use arrows to reorder)
              </span>
            </h2>
          </div>

          {sections.map((sec, idx) => {
            const catalogInfo = SECTION_CATALOG.find((c) => c.type === sec.type);
            return (
              <div
                key={sec.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className={`rounded-card border p-4 transition-all ${
                  sec.isVisible
                    ? "border-line bg-surface-card"
                    : "border-dashed border-line bg-surface-muted/40 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="cursor-grab text-ink-muted hover:text-ink-heading"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="rounded bg-accent-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          updateSection(sec.id, { title: e.target.value })
                        }
                        aria-label={`Section ${idx + 1} title`}
                        className="rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-semibold text-ink-heading hover:border-line focus:border-primary focus:bg-surface focus:outline-none"
                      />
                      <p className="px-1.5 font-mono text-[11px] text-ink-muted">
                        type: {sec.type} ·{" "}
                        {catalogInfo?.label || "Design System Block"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move section up"
                      className="rounded-control border border-line p-1.5 text-ink-muted hover:text-ink-heading disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sections.length - 1}
                      aria-label="Move section down"
                      className="rounded-control border border-line p-1.5 text-ink-muted hover:text-ink-heading disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSection(sec.id, { isVisible: !sec.isVisible })
                      }
                      className="inline-flex items-center gap-1 rounded-control border border-line px-2.5 py-1.5 text-xs font-medium text-ink-body hover:text-ink-heading"
                    >
                      {sec.isVisible ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                    {sec.type === "rich_text" && sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sec.id)}
                        aria-label="Remove custom section"
                        className="rounded-control border border-line p-1.5 text-ink-muted hover:border-red-500/40 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {sec.type === "rich_text" && (
                  <div className="mt-4 space-y-3 border-t border-line pt-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted">
                        Subtitle (optional)
                      </label>
                      <input
                        type="text"
                        value={sec.subtitle || ""}
                        onChange={(e) =>
                          updateSection(sec.id, { subtitle: e.target.value })
                        }
                        className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-ink-heading"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted">
                        Safe Markdown Content (H2 `##`, H3 `###`, lists `- `,
                        quotes `&gt; `)
                      </label>
                      <textarea
                        rows={5}
                        value={
                          typeof sec.config?.markdown === "string"
                            ? sec.config.markdown
                            : ""
                        }
                        onChange={(e) =>
                          updateSection(sec.id, {
                            config: {
                              ...(sec.config || {}),
                              markdown: e.target.value,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-control border border-line bg-surface p-3 font-mono text-xs text-ink-heading"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
