"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  FolderKanban,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  MessageSquareQuote,
  RotateCcw,
  Settings,
  Users,
} from "lucide-react";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PublishStatus,
  ServiceItem,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import { BlogEditorPanel } from "./cms/BlogEditorPanel";
import { CaseStudyEditorPanel } from "./cms/CaseStudyEditorPanel";
import {
  linesToArray,
  slugifyValue,
  type BlogFormState,
  type CaseStudyFormState,
  type CmsTab,
  type ServiceFormState,
} from "./cms/cms-helpers";
import { ServiceEditorPanel } from "./cms/ServiceEditorPanel";
import {
  FaqEditorPanel,
  TeamEditorPanel,
  TestimonialEditorPanel,
  type FaqFormState,
  type TeamFormState,
  type TestimonialFormState,
} from "./cms/TrustAndFaqPanel";

interface CmsWorkspaceClientProps {
  initialTab?: CmsTab;
  initialBlogPosts: BlogPost[];
  initialCaseStudies: CaseStudyItem[];
  initialServices: ServiceItem[];
  initialFaqs: FaqItem[];
  initialTestimonials: TestimonialItem[];
  initialTeamMembers: TeamMember[];
  canPublish: boolean;
  canEditAny: boolean;
}

const VALID_TABS = new Set<CmsTab>([
  "blog",
  "case_study",
  "service",
  "faq",
  "testimonial",
  "team",
]);

function postToBlogForm(post?: BlogPost): BlogFormState {
  return {
    id: post?.id || "",
    slug: post?.slug || "",
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    contentMarkdown:
      post?.contentMarkdown ||
      "## Problem Overview\n\nWrite grounded operational analysis here.\n\n## Implementation Blueprint\n\n- Step 1\n- Step 2",
    category: post?.category || "AI Automation",
    tagsText: post?.tags.join(", ") || "Automation, Operations",
    featuredImageUrl: post?.featuredImageUrl || "",
    featuredImageAlt: post?.featuredImageAlt || "",
    showTableOfContents: post?.showTableOfContents ?? true,
    status: post?.status || "draft",
    seoTitle: post?.seo?.seoTitle || "",
    seoDescription: post?.seo?.seoDescription || "",
  };
}

function csToForm(cs?: CaseStudyItem): CaseStudyFormState {
  return {
    id: cs?.id || "",
    slug: cs?.slug || "",
    title: cs?.title || "",
    workType: cs?.workType || "concept_demo",
    clientName: cs?.clientName || "",
    clientPermissionGranted: cs?.clientPermissionGranted ?? false,
    industry: cs?.industry || "B2B Operations",
    businessType: cs?.businessType || "Service Business",
    problemSummary: cs?.problemSummary || "",
    manualProcessBeforeText:
      cs?.manualProcessBefore.join("\n") ||
      "Manual inbox triage and spreadsheet copying",
    proposedAutomation: cs?.proposedAutomation || "",
    automatedWorkflowAfterText:
      cs?.automatedWorkflowAfter.join("\n") ||
      "Deterministic webhook validation and CRM routing",
    technologiesUsedText:
      cs?.technologiesUsed.join(", ") || "Next.js, Webhooks, PostgreSQL",
    verifiedResultsText:
      cs?.verifiedResults.join("\n") ||
      "Sub-minute lead routing with full audit logging",
    projectDuration: cs?.projectDuration || "2–3 Weeks",
    relatedServiceSlugsText: cs?.relatedServiceSlugs.join(", ") || "",
    status: cs?.status || "draft",
    seoTitle: cs?.seo?.seoTitle || "",
    seoDescription: cs?.seo?.seoDescription || "",
  };
}

function svcToForm(svc?: ServiceItem): ServiceFormState {
  return {
    id: svc?.id || "",
    slug: svc?.slug || "",
    title: svc?.title || "",
    categorySlug: svc?.categorySlug || "ai-workflow-automation",
    categoryName: svc?.categoryName || "AI Workflow Automation",
    isFlagshipPriority: svc?.isFlagshipPriority ?? false,
    badgeLabel: svc?.badgeLabel || "Core Practice",
    shortSummary: svc?.shortSummary || "",
    problemStatement: svc?.problemStatement || "",
    solutionOverview: svc?.solutionOverview || "",
    benefitsText:
      svc?.benefits.join("\n") ||
      "Eliminate manual copy-paste bottlenecks\nAudit-logged execution",
    ctaLabel: svc?.ctaLabel || "Discuss This Automation",
    ctaHref: svc?.ctaHref || "/contact",
    order: svc?.order ?? 1,
    status: svc?.status || "draft",
    seoTitle: svc?.seo?.seoTitle || "",
    seoDescription: svc?.seo?.seoDescription || "",
  };
}

export function CmsWorkspaceClient({
  initialTab = "blog",
  initialBlogPosts,
  initialCaseStudies,
  initialServices,
  initialFaqs,
  initialTestimonials,
  initialTeamMembers,
  canPublish,
  canEditAny,
}: CmsWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<CmsTab>(initialTab);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [caseStudies, setCaseStudies] =
    useState<CaseStudyItem[]>(initialCaseStudies);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [testimonials, setTestimonials] =
    useState<TestimonialItem[]>(initialTestimonials);
  const [team, setTeam] = useState<TeamMember[]>(initialTeamMembers);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [recoverableDraft, setRecoverableDraft] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [blogForm, setBlogFormState] = useState<BlogFormState>(() =>
    postToBlogForm(initialBlogPosts[0])
  );
  const [csForm, setCsFormState] = useState<CaseStudyFormState>(() =>
    csToForm(initialCaseStudies[0])
  );
  const [svcForm, setSvcFormState] = useState<ServiceFormState>(() =>
    svcToForm(initialServices[0])
  );
  const [faqForm, setFaqFormState] = useState<FaqFormState>({
    id: initialFaqs[0]?.id || "",
    question: initialFaqs[0]?.question || "",
    answer: initialFaqs[0]?.answer || "",
    category: initialFaqs[0]?.category || "Services & Scope",
    order: initialFaqs[0]?.order ?? 1,
    isPublished: initialFaqs[0]?.isPublished ?? true,
  });
  const [tmForm, setTmFormState] = useState<TestimonialFormState>({
    id: initialTestimonials[0]?.id || "",
    quote: initialTestimonials[0]?.quote || "",
    authorName: initialTestimonials[0]?.authorName || "",
    authorRole: initialTestimonials[0]?.authorRole || "",
    companyName: initialTestimonials[0]?.companyName || "",
    country: initialTestimonials[0]?.country || "United States",
    isVerified: initialTestimonials[0]?.isVerified ?? false,
    isAuthorized: initialTestimonials[0]?.isAuthorized ?? false,
    isPublished: initialTestimonials[0]?.isPublished ?? false,
  });
  const [memberForm, setMemberFormState] = useState<TeamFormState>({
    id: initialTeamMembers[0]?.id || "",
    name: initialTeamMembers[0]?.name || "",
    role: initialTeamMembers[0]?.role || "",
    isFounder: initialTeamMembers[0]?.isFounder ?? false,
    bio: initialTeamMembers[0]?.bio || "",
    focusAreasText:
      initialTeamMembers[0]?.focusAreas.join(", ") ||
      "AI Workflow Automation, Systems Integration",
    regionsServedText:
      initialTeamMembers[0]?.regionsServed.join(", ") ||
      "United States, United Kingdom, Canada",
    avatarUrl: initialTeamMembers[0]?.avatarUrl || "",
    linkedinUrl: initialTeamMembers[0]?.linkedinUrl || "",
    order: initialTeamMembers[0]?.order ?? 1,
    isPublished: initialTeamMembers[0]?.isPublished ?? false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as CmsTab | null;
    if (tabParam && VALID_TABS.has(tabParam) && (canEditAny || tabParam === "blog")) {
      setActiveTab(tabParam);
    }
  }, [canEditAny]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(
        `omniflow_cms_draft_v1_${activeTab}`
      );
      setRecoverableDraft(raw || null);
    } catch {
      setRecoverableDraft(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function persistDraft(tab: CmsTab, data: unknown) {
    setIsDirty(true);
    try {
      window.localStorage.setItem(
        `omniflow_cms_draft_v1_${tab}`,
        JSON.stringify(data)
      );
    } catch {
      // Ignore storage quota errors
    }
  }

  function clearDraft(tab: CmsTab) {
    setIsDirty(false);
    setRecoverableDraft(null);
    try {
      window.localStorage.removeItem(`omniflow_cms_draft_v1_${tab}`);
    } catch {
      // Ignore
    }
  }

  function handleRestoreDraft() {
    if (!recoverableDraft) return;
    try {
      const parsed = JSON.parse(recoverableDraft);
      if (activeTab === "blog") setBlogFormState(parsed);
      if (activeTab === "case_study") setCsFormState(parsed);
      if (activeTab === "service") setSvcFormState(parsed);
      if (activeTab === "faq") setFaqFormState(parsed);
      if (activeTab === "testimonial") setTmFormState(parsed);
      if (activeTab === "team") setMemberFormState(parsed);
      setRecoverableDraft(null);
      setIsDirty(true);
      setFeedback({
        type: "success",
        text: "Restored unsaved local draft into editor.",
      });
    } catch {
      clearDraft(activeTab);
    }
  }

  function handleTabSwitch(nextTab: CmsTab) {
    if (nextTab === activeTab) return;
    if (
      isDirty &&
      !window.confirm(
        "You have unsaved edits in this tab (saved locally as a draft). Switch tabs anyway?"
      )
    ) {
      return;
    }
    setIsDirty(false);
    setActiveTab(nextTab);
  }

  const availableStatuses: PublishStatus[] = canPublish
    ? ["draft", "review", "scheduled", "published", "archived"]
    : ["draft", "review"];

  async function postCmsPayload(
    payload: Record<string, unknown>,
    successMsg: string
  ) {
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
          text: json.error || "Failed to save CMS entry.",
        });
        return null;
      }
      clearDraft(activeTab);
      setFeedback({ type: "success", text: successMsg });
      return json.item;
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving CMS entry.",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(entity: string, id: string) {
    if (!id) return;
    if (
      !window.confirm("Permanently delete this entry? This cannot be undone.")
    ) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/cms?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Delete failed." });
        return;
      }
      if (entity === "blog") {
        setBlogPosts((prev) => prev.filter((p) => p.id !== id));
        setBlogFormState(postToBlogForm());
      } else if (entity === "case_study") {
        setCaseStudies((prev) => prev.filter((c) => c.id !== id));
        setCsFormState(csToForm());
      } else if (entity === "service") {
        setServices((prev) => prev.filter((s) => s.id !== id));
        setSvcFormState(svcToForm());
      } else if (entity === "faq") {
        setFaqs((prev) => prev.filter((f) => f.id !== id));
        setFaqFormState({
          id: "",
          question: "",
          answer: "",
          category: "Services & Scope",
          order: 1,
          isPublished: true,
        });
      } else if (entity === "testimonial") {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
      } else if (entity === "team") {
        setTeam((prev) => prev.filter((m) => m.id !== id));
      }
      clearDraft(activeTab);
      setFeedback({ type: "success", text: "Entry deleted." });
    } finally {
      setSaving(false);
    }
  }

  const allTabs: { id: CmsTab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: "blog",
      label: "Blog & Insights",
      count: blogPosts.length,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "case_study",
      label: "Work & Case Studies",
      count: caseStudies.length,
      icon: <FolderKanban className="h-4 w-4" />,
    },
    {
      id: "service",
      label: "Services",
      count: services.length,
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "faq",
      label: "FAQs",
      count: faqs.length,
      icon: <HelpCircle className="h-4 w-4" />,
    },
    {
      id: "testimonial",
      label: "Verified Testimonials",
      count: testimonials.length,
      icon: <MessageSquareQuote className="h-4 w-4" />,
    },
    {
      id: "team",
      label: "Team Profiles",
      count: team.length,
      icon: <Users className="h-4 w-4" />,
    },
  ];

  const visibleTabs = canEditAny
    ? allTabs
    : allTabs.filter((t) => t.id === "blog");

  return (
    <div className="space-y-6">
      {/* Quick Cross-CMS Architecture Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface-card px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-heading">
            Connected Publishing Controls:
          </span>
          {isDirty && (
            <span className="rounded-full bg-status-warning/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-status-warning">
              Unsaved Draft (Auto-Saved Locally)
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditAny && (
            <Link
              href="/admin/pages"
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 font-medium text-ink-heading hover:border-primary/40 hover:text-primary"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Homepage &amp; Page Sections</span>
            </Link>
          )}
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 font-medium text-ink-heading hover:border-primary/40 hover:text-primary"
          >
            <ImageIcon className="h-3.5 w-3.5 text-primary" />
            <span>Media Library</span>
          </Link>
          {canEditAny && (
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 font-medium text-ink-heading hover:border-primary/40 hover:text-primary"
            >
              <Settings className="h-3.5 w-3.5 text-primary" />
              <span>Navigation, Footer &amp; Site Copy</span>
            </Link>
          )}
        </div>
      </div>

      {/* Entity Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabSwitch(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-button"
                : "border border-line bg-surface-card text-ink-body hover:text-ink-heading"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className="rounded-full bg-black/15 px-2 py-0.5 font-mono text-[10px]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Local Draft Recovery Banner */}
      {recoverableDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-primary/35 bg-accent-subtle/40 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-ink-heading">
            <RotateCcw className="h-4 w-4 text-primary" />
            <span>
              An unsaved local draft was found for the{" "}
              <strong>{activeTab.replace("_", " ")}</strong> editor.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="rounded-control bg-primary px-3 py-1 font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={() => clearDraft(activeTab)}
              className="rounded-control border border-line bg-surface px-3 py-1 font-medium text-ink-muted hover:text-ink-heading"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-card border px-4 py-3 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* BLOG EDITOR */}
      {activeTab === "blog" && (
        <BlogEditorPanel
          blogPosts={blogPosts}
          blogForm={blogForm}
          setBlogForm={(next) => {
            setBlogFormState(next);
            persistDraft("blog", next);
          }}
          availableStatuses={availableStatuses}
          canEditAny={canEditAny}
          saving={saving}
          onSelectPost={(post) => {
            setBlogFormState(postToBlogForm(post));
            setIsDirty(false);
          }}
          onNewDraft={() => {
            setBlogFormState(postToBlogForm());
            setIsDirty(false);
          }}
          onDelete={(id) => deleteItem("blog", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "blog",
                id: blogForm.id || undefined,
                slug: slugifyValue(blogForm.slug || blogForm.title),
                title: blogForm.title,
                excerpt: blogForm.excerpt,
                contentMarkdown: blogForm.contentMarkdown,
                category: blogForm.category,
                tags: blogForm.tagsText
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                featuredImageUrl: blogForm.featuredImageUrl.trim() || null,
                featuredImageAlt: blogForm.featuredImageAlt.trim(),
                showTableOfContents: blogForm.showTableOfContents,
                status: blogForm.status,
                seo: {
                  seoTitle: blogForm.seoTitle,
                  seoDescription: blogForm.seoDescription,
                },
              },
              "Blog article saved."
            )) as BlogPost | null;
            if (saved) {
              setBlogPosts((prev) => {
                const exists = prev.some((p) => p.id === saved.id);
                return exists
                  ? prev.map((p) => (p.id === saved.id ? saved : p))
                  : [saved, ...prev];
              });
              setBlogFormState(postToBlogForm(saved));
            }
          }}
        />
      )}

      {/* CASE STUDIES / WORK BLUEPRINTS */}
      {activeTab === "case_study" && canEditAny && (
        <CaseStudyEditorPanel
          caseStudies={caseStudies}
          csForm={csForm}
          setCsForm={(next) => {
            setCsFormState(next);
            persistDraft("case_study", next);
          }}
          availableStatuses={availableStatuses}
          canEditAny={canEditAny}
          saving={saving}
          onSelectCaseStudy={(cs) => {
            setCsFormState(csToForm(cs));
            setIsDirty(false);
          }}
          onNewBlueprint={() => {
            setCsFormState(csToForm());
            setIsDirty(false);
          }}
          onDelete={(id) => deleteItem("case_study", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "case_study",
                id: csForm.id || undefined,
                slug: slugifyValue(csForm.slug || csForm.title),
                title: csForm.title,
                workType: csForm.workType,
                clientName: csForm.clientName.trim() || null,
                clientPermissionGranted: csForm.clientPermissionGranted,
                industry: csForm.industry,
                businessType: csForm.businessType,
                problemSummary: csForm.problemSummary,
                manualProcessBefore: linesToArray(
                  csForm.manualProcessBeforeText
                ),
                proposedAutomation: csForm.proposedAutomation,
                automatedWorkflowAfter: linesToArray(
                  csForm.automatedWorkflowAfterText
                ),
                technologiesUsed: csForm.technologiesUsedText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                verifiedResults: linesToArray(csForm.verifiedResultsText),
                projectDuration: csForm.projectDuration.trim() || null,
                relatedServiceSlugs: csForm.relatedServiceSlugsText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                status: csForm.status,
                seo: {
                  seoTitle: csForm.seoTitle,
                  seoDescription: csForm.seoDescription,
                },
              },
              "Work entry saved."
            )) as CaseStudyItem | null;

            if (saved) {
              setCaseStudies((prev) => {
                const exists = prev.some((c) => c.id === saved.id);
                return exists
                  ? prev.map((c) => (c.id === saved.id ? saved : c))
                  : [...prev, saved];
              });
              setCsFormState(csToForm(saved));
            }
          }}
        />
      )}

      {/* SERVICES */}
      {activeTab === "service" && canEditAny && (
        <ServiceEditorPanel
          services={services}
          svcForm={svcForm}
          setSvcForm={(next) => {
            setSvcFormState(next);
            persistDraft("service", next);
          }}
          availableStatuses={availableStatuses}
          canEditAny={canEditAny}
          saving={saving}
          onSelectService={(svc) => {
            setSvcFormState(svcToForm(svc));
            setIsDirty(false);
          }}
          onNewService={() => {
            setSvcFormState({
              ...svcToForm(),
              order: services.length + 1,
            });
            setIsDirty(false);
          }}
          onDelete={(id) => deleteItem("service", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "service",
                id: svcForm.id || undefined,
                slug: slugifyValue(svcForm.slug || svcForm.title),
                title: svcForm.title,
                categorySlug: svcForm.categorySlug,
                categoryName: svcForm.categoryName,
                isFlagshipPriority: svcForm.isFlagshipPriority,
                badgeLabel: svcForm.badgeLabel,
                shortSummary: svcForm.shortSummary,
                problemStatement:
                  svcForm.problemStatement || svcForm.shortSummary,
                solutionOverview:
                  svcForm.solutionOverview || svcForm.shortSummary,
                benefits: linesToArray(svcForm.benefitsText),
                ctaLabel: svcForm.ctaLabel,
                ctaHref: svcForm.ctaHref,
                order: svcForm.order,
                status: svcForm.status,
                seo: {
                  seoTitle: svcForm.seoTitle,
                  seoDescription: svcForm.seoDescription,
                },
              },
              "Service record saved."
            )) as ServiceItem | null;

            if (saved) {
              setServices((prev) => {
                const exists = prev.some((s) => s.id === saved.id);
                return exists
                  ? prev.map((s) => (s.id === saved.id ? saved : s))
                  : [...prev, saved];
              });
              setSvcFormState(svcToForm(saved));
            }
          }}
        />
      )}

      {/* FAQS */}
      {activeTab === "faq" && canEditAny && (
        <FaqEditorPanel
          faqs={faqs}
          faqForm={faqForm}
          setFaqForm={(next) => {
            setFaqFormState(next);
            persistDraft("faq", next);
          }}
          canEditAny={canEditAny}
          saving={saving}
          onDelete={(id) => deleteItem("faq", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "faq",
                id: faqForm.id || undefined,
                question: faqForm.question,
                answer: faqForm.answer,
                category: faqForm.category,
                order: faqForm.order,
                isPublished: faqForm.isPublished,
              },
              "FAQ entry saved."
            )) as FaqItem | null;
            if (saved) {
              setFaqs((prev) => {
                const exists = prev.some((f) => f.id === saved.id);
                return exists
                  ? prev.map((f) => (f.id === saved.id ? saved : f))
                  : [...prev, saved];
              });
              setFaqFormState({
                id: saved.id,
                question: saved.question,
                answer: saved.answer,
                category: saved.category,
                order: saved.order,
                isPublished: saved.isPublished,
              });
            }
          }}
        />
      )}

      {/* VERIFIED TESTIMONIALS */}
      {activeTab === "testimonial" && canEditAny && (
        <TestimonialEditorPanel
          testimonials={testimonials}
          tmForm={tmForm}
          setTmForm={(next) => {
            setTmFormState(next);
            persistDraft("testimonial", next);
          }}
          canEditAny={canEditAny}
          canPublish={canPublish}
          saving={saving}
          onDelete={(id) => deleteItem("testimonial", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "testimonial",
                id: tmForm.id || undefined,
                quote: tmForm.quote,
                authorName: tmForm.authorName,
                authorRole: tmForm.authorRole,
                companyName: tmForm.companyName,
                country: tmForm.country,
                isVerified: tmForm.isVerified,
                isAuthorized: tmForm.isAuthorized,
                isPublished: tmForm.isPublished,
              },
              "Testimonial saved."
            )) as TestimonialItem | null;
            if (saved) {
              setTestimonials((prev) => {
                const exists = prev.some((t) => t.id === saved.id);
                return exists
                  ? prev.map((t) => (t.id === saved.id ? saved : t))
                  : [saved, ...prev];
              });
              setTmFormState({ ...tmForm, id: saved.id });
            }
          }}
        />
      )}

      {/* TEAM MEMBERS */}
      {activeTab === "team" && canEditAny && (
        <TeamEditorPanel
          team={team}
          memberForm={memberForm}
          setMemberForm={(next) => {
            setMemberFormState(next);
            persistDraft("team", next);
          }}
          canEditAny={canEditAny}
          canPublish={canPublish}
          saving={saving}
          onDelete={(id) => deleteItem("team", id)}
          onSave={async () => {
            const saved = (await postCmsPayload(
              {
                entity: "team",
                id: memberForm.id || undefined,
                name: memberForm.name,
                role: memberForm.role,
                isFounder: memberForm.isFounder,
                bio: memberForm.bio,
                focusAreas: memberForm.focusAreasText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                regionsServed: memberForm.regionsServedText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                avatarUrl: memberForm.avatarUrl.trim() || null,
                linkedinUrl: memberForm.linkedinUrl.trim() || null,
                order: memberForm.order,
                isPublished: memberForm.isPublished,
              },
              "Team member profile saved."
            )) as TeamMember | null;
            if (saved) {
              setTeam((prev) => {
                const exists = prev.some((m) => m.id === saved.id);
                return exists
                  ? prev.map((m) => (m.id === saved.id ? saved : m))
                  : [...prev, saved];
              });
              setMemberFormState({ ...memberForm, id: saved.id });
            }
          }}
        />
      )}
    </div>
  );
}
