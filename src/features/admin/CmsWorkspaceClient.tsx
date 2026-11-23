"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  History,
  MessageSquareQuote,
  PenLine,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PublishStatus,
  ServiceItem,
  TeamMember,
  TestimonialItem,
  WorkVerificationType,
} from "@/types/content";

type CmsTab =
  | "blog"
  | "case_study"
  | "service"
  | "faq"
  | "testimonial"
  | "team";

interface CmsWorkspaceClientProps {
  initialTab?: CmsTab;
  initialBlogPosts: BlogPost[];
  initialCaseStudies: CaseStudyItem[];
  initialServices: ServiceItem[];
  initialFaqs: FaqItem[];
  initialTestimonials: TestimonialItem[];
  initialTeamMembers: TeamMember[];
  canEditAny: boolean;
  canPublish: boolean;
}

export function CmsWorkspaceClient({
  initialTab = "blog",
  initialBlogPosts,
  initialCaseStudies,
  initialServices,
  initialFaqs,
  initialTestimonials,
  initialTeamMembers,
  canEditAny,
  canPublish,
}: CmsWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<CmsTab>(initialTab);
  const [blogEditorMode, setBlogEditorMode] = useState<"write" | "preview">(
    "write"
  );

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [caseStudies, setCaseStudies] =
    useState<CaseStudyItem[]>(initialCaseStudies);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [testimonials, setTestimonials] =
    useState<TestimonialItem[]>(initialTestimonials);
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(initialTeamMembers);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Blog Editor State
  const [blogForm, setBlogForm] = useState({
    id: initialBlogPosts[0]?.id || "",
    slug: initialBlogPosts[0]?.slug || "new-automation-insight",
    title: initialBlogPosts[0]?.title || "",
    excerpt: initialBlogPosts[0]?.excerpt || "",
    contentMarkdown:
      initialBlogPosts[0]?.contentMarkdown ||
      "## Operational Context\n\nExplain the bottleneck clearly and honestly.\n\n## Deterministic Solution\n\n- Explicit validation rules\n- Human review checkpoints",
    category: initialBlogPosts[0]?.category || "AI Automation",
    tagsText: (initialBlogPosts[0]?.tags || ["Automation"]).join(", "),
    featuredImageUrl: initialBlogPosts[0]?.featuredImageUrl || "",
    featuredImageAlt: initialBlogPosts[0]?.featuredImageAlt || "",
    showTableOfContents: initialBlogPosts[0]?.showTableOfContents ?? true,
    status: (initialBlogPosts[0]?.status || "draft") as PublishStatus,
    seoTitle: initialBlogPosts[0]?.seo?.seoTitle || "",
    seoDescription: initialBlogPosts[0]?.seo?.seoDescription || "",
  });

  // Case Study State
  const [csForm, setCsForm] = useState({
    id: initialCaseStudies[0]?.id || "",
    slug: initialCaseStudies[0]?.slug || "new-workflow-blueprint",
    title: initialCaseStudies[0]?.title || "",
    workType: (initialCaseStudies[0]?.workType ||
      "concept_demo") as WorkVerificationType,
    clientName: initialCaseStudies[0]?.clientName || "",
    clientPermissionGranted:
      initialCaseStudies[0]?.clientPermissionGranted ?? false,
    industry: initialCaseStudies[0]?.industry || "B2B Operations",
    businessType: initialCaseStudies[0]?.businessType || "Service Team",
    problemSummary: initialCaseStudies[0]?.problemSummary || "",
    manualBeforeText: (initialCaseStudies[0]?.manualProcessBefore || []).join(
      "\n"
    ),
    proposedAutomation: initialCaseStudies[0]?.proposedAutomation || "",
    automatedAfterText: (
      initialCaseStudies[0]?.automatedWorkflowAfter || []
    ).join("\n"),
    techText: (initialCaseStudies[0]?.technologiesUsed || []).join(", "),
    resultsText: (initialCaseStudies[0]?.verifiedResults || []).join("\n"),
    projectDuration: initialCaseStudies[0]?.projectDuration || "2–3 weeks",
    status: (initialCaseStudies[0]?.status || "published") as PublishStatus,
  });

  // Service State
  const [svcForm, setSvcForm] = useState({
    id: initialServices[0]?.id || "",
    slug: initialServices[0]?.slug || "",
    title: initialServices[0]?.title || "",
    categorySlug: initialServices[0]?.categorySlug || "ai-automation",
    categoryName: initialServices[0]?.categoryName || "AI Automation",
    isFlagshipPriority: initialServices[0]?.isFlagshipPriority ?? true,
    badgeLabel: initialServices[0]?.badgeLabel || "Core Capability",
    shortSummary: initialServices[0]?.shortSummary || "",
    problemStatement: initialServices[0]?.problemStatement || "",
    solutionOverview: initialServices[0]?.solutionOverview || "",
    benefitsText: (initialServices[0]?.benefits || []).join("\n"),
    ctaLabel: initialServices[0]?.ctaLabel || "Discuss This Workflow",
    ctaHref: initialServices[0]?.ctaHref || "/contact",
    order: initialServices[0]?.order ?? 1,
    status: (initialServices[0]?.status || "published") as PublishStatus,
  });

  // FAQ State
  const [faqForm, setFaqForm] = useState({
    id: initialFaqs[0]?.id || "",
    question: initialFaqs[0]?.question || "",
    answer: initialFaqs[0]?.answer || "",
    category: initialFaqs[0]?.category || "General",
    order: initialFaqs[0]?.order ?? 1,
    isPublished: initialFaqs[0]?.isPublished ?? true,
  });

  // Testimonial State
  const [tstForm, setTstForm] = useState({
    id: initialTestimonials[0]?.id || "",
    authorName: initialTestimonials[0]?.authorName || "",
    authorRole: initialTestimonials[0]?.authorRole || "",
    companyName: initialTestimonials[0]?.companyName || "",
    country: initialTestimonials[0]?.country || "United States",
    quote: initialTestimonials[0]?.quote || "",
    isAuthorized: initialTestimonials[0]?.isAuthorized ?? false,
    isVerified: initialTestimonials[0]?.isVerified ?? false,
    isPublished: initialTestimonials[0]?.isPublished ?? false,
  });

  // Team State
  const [teamForm, setTeamForm] = useState({
    id: initialTeamMembers[0]?.id || "",
    name: initialTeamMembers[0]?.name || "",
    role: initialTeamMembers[0]?.role || "",
    isFounder: initialTeamMembers[0]?.isFounder ?? false,
    bio: initialTeamMembers[0]?.bio || "",
    focusText: (initialTeamMembers[0]?.focusAreas || []).join(", "),
    regionsText: (
      initialTeamMembers[0]?.regionsServed || ["USA", "UK", "Canada"]
    ).join(", "),
    avatarUrl: initialTeamMembers[0]?.avatarUrl || "",
    linkedinUrl: initialTeamMembers[0]?.linkedinUrl || "",
    order: initialTeamMembers[0]?.order ?? 1,
    isPublished: initialTeamMembers[0]?.isPublished ?? true,
  });

  const activeBlogRevisions =
    blogPosts.find((p) => p.id === blogForm.id)?.revisions || [];

  const availableStatuses: PublishStatus[] = canPublish
    ? ["draft", "review", "published", "scheduled", "archived"]
    : ["draft", "review"];

  async function postCmsPayload(payload: Record<string, unknown>) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Validation or permission error.",
        });
        return null;
      }
      return json.item;
    } catch {
      setFeedback({ type: "error", text: "Network error saving CMS item." });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(entity: CmsTab, id: string) {
    if (!id) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/cms?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not delete item.",
        });
        return;
      }
      if (entity === "blog")
        setBlogPosts((p) => p.filter((x) => x.id !== id));
      if (entity === "case_study")
        setCaseStudies((p) => p.filter((x) => x.id !== id));
      if (entity === "service")
        setServices((p) => p.filter((x) => x.id !== id));
      if (entity === "faq") setFaqs((p) => p.filter((x) => x.id !== id));
      if (entity === "testimonial")
        setTestimonials((p) => p.filter((x) => x.id !== id));
      if (entity === "team")
        setTeamMembers((p) => p.filter((x) => x.id !== id));

      setFeedback({ type: "success", text: `Deleted ${entity} record.` });
    } finally {
      setSaving(false);
    }
  }

  const tabs: {
    id: CmsTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    requiresEditAny?: boolean;
  }[] = [
    {
      id: "blog",
      label: "Blog & Insights",
      count: blogPosts.length,
      icon: BookOpen,
    },
    {
      id: "case_study",
      label: "Case Studies",
      count: caseStudies.length,
      icon: FileText,
      requiresEditAny: true,
    },
    {
      id: "service",
      label: "Services",
      count: services.length,
      icon: Briefcase,
      requiresEditAny: true,
    },
    {
      id: "faq",
      label: "FAQs",
      count: faqs.length,
      icon: HelpCircle,
      requiresEditAny: true,
    },
    {
      id: "testimonial",
      label: "Testimonials",
      count: testimonials.length,
      icon: MessageSquareQuote,
      requiresEditAny: true,
    },
    {
      id: "team",
      label: "Team & Founder",
      count: teamMembers.length,
      icon: Users,
      requiresEditAny: true,
    },
  ];

  const visibleTabs = tabs.filter((t) => !t.requiresEditAny || canEditAny);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-line bg-surface-card text-ink-body hover:text-ink-heading"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span className="rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

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

      {/* 1. BLOG & INSIGHTS TAB */}
      {activeTab === "blog" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2.5 rounded-card border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-heading">
                Articles ({blogPosts.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setBlogForm({
                    id: "",
                    slug: `insight-${Date.now().toString(36)}`,
                    title: "",
                    excerpt: "",
                    contentMarkdown:
                      "## Problem Overview\n\nWrite grounded operational analysis here.",
                    category: "AI Automation",
                    tagsText: "Automation, Operations",
                    featuredImageUrl: "",
                    featuredImageAlt: "",
                    showTableOfContents: true,
                    status: "draft",
                    seoTitle: "",
                    seoDescription: "",
                  })
                }
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
                  onClick={() =>
                    setBlogForm({
                      id: post.id,
                      slug: post.slug,
                      title: post.title,
                      excerpt: post.excerpt,
                      contentMarkdown: post.contentMarkdown,
                      category: post.category,
                      tagsText: post.tags.join(", "),
                      featuredImageUrl: post.featuredImageUrl || "",
                      featuredImageAlt: post.featuredImageAlt || "",
                      showTableOfContents: post.showTableOfContents,
                      status: post.status,
                      seoTitle: post.seo?.seoTitle || "",
                      seoDescription: post.seo?.seoDescription || "",
                    })
                  }
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
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, title: e.target.value })
                  }
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
                    setBlogForm({ ...blogForm, slug: e.target.value })
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
                    {blogForm.contentMarkdown.trim()
                      ? blogForm.contentMarkdown.trim().split(/\s+/).length
                      : 0}{" "}
                    words · ~
                    {Math.max(
                      1,
                      Math.ceil(
                        (blogForm.contentMarkdown.trim()
                          ? blogForm.contentMarkdown.trim().split(/\s+/).length
                          : 0) / 210
                      )
                    )}{" "}
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
                      Nothing to preview yet. Switch to Write mode and add Markdown blocks.
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
                <label className="block text-xs font-medium text-ink-muted">
                  Featured Image URL (optional, from Media Library)
                </label>
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
              <div className="flex items-end">
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
              </div>
            </div>

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
                  onClick={() => deleteItem("blog", blogForm.id)}
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
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "blog",
                    id: blogForm.id || undefined,
                    slug: blogForm.slug,
                    title: blogForm.title,
                    excerpt: blogForm.excerpt,
                    contentMarkdown: blogForm.contentMarkdown,
                    category: blogForm.category,
                    tags: blogForm.tagsText
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                    featuredImageUrl: blogForm.featuredImageUrl || null,
                    featuredImageAlt: blogForm.featuredImageAlt,
                    showTableOfContents: blogForm.showTableOfContents,
                    status: blogForm.status,
                    seo: {
                      seoTitle: blogForm.seoTitle || undefined,
                      seoDescription: blogForm.seoDescription || undefined,
                    },
                  })) as BlogPost | null;

                  if (saved) {
                    setBlogPosts((prev) => {
                      const idx = prev.findIndex((p) => p.id === saved.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = saved;
                        return copy;
                      }
                      return [saved, ...prev];
                    });
                    setBlogForm((f) => ({ ...f, id: saved.id, slug: saved.slug }));
                    setFeedback({
                      type: "success",
                      text: `Saved article "${saved.title}" (${saved.status}).`,
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Article</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CASE STUDIES TAB */}
      {activeTab === "case_study" && canEditAny && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2.5 rounded-card border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-heading">
                Case Studies ({caseStudies.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setCsForm({
                    id: "",
                    slug: `blueprint-${Date.now().toString(36)}`,
                    title: "",
                    workType: "concept_demo",
                    clientName: "",
                    clientPermissionGranted: false,
                    industry: "Operations",
                    businessType: "B2B Services",
                    problemSummary: "",
                    manualBeforeText: "Manual inbox triage\nSpreadsheet copying",
                    proposedAutomation: "",
                    automatedAfterText: "Webhook trigger\nCRM sync + Slack brief",
                    techText: "Next.js, Webhooks, HubSpot",
                    resultsText: "Target response under 60 seconds",
                    projectDuration: "2 weeks",
                    status: "draft",
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Entry</span>
              </button>
            </div>
            {caseStudies.map((cs) => (
              <button
                key={cs.id}
                type="button"
                onClick={() =>
                  setCsForm({
                    id: cs.id,
                    slug: cs.slug,
                    title: cs.title,
                    workType: cs.workType,
                    clientName: cs.clientName || "",
                    clientPermissionGranted: cs.clientPermissionGranted,
                    industry: cs.industry,
                    businessType: cs.businessType,
                    problemSummary: cs.problemSummary,
                    manualBeforeText: cs.manualProcessBefore.join("\n"),
                    proposedAutomation: cs.proposedAutomation,
                    automatedAfterText: cs.automatedWorkflowAfter.join("\n"),
                    techText: cs.technologiesUsed.join(", "),
                    resultsText: cs.verifiedResults.join("\n"),
                    projectDuration: cs.projectDuration || "",
                    status: cs.status,
                  })
                }
                className={`w-full rounded-control border p-3 text-left ${
                  csForm.id === cs.id
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface hover:bg-surface-muted"
                }`}
              >
                <p className="line-clamp-1 text-xs font-semibold text-ink-heading">
                  {cs.title}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {cs.workType} · {cs.status}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
            <div className="rounded-control border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-ink-heading">
              <strong>Truthful Classification Rule:</strong> Only select{" "}
              <code>verified_client</code> when written client permission is
              confirmed. Otherwise label honestly as Concept Demo, Internal
              Experiment, or Planned Architecture.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Title
                </label>
                <input
                  type="text"
                  value={csForm.title}
                  onChange={(e) =>
                    setCsForm({ ...csForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Slug
                </label>
                <input
                  type="text"
                  value={csForm.slug}
                  onChange={(e) =>
                    setCsForm({ ...csForm, slug: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Honest Classification
                </label>
                <select
                  value={csForm.workType}
                  onChange={(e) =>
                    setCsForm({
                      ...csForm,
                      workType: e.target.value as WorkVerificationType,
                    })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                >
                  <option value="concept_demo">Concept Demo</option>
                  <option value="internal_experiment">
                    Internal Experiment
                  </option>
                  <option value="planned_project">Planned Architecture</option>
                  <option value="verified_client">Verified Client Work</option>
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
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Publish Status
                </label>
                <select
                  value={csForm.status}
                  onChange={(e) =>
                    setCsForm({
                      ...csForm,
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

            {csForm.workType === "verified_client" && (
              <div className="grid gap-4 rounded-control border border-line bg-surface p-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted">
                    Client Organization Name
                  </label>
                  <input
                    type="text"
                    value={csForm.clientName}
                    onChange={(e) =>
                      setCsForm({ ...csForm, clientName: e.target.value })
                    }
                    className="mt-1 w-full rounded-control border border-line bg-surface-card px-3 py-1.5 text-sm text-ink-heading"
                  />
                </div>
                <div className="flex items-end">
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
                    <span>Written client permission confirmed</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Operational Problem Summary
              </label>
              <textarea
                rows={2}
                value={csForm.problemSummary}
                onChange={(e) =>
                  setCsForm({ ...csForm, problemSummary: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Manual Process Before (one step per line)
                </label>
                <textarea
                  rows={4}
                  value={csForm.manualBeforeText}
                  onChange={(e) =>
                    setCsForm({ ...csForm, manualBeforeText: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface p-2.5 text-xs text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Automated Workflow After (one step per line)
                </label>
                <textarea
                  rows={4}
                  value={csForm.automatedAfterText}
                  onChange={(e) =>
                    setCsForm({ ...csForm, automatedAfterText: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface p-2.5 text-xs text-ink-heading"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Proposed Architecture &amp; Guardrails
              </label>
              <textarea
                rows={2}
                value={csForm.proposedAutomation}
                onChange={(e) =>
                  setCsForm({ ...csForm, proposedAutomation: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Technologies Used (comma-separated)
                </label>
                <input
                  type="text"
                  value={csForm.techText}
                  onChange={(e) =>
                    setCsForm({ ...csForm, techText: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Target / Verified Outcomes (one per line)
                </label>
                <textarea
                  rows={2}
                  value={csForm.resultsText}
                  onChange={(e) =>
                    setCsForm({ ...csForm, resultsText: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface p-2 text-xs text-ink-heading"
                />
              </div>
            </div>

            <div className="flex justify-between border-t border-line pt-4">
              {csForm.id ? (
                <button
                  type="button"
                  onClick={() => deleteItem("case_study", csForm.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "case_study",
                    id: csForm.id || undefined,
                    slug: csForm.slug,
                    title: csForm.title,
                    workType: csForm.workType,
                    clientName: csForm.clientName || null,
                    clientPermissionGranted: csForm.clientPermissionGranted,
                    industry: csForm.industry,
                    businessType: csForm.businessType,
                    problemSummary: csForm.problemSummary,
                    manualProcessBefore: csForm.manualBeforeText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    proposedAutomation: csForm.proposedAutomation,
                    automatedWorkflowAfter: csForm.automatedAfterText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    technologiesUsed: csForm.techText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    verifiedResults: csForm.resultsText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    projectDuration: csForm.projectDuration || null,
                    status: csForm.status,
                  })) as CaseStudyItem | null;

                  if (saved) {
                    setCaseStudies((prev) => {
                      const idx = prev.findIndex((c) => c.id === saved.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = saved;
                        return copy;
                      }
                      return [saved, ...prev];
                    });
                    setCsForm((f) => ({ ...f, id: saved.id }));
                    setFeedback({
                      type: "success",
                      text: `Saved case study "${saved.title}".`,
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Case Study</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SERVICES TAB */}
      {activeTab === "service" && canEditAny && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2.5 rounded-card border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-heading">
                Services ({services.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setSvcForm({
                    id: "",
                    slug: `service-${Date.now().toString(36)}`,
                    title: "",
                    categorySlug: "ai-automation",
                    categoryName: "AI Automation",
                    isFlagshipPriority: true,
                    badgeLabel: "Flagship Priority",
                    shortSummary: "",
                    problemStatement: "",
                    solutionOverview: "",
                    benefitsText: "Deterministic execution\nAudit logging",
                    ctaLabel: "Discuss This Service",
                    ctaHref: "/contact",
                    order: services.length + 1,
                    status: "draft",
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Service</span>
              </button>
            </div>
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() =>
                  setSvcForm({
                    id: svc.id,
                    slug: svc.slug,
                    title: svc.title,
                    categorySlug: svc.categorySlug,
                    categoryName: svc.categoryName,
                    isFlagshipPriority: svc.isFlagshipPriority,
                    badgeLabel: svc.badgeLabel,
                    shortSummary: svc.shortSummary,
                    problemStatement: svc.problemStatement,
                    solutionOverview: svc.solutionOverview,
                    benefitsText: svc.benefits.join("\n"),
                    ctaLabel: svc.ctaLabel,
                    ctaHref: svc.ctaHref,
                    order: svc.order,
                    status: svc.status,
                  })
                }
                className={`w-full rounded-control border p-3 text-left ${
                  svcForm.id === svc.id
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface hover:bg-surface-muted"
                }`}
              >
                <p className="line-clamp-1 text-xs font-semibold text-ink-heading">
                  {svc.title}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {svc.categoryName} · {svc.status}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Service Title
                </label>
                <input
                  type="text"
                  value={svcForm.title}
                  onChange={(e) =>
                    setSvcForm({ ...svcForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Slug
                </label>
                <input
                  type="text"
                  value={svcForm.slug}
                  onChange={(e) =>
                    setSvcForm({ ...svcForm, slug: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink-heading"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Category Name
                </label>
                <input
                  type="text"
                  value={svcForm.categoryName}
                  onChange={(e) =>
                    setSvcForm({ ...svcForm, categoryName: e.target.value })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
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
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
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
              <span>
                Feature as Flagship Priority on Homepage (AI / Business
                Automation)
              </span>
            </label>

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Short Summary
              </label>
              <textarea
                rows={2}
                value={svcForm.shortSummary}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, shortSummary: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
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
                  className="mt-1 w-full rounded-control border border-line bg-surface p-2.5 text-xs text-ink-heading"
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
                  className="mt-1 w-full rounded-control border border-line bg-surface p-2.5 text-xs text-ink-heading"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted">
                Operational Benefits (one per line)
              </label>
              <textarea
                rows={3}
                value={svcForm.benefitsText}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, benefitsText: e.target.value })
                }
                className="mt-1 w-full rounded-control border border-line bg-surface p-2.5 text-xs text-ink-heading"
              />
            </div>

            <div className="flex justify-end border-t border-line pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "service",
                    id: svcForm.id || undefined,
                    slug: svcForm.slug,
                    title: svcForm.title,
                    categorySlug: svcForm.categorySlug,
                    categoryName: svcForm.categoryName,
                    isFlagshipPriority: svcForm.isFlagshipPriority,
                    badgeLabel: svcForm.badgeLabel,
                    shortSummary: svcForm.shortSummary,
                    problemStatement: svcForm.problemStatement,
                    solutionOverview: svcForm.solutionOverview,
                    benefits: svcForm.benefitsText
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean),
                    ctaLabel: svcForm.ctaLabel,
                    ctaHref: svcForm.ctaHref,
                    order: Number(svcForm.order) || 1,
                    status: svcForm.status,
                  })) as ServiceItem | null;

                  if (saved) {
                    setServices((prev) => {
                      const idx = prev.findIndex((s) => s.id === saved.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = saved;
                        return copy;
                      }
                      return [...prev, saved];
                    });
                    setSvcForm((f) => ({ ...f, id: saved.id }));
                    setFeedback({
                      type: "success",
                      text: `Saved service "${saved.title}".`,
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FAQ TAB */}
      {activeTab === "faq" && canEditAny && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 rounded-card border border-line bg-surface-card p-4">
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
                    category: "General",
                    order: faqs.length + 1,
                    isPublished: canPublish,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New FAQ</span>
              </button>
            </div>
            {faqs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFaqForm({ ...f })}
                className={`w-full rounded-control border p-3 text-left ${
                  faqForm.id === f.id
                    ? "border-primary bg-accent-subtle/40"
                    : "border-line bg-surface"
                }`}
              >
                <p className="line-clamp-1 text-xs font-semibold text-ink-heading">
                  {f.question}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {f.category} · {f.isPublished ? "Published" : "Draft"}
                </p>
              </button>
            ))}
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
                rows={4}
                value={faqForm.answer}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answer: e.target.value })
                }
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
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted">
                  Display Order
                </label>
                <input
                  type="number"
                  value={faqForm.order}
                  onChange={(e) =>
                    setFaqForm({
                      ...faqForm,
                      order: Number(e.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
                />
              </div>
              {canPublish && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-medium text-ink-heading">
                    <input
                      type="checkbox"
                      checked={faqForm.isPublished}
                      onChange={(e) =>
                        setFaqForm({
                          ...faqForm,
                          isPublished: e.target.checked,
                        })
                      }
                    />
                    <span>Published on website</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-line pt-4">
              {faqForm.id ? (
                <button
                  type="button"
                  onClick={() => deleteItem("faq", faqForm.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-medium text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "faq",
                    id: faqForm.id || undefined,
                    question: faqForm.question,
                    answer: faqForm.answer,
                    category: faqForm.category,
                    order: faqForm.order,
                    isPublished: faqForm.isPublished,
                  })) as FaqItem | null;
                  if (saved) {
                    setFaqs((prev) => {
                      const idx = prev.findIndex((f) => f.id === saved.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = saved;
                        return copy;
                      }
                      return [...prev, saved];
                    });
                    setFaqForm(saved);
                    setFeedback({ type: "success", text: "Saved FAQ item." });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save FAQ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TESTIMONIALS TAB */}
      {activeTab === "testimonial" && canEditAny && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 rounded-card border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-heading">
                Testimonials ({testimonials.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setTstForm({
                    id: "",
                    authorName: "",
                    authorRole: "",
                    companyName: "",
                    country: "United States",
                    quote: "",
                    isAuthorized: false,
                    isVerified: false,
                    isPublished: false,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Quote</span>
              </button>
            </div>
            {testimonials.length === 0 && (
              <p className="text-xs text-ink-muted">
                No testimonials stored yet. Public testimonials section stays
                cleanly hidden until a real, verified client quote is added.
              </p>
            )}
            {testimonials.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTstForm({ ...t })}
                className="w-full rounded-control border border-line bg-surface p-3 text-left"
              >
                <p className="text-xs font-semibold text-ink-heading">
                  {t.authorName} · {t.companyName}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {t.isPublished && t.isAuthorized && t.isVerified
                    ? "LIVE VERIFIED"
                    : "HIDDEN / UNVERIFIED"}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
            <div className="rounded-control border border-line bg-surface-muted/60 p-3 text-xs text-ink-body">
              <strong>Honest Proof Gate:</strong> A testimonial only appears on
              the public website when <em>Authorized</em>, <em>Verified</em>,
              and <em>Published</em> are all enabled.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Client Full Name"
                value={tstForm.authorName}
                onChange={(e) =>
                  setTstForm({ ...tstForm, authorName: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
              <input
                type="text"
                placeholder="Role / Title"
                value={tstForm.authorRole}
                onChange={(e) =>
                  setTstForm({ ...tstForm, authorRole: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={tstForm.companyName}
                onChange={(e) =>
                  setTstForm({ ...tstForm, companyName: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
              <input
                type="text"
                placeholder="Country (e.g. United Kingdom)"
                value={tstForm.country}
                onChange={(e) =>
                  setTstForm({ ...tstForm, country: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Exact client quote..."
              value={tstForm.quote}
              onChange={(e) =>
                setTstForm({ ...tstForm, quote: e.target.value })
              }
              className="w-full rounded-control border border-line bg-surface p-3 text-sm text-ink-heading"
            />
            <div className="flex flex-wrap gap-5 text-xs font-medium text-ink-heading">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tstForm.isAuthorized}
                  onChange={(e) =>
                    setTstForm({ ...tstForm, isAuthorized: e.target.checked })
                  }
                />
                <span>Client Authorized</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tstForm.isVerified}
                  onChange={(e) =>
                    setTstForm({ ...tstForm, isVerified: e.target.checked })
                  }
                />
                <span>Identity Verified</span>
              </label>
              {canPublish && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tstForm.isPublished}
                    onChange={(e) =>
                      setTstForm({ ...tstForm, isPublished: e.target.checked })
                    }
                  />
                  <span>Published</span>
                </label>
              )}
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "testimonial",
                    id: tstForm.id || undefined,
                    authorName: tstForm.authorName,
                    authorRole: tstForm.authorRole,
                    companyName: tstForm.companyName,
                    country: tstForm.country,
                    quote: tstForm.quote,
                    isAuthorized: tstForm.isAuthorized,
                    isVerified: tstForm.isVerified,
                    isPublished: tstForm.isPublished,
                  })) as TestimonialItem | null;
                  if (saved) {
                    setTestimonials((prev) => [
                      saved,
                      ...prev.filter((x) => x.id !== saved.id),
                    ]);
                    setTstForm(saved);
                    setFeedback({
                      type: "success",
                      text: "Saved testimonial record.",
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Testimonial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TEAM & FOUNDER TAB */}
      {activeTab === "team" && canEditAny && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 rounded-card border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-heading">
                Team Profiles ({teamMembers.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setTeamForm({
                    id: "",
                    name: "",
                    role: "",
                    isFounder: false,
                    bio: "",
                    focusText: "Workflow Automation, Systems Integration",
                    regionsText: "USA, UK, Canada",
                    avatarUrl: "",
                    linkedinUrl: "",
                    order: teamMembers.length + 1,
                    isPublished: canPublish,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            </div>
            {teamMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  setTeamForm({
                    id: m.id,
                    name: m.name,
                    role: m.role,
                    isFounder: m.isFounder,
                    bio: m.bio,
                    focusText: m.focusAreas.join(", "),
                    regionsText: m.regionsServed.join(", "),
                    avatarUrl: m.avatarUrl || "",
                    linkedinUrl: m.linkedinUrl || "",
                    order: m.order,
                    isPublished: m.isPublished,
                  })
                }
                className="w-full rounded-control border border-line bg-surface p-3 text-left"
              >
                <p className="text-xs font-semibold text-ink-heading">
                  {m.name} {m.isFounder ? "· Founder" : ""}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  {m.role}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-card border border-line bg-surface-card p-5 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Full Name"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, name: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
              <input
                type="text"
                placeholder="Role / Title"
                value={teamForm.role}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, role: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-heading"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Grounded professional bio..."
              value={teamForm.bio}
              onChange={(e) =>
                setTeamForm({ ...teamForm, bio: e.target.value })
              }
              className="w-full rounded-control border border-line bg-surface p-3 text-sm text-ink-heading"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Focus Areas (comma-separated)"
                value={teamForm.focusText}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, focusText: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
              <input
                type="text"
                placeholder="Regions Served (comma-separated)"
                value={teamForm.regionsText}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, regionsText: e.target.value })
                }
                className="rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
              />
            </div>
            <div className="flex flex-wrap gap-5 text-xs font-medium text-ink-heading">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={teamForm.isFounder}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, isFounder: e.target.checked })
                  }
                />
                <span>Founder Profile</span>
              </label>
              {canPublish && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={teamForm.isPublished}
                    onChange={(e) =>
                      setTeamForm({
                        ...teamForm,
                        isPublished: e.target.checked,
                      })
                    }
                  />
                  <span>Published</span>
                </label>
              )}
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const saved = (await postCmsPayload({
                    entity: "team",
                    id: teamForm.id || undefined,
                    name: teamForm.name,
                    role: teamForm.role,
                    isFounder: teamForm.isFounder,
                    bio: teamForm.bio,
                    focusAreas: teamForm.focusText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    regionsServed: teamForm.regionsText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    avatarUrl: teamForm.avatarUrl || null,
                    linkedinUrl: teamForm.linkedinUrl || null,
                    order: teamForm.order,
                    isPublished: teamForm.isPublished,
                  })) as TeamMember | null;
                  if (saved) {
                    setTeamMembers((prev) => {
                      const idx = prev.findIndex((m) => m.id === saved.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = saved;
                        return copy;
                      }
                      return [...prev, saved];
                    });
                    setTeamForm((f) => ({ ...f, id: saved.id }));
                    setFeedback({
                      type: "success",
                      text: `Saved team profile "${saved.name}".`,
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
