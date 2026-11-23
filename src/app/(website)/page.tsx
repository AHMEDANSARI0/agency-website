import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileCheck2,
  Globe2,
  Layers,
  Lock,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PinnedHero } from "@/components/sections/PinnedHero";
import { LightUpText } from "@/components/animations/LightUpText";
import { WorkflowDiagram } from "@/components/sections/WorkflowDiagram";
import { HomeAutomationLabPreview } from "@/components/sections/HomeAutomationLabPreview";
import { BeforeAfterWorkflowCompare } from "@/components/sections/BeforeAfterWorkflowCompare";
import { IntegrationEcosystemVisualizer } from "@/components/sections/IntegrationEcosystemVisualizer";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import type { Metadata } from "next";
import type { PageSectionBlock, PageSectionType } from "@/types/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [homePage, settings] = await Promise.all([
    db.getPageBySlug("home"),
    db.getSiteSettings(),
  ]);
  const baseUrl = getCanonicalSiteUrl();

  return {
    title:
      homePage?.seo?.seoTitle ||
      `${settings.companyName} — ${settings.positioning}`,
    description:
      homePage?.seo?.seoDescription ||
      `${settings.tagline} Grounded AI customer support, lead management, and deterministic workflow automation for US, UK, and Canadian businesses.`,
    alternates: {
      canonical: homePage?.seo?.canonicalUrl || baseUrl,
    },
    robots: homePage?.seo?.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

const ECOSYSTEM_ROW_1 = [
  "HubSpot CRM",
  "Pipedrive",
  "Salesforce",
  "Google Workspace",
  "Microsoft 365",
  "Slack",
  "Notion",
  "Airtable",
  "Stripe",
  "Calendly",
];

const ECOSYSTEM_ROW_2 = [
  "PostgreSQL",
  "Supabase",
  "Webhooks & REST APIs",
  "Zendesk",
  "Intercom",
  "QuickBooks",
  "Xero",
  "Linear",
  "Cal.com",
  "n8n / Custom TypeScript",
];

const LEAK_ITEMS = [
  {
    num: "01",
    leakTitle: "Slow, inconsistent lead follow-up",
    leakDetail: "High-intent enquiries wait hours in shared inboxes before anyone qualifies scope or responds.",
    outcomeTitle: "Sub-minute structured intake & routing",
    outcomeDetail: "Every enquiry is validated, scored, logged to CRM, and summarized for the right owner automatically.",
  },
  {
    num: "02",
    leakTitle: "Repetitive policy & status questions",
    leakDetail: "Senior staff answer the same onboarding, pricing-tier, and turnaround questions dozens of times a week.",
    outcomeTitle: "Policy-grounded triage with human escalation",
    outcomeDetail: "Routine questions get accurate SOP-backed answers; edge cases escalate cleanly with full context.",
  },
  {
    num: "03",
    leakTitle: "Manual copy-paste across 5+ tools",
    leakDetail: "Details get re-typed from forms into CRM, spreadsheets, Slack channels, and project boards.",
    outcomeTitle: "Single-entry cross-system synchronization",
    outcomeDetail: "Validated payloads propagate across your stack with idempotency keys and zero duplicate records.",
  },
  {
    num: "04",
    leakTitle: "Silent failures in brittle no-code chains",
    leakDetail: "Unmonitored zaps fail silently when an API times out, dropping leads without anyone noticing.",
    outcomeTitle: "Atomic persistence & dead-letter fallback",
    outcomeDetail: "Enquiries commit to your database first with retry flags and owner alerts if external APIs hiccup.",
  },
  {
    num: "05",
    leakTitle: "Zero visibility into operational bottlenecks",
    leakDetail: "Founders guess where leads stall or why client onboarding takes two weeks instead of two days.",
    outcomeTitle: "Clean audit trails & operational telemetry",
    outcomeDetail: "Timestamped stage transitions give leadership clear visibility into response speed and capacity.",
  },
];

const DELIVERY_STAGES = [
  {
    step: "Stage 01",
    title: "Workflow & Bottleneck Audit",
    duration: "Days 1–3",
    summary:
      "We map your current enquiry, support, or onboarding flow end-to-end — identifying where time leaks and what should stay human.",
    deliverable: "Written Architecture & Guardrail Specification",
  },
  {
    step: "Stage 02",
    title: "Deterministic Schema & Guardrails",
    duration: "Days 4–7",
    summary:
      "Before touching AI, we design strict validation rules, duplicate checks, fallback queues, and approved knowledge boundaries.",
    deliverable: "Data Contracts & Escalation Matrix",
  },
  {
    step: "Stage 03",
    title: "Staged Build & Edge-Case QA",
    duration: "Week 2–3",
    summary:
      "We build and test against realistic edge cases — malformed inputs, API timeouts, and out-of-scope questions — in a staging sandbox.",
    deliverable: "Verified Production-Ready Workflow",
  },
  {
    step: "Stage 04",
    title: "Team Walkthrough & 100% Handover",
    duration: "Launch & Beyond",
    summary:
      "Your team receives plain-English runbooks, full repository/configuration ownership, and post-launch operational tuning.",
    deliverable: "Full Admin Access, Runbooks & Support",
  },
];

const CANONICAL_HOME_TYPES: PageSectionType[] = [
  "hero",
  "trust_strip",
  "problems_outcomes",
  "flagship_systems",
  "services_overview",
  "interactive_demos_preview",
  "workflow_demo",
  "how_it_works",
  "industry_use_cases",
  "architecture_governance",
  "roi_framing",
  "case_studies_highlight",
  "founder_intro",
  "insights_preview",
  "testimonials",
  "faq_section",
  "cta_banner",
];

function normalizeHomeSections(rawSections?: PageSectionBlock[]): PageSectionBlock[] {
  if (!rawSections || rawSections.length === 0) {
    return CANONICAL_HOME_TYPES.map((type, idx) => ({
      id: `default_${type}`,
      type,
      title: type,
      isVisible: true,
      order: idx + 1,
      config: {},
    }));
  }

  // Upgrade legacy 11-section home documents seamlessly while preserving visibility/custom rich_text blocks
  const hasNewPhase3Sections = rawSections.some(
    (s) =>
      s.type === "trust_strip" ||
      s.type === "flagship_systems" ||
      s.type === "interactive_demos_preview"
  );

  if (!hasNewPhase3Sections) {
    const byType = new Map(rawSections.map((s) => [s.type, s]));
    const upgradedCanonical = CANONICAL_HOME_TYPES.map((type, idx) => {
      const existing = byType.get(type);
      return existing
        ? { ...existing, order: idx + 1 }
        : {
            id: `sec_${type}`,
            type,
            title: type,
            isVisible: true,
            order: idx + 1,
            config: {},
          };
    });
    const customBlocks = rawSections
      .filter((s) => s.type === "rich_text")
      .map((s, idx) => ({ ...s, order: upgradedCanonical.length + idx + 1 }));
    return [...upgradedCanonical, ...customBlocks].filter((s) => s.isVisible);
  }

  return [...rawSections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);
}

export default async function HomePage() {
  const [
    settings,
    homePage,
    pillars,
    services,
    caseStudies,
    blogPosts,
    faqs,
    testimonials,
    team,
  ] = await Promise.all([
    db.getSiteSettings(),
    db.getPageBySlug("home"),
    db.getServicePillars(),
    db.listServices(true),
    db.listCaseStudies(true),
    db.listBlogPosts(true),
    db.listFaqs(true),
    db.listTestimonials(true),
    db.listTeamMembers(true),
  ]);

  const flagshipServices = services.filter((s) => s.isFlagshipPriority);
  const practiceServices = services.filter((s) => !s.isFlagshipPriority);
  const founder = team.find((m) => m.isFounder) ?? team[0];
  const orderedSections = normalizeHomeSections(homePage?.sections);

  const renderSection = (block: PageSectionBlock) => {
    switch (block.type) {
      /* =====================================================================
       * 01. EXECUTIVE ARCHITECTURAL HERO
       * ===================================================================== */
      case "hero":
        return (
          <div key={block.id}>
            <PinnedHero
              companyName={settings.companyName}
              tagline={settings.tagline}
              primaryCtaLabel={settings.primaryCtaLabel}
              primaryCtaHref={settings.primaryCtaHref}
              secondaryCtaLabel={settings.secondaryCtaLabel}
              secondaryCtaHref={settings.secondaryCtaHref}
            />
          </div>
        );

      /* =====================================================================
       * 02. ENGINEERING STANDARDS & INTEGRATION STACK STRIP
       * ===================================================================== */
      case "trust_strip":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-14 sm:py-20">
            <Container>
              {/* 4 Business & Operational Standards Cards (Honest Proof — Zero Fake Client Logos) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: ShieldCheck,
                    label: "Faster Customer Responses",
                    detail: "Every enquiry and routine question receives an accurate, sub-minute response 24/7.",
                  },
                  {
                    icon: Lock,
                    label: "Safe, Guardrailed AI",
                    detail: "Answers stay strictly within your approved policies—sensitive cases escalate to your team.",
                  },
                  {
                    icon: Database,
                    label: "100% Client Ownership",
                    detail: "Your business owns every workflow, credential, database schema, and plain-English runbook.",
                  },
                  {
                    icon: Globe2,
                    label: "US · UK · Canada Overlap",
                    detail: "Direct Principal communication aligned with overlapping EST and GMT business hours.",
                  },
                ].map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.label}
                      data-reveal=""
                      className="card-3d rounded-card border border-[var(--of-border-card)] bg-surface-card p-5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-subtle text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-bold text-ink-heading">{pillar.label}</h2>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-ink-body">
                        {pillar.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Purpose Statement */}
              <div className="mt-14 sm:mt-16">
                <p className="t-eyebrow mb-4">Why Growing Teams Choose OmniFlow</p>
                <LightUpText
                  text="Stop paying skilled staff to copy-paste between disconnected apps. We connect your enquiries, CRM, customer support, and operations into dependable automated systems."
                  accentWords={["enquiries,", "CRM,", "dependable", "automated"]}
                  className="max-w-5xl text-[clamp(1.65rem,3.3vw,2.85rem)] font-semibold leading-[1.18] tracking-tight"
                />
              </div>
              {/* Interactive Connected Ecosystem Architecture */}
              <div data-reveal="" className="mt-14">
                <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <Badge variant="accent">Connected Integration Ecosystem</Badge>
                    <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
                      Works seamlessly with the business software you already run.
                    </h2>
                  </div>
                  <p className="font-mono text-xs text-primary">
                    REST · Webhooks · SQL · CRM · Messaging
                  </p>
                </div>

                <IntegrationEcosystemVisualizer />
              </div>
            </Container>

            {/* Connected Ecosystem Marquee */}
            <div className="mt-12 overflow-hidden border-t border-line pt-8">
              <div className="space-y-3">
                <div className="flex w-max animate-marquee gap-3">
                  {[...ECOSYSTEM_ROW_1, ...ECOSYSTEM_ROW_1, ...ECOSYSTEM_ROW_1].map(
                    (tool, idx) => (
                      <span
                        key={`r1-${idx}`}
                        className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-card px-4 py-2 font-mono text-xs font-medium text-ink-heading shadow-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {tool}
                      </span>
                    )
                  )}
                </div>

                <div className="flex w-max animate-marquee-reverse gap-3">
                  {[...ECOSYSTEM_ROW_2, ...ECOSYSTEM_ROW_2, ...ECOSYSTEM_ROW_2].map(
                    (tool, idx) => (
                      <span
                        key={`r2-${idx}`}
                        className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-card px-4 py-2 font-mono text-xs text-ink-body shadow-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {tool}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      /* =====================================================================
       * 03. OPERATIONAL BOTTLENECKS VS. ENGINEERED OUTCOMES
       * ===================================================================== */
      case "problems_outcomes":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              <div data-reveal="" className="max-w-3xl">
                <Badge>01 · Interactive Before &amp; After Transformation</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  See how manual bottlenecks become connected workflows.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-body sm:text-lg">
                  Select a business process below to compare fragmented manual handoffs against an automated OmniFlow system.
                </p>
              </div>

              {/* Interactive Before / After Workflow Visualizer */}
              <div data-reveal="" className="mt-10">
                <BeforeAfterWorkflowCompare />
              </div>

              {/* 5 High-Impact Bottleneck Diagnostics */}
              <div className="mt-10 space-y-3">
                {LEAK_ITEMS.map((item) => (
                  <div
                    key={item.num}
                    data-reveal=""
                    className="grid grid-cols-1 gap-4 rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card lg:grid-cols-12 lg:items-center lg:p-6"
                  >
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-ink-muted">
                          {item.num} · Manual Bottleneck
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-ink-heading">
                        {item.leakTitle}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-body">
                        {item.leakDetail}
                      </p>
                    </div>

                    <div className="hidden justify-center lg:col-span-1 lg:flex">
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/25 bg-accent-subtle text-primary">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-accent-subtle/45 p-4 lg:col-span-6">
                      <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-primary">
                        Engineered OmniFlow System
                      </span>
                      <p className="mt-1 text-sm font-bold text-ink-heading">
                        {item.outcomeTitle}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-body sm:text-sm">
                        {item.outcomeDetail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 04. THREE FLAGSHIP PRIORITY SYSTEMS
       * ===================================================================== */
      case "flagship_systems":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-28">
            <Container>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <Badge variant="accent">02 · Priority Revenue &amp; Delivery Systems</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Three flagship systems built for immediate operational leverage.
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-ink-body">
                    Most engagements start with one of these three high-impact bottlenecks — scoped clearly, verified against edge cases, and handed over cleanly.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  <span>Compare all 8 services</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {flagshipServices.map((service, idx) => (
                  <article
                    key={service.id}
                    data-reveal=""
                    className="spot card-3d flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-7"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="accent">{service.badgeLabel}</Badge>
                        <span className="font-mono text-xs font-semibold text-ink-muted">
                          0{idx + 1}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-bold tracking-tight text-ink-heading sm:text-2xl">
                        <Link
                          href={`/services/${service.slug}`}
                          className="hover:text-primary"
                        >
                          {service.title}
                        </Link>
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-ink-body">
                        {service.shortSummary}
                      </p>

                      <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                        {service.benefits.slice(0, 3).map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-body sm:text-sm"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-7 flex items-center justify-between border-t border-line pt-4">
                      <Link
                        href={`/services/${service.slug}`}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                      >
                        <span>See how it works</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <Link
                        href={`/contact?service=${encodeURIComponent(service.slug)}&intent=call&source=home_flagship_${encodeURIComponent(service.slug)}`}
                        className="font-mono text-xs text-ink-muted hover:text-ink-heading"
                      >
                        Book call →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 05. FIVE CORE AI & AUTOMATION PRACTICE PILLARS
       * ===================================================================== */
      case "services_overview":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              <div className="max-w-3xl">
                <Badge>03 · Full Practice Architecture</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  Five specialized AI &amp; automation capability pillars.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-ink-body">
                  Beyond initial intake and support triage, OmniFlow designs cohesive operational infrastructure across sales intelligence, client experience, internal ops, analytics, and custom systems.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {pillars.map((pillar) => {
                  const linkedService = practiceServices.find((s) => s.slug === pillar.slug);
                  return (
                    <Link
                      key={pillar.id}
                      href={`/services/${pillar.slug}`}
                      className="group flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-accent-subtle px-2.5 py-1 font-mono text-xs font-bold text-primary">
                            Pillar 0{pillar.number}
                          </span>
                          <Layers className="h-4 w-4 text-ink-muted group-hover:text-primary" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-ink-heading group-hover:text-primary">
                          {pillar.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-primary">
                          {pillar.capabilities.slice(0, 2).join(" · ")}
                        </p>
                        <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                          {linkedService?.shortSummary || pillar.shortSummary}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5 text-xs font-semibold text-primary">
                        <span>Explore pillar blueprint</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}

                {/* Capability Summary CTA Card */}
                <div className="flex flex-col justify-between rounded-card border border-primary/25 bg-accent-subtle/50 p-6">
                  <div>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      Not sure where to start?
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-ink-heading">
                      Take the 2-Minute Automation Readiness Diagnostic
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-body">
                      Benchmark your current documentation, CRM structure, and enquiry volume to find the highest-leverage starting workflow.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/demos?tab=readiness-assessment"
                      className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
                    >
                      <span>Run Readiness Assessment</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 06. LIVE INTERACTIVE AUTOMATION LAB PREVIEW
       * ===================================================================== */
      case "interactive_demos_preview":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-28">
            <Container>
              <div className="mb-10 max-w-3xl">
                <Badge variant="accent">04 · Proof Over Promise</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  Inspect how our systems think before booking a call.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-ink-body">
                  Most agencies hide behind vague decks. Try our deterministic scoring, fail-safe queue handling, and multi-currency capacity calculator directly in your browser.
                </p>
              </div>

              <HomeAutomationLabPreview />
            </Container>
          </section>
        );

      /* =====================================================================
       * 07. END-TO-END DETERMINISTIC EXECUTION TRACE
       * ===================================================================== */
      case "workflow_demo":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              <div className="mb-10 grid items-end gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <Badge>05 · Pipeline Architecture</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Nine seconds of structured prep. One clear human decision.
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-ink-body lg:col-span-5">
                  Click through each stage below to inspect the exact payload validation, qualification rules, atomic CRM transaction, and owner handoff brief.
                </p>
              </div>
              <WorkflowDiagram />
            </Container>
          </section>
        );

      /* =====================================================================
       * 08. 4-STAGE ENGINEERING DELIVERY METHODOLOGY
       * ===================================================================== */
      case "how_it_works":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-28">
            <Container>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <Badge variant="accent">06 · Delivery Methodology</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Scoped in milestones. Verified before launch.
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-ink-body">
                    We never deploy black-box automations onto live client channels without written schemas, staging tests, and team sign-off.
                  </p>
                </div>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  <span>Full delivery guide</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {DELIVERY_STAGES.map((stage) => (
                  <div
                    key={stage.step}
                    className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                          {stage.step}
                        </span>
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-[0.68rem] text-ink-muted">
                          {stage.duration}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-ink-heading">
                        {stage.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                        {stage.summary}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-line pt-3.5">
                      <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-muted">
                        Milestone Deliverable
                      </p>
                      <p className="mt-1 text-xs font-semibold text-ink-heading">
                        {stage.deliverable}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust & Partnership Guarantees: Communication, Ownership & Support */}
              <div className="mt-8 grid grid-cols-1 gap-5 rounded-card border border-line bg-surface-muted/50 p-6 lg:grid-cols-3">
                <div className="rounded-xl border border-line bg-surface-card p-5">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                    Client Communication
                  </p>
                  <h3 className="mt-1.5 text-sm font-bold text-ink-heading">
                    Direct Principal Collaboration
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                    You communicate directly with the system architect—with concise milestone walkthroughs and overlapping EST/GMT availability.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface-card p-5">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                    Project Ownership
                  </p>
                  <h3 className="mt-1.5 text-sm font-bold text-ink-heading">
                    Zero Vendor Lock-In
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                    All workflows, accounts, API connections, and plain-English operating runbooks are handed over to your business in full.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface-card p-5">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                    Maintenance &amp; Support
                  </p>
                  <h3 className="mt-1.5 text-sm font-bold text-ink-heading">
                    Post-Launch Tuning or Self-Run
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                    Includes post-launch stabilization monitoring, with optional lightweight ongoing support as your enquiry volume grows.
                  </p>
                </div>
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 09. INDUSTRY PLAYBOOKS (SERVICE BUSINESSES, CONSULTANTS, AGENCIES)
       * ===================================================================== */
      case "industry_use_cases":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              <div className="max-w-3xl">
                <Badge>07 · Sector Playbooks (US · UK · Canada)</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  Engineered for businesses that run on client relationships.
                </h2>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {[
                  {
                    title: "Service Businesses",
                    regionNote: "Commercial, Field & Multi-Location Operators",
                    desc: "Capture missed after-hours enquiries, validate job scope upfront, eliminate duplicate CRM entries, and route ready-to-book quotes immediately.",
                    outcomes: [
                      "24/7 structured enquiry capture",
                      "Postcode/region & urgency routing",
                      "Automated follow-up sequences",
                    ],
                    href: "/solutions#service-businesses",
                  },
                  {
                    title: "Consultants & Advisory Firms",
                    regionNote: "Management, Financial, Legal & Specialist Practices",
                    desc: "Protect partner billable hours with automated discovery qualification, pre-call dossier briefs, document checklists, and SOP-grounded FAQ handling.",
                    outcomes: [
                      "Fit & timeline scoring before calls",
                      "Automated client intake checklists",
                      "Zero ungrounded AI advice",
                    ],
                    href: "/solutions#consultants",
                  },
                  {
                    title: "Small & Boutique Agencies",
                    regionNote: "Digital, Creative, Recruitment & Growth Teams",
                    desc: "Filter low-fit requests from retainer opportunities, provision client onboarding workspaces on deal-won, and automate weekly KPI digests.",
                    outcomes: [
                      "Retainer vs. one-off triage",
                      "1-click kickoff provisioning",
                      "Cross-tool status aggregation",
                    ],
                    href: "/solutions#agencies",
                  },
                ].map((segment) => (
                  <article
                    key={segment.title}
                    className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-7 shadow-card"
                  >
                    <div>
                      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                        {segment.regionNote}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-ink-heading">
                        {segment.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-body">
                        {segment.desc}
                      </p>
                      <ul className="mt-5 space-y-2 border-t border-line pt-4">
                        {segment.outcomes.map((out) => (
                          <li key={out} className="flex items-center gap-2 text-xs font-medium text-ink-heading">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-2">
                      <Link
                        href={segment.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                      >
                        <span>Inspect sector playbook</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 10. SAFETY, GUARDRAILS & DATA OWNERSHIP ARCHITECTURE
       * ===================================================================== */
      case "architecture_governance":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-24">
            <Container>
              <div className="grid items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <Badge variant="accent">08 · Governance &amp; Safety Architecture</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Why OmniFlow workflows never guess with your reputation.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-ink-body">
                    Deploying open-ended chatbots on client channels is an operational liability. We separate deterministic business rules from bounded AI classification so your brand stays accurate and compliant.
                  </p>
                  <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      {
                        icon: FileCheck2,
                        title: "Approved Knowledge Only",
                        desc: "Support assistants cite only your verified policies, pricing tiers, and SLAs.",
                      },
                      {
                        icon: Workflow,
                        title: "Confidence Escalation",
                        desc: "Ambiguous, custom-contract, or sensitive queries route straight to a human owner.",
                      },
                      {
                        icon: Cpu,
                        title: "Idempotent Transactions",
                        desc: "Webhook retries never create duplicate contacts, invoices, or tasks.",
                      },
                      {
                        icon: Scale,
                        title: "Zero Vendor Lock-In",
                        desc: "Your business owns all credentials, repositories, schemas, and runbooks.",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="rounded-xl border border-line bg-surface-muted/60 p-4"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <h3 className="mt-2 text-sm font-bold text-ink-heading">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-ink-body">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deterministic Decision Matrix Card */}
                <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8 lg:col-span-6">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-heading">
                      Guardrail Execution Matrix
                    </span>
                    <Badge variant="status">Production Standard</Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        event: "Schema & Email Validation",
                        mode: "100% Deterministic",
                        badgeClass: "bg-accent-subtle text-primary",
                      },
                      {
                        event: "CRM Record & Audit Timestamp",
                        mode: "Atomic SQL Commit",
                        badgeClass: "bg-accent-subtle text-primary",
                      },
                      {
                        event: "Approved FAQ / Turnaround Query",
                        mode: "Policy-Grounded Draft",
                        badgeClass: "bg-surface-muted text-ink-heading",
                      },
                      {
                        event: "Custom Pricing / Refund / Legal Edge Case",
                        mode: "Mandatory Human Escalation",
                        badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                      },
                    ].map((row) => (
                      <div
                        key={row.event}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs"
                      >
                        <span className="font-semibold text-ink-heading">{row.event}</span>
                        <span className={`rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-semibold ${row.badgeClass}`}>
                          {row.mode}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 font-mono text-[0.7rem] text-ink-muted">
                    Every automated step is logged with input payload, rule matched, and outcome status.
                  </p>
                </div>
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 11. TRANSPARENT ECONOMICS & COST-CONTROLLED STACK
       * ===================================================================== */
      case "roi_framing":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              <div className="max-w-3xl">
                <Badge>09 · Lean Operational Economics</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  Built to reduce SaaS bloat — not add another runaway bill.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-ink-body">
                  We design lean, cost-controlled architectures first. Before recommending any paid third-party tool, we document exact task volumes, free-tier quotas, and ongoing operating costs transparently.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-card border border-line bg-surface-card p-6 shadow-card">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Status Quo #1
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-ink-heading">
                    Manual Inbox &amp; Spreadsheet Triage
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    Hidden payroll drain as principals and account managers spend 5–12 hours weekly copying data, chasing missing context, and following up late.
                  </p>
                </div>

                <div className="rounded-card border border-line bg-surface-card p-6 shadow-card">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Status Quo #2
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-ink-heading">
                    Fragile Per-Task Automation Sprawl
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    Dozens of undocumented multi-step zaps that charge per task, lack version control, duplicate CRM contacts, and break silently on edge cases.
                  </p>
                </div>

                <div className="rounded-card border border-primary/35 bg-surface-card p-6 shadow-elevated">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    The OmniFlow Standard
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-ink-heading">
                    Lean, Documented Engineering
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    Clean webhook orchestration, relational persistence, and bounded AI calls only when needed — keeping monthly infrastructure predictable and owned by you.
                  </p>
                  <Link
                    href="/demos?tab=savings-calculator"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    <span>Estimate reclaimed hours (USD / GBP / CAD)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 12. REFERENCE ARCHITECTURES & VERIFIED WORK
       * ===================================================================== */
      case "case_studies_highlight":
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-28">
            <Container>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <Badge variant="accent">10 · Reference Architectures &amp; Work</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Transparently labeled blueprints and system implementations.
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-ink-body">
                    Every published item carries an explicit verification badge distinguishing authorized client deployments from internal reference architectures — never fabricated metrics.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/case-studies"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                  >
                    <span>All case studies</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {caseStudies.slice(0, 3).map((cs) => {
                  const meta = WORK_TYPE_META[cs.workType];
                  return (
                    <article
                      key={cs.id}
                      data-reveal=""
                      className="spot card-3d flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{meta.label}</Badge>
                          <Badge variant="outline">{cs.industry}</Badge>
                        </div>
                        <h3 className="mt-4 text-xl font-bold leading-snug text-ink-heading">
                          <Link
                            href={`/case-studies/${cs.slug}`}
                            className="hover:text-primary"
                          >
                            {cs.title}
                          </Link>
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-ink-body">
                          {cs.problemSummary}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                        <span className="font-mono text-[0.68rem] text-ink-muted">
                          {cs.technologiesUsed.slice(0, 2).join(" · ")}
                        </span>
                        <Link
                          href={`/case-studies/${cs.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                        >
                          <span>Inspect blueprint</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 13. PRINCIPAL-LED ENGINEERING (AHMED ANSARI)
       * ===================================================================== */
      case "founder_intro":
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20 sm:py-24">
            <Container>
              {founder && (
                <div className="grid items-center gap-8 rounded-card border border-[var(--of-border-card)] bg-surface-card p-8 shadow-card lg:grid-cols-12 lg:p-10">
                  <div className="lg:col-span-8">
                    <Badge variant="accent">11 · Principal-Led Accountability</Badge>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
                      Work directly with {founder.name}, {founder.role}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-ink-body">
                      {founder.bio} Every architecture audit, guardrail specification, and production deployment is led with direct senior accountability — never handed off to unaccountable subcontractors.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {founder.focusAreas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-muted p-6 lg:col-span-4">
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      Operating Coverage
                    </p>
                    <p className="text-sm font-semibold text-ink-heading">
                      {founder.regionsServed.join(" · ")}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-body">
                      Discovery reviews and milestone walkthroughs scheduled across overlapping EST and GMT business hours.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2.5 pt-1">
                      <Link
                        href="/about"
                        className="rounded-control border border-line-strong bg-surface px-4 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-card"
                      >
                        About {settings.companyName}
                      </Link>
                      <Link
                        href="/team"
                        className="rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                      >
                        Leadership Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </Container>
          </section>
        );

      /* =====================================================================
       * 14. LATEST ENGINEERING BRIEFINGS & PLAYBOOKS
       * ===================================================================== */
      case "insights_preview":
        if (blogPosts.length === 0) return null;
        return (
          <section key={block.id} className="border-b border-line bg-surface py-20 sm:py-24">
            <Container>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <Badge>12 · Engineering Briefings &amp; Insights</Badge>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Practical guides on reliable business automation.
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  <span>Browse all insights</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {blogPosts.slice(0, 3).map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge>{post.category}</Badge>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readingTimeMinutes} min
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold leading-snug text-ink-heading">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-body">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                      <span className="text-ink-muted">By {post.authorName}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover"
                      >
                        <span>Read briefing</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 15. VERIFIED CLIENT FEEDBACK GATE (STRICT TRUTHFULNESS GATE)
       * ===================================================================== */
      case "testimonials":
        if (testimonials.length === 0) return null;
        return (
          <section key={block.id} className="border-b border-line bg-surface-muted/45 py-20">
            <Container>
              <Badge variant="accent">Verified Client Feedback</Badge>
              <h2 className="t-display mt-3 text-ink-heading">Authorized Client Reviews</h2>
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                {testimonials.map((t) => (
                  <blockquote
                    key={t.id}
                    className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-7 shadow-card"
                  >
                    <p className="text-base italic leading-relaxed text-ink-body">
                      “{t.quote}”
                    </p>
                    <footer className="mt-4 font-mono text-xs font-semibold text-ink-heading">
                      {t.authorName} · {t.authorRole}, {t.companyName} ({t.country})
                    </footer>
                  </blockquote>
                ))}
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 16A. EXECUTIVE FAQ ACCORDION
       * ===================================================================== */
      case "faq_section":
        return (
          <section key={block.id} className="bg-surface py-20 sm:py-24">
            <Container className="max-w-4xl">
              <div>
                <Badge>13 · Common Questions</Badge>
                <h2 className="t-display mt-3 text-ink-heading">
                  Straight answers before you scope a project.
                </h2>
              </div>

              <div className="mt-10 space-y-3">
                {faqs.slice(0, 6).map((faq) => (
                  <details
                    key={faq.id}
                    className="more rounded-card border border-[var(--of-border-card)] bg-surface-card px-6 py-4 shadow-card"
                  >
                    <summary className="flex items-center justify-between gap-4 text-left text-base font-semibold text-ink-heading sm:text-lg">
                      <span>{faq.question}</span>
                      <span className="more-icon grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface-muted text-primary">
                        <Plus className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-3xl border-t border-line pt-3 text-sm leading-relaxed text-ink-body">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  <span>Browse full FAQ library</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Container>
          </section>
        );

      /* =====================================================================
       * 16B. EXECUTIVE CONSULTATION & AUDIT CONVERSION BANNER
       * ===================================================================== */
      case "cta_banner":
        return (
          <section key={block.id} className="bg-surface px-3 pb-12 pt-4 sm:px-5 sm:pb-16">
            <div
              className="on-dark relative mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-white/10 px-6 py-16 text-center shadow-elevated sm:rounded-[28px] sm:px-12 sm:py-20"
              style={{
                background: "var(--of-gradient-cta-banner)",
              }}
            >
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.14em] text-white/90">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Free 25-Minute Discovery Call</span>
              </div>

              <h2 className="t-display mx-auto mt-4 max-w-3xl text-white">
                Ready to eliminate manual busywork and respond faster?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Book a free discovery call or share your current bottleneck. Within one business day, we will map what to automate, what tools connect cleanly, and what stays human.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href={settings.primaryCtaHref}
                  className="group inline-flex items-center gap-2 rounded-control bg-[var(--of-btn-primary-bg,var(--of-color-primary))] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:bg-primary-hover"
                >
                  <span>{settings.primaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={settings.secondaryCtaHref || "/demos"}
                  className="inline-flex items-center gap-2 rounded-control border border-slate-600/80 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  <span>{settings.secondaryCtaLabel || "Explore Live Demos"}</span>
                </Link>
              </div>

              <p className="mt-6 font-mono text-xs text-slate-400">
                USA · United Kingdom · Canada · Private enquiry · Zero obligation
              </p>
            </div>
          </section>
        );

      /* =====================================================================
       * CUSTOM CMS MARKDOWN SECTION BLOCK
       * ===================================================================== */
      case "rich_text": {
        const md =
          typeof block.config?.markdown === "string"
            ? block.config.markdown
            : "";
        const mdBlocks = parseSafeMarkdown(md);
        return (
          <section key={block.id} className="border-t border-line bg-surface py-16 sm:py-20">
            <Container className="max-w-4xl">
              <Badge>Architecture Note</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
                {block.title}
              </h2>
              {block.subtitle && (
                <p className="mt-2 text-base text-ink-muted">{block.subtitle}</p>
              )}
              {mdBlocks.length > 0 && (
                <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-body">
                  {mdBlocks.map((mb, idx) => {
                    if (mb.type === "h2") {
                      return (
                        <h3
                          key={idx}
                          className="pt-4 text-xl font-bold text-ink-heading"
                        >
                          {mb.text}
                        </h3>
                      );
                    }
                    if (mb.type === "h3") {
                      return (
                        <h4
                          key={idx}
                          className="pt-2 text-lg font-semibold text-ink-heading"
                        >
                          {mb.text}
                        </h4>
                      );
                    }
                    if (mb.type === "ul") {
                      return (
                        <ul
                          key={idx}
                          className="list-disc space-y-1.5 pl-6 text-ink-body"
                        >
                          {mb.items.map((li, liIdx) => (
                            <li key={liIdx}>{li}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (mb.type === "blockquote") {
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-2 border-primary pl-4 italic text-ink-heading"
                        >
                          {mb.text}
                        </blockquote>
                      );
                    }
                    return <p key={idx}>{mb.text}</p>;
                  })}
                </div>
              )}
            </Container>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {orderedSections.map((block, idx) => {
        const rendered = renderSection(block);
        if (!rendered) return null;
        return (
          <div key={block.id} className={idx >= 2 ? "cv-auto" : undefined}>
            {rendered}
          </div>
        );
      })}
    </>
  );
}
