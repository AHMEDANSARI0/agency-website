"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
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
  Sparkles,
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
  HERO_CANVAS_PRESETS,
  normalizeHeroCanvasConfig,
  type GlobeParticleDensity,
  type HeroCanvasConfig,
  type HeroLayoutAlign,
  type HeroVisualMode,
} from "@/types/hero-canvas";

export const SECTION_CATALOG: {
  type: PageSectionType;
  label: string;
  description: string;
  coreOrder?: number;
}[] = [
  {
    type: "hero",
    label: "Hero + 3D Globe & Command Center",
    description:
      "Configurable Soale Orbital Halo, Quip 3D Quantum Particle Sphere, or BlueOrbit Rising Horizon Globe.",
    coreOrder: 1,
  },
  {
    type: "trust_strip",
    label: "Works With Your Stack",
    description: "6 crisp inline SVG integration wordmarks (HubSpot, Slack, Stripe, etc.).",
    coreOrder: 2,
  },
  {
    type: "problems_outcomes",
    label: "Plain-English Outcomes & Before/After Workflow",
    description:
      "Plain-English operational bottlenecks paired with interactive Before/After toggle.",
    coreOrder: 3,
  },
  {
    type: "flagship_systems",
    label: "Three Flagship Automation Services",
    description: "Top 3 workflow tracks with clear deliverables and direct service links.",
    coreOrder: 4,
  },
  {
    type: "interactive_demos_preview",
    label: "Interactive Lead Scorer Preview",
    description: "Step-by-step live sandbox preview on the homepage.",
    coreOrder: 5,
  },
  {
    type: "how_it_works",
    label: "Four-Phase Delivery Process",
    description: "Audit & Map -> Build & Guardrail -> Launch & Measure.",
    coreOrder: 6,
  },
  {
    type: "case_studies_highlight",
    label: "Workflow Blueprints & Founder Accountability",
    description: "Honest scenario-labeled example results + Founder reliability note.",
    coreOrder: 7,
  },
  {
    type: "roi_framing",
    label: "Transparent Pricing & Scopes",
    description:
      "Transparent starting tiers wired to Admin Settings -> Pricing Packages.",
    coreOrder: 8,
  },
  {
    type: "faq_section",
    label: "Frequently Asked Questions & Final Review CTA",
    description: "Top 5 plain-English buyer questions with conversion banner.",
    coreOrder: 9,
  },
  {
    type: "services_overview",
    label: "Full Services Overview Grid (Optional)",
    description: "Expanded services directory showcase.",
  },
  {
    type: "workflow_demo",
    label: "Pipeline Architecture Strip (Optional)",
    description: "Trigger -> AI Agent -> Policy Gate -> CRM Sync diagram.",
  },
  {
    type: "industry_use_cases",
    label: "Industry Playbook Tabs (Optional)",
    description: "Sector-specific use cases (also dedicated on /solutions).",
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
    label: "Partner Feedback Grid (Optional)",
    description: "Published client quotes or representative scenario notes.",
  },
  {
    type: "cta_banner",
    label: "Standalone Final Conversion Banner (Optional)",
    description: "Focused dark purple call-to-action card with workflow review link.",
  },
  {
    type: "rich_text",
    label: "Custom Editorial Block (Markdown)",
    description: "Safe custom copy block rendered via sanitized Markdown.",
  },
];

export const CLEAN_HOME_9_SECTIONS: PageSectionBlock[] = [
  { id: "sec-hero", type: "hero", title: "Automate the work. Accelerate the business.", isVisible: true, order: 1, config: {} },
  { id: "sec-trust", type: "trust_strip", title: "Works with your stack", isVisible: true, order: 2, config: {} },
  { id: "sec-problems", type: "problems_outcomes", title: "Plain-English Outcomes & Before/After Workflow", isVisible: true, order: 3, config: {} },
  { id: "sec-flagship", type: "flagship_systems", title: "Three Flagship Automation Services", isVisible: true, order: 4, config: {} },
  { id: "sec-demos-preview", type: "interactive_demos_preview", title: "Interactive Lead Scorer Preview", isVisible: true, order: 5, config: {} },
  { id: "sec-how", type: "how_it_works", title: "Four-Phase Delivery Process", isVisible: true, order: 6, config: {} },
  { id: "sec-cases", type: "case_studies_highlight", title: "Workflow Blueprints & Founder Accountability", isVisible: true, order: 7, config: {} },
  { id: "sec-roi", type: "roi_framing", title: "Transparent Pricing & Scopes", isVisible: true, order: 8, config: {} },
  { id: "sec-faq", type: "faq_section", title: "Frequently Asked Questions & Final Review CTA", isVisible: true, order: 9, config: {} },
];

const PREVIEWABLE_SITE_ROUTES: {
  slug: string;
  label: string;
  path: string;
  defaultTitle: string;
}[] = [
  { slug: "home", label: "Home Page (/)", path: "/", defaultTitle: "Home" },
  {
    slug: "services",
    label: "Services (/services)",
    path: "/services",
    defaultTitle: "Services",
  },
  {
    slug: "solutions",
    label: "Solutions (/solutions)",
    path: "/solutions",
    defaultTitle: "Solutions",
  },
  {
    slug: "pricing",
    label: "Pricing (/pricing)",
    path: "/pricing",
    defaultTitle: "Pricing",
  },
  {
    slug: "how-it-works",
    label: "How It Works (/how-it-works)",
    path: "/how-it-works",
    defaultTitle: "How It Works",
  },
  {
    slug: "case-studies",
    label: "Case Studies (/case-studies)",
    path: "/case-studies",
    defaultTitle: "Case Studies",
  },
  {
    slug: "demos",
    label: "Live Demos (/demos)",
    path: "/demos",
    defaultTitle: "Interactive Demos",
  },
  {
    slug: "work",
    label: "Work Portfolio (/work)",
    path: "/work",
    defaultTitle: "Work & Builds",
  },
  {
    slug: "blog",
    label: "Blog & Guides (/blog)",
    path: "/blog",
    defaultTitle: "Insights & Playbooks",
  },
  {
    slug: "about",
    label: "About (/about)",
    path: "/about",
    defaultTitle: "About OmniFlow",
  },
  {
    slug: "team",
    label: "Team (/team)",
    path: "/team",
    defaultTitle: "Team",
  },
  {
    slug: "faq",
    label: "FAQ (/faq)",
    path: "/faq",
    defaultTitle: "FAQ",
  },
  {
    slug: "contact",
    label: "Contact (/contact)",
    path: "/contact",
    defaultTitle: "Contact",
  },
];

type StudioViewport = "desktop" | "tablet" | "mobile";
type StudioLayoutMode = "split" | "canvas" | "inspector";
type SidebarTab = "sections" | "globe_studio" | "seo";

interface PageBuilderClientProps {
  initialPages: PageDocument[];
  canPublish: boolean;
}

export function PageBuilderClient({
  initialPages,
  canPublish,
}: PageBuilderClientProps) {
  const [pages, setPages] = useState<PageDocument[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialPages[0]?.slug ?? "home"
  );

  const activePage = useMemo(
    () => pages.find((p) => p.slug === selectedSlug) ?? pages[0],
    [pages, selectedSlug]
  );

  const [sections, setSections] = useState<PageSectionBlock[]>(
    activePage?.draftSections ?? activePage?.sections ?? []
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

  // Shopify OS 2.0 Studio state
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

  // HTML5 Drag-and-Drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Live Canvas Iframe Bridge state
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
      }
    );
  }, [selectedSlug, activePage?.title]);

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
      const placeholderBlock: PageSectionBlock = {
        id: `sec_${slug}_content`,
        type: "rich_text",
        title: routeMeta?.defaultTitle ?? slug,
        subtitle: `SEO & editorial governance record for /${slug}`,
        isVisible: true,
        order: 1,
        config: {},
      };
      setSections([placeholderBlock]);
      setSelectedSectionId(placeholderBlock.id);
      setPageTitle(routeMeta?.defaultTitle ?? slug);
      setSeoTitle("");
      setSeoDescription("");
      setCanonicalUrl("");
      setOgTitle("");
      setOgDescription("");
      setOgImageUrl("");
      setNoIndex(false);
      setScheduledFor("");
      if (slug !== "home") {
        setSidebarTab("seo");
      }
    }
    setCanvasReady(false);
    setIsDirty(false);
    setFeedback(null);
  };

  // Sync changes in real time into the Right-Side Live Canvas iframe
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

  // Listen for events coming FROM the Right-Side Live Canvas (ready, click-to-select, globe drag)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const payload = e.data as
        | { type?: string; sectionId?: string; offsetX?: number; offsetY?: number }
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
        if (clicked?.type === "hero") {
          setSidebarTab("globe_studio");
        } else {
          setSidebarTab("sections");
        }
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
  }, [postSyncToCanvas, sections]);

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
          id: "sec_hero",
          type: "hero",
          title: "Automate the work. Accelerate the business.",
          subtitle:
            "AI workflows that answer every lead, update your CRM and alert your team, with a person approving the important steps.",
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
            heroCanvas: normalizeHeroCanvasConfig({
              ...current,
              ...patch,
            }),
          },
        };
      });
    });
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= sections.length) return;
    const clone = [...sections];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    const next = clone.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(next);
    setSelectedSectionId(moved.id);
    setIsDirty(true);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    reorderSections(index, index + direction);
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

  const addNewSection = (typeOverride?: PageSectionType) => {
    const targetType = typeOverride ?? addSectionType;
    const meta = SECTION_CATALOG.find((c) => c.type === targetType);
    const id = `sec_${Date.now().toString(36)}`;
    const newBlock: PageSectionBlock = {
      id,
      type: targetType,
      title: meta?.label ?? "New Section",
      subtitle: "",
      isVisible: true,
      order: sections.length + 1,
      config:
        targetType === "rich_text"
          ? {
              markdown:
                "## Operational Clarity\n\nAdd structured guidance, scope details, or executive context here.",
              ctaLabel: "Book a Free Workflow Review",
              ctaHref: "/contact?intent=call",
            }
          : targetType === "hero"
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
        "Restored clean 9-section Soale homepage flow in editor. Click 'Publish Live' to apply publicly.",
    });
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        // Refresh the live iframe after publish so server-rendered changes commit cleanly
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
    } catch {
      setFeedback({
        type: "error",
        message: "Network error while saving page.",
      });
    } finally {
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
      {/* =====================================================================
          SHOPIFY OS 2.0 TOP STUDIO BAR
         ===================================================================== */}
      <div className="rounded-2xl border border-line-subtle bg-surface-card p-3.5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Route Picker + Live Status */}
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
                      {route.label} {hasDbDoc ? "● CMS" : ""}
                    </option>
                  );
                })}
                {pages
                  .filter(
                    (p) =>
                      !PREVIEWABLE_SITE_ROUTES.some((r) => r.slug === p.slug)
                  )
                  .map((customPage) => (
                    <option key={customPage.slug} value={customPage.slug}>
                      {customPage.title} (/{customPage.slug}) ● CMS
                    </option>
                  ))}
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
                  isDirty ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {isDirty
                ? "Live Preview Unsaved"
                : activePage?.status ?? "Published"}
            </span>

            {selectedSlug === "home" && (
              <button
                type="button"
                onClick={resetCleanHomeLayout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/15"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Default 9-Section Home
              </button>
            )}
          </div>

          {/* Center: Workspace Mode + Device Viewport + Theme + Globe Drag */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Workspace Layout Mode */}
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

            {/* Responsive Viewport Switcher */}
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

            {/* Dark / Light Preview Switch */}
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

            {/* Direct On-Canvas 3D Globe Drag Toggle */}
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

          {/* Right: Save Draft & Publish Live */}
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

      {/* =====================================================================
          SHOPIFY SPLIT WORKSPACE: LEFT SIDEBAR + RIGHT LIVE WEBSITE CANVAS
         ===================================================================== */}
      <div
        className={`grid gap-4 ${
          layoutMode === "split"
            ? "lg:grid-cols-12"
            : "grid-cols-1"
        }`}
      >
        {/* -------------------------------------------------------------------
            LEFT PANEL: SECTION DRAG-AND-DROP TREE + 3D GLOBE STUDIO + PAGE SEO
           ------------------------------------------------------------------- */}
        {layoutMode !== "canvas" && (
          <aside
            className={`flex flex-col rounded-2xl border border-line-subtle bg-surface-card shadow-card ${
              layoutMode === "split"
                ? "lg:col-span-5 xl:col-span-4 lg:max-h-[82vh]"
                : ""
            }`}
          >
            {/* Studio Sub-Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 border-b border-line-subtle bg-surface-elevated/60 p-2 rounded-t-2xl">
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

            {/* Scrollable Studio Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* =================== TAB 1: DRAG & DROP SECTIONS =================== */}
              {sidebarTab === "sections" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-ink-muted">
                      Drag rows by the grip handle to reorder live on the right
                      canvas, or click any row to inspect & edit.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddDrawer((v) => !v)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/12 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Section
                    </button>
                  </div>

                  {/* Add Section Catalog Drawer */}
                  {showAddDrawer && (
                    <div className="rounded-xl border border-primary/30 bg-surface-elevated p-3 space-y-2.5">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-primary">
                        Insert Approved Design-System Section
                      </label>
                      <select
                        aria-label="Section type to add"
                        value={addSectionType}
                        onChange={(e) =>
                          setAddSectionType(e.target.value as PageSectionType)
                        }
                        className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-2 text-xs text-ink-heading"
                      >
                        {SECTION_CATALOG.map((item) => (
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
                          onClick={() => addNewSection()}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Insert Block
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Draggable Section Tree */}
                  <div className="space-y-2">
                    {sections.map((section, idx) => {
                      const catalogMeta = SECTION_CATALOG.find(
                        (c) => c.type === section.type
                      );
                      const isExpanded = selectedSectionId === section.id;
                      const isDragTarget =
                        dragOverIdx === idx && draggedIdx !== idx;

                      return (
                        <div
                          key={section.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedIdx(idx);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", String(idx));
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
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
                          {/* Compact Shopify Tree Header Row */}
                          <div className="flex items-center justify-between gap-2 px-2.5 py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                title="Drag to reorder section"
                                className="cursor-grab text-ink-muted hover:text-ink-heading active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4" />
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextId = isExpanded ? null : section.id;
                                  setSelectedSectionId(nextId);
                                  if (nextId) {
                                    postSyncToCanvas(nextId);
                                  }
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
                                  {catalogMeta?.label ?? section.type}
                                </span>
                              </button>
                            </div>

                            {/* Quick Row Controls */}
                            <div className="flex shrink-0 items-center gap-1">
                              {section.type === "hero" && (
                                <button
                                  type="button"
                                  onClick={() => setSidebarTab("globe_studio")}
                                  title="Open 3D Globe Studio"
                                  className="rounded-md bg-primary/15 px-2 py-1 font-mono text-[10px] font-semibold text-primary hover:bg-primary/25"
                                >
                                  3D Globe
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label="Move section up"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, -1)}
                                className="rounded p-1 text-ink-muted hover:bg-surface-card hover:text-ink-heading disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Move section down"
                                disabled={idx === sections.length - 1}
                                onClick={() => moveSection(idx, 1)}
                                className="rounded p-1 text-ink-muted hover:bg-surface-card hover:text-ink-heading disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
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

                          {/* Expanded Inline Inspector */}
                          {isExpanded && (
                            <div className="space-y-3 border-t border-line-subtle px-3 py-3">
                              {catalogMeta?.description && (
                                <p className="text-[11px] leading-relaxed text-ink-muted">
                                  {catalogMeta.description}
                                </p>
                              )}

                              <div>
                                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                                  Section Headline
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
                                  placeholder="Optional supporting copy..."
                                  className="w-full rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs text-ink-body focus:border-primary/50 focus:outline-none"
                                />
                              </div>

                              {(section.type === "hero" ||
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

              {/* =================== TAB 2: 3D GLOBE & HERO CANVAS STUDIO =================== */}
              {sidebarTab === "globe_studio" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/25 bg-primary/8 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Sparkles className="h-4 w-4" />
                      Interactive 3D Globe & Hero Canvas Studio
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                      Switch between the Soale Orbital Halo, the Quip 3D Quantum
                      Particle/Ring Sphere, or the BlueOrbit Rising Horizon 3D
                      Globe. Every slider updates the right-side website canvas
                      in real time.
                    </p>
                  </div>

                  {selectedSlug !== "home" && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                      The Interactive 3D Globe Hero renders on{" "}
                      <strong>Home (/)</strong>.{" "}
                      <button
                        type="button"
                        onClick={() => selectPageOrRoute("home")}
                        className="font-semibold underline"
                      >
                        Switch to Home Page
                      </button>{" "}
                      to preview live.
                    </div>
                  )}

                  {/* 4 One-Click Visual Presets */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      1. Choose Hero 3D Module Preset
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {HERO_CANVAS_PRESETS.map((preset) => {
                        const isSelected =
                          heroCanvasConfig.visualMode ===
                          preset.config.visualMode;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => updateHeroCanvas(preset.config)}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                                : "border-line-subtle bg-surface-elevated hover:border-line-strong"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-ink-heading">
                                  {preset.name}
                                </span>
                                <span className="rounded-full border border-line-subtle bg-surface-card px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                                  {preset.badge}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                                {preset.description}
                              </p>
                            </div>
                            <span
                              className="mt-1 h-4 w-4 shrink-0 rounded-full border border-white/20 shadow-inner"
                              style={{
                                background: `linear-gradient(135deg, ${preset.config.primaryGlowColor}, ${preset.config.secondaryGlowColor})`,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hero Layout Alignment */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      2. Hero Copy & Globe Composition
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            id: "centered" as HeroLayoutAlign,
                            label: "Centered Horizon",
                            sub: "Headline centered over backdrop",
                          },
                          {
                            id: "split_left" as HeroLayoutAlign,
                            label: "Split Left + Right Globe",
                            sub: "Copy left · 3D Sphere right",
                          },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updateHeroCanvas({ layoutAlign: opt.id })
                          }
                          className={`rounded-xl border p-2.5 text-left transition ${
                            heroCanvasConfig.layoutAlign === opt.id
                              ? "border-primary bg-primary/10 text-ink-heading"
                              : "border-line-subtle bg-surface-elevated text-ink-muted hover:text-ink-heading"
                          }`}
                        >
                          <div className="text-xs font-semibold">
                            {opt.label}
                          </div>
                          <div className="mt-0.5 text-[10px] opacity-80">
                            {opt.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Mode Fine Selector */}
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      Active Render Engine
                    </label>
                    <select
                      aria-label="Hero visual render engine"
                      value={heroCanvasConfig.visualMode}
                      onChange={(e) =>
                        updateHeroCanvas({
                          visualMode: e.target.value as HeroVisualMode,
                        })
                      }
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs font-medium text-ink-heading"
                    >
                      <option value="orbital_halo">
                        Soale Orbital Halo (SVG Ambient)
                      </option>
                      <option value="quantum_sphere">
                        Quip 3D Quantum Particle + Ring Sphere (HTML5 3D Canvas)
                      </option>
                      <option value="horizon_arc">
                        BlueOrbit Rising Horizon 3D Globe (HTML5 3D Canvas)
                      </option>
                      <option value="halo_plus_globe">
                        Hybrid: Orbital Halo + 3D Quantum Sphere
                      </option>
                    </select>
                  </div>

                  {/* Direct Canvas Drag Positioning + Sliders */}
                  <div className="rounded-xl border border-line-subtle bg-surface-elevated p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        3. 3D Transform & Canvas Position
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCanvasPositionDragMode((prev) => !prev)
                          }
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                            canvasPositionDragMode
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface-card text-primary border border-primary/30"
                          }`}
                        >
                          <Move className="h-3 w-3" />
                          {canvasPositionDragMode
                            ? "Done Dragging"
                            : "Drag on Canvas"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateHeroCanvas({
                              globeScale: 1,
                              globeOffsetX: 0,
                              globeOffsetY: 0,
                            })
                          }
                          className="rounded-lg px-2 py-1 text-[10px] text-ink-muted hover:text-ink-heading"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Scale */}
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-ink-body">Globe Scale</span>
                        <span className="font-mono text-primary">
                          {heroCanvasConfig.globeScale.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.65}
                        max={1.65}
                        step={0.05}
                        value={heroCanvasConfig.globeScale}
                        onChange={(e) =>
                          updateHeroCanvas({
                            globeScale: Number.parseFloat(e.target.value),
                          })
                        }
                        className="mt-1 w-full accent-primary"
                      />
                    </div>

                    {/* Offset X & Y */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-ink-body">Offset X</span>
                          <span className="font-mono text-ink-muted">
                            {heroCanvasConfig.globeOffsetX}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-240}
                          max={240}
                          step={4}
                          value={heroCanvasConfig.globeOffsetX}
                          onChange={(e) =>
                            updateHeroCanvas({
                              globeOffsetX: Number.parseInt(e.target.value, 10),
                            })
                          }
                          className="mt-1 w-full accent-primary"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-ink-body">Offset Y</span>
                          <span className="font-mono text-ink-muted">
                            {heroCanvasConfig.globeOffsetY}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-160}
                          max={160}
                          step={4}
                          value={heroCanvasConfig.globeOffsetY}
                          onChange={(e) =>
                            updateHeroCanvas({
                              globeOffsetY: Number.parseInt(e.target.value, 10),
                            })
                          }
                          className="mt-1 w-full accent-primary"
                        />
                      </div>
                    </div>

                    {/* Rotation Speed & Particle Density */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-ink-body">Spin Speed</span>
                          <span className="font-mono text-ink-muted">
                            {heroCanvasConfig.rotationSpeed.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={3}
                          step={0.1}
                          value={heroCanvasConfig.rotationSpeed}
                          onChange={(e) =>
                            updateHeroCanvas({
                              rotationSpeed: Number.parseFloat(e.target.value),
                            })
                          }
                          className="mt-1 w-full accent-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-ink-body">
                          Dot Density
                        </label>
                        <select
                          aria-label="Globe dot density"
                          value={heroCanvasConfig.particleDensity}
                          onChange={(e) =>
                            updateHeroCanvas({
                              particleDensity: e.target
                                .value as GlobeParticleDensity,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-card px-2 py-1 text-xs text-ink-heading"
                        >
                          <option value="minimal">Minimal (Fast)</option>
                          <option value="balanced">Balanced</option>
                          <option value="dense">Ultra Dense (HD)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Glow Palette & Atmospheric Toggles */}
                  <div className="rounded-xl border border-line-subtle bg-surface-elevated p-3 space-y-3">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      4. Atmosphere, Rim Glow & Interactive Layers
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs">
                        <span className="text-ink-body">Rim Glow</span>
                        <input
                          type="color"
                          value={heroCanvasConfig.primaryGlowColor}
                          onChange={(e) =>
                            updateHeroCanvas({
                              primaryGlowColor: e.target.value,
                            })
                          }
                          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-2.5 py-1.5 text-xs">
                        <span className="text-ink-body">Node Glow</span>
                        <input
                          type="color"
                          value={heroCanvasConfig.secondaryGlowColor}
                          onChange={(e) =>
                            updateHeroCanvas({
                              secondaryGlowColor: e.target.value,
                            })
                          }
                          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                        />
                      </label>
                    </div>

                    <div className="space-y-2 pt-1">
                      {(
                        [
                          {
                            key: "showOrbitalRing" as const,
                            label: "Tilted Dotted Orbital Ring",
                          },
                          {
                            key: "showSignalArcs" as const,
                            label: "Animated Global Trajectory Arcs",
                          },
                          {
                            key: "interactiveDrag" as const,
                            label: "Allow Visitors to Spin Globe with Mouse",
                          },
                          {
                            key: "showCommandCenter" as const,
                            label: "Show Workflow Command Center Preview Below",
                          },
                        ] as const
                      ).map((item) => (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-line-subtle bg-surface-card px-3 py-2 text-xs text-ink-body"
                        >
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={heroCanvasConfig[item.key]}
                            onChange={(e) =>
                              updateHeroCanvas({
                                [item.key]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded accent-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* =================== TAB 3: PAGE SEO & METADATA =================== */}
              {sidebarTab === "seo" && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-ink-heading">
                        Metadata Override for {currentRouteMeta.path}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Saved overrides apply dynamically via generateMetadata().
                      </p>
                    </div>
                    <Link
                      href="/admin/seo-inspector"
                      className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
                    >
                      Full SEO Audit
                    </Link>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      Internal Page Label
                    </label>
                    <input
                      value={pageTitle}
                      onChange={(e) => {
                        setIsDirty(true);
                        setPageTitle(e.target.value);
                      }}
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      <span>SEO Title Tag</span>
                      <span
                        className={
                          seoTitle.length > 60
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        {seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      value={seoTitle}
                      onChange={(e) => {
                        setIsDirty(true);
                        setSeoTitle(e.target.value);
                      }}
                      placeholder="Custom <title> override (recommended 30–60 chars)"
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      <span>Meta Description</span>
                      <span
                        className={
                          seoDescription.length > 160
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        {seoDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => {
                        setIsDirty(true);
                        setSeoDescription(e.target.value);
                      }}
                      placeholder="Compelling SERP summary (recommended 110–160 chars)..."
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-body"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      Canonical URL Override (Optional)
                    </label>
                    <input
                      value={canonicalUrl}
                      onChange={(e) => {
                        setIsDirty(true);
                        setCanonicalUrl(e.target.value);
                      }}
                      placeholder={currentRouteMeta.path}
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        Open Graph Title
                      </label>
                      <input
                        value={ogTitle}
                        onChange={(e) => {
                          setIsDirty(true);
                          setOgTitle(e.target.value);
                        }}
                        placeholder="Defaults to SEO Title"
                        className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        OG Share Image URL
                      </label>
                      <input
                        value={ogImageUrl}
                        onChange={(e) => {
                          setIsDirty(true);
                          setOgImageUrl(e.target.value);
                        }}
                        placeholder="/opengraph-image"
                        className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 font-mono text-xs text-ink-heading"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      Schedule Publication (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => {
                        setIsDirty(true);
                        setScheduledFor(e.target.value);
                      }}
                      className="w-full rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2 text-xs text-ink-heading"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line-subtle bg-surface-elevated px-3 py-2.5 text-xs text-ink-body">
                    <span>
                      Exclude from Google &amp; Sitemap (
                      <code>noindex, nofollow</code>)
                    </span>
                    <input
                      type="checkbox"
                      checked={noIndex}
                      onChange={(e) => {
                        setIsDirty(true);
                        setNoIndex(e.target.checked);
                      }}
                      className="h-4 w-4 rounded accent-primary"
                    />
                  </label>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* -------------------------------------------------------------------
            RIGHT PANEL: LIVE INTERACTIVE WEBSITE PREVIEW CANVAS
           ------------------------------------------------------------------- */}
        {layoutMode !== "inspector" && (
          <section
            className={`flex flex-col rounded-2xl border border-line-subtle bg-surface-card shadow-card overflow-hidden ${
              layoutMode === "split" ? "lg:col-span-7 xl:col-span-8" : ""
            }`}
          >
            {/* Browser Chrome Bar */}
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
                  title="Reload live preview canvas"
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

            {/* Responsive Viewport Stage */}
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
