"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  Filter,
  FolderKanban,
  Layers,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/features/themes/ThemeToggle";

interface NavbarProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

type MegaPanelId = "services" | "solutions" | "proof" | null;

const FLAGSHIP_SYSTEMS = [
  {
    title: "Lead Management & Qualification",
    href: "/services/lead-management",
    badge: "Priority 01",
    summary: "Instant multi-channel capture, deterministic scoring, CRM sync, and owner briefs.",
    icon: Filter,
  },
  {
    title: "Policy-Grounded AI Support",
    href: "/services/ai-customer-support",
    badge: "Priority 02",
    summary: "24/7 answers strictly bounded to approved policies with human escalation.",
    icon: MessageSquareText,
  },
  {
    title: "End-to-End Workflow Automation",
    href: "/services/workflow-automation",
    badge: "Priority 03",
    summary: "Eliminate manual copy-paste across forms, CRM, billing, and client onboarding.",
    icon: Workflow,
  },
];

const PRACTICE_PILLARS = [
  {
    title: "AI Sales & Lead Intelligence",
    href: "/services/ai-sales-intelligence",
    note: "Pipeline enrichment & pre-call context",
  },
  {
    title: "AI Customer Experience",
    href: "/services/ai-customer-experience",
    note: "Structured intake & proactive updates",
  },
  {
    title: "AI Workflow & Operations",
    href: "/services/ai-operations",
    note: "Cross-tool orchestration & SLA alerts",
  },
  {
    title: "AI Data & Analytics",
    href: "/services/ai-analytics",
    note: "Executive KPI visibility & attribution",
  },
  {
    title: "Custom AI Systems",
    href: "/services/custom-ai-systems",
    note: "Tailored internal tools & guardrailed agents",
  },
];

const SOLUTIONS_PROFILES = [
  {
    title: "Service Businesses",
    href: "/solutions#service-businesses",
    summary: "Respond to enquiries faster, qualify job scope, and automate scheduling handoffs.",
    icon: Briefcase,
  },
  {
    title: "Consultants & Advisory Firms",
    href: "/solutions#consultants",
    summary: "Reclaim billable hours with automated discovery triage and client onboarding.",
    icon: Users,
  },
  {
    title: "Boutique Agencies",
    href: "/solutions#agencies",
    summary: "Standardize client intake, kickoff provisioning, and recurring status reporting.",
    icon: Layers,
  },
];

const LIVE_DEMOS = [
  {
    title: "01 · Lead Qualification Scorer",
    href: "/demos?tab=lead-qualification",
    icon: Filter,
  },
  {
    title: "02 · Policy-Grounded Support Triage",
    href: "/demos?tab=support-generator",
    icon: MessageSquareText,
  },
  {
    title: "03 · Workflow Execution Simulator",
    href: "/demos?tab=workflow-builder",
    icon: Workflow,
  },
  {
    title: "04 · Multi-Currency Savings Calculator",
    href: "/demos?tab=savings-calculator",
    icon: Calculator,
  },
  {
    title: "05 · Automation Readiness Assessment",
    href: "/demos?tab=readiness-assessment",
    icon: ClipboardCheck,
  },
];

const PROOF_ITEMS = [
  {
    title: "Case Studies & Blueprints",
    href: "/case-studies",
    summary: "Detailed Problem → Architecture → Outcome engineering breakdowns.",
    icon: FolderKanban,
  },
  {
    title: "Work & Reference Portfolio",
    href: "/work",
    summary: "Transparently badged verified client engagements and system prototypes.",
    icon: ShieldCheck,
  },
  {
    title: "Engineering Insights & Guides",
    href: "/blog",
    summary: "Practical articles on deterministic workflows, CRM reliability, and AI guardrails.",
    icon: BookOpen,
  },
  {
    title: "Leadership & Delivery Team",
    href: "/team",
    summary: "Principal-led architecture by Ahmed Ansari across US, UK, and Canadian hours.",
    icon: Cpu,
  },
];

const BUILTIN_COVERED_HREFS = new Set([
  "/",
  "/services",
  "/solutions",
  "/demos",
  "/how-it-works",
  "/work",
  "/case-studies",
  "/blog",
  "/about",
  "/team",
  "/faq",
  "/contact",
]);

export function Navbar({ brand, settings }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<MegaPanelId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>("services");

  const navRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Record<Exclude<MegaPanelId, null>, HTMLButtonElement | null>>({
    services: null,
    solutions: null,
    proof: null,
  });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleCloseMega = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMega(null);
    }, 130);
  }, [clearCloseTimer]);

  const activateMega = useCallback(
    (panel: Exclude<MegaPanelId, null>) => {
      clearCloseTimer();
      setOpenMega(panel);
    },
    [clearCloseTimer]
  );

  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMega(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (openMega) {
          const trigger = triggerRefs.current[openMega];
          setOpenMega(null);
          trigger?.focus();
        }
        if (mobileOpen) {
          setMobileOpen(false);
        }
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openMega, mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    panel: Exclude<MegaPanelId, null>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpenMega(panel);
      requestAnimationFrame(() => {
        const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>("a[href]");
        firstLink?.focus();
      });
    }
  };

  const extraCustomNav = settings.navigation
    .filter((item) => item.isVisible && !BUILTIN_COVERED_HREFS.has(item.href))
    .sort((a, b) => a.order - b.order);

  const isServicesActive = pathname === "/services" || pathname.startsWith("/services/");
  const isSolutionsActive =
    pathname === "/solutions" ||
    pathname.startsWith("/solutions/") ||
    pathname === "/demos" ||
    pathname.startsWith("/demos/");
  const isProofActive =
    pathname === "/case-studies" ||
    pathname.startsWith("/case-studies/") ||
    pathname === "/work" ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/team";

  const navItemClass = (active: boolean) =>
    `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.86rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] ${
      active
        ? "bg-accent-subtle text-primary font-semibold"
        : "text-ink-body hover:bg-surface-muted hover:text-ink-heading"
    }`;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-3.5">
      <nav
        ref={navRef}
        aria-label="Primary navigation"
        onMouseLeave={scheduleCloseMega}
        className={`pointer-events-auto relative flex w-full max-w-7xl items-center justify-between rounded-2xl border border-[var(--of-border-navbar)] bg-[var(--of-surface-navbar)] text-ink-navbar backdrop-blur-xl transition-all duration-300 ease-[var(--of-ease-balance)] ${
          scrolled
            ? "px-4 py-2 shadow-elevated sm:px-5"
            : "px-4 py-2.5 shadow-card sm:px-6"
        }`}
      >
        <BrandMark brand={brand} tone="auto" />

        {/* Desktop Mega-Menu & Direct Navigation */}
        <ul className="hidden items-center gap-0.5 xl:flex">
          {/* 1. Services Mega-Menu */}
          <li onMouseEnter={() => activateMega("services")}>
            <button
              ref={(el) => {
                triggerRefs.current.services = el;
              }}
              type="button"
              aria-expanded={openMega === "services"}
              aria-haspopup="true"
              aria-controls="mega-panel-services"
              onClick={() =>
                setOpenMega((prev) => (prev === "services" ? null : "services"))
              }
              onKeyDown={(e) => handleTriggerKeyDown(e, "services")}
              className={navItemClass(isServicesActive || openMega === "services")}
            >
              <span>Services</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openMega === "services" ? "rotate-180 text-primary" : "text-ink-muted"
                }`}
              />
            </button>
          </li>

          {/* 2. Solutions & Interactive Lab Mega-Menu */}
          <li onMouseEnter={() => activateMega("solutions")}>
            <button
              ref={(el) => {
                triggerRefs.current.solutions = el;
              }}
              type="button"
              aria-expanded={openMega === "solutions"}
              aria-haspopup="true"
              aria-controls="mega-panel-solutions"
              onClick={() =>
                setOpenMega((prev) => (prev === "solutions" ? null : "solutions"))
              }
              onKeyDown={(e) => handleTriggerKeyDown(e, "solutions")}
              className={navItemClass(isSolutionsActive || openMega === "solutions")}
            >
              <span>Solutions &amp; Lab</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openMega === "solutions" ? "rotate-180 text-primary" : "text-ink-muted"
                }`}
              />
            </button>
          </li>

          {/* 3. How It Works */}
          <li onMouseEnter={() => setOpenMega(null)}>
            <Link
              href="/how-it-works"
              aria-current={pathname === "/how-it-works" ? "page" : undefined}
              className={navItemClass(pathname === "/how-it-works")}
            >
              How It Works
            </Link>
          </li>

          {/* 4. Work, Proof & Insights Mega-Menu */}
          <li onMouseEnter={() => activateMega("proof")}>
            <button
              ref={(el) => {
                triggerRefs.current.proof = el;
              }}
              type="button"
              aria-expanded={openMega === "proof"}
              aria-haspopup="true"
              aria-controls="mega-panel-proof"
              onClick={() =>
                setOpenMega((prev) => (prev === "proof" ? null : "proof"))
              }
              onKeyDown={(e) => handleTriggerKeyDown(e, "proof")}
              className={navItemClass(isProofActive || openMega === "proof")}
            >
              <span>Work &amp; Insights</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openMega === "proof" ? "rotate-180 text-primary" : "text-ink-muted"
                }`}
              />
            </button>
          </li>

          {/* 5. Interactive Demos direct pill */}
          <li onMouseEnter={() => setOpenMega(null)}>
            <Link
              href="/demos"
              aria-current={pathname === "/demos" ? "page" : undefined}
              className={navItemClass(pathname === "/demos")}
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              <span>Live Demos</span>
            </Link>
          </li>

          {/* 6. About & FAQ */}
          <li onMouseEnter={() => setOpenMega(null)}>
            <Link
              href="/about"
              aria-current={pathname === "/about" ? "page" : undefined}
              className={navItemClass(pathname === "/about")}
            >
              About
            </Link>
          </li>

          <li onMouseEnter={() => setOpenMega(null)}>
            <Link
              href="/faq"
              aria-current={pathname === "/faq" ? "page" : undefined}
              className={navItemClass(pathname === "/faq")}
            >
              FAQ
            </Link>
          </li>

          {extraCustomNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.id} onMouseEnter={() => setOpenMega(null)}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={navItemClass(active)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right Controls: Theme Toggle + Primary CTA + Mobile Trigger */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href={settings.primaryCtaHref}
            className="hidden items-center gap-2 whitespace-nowrap rounded-control bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-4 py-2 text-[0.84rem] font-semibold text-primary-foreground shadow-glow transition-all hover:bg-primary-hover active:bg-primary-active sm:inline-flex"
          >
            <span>{settings.primaryCtaLabel}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="omniflow-mobile-menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded-control border border-line bg-surface-muted text-ink-heading transition-colors hover:border-line-strong xl:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "top-1.5 -rotate-45" : "top-2.5"
                }`}
              />
            </span>
          </button>
        </div>

        {/* Desktop Mega-Menu Panels */}
        {openMega && (
          <div
            ref={panelRef}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleCloseMega}
            className="absolute inset-x-0 top-[calc(100%+10px)] hidden rounded-2xl border border-line bg-surface p-6 shadow-elevated xl:block"
          >
            {openMega === "services" && (
              <div
                id="mega-panel-services"
                role="region"
                aria-label="Services and AI capabilities"
                className="grid grid-cols-12 gap-6"
              >
                <div className="col-span-7 border-r border-line pr-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                      Priority Flagship Systems
                    </p>
                    <span className="text-xs text-ink-muted">
                      Highest operational ROI for growing teams
                    </span>
                  </div>
                  <div className="mt-3.5 space-y-2.5">
                    {FLAGSHIP_SYSTEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenMega(null)}
                          className="group flex items-start gap-3.5 rounded-xl border border-transparent p-3 transition-all hover:border-line hover:bg-surface-muted"
                        >
                          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-accent-subtle text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-ink-heading group-hover:text-primary">
                                {item.title}
                              </span>
                              <span className="rounded-full bg-accent-subtle px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-primary">
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-body">
                              {item.summary}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-5 flex flex-col justify-between">
                  <div>
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      5 Practice Pillars
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {PRACTICE_PILLARS.map((pillar) => (
                        <li key={pillar.href}>
                          <Link
                            href={pillar.href}
                            onClick={() => setOpenMega(null)}
                            className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-muted"
                          >
                            <div>
                              <p className="text-sm font-medium text-ink-heading group-hover:text-primary">
                                {pillar.title}
                              </p>
                              <p className="text-xs text-ink-muted">{pillar.note}</p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-muted px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-ink-heading">
                        Full Capability Matrix
                      </p>
                      <p className="text-[0.72rem] text-ink-muted">
                        Compare all 8 automation &amp; AI systems
                      </p>
                    </div>
                    <Link
                      href="/services"
                      onClick={() => setOpenMega(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      View all services
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {openMega === "solutions" && (
              <div
                id="mega-panel-solutions"
                role="region"
                aria-label="Industry solutions and interactive lab"
                className="grid grid-cols-12 gap-6"
              >
                <div className="col-span-6 border-r border-line pr-6">
                  <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                    Solutions by Firm Profile (US · UK · Canada)
                  </p>
                  <div className="mt-3.5 space-y-2.5">
                    {SOLUTIONS_PROFILES.map((sol) => {
                      const Icon = sol.icon;
                      return (
                        <Link
                          key={sol.href}
                          href={sol.href}
                          onClick={() => setOpenMega(null)}
                          className="group flex items-start gap-3.5 rounded-xl border border-transparent p-3 transition-all hover:border-line hover:bg-surface-muted"
                        >
                          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-muted text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-heading group-hover:text-primary">
                              {sol.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-body">
                              {sol.summary}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2">
                    <Link
                      href="/solutions"
                      onClick={() => setOpenMega(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Explore all industry playbooks
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="col-span-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                        Interactive Automation Lab
                      </p>
                      <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold text-primary">
                        Zero Login · Deterministic
                      </span>
                    </div>
                    <ul className="mt-3.5 grid grid-cols-1 gap-1.5">
                      {LIVE_DEMOS.map((demo) => {
                        const Icon = demo.icon;
                        return (
                          <li key={demo.href}>
                            <Link
                              href={demo.href}
                              onClick={() => setOpenMega(null)}
                              className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-muted hover:text-primary"
                            >
                              <span className="inline-flex items-center gap-2.5">
                                <Icon className="h-4 w-4 text-primary" />
                                <span>{demo.title}</span>
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-accent-subtle/60 px-4 py-3">
                    <span className="text-xs font-medium text-ink-heading">
                      Test live scoring, grounded triage &amp; USD/GBP/CAD ROI
                    </span>
                    <Link
                      href="/demos"
                      onClick={() => setOpenMega(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Open Lab
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {openMega === "proof" && (
              <div
                id="mega-panel-proof"
                role="region"
                aria-label="Work, blueprints, and insights"
                className="grid grid-cols-2 gap-4"
              >
                {PROOF_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMega(null)}
                      className="group flex items-start gap-3.5 rounded-xl border border-line bg-surface-card p-4 transition-all hover:border-primary/40 hover:bg-surface-muted"
                    >
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-accent-subtle text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-heading group-hover:text-primary">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-body">
                          {item.summary}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile & Tablet Structured Accordion Drawer */}
      {mobileOpen && (
        <div
          id="omniflow-mobile-menu"
          className="pointer-events-auto absolute inset-x-3 top-[68px] max-h-[84vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-elevated xl:hidden"
        >
          <div className="space-y-2">
            {/* Group 1: Services */}
            <div className="rounded-xl border border-line bg-surface-card">
              <button
                type="button"
                aria-expanded={mobileGroup === "services"}
                onClick={() =>
                  setMobileGroup((prev) => (prev === "services" ? null : "services"))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink-heading"
              >
                <span>Services &amp; Practice Pillars</span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${
                    mobileGroup === "services" ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {mobileGroup === "services" && (
                <div className="space-y-1 border-t border-line px-3 py-2.5">
                  {FLAGSHIP_SYSTEMS.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-2.5 py-2 text-sm font-medium text-ink-heading hover:bg-surface-muted"
                    >
                      {s.title}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-line/60" />
                  {PRACTICE_PILLARS.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-body hover:bg-surface-muted hover:text-ink-heading"
                    >
                      {p.title}
                    </Link>
                  ))}
                  <Link
                    href="/services"
                    onClick={() => setMobileOpen(false)}
                    className="mt-1 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary"
                  >
                    View all 8 services
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Group 2: Solutions & Demos */}
            <div className="rounded-xl border border-line bg-surface-card">
              <button
                type="button"
                aria-expanded={mobileGroup === "solutions"}
                onClick={() =>
                  setMobileGroup((prev) => (prev === "solutions" ? null : "solutions"))
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink-heading"
              >
                <span>Solutions &amp; Live Lab (5 Demos)</span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${
                    mobileGroup === "solutions" ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {mobileGroup === "solutions" && (
                <div className="space-y-1 border-t border-line px-3 py-2.5">
                  <Link
                    href="/solutions"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-2.5 py-2 text-sm font-medium text-ink-heading hover:bg-surface-muted"
                  >
                    Industry Playbooks (US · UK · Canada)
                  </Link>
                  {LIVE_DEMOS.map((d) => (
                    <Link
                      key={d.href}
                      href={d.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-body hover:bg-surface-muted hover:text-ink-heading"
                    >
                      {d.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Mobile Links */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "How It Works", href: "/how-it-works" },
                { label: "Interactive Demos", href: "/demos" },
                { label: "Case Studies", href: "/case-studies" },
                { label: "Work & Blueprints", href: "/work" },
                { label: "Insights Blog", href: "/blog" },
                { label: "About & Team", href: "/about" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-line bg-surface-card px-3.5 py-2.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-line pt-4 sm:grid-cols-2">
            <Link
              href={settings.secondaryCtaHref}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-control border border-line-strong bg-surface-muted px-4 py-2.5 text-xs font-semibold text-ink-heading"
            >
              <span>{settings.secondaryCtaLabel}</span>
            </Link>
            <Link
              href={settings.primaryCtaHref}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow hover:bg-primary-hover"
            >
              <span>{settings.primaryCtaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
