"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  Layers,
  Maximize2,
  Monitor,
  Moon,
  Move,
  PanelLeft,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
} from "lucide-react";
import type {
  PageDocument,
  PageSectionBlock,
  PageSectionType,
} from "@/types/content";
import {
  DEFAULT_HERO_CANVAS_CONFIG,
  normalizeHeroCanvasConfig,
  type HeroCanvasConfig,
} from "@/types/hero-canvas";
import { HeroGlobeStudioPanel } from "@/features/admin/page-builder/HeroGlobeStudioPanel";
import { PageSeoPanel } from "@/features/admin/page-builder/PageSeoPanel";

export const SECTION_CATALOG: {
  type: PageSectionType;
  label: string;
  description: string;
  coreOrder?: number;
}[] = [
  {
    type: "hero",
    label: "Hero + 3D Globe & Executive Header",
    description:
      "Signature 3D Quantum Sphere, Rising Horizon Globe, or Ambient Orbital Halo.",
    coreOrder: 1,
  },
  {
    type: "flagship_systems",
    label: "Stack Bar + Three Flagship Automation Systems",
    description:
      "Inline SVG stack strip paired with top 3 workflow tracks and service links.",
    coreOrder: 2,
  },
  {
    type: "interactive_demos_preview",
    label: "Interactive Lead Scorer & Workflow Lab",
    description: "Focused live interactive sandbox preview on the homepage.",
    coreOrder: 3,
  },
  {
    type: "case_studies_highlight",
    label: "Verified Blueprints & Founder Accountability",
    description:
      "Explicitly badged reference architectures / prototypes + Founder engineering note.",
    coreOrder: 4,
  },
  {
    type: "how_it_works",
    label: "Four-Phase Delivery & Scope Clarity",
    description:
      "Audit -> Guardrail Build -> Stress Test -> Handover + transparent starting scope.",
    coreOrder: 5,
  },
  {
    type: "cta_banner",
    label: "Executive Conversion Banner",
    description:
      "High-conviction conversion card with workflow review CTA and buyer FAQ link.",
    coreOrder: 6,
  },
  {
    type: "trust_strip",
    label: "Standalone Stack Logo Bar (Optional)",
    description: "6 crisp inline SVG integration wordmarks.",
  },
  {
    type: "problems_outcomes",
    label: "Outcomes + Before / After Compare (Optional)",
    description: "Operational bottlenecks paired with Before/After toggle.",
  },
  {
    type: "roi_framing",
    label: "Full Pricing Tier Grid (Optional)",
    description: "Expanded starting tiers wired to Admin Settings -> Pricing.",
  },
  {
    type: "faq_section",
    label: "Buyer FAQ Accordion (Optional)",
    description: "Top 5 plain-English buyer questions.",
  },
  {
    type: "services_overview",
    label: "5 Practice Pillars Matrix (Optional)",
    description: "Modular practice pillars capability grid.",
  },
  {
    type: "workflow_demo",
    label: "Pipeline Architecture Strip (Optional)",
    description: "Connected CRM, inbox, and webhook orchestration diagram.",
  },
  {
    type: "industry_use_cases",
    label: "Industry Playbook Cards (Optional)",
    description: "Sector-specific use cases.",
  },
  {
    type: "architecture_governance",
    label: "Human-in-the-Loop Governance (Optional)",
    description: "Approval gates, audit logs, and deterministic fallbacks.",
  },
  {
    type: "founder_intro",
    label: "Standalone Founder Section (Optional)",
    description: "Expanded founder biography block.",
  },
  {
    type: "insights_preview",
    label: "Latest Blog & Guides Grid (Optional)",
    description: "Recent published articles from /blog.",
  },
  {
    type: "testimonials",
    label: "Verified Partner Feedback (Optional)",
    description: "Authorized client quotes only.",
  },
  {
    type: "rich_text",
    label: "Custom Editorial Block (Markdown)",
    description: "Safe custom copy block rendered via sanitized Markdown.",
  },
];

export const CLEAN_HOME_9_SECTIONS: PageSectionBlock[] = [
  { id: "sec-hero", type: "hero", title: "Automate the work. Accelerate the business.", isVisible: true, order: 1, config: {} },
  { id: "sec-flagship", type: "flagship_systems", title: "Three Flagship Automation Services", isVisible: true, order: 2, config: {} },
  { id: "sec-demos-preview", type: "interactive_demos_preview", title: "Interactive Lead Scorer Preview", isVisible: true, order: 3, config: {} },
  { id: "sec-cases", type: "case_studies_highlight", title: "Workflow Blueprints & Founder Accountability", isVisible: true, order: 4, config: {} },
  { id: "sec-how", type: "how_it_works", title: "Four-Phase Delivery Process", isVisible: true, order: 5, config: {} },
  { id: "sec-cta", type: "cta_banner", title: "Start with one bottleneck. Leave with a clear, written automation plan.", isVisible: true, order: 6, config: {} },
];

const INNER_PAGE_SUPPORTED_TYPES: PageSectionType[] = [
  "hero",
  "rich_text",
  "cta_banner",
];

const PREVIEWABLE_SITE_ROUTES: {
  slug: string;
  label: string;
  path: string;
  defaultTitle: string;
  defaultSubtitle: string;
}[] = [
  {
    slug: "home",
    label: "Home Page (/)",
    path: "/",
    defaultTitle: "Home",
    defaultSubtitle:
      "AI workflows that answer every lead, update your CRM and alert your team.",
  },
  {
    slug: "services",
    label: "Services (/services)",
    path: "/services",
    defaultTitle: "Workflow & AI Systems Built Around Real Business Bottlenecks",
    defaultSubtitle:
      "Explore 8 core automation services engineered with human approval gates and 100% client ownership.",
  },
  {
    slug: "solutions",
    label: "Solutions (/solutions)",
    path: "/solutions",
    defaultTitle: "Practical Automation Playbooks by Industry",
    defaultSubtitle:
      "Tailored workflows for service businesses, consultancies, and agencies across the US, UK, and Canada.",
  },
  {
    slug: "case-studies",
    label: "Case Studies (/case-studies)",
    path: "/case-studies",
    defaultTitle: "Case Studies, Prototypes & Workflow Blueprints",
    defaultSubtitle:
      "Transparent operational breakdowns explicitly labeled to distinguish authorized client builds from internal prototypes.",
  },
  {
    slug: "pricing",
    label: "Pricing (/pricing)",
    path: "/pricing",
    defaultTitle: "Simple, Written Scope Before Any Build Starts",
    defaultSubtitle:
      "Fixed-scope automation packages with clear deliverables and zero vendor lock-in.",
  },
  {
    slug: "how-it-works",
    label: "How It Works (/how-it-works)",
    path: "/how-it-works",
    defaultTitle: "From Bottleneck Review to Live Workflow in Weeks",
    defaultSubtitle:
      "Our 4-phase engineering process for auditing, building, testing, and handing over dependable AI workflows.",
  },
  {
    slug: "demos",
    label: "Live Demos (/demos)",
    path: "/demos",
    defaultTitle: "Test Five Live Workflow Simulators in Your Browser",
    defaultSubtitle:
      "Experience lead scoring, grounded FAQ support, workflow orchestration, and ROI modeling hands-on.",
  },
  {
    slug: "blog",
    label: "Blog & Guides (/blog)",
    path: "/blog",
    defaultTitle: "Practical Implementation Guides & Operations Notes",
    defaultSubtitle:
      "Actionable articles on lead qualification, policy-grounded support, and deterministic guardrails.",
  },
  {
    slug: "about",
    label: "About (/about)",
    path: "/about",
    defaultTitle: "Practical Engineering for Businesses That Value Reliability",
    defaultSubtitle:
      "Founded by Ahmed Ansari to replace manual inbox chaos with dependable, human-approved business systems.",
  },
  {
    slug: "team",
    label: "Team (/team)",
    path: "/team",
    defaultTitle: "Founder-Led Engineering With Direct Accountability",
    defaultSubtitle:
      "Meet the leadership behind OmniFlow’s automation systems across the US, UK, and Canada.",
  },
  {
    slug: "faq",
    label: "FAQ (/faq)",
    path: "/faq",
    defaultTitle: "Straight Answers Before We Talk",
    defaultSubtitle:
      "Clear answers on data privacy, AI guardrails, ownership, timelines, and support.",
  },
  {
    slug: "contact",
    label: "Contact (/contact)",
    path: "/contact",
    defaultTitle: "Book a Free Workflow Review or Share Your Bottleneck",
    defaultSubtitle:
      "Tell us where slow follow-ups or manual copy-pasting cost your team hours.",
  },
];

function buildDefaultInnerPageSections(slug: string): PageSectionBlock[] {
  const meta = PREVIEWABLE_SITE_ROUTES.find((r) => r.slug === slug);
  const blocks: PageSectionBlock[] = [
    {
      id: `sec_${slug}_hero`,
      type: "hero",
      title: meta?.defaultTitle ?? slug,
      subtitle: meta?.defaultSubtitle ?? "",
      isVisible: true,
      order: 1,
      config: {},
    },
  ];
  if (slug !== "contact") {
    blocks.push({
      id: `sec_${slug}_cta`,
      type: "cta_banner",
      title: "Ready to Map Your First Workflow?",
      subtitle:
        "Book a free 25-minute review and receive a clear, written scope tailored to your stack.",
      isVisible: true,
      order: 2,
      config: {},
    });
  }
  return blocks;
}

type StudioViewport = "desktop" | "tablet" | "mobile";
type StudioLayoutMode = "split" | "canvas" | "inspector";
type SidebarTab = "sections" | "globe_studio" | "seo";

interface PageBuilderClientProps {
  initialPages: PageDocument[];
  canPublish: boolean;
  onEditGlobalElement?: (element: "header" | "footer") => void;
}

export function PageBuilderClient({
  initialPages,
  canPublish,
  onEditGlobalElement,
}: PageBuilderClientProps) {
  const [pages, setPages] = useState<PageDocument[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialPages[0]?.slug ?? "home"
  );

  const activePage = useMemo(
    () => pages.find((p) => p.slug === selectedSlug) ?? null,
    [pages, selectedSlug]
  );

  const [sections, setSections] = useState<PageSectionBlock[]>(
    activePage?.draftSections ??
      activePage?.sections ??
      buildDefaultInnerPageSections(selectedSlug)
  );
  const [pageTitle, setPageTitle] = useState(activePage?.title ?? "Home");
  const [seoTitle, setSeoTitle] = useState(activePage?.seo.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    activePage?.seo.seoDescription ?? ""
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    activePage?.seo.canonicalUrl ?? ""
  );
  const [ogTitle, setOgTitle] = useState(activePage?.seo.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(
    activePage?.seo.ogDescription ?? ""
  );
  const [ogImageUrl, setOgImageUrl] = useState(
    activePage?.seo.ogImageUrl ?? ""
  );
  const [noIndex, setNoIndex] = useState(Boolean(activePage?.seo.noIndex));
  const [scheduledFor, setScheduledFor] = useState(
    activePage?.scheduledFor ? activePage.scheduledFor.slice(0, 16) : ""
  );

  const [layoutMode, setLayoutMode] = useState<StudioLayoutMode>("split");
  const [viewport, setViewport] = useState<StudioViewport>("desktop");
  const [canvasTheme, setCanvasTheme] = useState<"dark" | "light">("dark");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );
  const [canvasPositionDragMode, setCanvasPositionDragMode] = useState(false);
  const [addSectionType, setAddSectionType] =
    useState<PageSectionType>("rich_text");
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const currentRouteMeta = useMemo(() => {
    return (
      PREVIEWABLE_SITE_ROUTES.find((r) => r.slug === selectedSlug) ?? {
        slug: selectedSlug,
        label: `/${selectedSlug}`,
        path: selectedSlug === "home" ? "/" : `/${selectedSlug}`,
        defaultTitle: activePage?.title ?? selectedSlug,
        defaultSubtitle: "",
      }
    );
  }, [selectedSlug, activePage?.title]);

  const availableCatalogForRoute = useMemo(() => {
    if (selectedSlug === "home") return SECTION_CATALOG;
    return SECTION_CATALOG.filter((c) =>
      INNER_PAGE_SUPPORTED_TYPES.includes(c.type)
    );
  }, [selectedSlug]);

  const selectPageOrRoute = (slug: string) => {
    setSelectedSlug(slug);
    const target = pages.find((p) => p.slug === slug);
    const routeMeta = PREVIEWABLE_SITE_ROUTES.find((r) => r.slug === slug);
    if (target) {
      const nextSecs = target.draftSections ?? target.sections;
      setSections(nextSecs);
      setSelectedSectionId(nextSecs[0]?.id ?? null);
      setPageTitle(target.title);
      setSeoTitle(target.seo.seoTitle ?? "");
      setSeoDescription(target.seo.seoDescription ?? "");
      setCanonicalUrl(target.seo.canonicalUrl ?? "");
      setOgTitle(target.seo.ogTitle ?? "");
      setOgDescription(target.seo.ogDescription ?? "");
      setOgImageUrl(target.seo.ogImageUrl ?? "");
      setNoIndex(Boolean(target.seo.noIndex));
      setScheduledFor(
        target.scheduledFor ? target.scheduledFor.slice(0, 16) : ""
      );
    } else {
      const realDefaults = buildDefaultInnerPageSections(slug);
      setSections(realDefaults);
      setSelectedSectionId(realDefaults[0]?.id ?? null);
      setPageTitle(routeMeta?.label.split(" (")[0] ?? slug);
      setSeoTitle("");
      setSeoDescription("");
      setCanonicalUrl("");
      setOgTitle("");
      setOgDescription("");
      setOgImageUrl("");
      setNoIndex(false);
      setScheduledFor("");
    }
    if (slug !== "home" && sidebarTab === "globe_studio") {
      setSidebarTab("sections");
    }
    setAddSectionType("rich_text");
    setCanvasReady(false);
    setIsDirty(false);
    setFeedback(null);
  };

  const postSyncToCanvas = useCallback(
    (scrollToSectionId?: string | null) => {
      const win = iframeRef.current?.contentWindow;
      if (!win || typeof window === "undefined") return;
      win.postMessage(
        {
          type: "OMNIFLOW_VE_SYNC",
          sections,
          selectedSectionId,
          scrollToSectionId: scrollToSectionId ?? null,
          canvasPositionDragMode,
          themeMode: canvasTheme,
        },
        window.location.origin
      );
    },
    [sections, selectedSectionId, canvasPositionDragMode, canvasTheme]
  );

  useEffect(() => {
    postSyncToCanvas();
  }, [postSyncToCanvas]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const payload = e.data as
        | {
            type?: string;
            sectionId?: string;
            offsetX?: number;
            offsetY?: number;
            element?: "header" | "footer";
          }
        | undefined;
      if (!payload?.type) return;

      if (payload.type === "OMNIFLOW_VE_READY") {
        setCanvasReady(true);
        postSyncToCanvas();
      } else if (
        payload.type === "OMNIFLOW_VE_SECTION_CLICKED" &&
        payload.sectionId
      ) {
        setSelectedSectionId(payload.sectionId);
        const clicked = sections.find((s) => s.id === payload.sectionId);
        if (clicked?.type === "hero" && selectedSlug === "home") {
          setSidebarTab("globe_studio");
        } else {
          setSidebarTab("sections");
        }
      } else if (
        payload.type === "OMNIFLOW_VE_GLOBAL_CLICKED" &&
        (payload.element === "header" || payload.element === "footer")
      ) {
        onEditGlobalElement?.(payload.element);
      } else if (
        payload.type === "OMNIFLOW_VE_GLOBE_DRAGGED" &&
        typeof payload.offsetX === "number" &&
        typeof payload.offsetY === "number"
      ) {
        setIsDirty(true);
        setSections((prev) =>
          prev.map((sec) => {
            if (sec.type !== "hero") return sec;
            const prevCanvas = normalizeHeroCanvasConfig(
              sec.config?.heroCanvas
            );
            return {
              ...sec,
              config: {
                ...sec.config,
                heroCanvas: {
                  ...prevCanvas,
                  globeOffsetX: payload.offsetX!,
                  globeOffsetY: payload.offsetY!,
                },
              },
            };
          })
        );
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postSyncToCanvas, sections, selectedSlug, onEditGlobalElement]);

  const heroSection = useMemo(
    () => sections.find((s) => s.type === "hero") ?? null,
    [sections]
  );

  const heroCanvasConfig: HeroCanvasConfig = useMemo(
    () => normalizeHeroCanvasConfig(heroSection?.config?.heroCanvas),
    [heroSection]
  );

  const updateHeroCanvas = (patch: Partial<HeroCanvasConfig>) => {
    setIsDirty(true);
    setSections((prev) => {
      const hasHero = prev.some((s) => s.type === "hero");
      if (!hasHero) {
        const createdHero: PageSectionBlock = {
          id: "sec-hero",
          type: "hero",
          title: "Automate the work. Accelerate the business.",
          isVisible: true,
          order: 1,
          config: {
            heroCanvas: normalizeHeroCanvasConfig({
              ...DEFAULT_HERO_CANVAS_CONFIG,
              ...patch,
            }),
          },
        };
        return [createdHero, ...prev].map((s, idx) => ({
          ...s,
          order: idx + 1,
        }));
      }

      return prev.map((sec) => {
        if (sec.type !== "hero") return sec;
        const current = normalizeHeroCanvasConfig(sec.config?.heroCanvas);
        return {
          ...sec,
          config: {
            ...sec.config,
            heroCanvas: normalizeHeroCanvasConfig({ ...current, ...patch }),
          },
        };
      });
    });
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= sections.length) {
      return;
    }
    const clone = [...sections];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    setSections(clone.map((s, idx) => ({ ...s, order: idx + 1 })));
    setSelectedSectionId(moved.id);
    setIsDirty(true);
  };

  const toggleVisibility = (index: number) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === index ? { ...sec, isVisible: !sec.isVisible } : sec
      )
    );
  };

  const updateSectionField = (
    index: number,
    patch: Partial<PageSectionBlock>
  ) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, ...patch } : sec))
    );
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setIsDirty(true);
    setSections((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  };

  const addNewSection = () => {
    const meta = SECTION_CATALOG.find((c) => c.type === addSectionType);
    const id = `sec_${Date.now().toString(36)}`;
    const newBlock: PageSectionBlock = {
      id,
      type: addSectionType,
      title: meta?.label ?? "Editorial Section",
      subtitle: "",
      isVisible: true,
      order: sections.length + 1,
      config:
        addSectionType === "rich_text"
          ? {
              markdown:
                "## Operational Clarity\n\nAdd structured guidance, scope details, or executive context here.",
              ctaLabel: "Book a Free Workflow Review",
              ctaHref: "/contact?intent=call",
            }
          : addSectionType === "hero" && selectedSlug === "home"
            ? { heroCanvas: { ...DEFAULT_HERO_CANVAS_CONFIG } }
            : {},
    };
    setIsDirty(true);
    setSections((prev) => [...prev, newBlock]);
    setSelectedSectionId(id);
    setShowAddDrawer(false);
  };

  const resetCleanHomeLayout = () => {
    const fresh = structuredClone(CLEAN_HOME_9_SECTIONS);
    setSections(fresh);
    setSelectedSectionId(fresh[0]?.id ?? null);
    setIsDirty(true);
    setFeedback({
      type: "success",
      message:
        "Restored streamlined 6-section Futuristic Homepage flow. Click 'Publish Live' to apply publicly.",
    });
  };

  const handleSave = async (publish: boolean) => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          id: activePage?.id,
          slug: selectedSlug,
          title: pageTitle,
          sections,
          publish,
          scheduledFor: scheduledFor
            ? new Date(scheduledFor).toISOString()
            : null,
          seo: {
            seoTitle,
            seoDescription,
            canonicalUrl,
            ogTitle,
            ogDescription,
            ogImageUrl,
            noIndex,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: json.error || "Failed to save page layout.",
        });
      } else {
        setPages((prev) => {
          const exists = prev.some((p) => p.slug === json.page.slug);
          return exists
            ? prev.map((p) => (p.slug === json.page.slug ? json.page : p))
            : [...prev, json.page];
        });
        setIsDirty(false);
        if (publish) {
          setIframeKey((k) => k + 1);
        }
        setFeedback({
          type: "success",
          message: publish
            ? scheduledFor
              ? `Scheduled "${json.page.title}" for publication.`
              : `Published "${json.page.title}" live (${json.page.sections.length} sections).`
            : `Draft saved for "${json.page.title}".`,
        });
      }
    } catch (err) {
      const timedOut =
        err instanceof DOMException && err.name === "AbortError";
      setFeedback({
        type: "error",
        message: timedOut
          ? "Save request timed out. Your unsaved edits remain intact — please retry."
          : "Network error while saving page. Your edits remain intact.",
      });
    } finally {
      clearTimeout(timer);
      setSaving(false);
    }
  };

  const viewportFrameClass =
    viewport === "mobile"
      ? "mx-auto w-[390px] max-w-full"
      : viewport === "tablet"
        ? "mx-auto w-[820px] max-w-full"
        : "w-full";

  const canvasSrc = `${currentRouteMeta.path}?ve=1`;

  return (
    <div className="space-y-4">
      {/* TOP STUDIO TOOLBAR */}
      <div className="rounded-2xl border border-line-subtle bg-surface-card p-3.5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface-elevated px-3 py-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                Page
              </span>
              <select
                aria-label="Select page to customize"
                value={selectedSlug}
                onChange={(e) => selectPageOrRoute(e.target.value)}
                className="bg-transparent text-xs font-semibold text-ink-heading focus:outline-none"
              >
                {PREVIEWABLE_SITE_ROUTES.map((route) => {
                  const hasDbDoc = pages.some((p) => p.slug === route.slug);
                  return (
                    <option key={route.slug} value={route.slug}>
                      {route.label} {hasDbDoc ? "● Customized" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                isDirty
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDirty ? "animate-pulse bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {isDirty ? "Live Preview Unsaved" : activePage?.status ?? "Live"}
            </span>

            {selectedSlug === "home" && (
              <button
                type="button"
                onClick={resetCleanHomeLayout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/15"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Default 6-Section Home
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-line-subtle bg-surface-elevated p-0.5">
              {(
                [
                  { id: "split", label: "Split Studio", icon: PanelLeft },
                  { id: "canvas", label: "Full Canvas", icon: Maximize2 },
                  { id: "inspector", label: "Inspector", icon: Layers },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLayoutMode(id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    layoutMode === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-ink-muted hover:text-ink-heading"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {layoutMode !== "inspector" && (
              <div
                className="inline-flex rounded-xl border border-line-subtle bg-surface-elevated p-0.5"
                role="group"
                aria-label="Canvas viewport size"
              >
                {(
                  [
                    { id: "desktop", label: "Desktop", icon: Monitor },
                    { id: "tablet", label: "Tablet", icon: Tablet },
                    { id: "mobile", label: "Mobile", icon: Smartphone },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => setViewport(id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                      viewport === id
                        ? "bg-surface-card text-ink-heading shadow-sm ring-1 ring-line-subtle"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {layoutMode !== "inspector" && (
              <button
                type="button"
                onClick={() =>
                  setCanvasTheme((t) => (t === "dark" ? "light" : "dark"))
                }
                title="Switch live canvas theme mode"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-subtle bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-body hover:text-ink-heading"
              >
                {canvasTheme === "dark" ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden xl:inline">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span className="hidden xl:inline">Light</span>
                  </>
                )}
              </button>
            )}

            {selectedSlug === "home" &&
              heroCanvasConfig.visualMode !== "orbital_halo" && (
                <button
                  type="button"
                  onClick={() => setCanvasPositionDragMode((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                    canvasPositionDragMode
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-line-subtle bg-surface-elevated text-ink-body hover:border-primary/40"
                  }`}
                >
                  <Move className="h-3.5 w-3.5" />
                  {canvasPositionDragMode ? "Dragging Globe…" : "Move Globe"}
                </button>
              )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface-elevated px-3.5 py-2 text-xs font-medium text-ink-heading transition hover:border-primary/40 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              Save Draft
            </button>

            {canPublish && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:bg-primary-hover disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {scheduledFor ? "Schedule" : "Publish Live"}
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-3 flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-xs ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {feedback.message}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SPLIT STUDIO WORKSPACE */}
      <div
        className={`grid gap-4 ${
          layoutMode === "split" ? "lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {layoutMode !== "canvas" && (
          <aside
            className={`flex flex-col rounded-2xl border border-line-subtle bg-surface-card shadow-card ${
              layoutMode === "split"
                ? "lg:col-span-5 lg:max-h-[82vh] xl:col-span-4"
                : ""
            }`}
          >
            <div className="grid grid-cols-3 gap-1 rounded-t-2xl border-b border-line-subtle bg-surface-elevated/60 p-2">
              <button
                type="button"
                onClick={() => setSidebarTab("sections")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  sidebarTab === "sections"
                    ? "bg-surface-card text-ink-heading shadow-sm ring-1 ring-line-subtle"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                Sections ({sections.length})
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("globe_studio")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  sidebarTab === "globe_studio"
                    ? "bg-surface-card text-ink-heading shadow-sm ring-1 ring-line-subtle"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                3D Globe Hero
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("seo")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  sidebarTab === "seo"
                    ? "bg-surface-card text-ink-heading shadow-sm ring-1 ring-line-subtle"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <Search className="h-3.5 w-3.5 text-primary" />
                Page SEO
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {sidebarTab === "sections" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-ink-muted">
                      {selectedSlug === "home"
                        ? "Drag rows to reorder live on the right canvas, or click any section to edit."
                        : "Customize this page’s live Header, Conversion Banner, or add Editorial Markdown blocks."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddDrawer((v) => !v)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/12 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Block
                    </button>
                  </div>

                  {showAddDrawer && (
                    <div className="space-y-2.5 rounded-xl border border-primary/30 bg-surface-elevated p-3">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-primary">
                        Insert Live Section Block
                      </label>
                      <select
                        aria-label="Section type to add"
                        value={addSectionType}
                        onChange={(e) =>
                          setAddSectionType(e.target.value as PageSectionType)
                        }
                        className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-2 text-xs text-ink-heading"
                      >
                        {availableCatalogForRoute.map((item) => (
                          <option key={item.type} value={item.type}>
                            {item.coreOrder
                              ? `[Core 0${item.coreOrder}] `
                              : ""}
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddDrawer(false)}
                          className="rounded-lg px-2.5 py-1 text-xs text-ink-muted hover:text-ink-heading"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addNewSection}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Insert Block
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {sections.map((section, idx) => {
                      const catalogMeta = SECTION_CATALOG.find(
                        (c) => c.type === section.type
                      );
                      const isExpanded = selectedSectionId === section.id;
                      const isDragTarget =
                        dragOverIdx === idx && draggedIdx !== idx;

                      const displayLabel =
                        selectedSlug !== "home" && section.type === "hero"
                          ? "Page Header (H1, Lead & CTA)"
                          : catalogMeta?.label ?? section.type;

                      return (
                        <div
                          key={section.id}
                          draggable={selectedSlug === "home"}
                          onDragStart={(e) => {
                            setDraggedIdx(idx);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", String(idx));
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverIdx !== idx) setDragOverIdx(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverIdx === idx) setDragOverIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from =
                              draggedIdx ??
                              Number.parseInt(
                                e.dataTransfer.getData("text/plain"),
                                10
                              );
                            if (!Number.isNaN(from)) {
                              reorderSections(from, idx);
                            }
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          onDragEnd={() => {
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          className={`rounded-xl border transition-all ${
                            isDragTarget
                              ? "border-primary ring-2 ring-primary/40"
                              : isExpanded
                                ? "border-primary/45 bg-surface-elevated"
                                : section.isVisible
                                  ? "border-line-subtle bg-surface-card hover:border-line-strong"
                                  : "border-line-subtle bg-surface-card/50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 px-2.5 py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                              {selectedSlug === "home" && (
                                <span
                                  title="Drag to reorder section"
                                  className="cursor-grab text-ink-muted hover:text-ink-heading active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const nextId = isExpanded ? null : section.id;
                                  setSelectedSectionId(nextId);
                                  if (nextId) postSyncToCanvas(nextId);
                                }}
                                className="flex min-w-0 items-center gap-1.5 text-left"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                                )}
                                <span className="font-mono text-[10px] font-semibold text-primary">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="truncate text-xs font-semibold text-ink-heading">
                                  {displayLabel}
                                </span>
                              </button>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              {section.type === "hero" &&
                                selectedSlug === "home" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSidebarTab("globe_studio")
                                    }
                                    className="rounded-md bg-primary/15 px-2 py-1 font-mono text-[10px] font-semibold text-primary hover:bg-primary/25"
                                  >
                                    3D Globe
                                  </button>
                                )}
                              {selectedSlug === "home" && (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Move section up"
                                    disabled={idx === 0}
                                    onClick={() =>
                                      reorderSections(idx, idx - 1)
                                    }
                                    className="rounded p-1 text-ink-muted hover:bg-surface-card hover:text-ink-heading disabled:opacity-30"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Move section down"
                                    disabled={idx === sections.length - 1}
                                    onClick={() =>
                                      reorderSections(idx, idx + 1)
                                    }
                                    className="rounded p-1 text-ink-muted hover:bg-surface-card hover:text-ink-heading disabled:opacity-30"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                aria-label="Toggle section visibility"
                                onClick={() => toggleVisibility(idx)}
                                className="rounded p-1 text-ink-muted hover:bg-surface-card hover:text-ink-heading"
                              >
                                {section.isVisible ? (
                                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label="Remove section"
                                disabled={sections.length <= 1}
                                onClick={() => removeSection(idx)}
                                className="rounded p-1 text-ink-muted hover:text-red-400 disabled:opacity-30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 border-t border-line-subtle px-3 py-3">
                              <div>
                                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                  Headline
                                </label>
                                <input
                                  value={section.title}
                                  onChange={(e) =>
                                    updateSectionField(idx, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading focus:border-primary/50 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                  Subheadline / Lead Copy
                                </label>
                                <textarea
                                  rows={2}
                                  value={section.subtitle ?? ""}
                                  onChange={(e) =>
                                    updateSectionField(idx, {
                                      subtitle: e.target.value,
                                    })
                                  }
                                  placeholder="Supporting description..."
                                  className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs text-ink-body focus:border-primary/50 focus:outline-none"
                                />
                              </div>

                              {(section.type === "hero" ||
                                section.type === "cta_banner" ||
                                section.type === "rich_text") && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                      CTA Label
                                    </label>
                                    <input
                                      value={
                                        (section.config?.ctaLabel as string) ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateSectionField(idx, {
                                          config: {
                                            ...section.config,
                                            ctaLabel: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="Book a free workflow review"
                                      className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                      CTA Link
                                    </label>
                                    <input
                                      value={
                                        (section.config?.ctaHref as string) ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateSectionField(idx, {
                                          config: {
                                            ...section.config,
                                            ctaHref: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="/contact?intent=call"
                                      className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs text-ink-heading"
                                    />
                                  </div>
                                </div>
                              )}

                              {section.type === "rich_text" && (
                                <div>
                                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                    Editorial Markdown
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={
                                      (section.config?.markdown as string) ?? ""
                                    }
                                    onChange={(e) =>
                                      updateSectionField(idx, {
                                        config: {
                                          ...section.config,
                                          markdown: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-2 font-mono text-xs text-ink-heading"
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
              )}

              {sidebarTab === "globe_studio" && (
                <HeroGlobeStudioPanel
                  selectedSlug={selectedSlug}
                  heroCanvasConfig={heroCanvasConfig}
                  canvasPositionDragMode={canvasPositionDragMode}
                  onToggleDragMode={() =>
                    setCanvasPositionDragMode((prev) => !prev)
                  }
                  onSwitchToHome={() => selectPageOrRoute("home")}
                  onUpdateHeroCanvas={updateHeroCanvas}
                />
              )}

              {sidebarTab === "seo" && (
                <PageSeoPanel
                  routePath={currentRouteMeta.path}
                  pageTitle={pageTitle}
                  seoTitle={seoTitle}
                  seoDescription={seoDescription}
                  canonicalUrl={canonicalUrl}
                  ogTitle={ogTitle}
                  ogImageUrl={ogImageUrl}
                  scheduledFor={scheduledFor}
                  noIndex={noIndex}
                  onChangePageTitle={(v) => {
                    setIsDirty(true);
                    setPageTitle(v);
                  }}
                  onChangeSeoTitle={(v) => {
                    setIsDirty(true);
                    setSeoTitle(v);
                  }}
                  onChangeSeoDescription={(v) => {
                    setIsDirty(true);
                    setSeoDescription(v);
                  }}
                  onChangeCanonicalUrl={(v) => {
                    setIsDirty(true);
                    setCanonicalUrl(v);
                  }}
                  onChangeOgTitle={(v) => {
                    setIsDirty(true);
                    setOgTitle(v);
                  }}
                  onChangeOgImageUrl={(v) => {
                    setIsDirty(true);
                    setOgImageUrl(v);
                  }}
                  onChangeScheduledFor={(v) => {
                    setIsDirty(true);
                    setScheduledFor(v);
                  }}
                  onChangeNoIndex={(v) => {
                    setIsDirty(true);
                    setNoIndex(v);
                  }}
                />
              )}
            </div>
          </aside>
        )}

        {/* RIGHT LIVE WEBSITE CANVAS */}
        {layoutMode !== "inspector" && (
          <section
            className={`flex flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface-card shadow-card ${
              layoutMode === "split" ? "lg:col-span-7 xl:col-span-8" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-surface-elevated px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-2 rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1 font-mono text-[11px] text-ink-body">
                  {currentRouteMeta.path}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    canvasReady
                      ? "bg-emerald-500/12 text-emerald-400"
                      : "bg-surface-card text-ink-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      canvasReady ? "bg-emerald-400" : "bg-ink-muted"
                    }`}
                  />
                  {canvasReady ? "Live Bridge Active" : "Syncing Canvas…"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCanvasReady(false);
                    setIframeKey((k) => k + 1);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink-heading"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reload
                </button>
                <a
                  href={currentRouteMeta.path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink-heading"
                >
                  Open Tab
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex-1 bg-[#07050E] p-2 sm:p-3">
              <div
                className={`${viewportFrameClass} overflow-hidden rounded-xl border border-white/10 bg-canvas shadow-elevated transition-all duration-300`}
              >
                <iframe
                  key={`${selectedSlug}-${iframeKey}`}
                  ref={iframeRef}
                  src={canvasSrc}
                  title={`Live Website Preview (${currentRouteMeta.path})`}
                  onLoad={() => {
                    setCanvasReady(true);
                    postSyncToCanvas();
                  }}
                  className="h-[74vh] min-h-[580px] w-full border-0 bg-canvas"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
