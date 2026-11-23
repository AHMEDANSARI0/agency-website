"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Monitor,
  Plus,
  Redo2,
  Save,
  Send,
  Settings2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
} from "lucide-react";
import type {
  PageDocument,
  PageSectionBlock,
  PageSectionType,
} from "@/types/content";

interface PageBuilderClientProps {
  initialPages: PageDocument[];
  canPublish: boolean;
}

export const SECTION_CATALOG: {
  type: PageSectionType;
  label: string;
  description: string;
  allowMultiple?: boolean;
}[] = [
  {
    type: "hero",
    label: "01 · Executive Architectural Hero",
    description:
      "Light-first architectural split hero with live deterministic triage telemetry.",
  },
  {
    type: "trust_strip",
    label: "02 · Engineering Standards & Stack Strip",
    description:
      "Verification standards, integration stack, and US/UK/Canada timezone overlap.",
  },
  {
    type: "problems_outcomes",
    label: "03 · Operational Bottlenecks vs. Outcomes",
    description:
      "5-point revenue & operations leak diagnosis paired with engineered outcomes.",
  },
  {
    type: "flagship_systems",
    label: "04 · Three Flagship Priority Systems",
    description:
      "Lead Management, Policy-Grounded AI Support, and End-to-End Workflow Automation.",
  },
  {
    type: "services_overview",
    label: "05 · Core AI & Automation Practice Pillars",
    description:
      "Structured practice grid across all 5 AI & operational engineering domains.",
  },
  {
    type: "interactive_demos_preview",
    label: "06 · Live Interactive Automation Lab Preview",
    description:
      "Embedded zero-API deterministic sandbox preview linking to all 5 live demos.",
  },
  {
    type: "workflow_demo",
    label: "07 · Deterministic Workflow Execution Trace",
    description:
      "Interactive 4-stage payload inspector and automated vs. manual comparison.",
  },
  {
    type: "how_it_works",
    label: "08 · 4-Stage Engineering Delivery Process",
    description:
      "Audit, deterministic architecture, staged QA verification, and full handover.",
  },
  {
    type: "industry_use_cases",
    label: "09 · Industry Playbooks (US · UK · Canada)",
    description:
      "Tailored playbooks for service businesses, consultants, and boutique agencies.",
  },
  {
    type: "architecture_governance",
    label: "10 · Safety, Guardrails & Data Ownership",
    description:
      "Deterministic-first routing, grounded knowledge boundaries, and 100% IP ownership.",
  },
  {
    type: "roi_framing",
    label: "11 · Transparent Economics & Cost Control",
    description:
      "Honest cost-controlled architecture framing vs. brittle SaaS sprawl.",
  },
  {
    type: "case_studies_highlight",
    label: "12 · Reference Architectures & Verified Work",
    description:
      "Transparently badged workflow case studies and reference system blueprints.",
  },
  {
    type: "founder_intro",
    label: "13 · Principal-Led Engineering (Founder)",
    description:
      "Direct principal accountability card led by Ahmed Ansari.",
  },
  {
    type: "insights_preview",
    label: "14 · Engineering Briefings & Insights",
    description:
      "Latest published operational engineering articles and implementation guides.",
  },
  {
    type: "testimonials",
    label: "15 · Verified Client Feedback Gate",
    description:
      "Renders strictly when authorized + verified client testimonials exist.",
  },
  {
    type: "faq_section",
    label: "16A · Executive FAQ Accordion",
    description:
      "Accessible expandable answers for technical, security, and scoping questions.",
  },
  {
    type: "cta_banner",
    label: "16B · Executive Consultation Banner",
    description:
      "High-contrast midnight-indigo conversion island with audit & lab CTAs.",
  },
  {
    type: "rich_text",
    label: "Custom Editorial Markdown Block",
    description:
      "Safe structured Markdown block (headings, paragraphs, bullet lists, quotes).",
    allowMultiple: true,
  },
];

type PreviewViewport = "off" | "desktop" | "tablet" | "mobile";

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

  const [sections, setSectionsState] = useState<PageSectionBlock[]>(
    activePage?.draftSections ?? activePage?.sections ?? []
  );
  const [undoStack, setUndoStack] = useState<PageSectionBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<PageSectionBlock[][]>([]);
  const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("off");
  const [isDirty, setIsDirty] = useState(false);

  const [title, setTitle] = useState<string>(activePage?.title ?? "");
  const [seoTitle, setSeoTitle] = useState<string>(
    activePage?.seo?.seoTitle ?? ""
  );
  const [seoDescription, setSeoDescription] = useState<string>(
    activePage?.seo?.seoDescription ?? ""
  );
  const [newSectionType, setNewSectionType] =
    useState<PageSectionType>("rich_text");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Unsaved-changes guard on tab close
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Keyboard shortcuts for Undo (Ctrl/Cmd+Z) and Redo (Ctrl/Cmd+Shift+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function commitSections(next: PageSectionBlock[]) {
    setUndoStack((prev) => [...prev.slice(-29), sections]);
    setRedoStack([]);
    setSectionsState(next);
    setIsDirty(true);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, sections]);
    setSectionsState(previous);
    setIsDirty(true);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, sections]);
    setSectionsState(next);
    setIsDirty(true);
  }

  function selectPage(slug: string) {
    if (
      isDirty &&
      !window.confirm(
        "You have unsaved layout changes on this page. Switch pages without saving?"
      )
    ) {
      return;
    }
    const found = pages.find((p) => p.slug === slug);
    setSelectedSlug(slug);
    setFeedback(null);
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    setExpandedConfigId(null);
    if (found) {
      setSectionsState(found.draftSections ?? found.sections);
      setTitle(found.title);
      setSeoTitle(found.seo?.seoTitle ?? "");
      setSeoDescription(found.seo?.seoDescription ?? "");
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    commitSections(copy.map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const copy = [...sections];
    const [moved] = copy.splice(dragIndex, 1);
    copy.splice(dropIndex, 0, moved);
    setDragIndex(null);
    commitSections(copy.map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function addApprovedSection() {
    const catalogItem = SECTION_CATALOG.find((c) => c.type === newSectionType);
    if (!catalogItem) return;

    if (
      !catalogItem.allowMultiple &&
      sections.some((s) => s.type === newSectionType)
    ) {
      setFeedback({
        type: "error",
        text: `"${catalogItem.label}" is already in this page stack. Reorder or toggle its visibility below.`,
      });
      return;
    }

    const block: PageSectionBlock = {
      id: `sec-${Date.now().toString(36)}`,
      type: newSectionType,
      title: catalogItem.label.replace(/^\d+[A-Z]?\s*·\s*/, ""),
      subtitle: "",
      isVisible: true,
      order: sections.length + 1,
      config:
        newSectionType === "rich_text"
          ? {
              markdown:
                "## Operational Context\n\nAdd structured guidance, scope details, or client FAQs here.",
            }
          : {},
    };

    commitSections([...sections, block]);
    setExpandedConfigId(block.id);
    setFeedback(null);
  }

  function updateSection(id: string, patch: Partial<PageSectionBlock>) {
    commitSections(
      sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function removeSection(id: string) {
    if (sections.length <= 1) return;
    commitSections(
      sections
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
      setSectionsState(saved.draftSections);
      setIsDirty(false);
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

  const visibleSections = sections.filter((s) => s.isVisible);

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
      <div className="flex flex-col justify-between gap-4 rounded-card border border-line bg-surface-card p-5 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-muted">
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
            {visibleSections.length} visible ·{" "}
            {sections.length - visibleSections.length} hidden
          </span>
          {isDirty && (
            <span className="rounded-full bg-status-warning/15 px-3 py-1 font-mono text-[11px] font-semibold text-status-warning">
              Unsaved Changes
            </span>
          )}
          <a
            href={selectedSlug === "home" ? "/" : `/${selectedSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-primary hover:bg-accent-subtle"
          >
            <span>Live Page</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div
            role="group"
            aria-label="Layout history controls"
            className="inline-flex rounded-control border border-line bg-surface p-0.5"
          >
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo layout change (Ctrl+Z)"
              aria-label="Undo layout change"
              className="inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium text-ink-heading hover:bg-surface-muted disabled:opacity-35"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo layout change (Ctrl+Shift+Z)"
              aria-label="Redo layout change"
              className="inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium text-ink-heading hover:bg-surface-muted disabled:opacity-35"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span>Redo</span>
            </button>
          </div>

          {/* Responsive Viewport Preview Switcher */}
          <div
            role="group"
            aria-label="Responsive layout preview"
            className="inline-flex rounded-control border border-line bg-surface-muted p-0.5"
          >
            {(
              [
                { id: "off", label: "Builder", icon: <Layers className="h-3.5 w-3.5" /> },
                { id: "desktop", label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
                { id: "tablet", label: "Tablet", icon: <Tablet className="h-3.5 w-3.5" /> },
                { id: "mobile", label: "Mobile", icon: <Smartphone className="h-3.5 w-3.5" /> },
              ] as const
            ).map((vp) => (
              <button
                key={vp.id}
                type="button"
                onClick={() => setPreviewViewport(vp.id)}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewViewport === vp.id
                    ? "bg-surface text-primary shadow-xs"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                {vp.icon}
                <span>{vp.label}</span>
              </button>
            ))}
          </div>

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

      {/* Responsive Preview Stage (Desktop / Tablet / Mobile) */}
      {previewViewport !== "off" && (
        <section
          aria-label="Responsive section stack preview"
          className="rounded-card border border-line bg-surface-muted/40 p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="font-semibold text-ink-heading">
              Responsive Layout Preview —{" "}
              <span className="font-mono uppercase text-primary">
                {previewViewport} (
                {previewViewport === "desktop"
                  ? "1280px Multi-Column"
                  : previewViewport === "tablet"
                    ? "768px 2-Column"
                    : "375px Single-Column"}
                )
              </span>
            </p>
            <span className="text-ink-muted">
              Showing {visibleSections.length} visible section(s) in live render
              order
            </span>
          </div>

          <div
            className={`mx-auto space-y-3 rounded-2xl border border-line-strong bg-surface p-4 shadow-card transition-all duration-300 ${
              previewViewport === "desktop"
                ? "max-w-5xl"
                : previewViewport === "tablet"
                  ? "max-w-[768px]"
                  : "max-w-[375px]"
            }`}
          >
            {visibleSections.map((sec, idx) => {
              const eyebrow =
                typeof sec.config?.eyebrow === "string"
                  ? sec.config.eyebrow
                  : sec.type.replace(/_/g, " ").toUpperCase();
              const ctaLabel =
                typeof sec.config?.primaryCtaLabel === "string"
                  ? sec.config.primaryCtaLabel
                  : "";
              const isDarkIsland =
                sec.type === "cta_banner" ||
                sec.type === "workflow_demo" ||
                sec.type === "interactive_demos_preview";

              return (
                <div
                  key={sec.id}
                  className={`rounded-xl border p-4 ${
                    isDarkIsland
                      ? "border-indigo-500/30 bg-[#0B1020] text-slate-100"
                      : "border-line bg-surface-card text-ink-heading"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                      {String(idx + 1).padStart(2, "0")} · {eyebrow}
                    </span>
                    <span className="font-mono text-[10px] opacity-65">
                      {sec.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{sec.title}</p>
                  {sec.subtitle && (
                    <p className="mt-1 text-xs opacity-75">{sec.subtitle}</p>
                  )}
                  <div
                    className={`mt-3 grid gap-2 ${
                      previewViewport === "mobile"
                        ? "grid-cols-1"
                        : previewViewport === "tablet"
                          ? "grid-cols-2"
                          : "grid-cols-3"
                    }`}
                  >
                    <div className="h-6 rounded border border-current/10 bg-current/5" />
                    <div className="h-6 rounded border border-current/10 bg-current/5" />
                    {previewViewport === "desktop" && (
                      <div className="h-6 rounded border border-current/10 bg-current/5" />
                    )}
                  </div>
                  {ctaLabel && (
                    <span className="mt-2.5 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                      {ctaLabel} →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

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
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
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
              onChange={(e) => {
                setSeoTitle(e.target.value);
                setIsDirty(true);
              }}
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
              onChange={(e) => {
                setSeoDescription(e.target.value);
                setIsDirty(true);
              }}
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
            const configExpanded =
              expandedConfigId === sec.id || sec.type === "rich_text";

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
                    {sec.type !== "rich_text" && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedConfigId(
                            expandedConfigId === sec.id ? null : sec.id
                          )
                        }
                        className={`inline-flex items-center gap-1 rounded-control border px-2.5 py-1.5 text-xs font-medium ${
                          expandedConfigId === sec.id
                            ? "border-primary bg-accent-subtle text-primary"
                            : "border-line text-ink-muted hover:text-ink-heading"
                        }`}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span>Config</span>
                      </button>
                    )}

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

                {configExpanded && (
                  <div className="mt-4 space-y-3 border-t border-line pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-ink-muted">
                          Section Eyebrow Label (optional)
                        </label>
                        <input
                          type="text"
                          value={
                            typeof sec.config?.eyebrow === "string"
                              ? sec.config.eyebrow
                              : ""
                          }
                          onChange={(e) =>
                            updateSection(sec.id, {
                              config: {
                                ...(sec.config || {}),
                                eyebrow: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g., Deterministic Systems"
                          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-ink-heading"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-muted">
                          Section Subtitle (optional)
                        </label>
                        <input
                          type="text"
                          value={sec.subtitle || ""}
                          onChange={(e) =>
                            updateSection(sec.id, { subtitle: e.target.value })
                          }
                          placeholder="Supporting section lead copy"
                          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-ink-heading"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-ink-muted">
                          Primary CTA Label Override (optional)
                        </label>
                        <input
                          type="text"
                          value={
                            typeof sec.config?.primaryCtaLabel === "string"
                              ? sec.config.primaryCtaLabel
                              : ""
                          }
                          onChange={(e) =>
                            updateSection(sec.id, {
                              config: {
                                ...(sec.config || {}),
                                primaryCtaLabel: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g., Book a Discovery Call"
                          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-1.5 text-xs text-ink-heading"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-muted">
                          Primary CTA Destination Path (optional)
                        </label>
                        <input
                          type="text"
                          value={
                            typeof sec.config?.primaryCtaHref === "string"
                              ? sec.config.primaryCtaHref
                              : ""
                          }
                          onChange={(e) =>
                            updateSection(sec.id, {
                              config: {
                                ...(sec.config || {}),
                                primaryCtaHref: e.target.value,
                              },
                            })
                          }
                          placeholder="/contact or /demos"
                          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-heading"
                        />
                      </div>
                    </div>

                    {sec.type === "rich_text" && (
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
                    )}
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
