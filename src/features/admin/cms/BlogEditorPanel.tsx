"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Eye,
  History,
  Image as ImageIcon,
  PenLine,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import type { BlogPost, PublishStatus } from "@/types/content";
import {
  slugifyValue,
  type BlogFormState,
} from "./cms-helpers";
import { MediaPickerModal } from "./MediaPickerModal";
import { SeoCompletenessBar } from "./SeoCompletenessBar";

interface BlogEditorPanelProps {
  blogPosts: BlogPost[];
  blogForm: BlogFormState;
  setBlogForm: (next: BlogFormState) => void;
  availableStatuses: PublishStatus[];
  canEditAny: boolean;
  saving: boolean;
  onSelectPost: (post: BlogPost) => void;
  onNewDraft: () => void;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BlogEditorPanel({
  blogPosts,
  blogForm,
  setBlogForm,
  availableStatuses,
  canEditAny,
  saving,
  onSelectPost,
  onNewDraft,
  onSave,
  onDelete,
}: BlogEditorPanelProps) {
  const [blogEditorMode, setBlogEditorMode] = useState<"write" | "preview">(
    "write"
  );
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const activeBlogRevisions =
    blogPosts.find((p) => p.id === blogForm.id)?.revisions || [];

  const wordCount = blogForm.contentMarkdown.trim()
    ? blogForm.contentMarkdown.trim().split(/\s+/).length
    : 0;

  return (
    <>
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) =>
          setBlogForm({
            ...blogForm,
            featuredImageUrl: asset.url,
            featuredImageAlt: blogForm.featuredImageAlt || asset.altText,
          })
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-card border border-line bg-surface-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-heading">
              Articles ({blogPosts.length})
            </h2>
            <button
              type="button"
              onClick={onNewDraft}
              className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Draft</span>
            </button>
          </div>
          <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
            {blogPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post)}
                className={`w-full rounded-control border p-3 text-left transition-colors ${
                  blogForm.id === post.id
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface hover:bg-surface-muted"
                }`}
              >
                <p className="line-clamp-1 text-xs font-semibold text-ink-heading">
                  {post.title}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {post.status} · {post.readingTimeMinutes} min ·{" "}
                  {post.revisions.length} rev
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Article Title
              </label>
              <input
                type="text"
                value={blogForm.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setBlogForm({
                    ...blogForm,
                    title: nextTitle,
                    slug:
                      !blogForm.id && !blogForm.slug
                        ? slugifyValue(nextTitle)
                        : blogForm.slug,
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
                value={blogForm.slug}
                onChange={(e) =>
                  setBlogForm({
                    ...blogForm,
                    slug: slugifyValue(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Category
              </label>
              <input
                type="text"
                value={blogForm.category}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, category: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={blogForm.tagsText}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, tagsText: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Workflow Status
              </label>
              <select
                value={blogForm.status}
                onChange={(e) =>
                  setBlogForm({
                    ...blogForm,
                    status: e.target.value as PublishStatus,
                  })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted">
              Summary Excerpt
            </label>
            <textarea
              rows={2}
              value={blogForm.excerpt}
              onChange={(e) =>
                setBlogForm({ ...blogForm, excerpt: e.target.value })
              }
              className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-medium text-ink-muted">
                Structured Markdown Body (`##` H2, `###` H3, `- ` lists, `&gt; `
                callouts)
              </label>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-ink-muted">
                  {wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 210))}{" "}
                  min read
                </span>

                <div className="inline-flex rounded-control border border-line bg-surface-muted p-0.5">
                  <button
                    type="button"
                    onClick={() => setBlogEditorMode("write")}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                      blogEditorMode === "write"
                        ? "bg-surface text-primary shadow-xs"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    <PenLine className="h-3 w-3" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlogEditorMode("preview")}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                      blogEditorMode === "preview"
                        ? "bg-surface text-primary shadow-xs"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                </div>

                {blogForm.slug && blogForm.status === "published" && (
                  <a
                    href={`/blog/${encodeURIComponent(blogForm.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-accent-subtle"
                  >
                    <span>Live</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {blogEditorMode === "preview" ? (
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-control border border-line bg-surface p-4 text-sm text-ink-body">
                {parseSafeMarkdown(blogForm.contentMarkdown).length === 0 ? (
                  <p className="text-xs text-ink-muted">
                    Nothing to preview yet. Switch to Write mode and add Markdown
                    blocks.
                  </p>
                ) : (
                  parseSafeMarkdown(blogForm.contentMarkdown).map((blk, i) => {
                    if (blk.type === "h2") {
                      return (
                        <h2
                          key={i}
                          className="pt-2 text-lg font-bold text-ink-heading"
                        >
                          {blk.text}
                        </h2>
                      );
                    }
                    if (blk.type === "h3") {
                      return (
                        <h3
                          key={i}
                          className="pt-1 text-base font-semibold text-ink-heading"
                        >
                          {blk.text}
                        </h3>
                      );
                    }
                    if (blk.type === "blockquote") {
                      return (
                        <blockquote
                          key={i}
                          className="border-l-2 border-primary bg-accent-subtle/40 px-3 py-2 text-xs italic text-ink-heading"
                        >
                          {blk.text}
                        </blockquote>
                      );
                    }
                    if (blk.type === "ul") {
                      return (
                        <ul key={i} className="list-disc space-y-1 pl-5 text-xs">
                          {blk.items.map((it, j) => (
                            <li key={j}>{it}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={i} className="text-xs leading-relaxed">
                        {blk.text}
                      </p>
                    );
                  })
                )}
              </div>
            ) : (
              <textarea
                rows={11}
                value={blogForm.contentMarkdown}
                onChange={(e) =>
                  setBlogForm({ ...blogForm, contentMarkdown: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-ink-heading"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-ink-muted">
                  Featured Image URL (optional)
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
                value={blogForm.featuredImageUrl}
                onChange={(e) =>
                  setBlogForm({
                    ...blogForm,
                    featuredImageUrl: e.target.value,
                  })
                }
                placeholder="/uploads/... or https://..."
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Featured Image Alt Text
              </label>
              <input
                type="text"
                value={blogForm.featuredImageAlt}
                onChange={(e) =>
                  setBlogForm({
                    ...blogForm,
                    featuredImageAlt: e.target.value,
                  })
                }
                placeholder="Accessible description of featured visual"
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
            <input
              type="checkbox"
              checked={blogForm.showTableOfContents}
              onChange={(e) =>
                setBlogForm({
                  ...blogForm,
                  showTableOfContents: e.target.checked,
                })
              }
            />
            <span>Auto-generate sticky Table of Contents</span>
          </label>

          <SeoCompletenessBar
            checkInput={{
              title: blogForm.title,
              slug: blogForm.slug,
              summary: blogForm.excerpt,
              seoTitle: blogForm.seoTitle,
              seoDescription: blogForm.seoDescription,
              bodyText: blogForm.contentMarkdown,
            }}
            urlPathPreview={`/blog/${blogForm.slug || "your-slug"}`}
            seoTitle={blogForm.seoTitle}
            seoDescription={blogForm.seoDescription}
            onChangeSeoTitle={(seoTitle) =>
              setBlogForm({ ...blogForm, seoTitle })
            }
            onChangeSeoDescription={(seoDescription) =>
              setBlogForm({ ...blogForm, seoDescription })
            }
          />

          {activeBlogRevisions.length > 0 && (
            <div className="rounded-control border border-line bg-surface-muted/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-heading">
                <History className="h-3.5 w-3.5 text-primary" />
                <span>
                  Saved Revisions ({activeBlogRevisions.length}) — click to
                  restore into editor
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeBlogRevisions.slice(0, 5).map((rev, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setBlogForm({
                        ...blogForm,
                        title: rev.title,
                        contentMarkdown: rev.contentMarkdown,
                      })
                    }
                    className="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-body hover:text-ink-heading"
                  >
                    {new Date(rev.savedAt).toLocaleDateString()} by{" "}
                    {rev.savedBy}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {blogForm.id && canEditAny ? (
              <button
                type="button"
                onClick={() => onDelete(blogForm.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Article</span>
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
              <span>{saving ? "Saving..." : "Save Article"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
