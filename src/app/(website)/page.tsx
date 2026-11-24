import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Globe2,
  Layers,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
  SoaleSectionHeader,
} from "@/components/ui/soale";
import { PinnedHero } from "@/components/sections/PinnedHero";
import { HomeAutomationLabPreview } from "@/components/sections/HomeAutomationLabPreview";
import { BeforeAfterWorkflowCompare } from "@/components/sections/BeforeAfterWorkflowCompare";
import { IntegrationEcosystemVisualizer } from "@/components/sections/IntegrationEcosystemVisualizer";
import {
  SoaleEditorialProof,
  SoaleFaqAccordion,
  SoalePricingSection,
  SoaleProcessSection,
  SoaleServicesShowcase,
  SoaleWorkShowcase,
} from "@/components/sections/soale";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
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
  "TypeScript & Deterministic Workflows",
];

const OUTCOME_BENTO_CARDS = [
  {
    code: "Outcome 01",
    tag: "Speed-to-Lead",
    title: "Sub-minute enquiry capture, fit scoring & CRM brief",
    description:
      "Every web form, booking request, or after-hours enquiry is validated, scored deterministically, committed to your CRM, and summarized on WhatsApp or email for the right owner.",
    chips: ["24/7 Structured Intake", "Duplicate-Safe CRM Sync"],
    href: "/services/lead-management",
  },
  {
    code: "Outcome 02",
    tag: "Support Guardrails",
    title: "Policy-grounded AI replies with clean human escalation",
    description:
      "Routine client questions on turnaround, onboarding, and approved policies get instant accurate answers — while sensitive or custom requests escalate cleanly with full context.",
    chips: ["Approved SOPs Only", "Zero Hallucinated Promises"],
    href: "/services/ai-customer-support",
  },
  {
    code: "Outcome 03",
    tag: "Connected Ops",
    title: "Eliminate manual copy-paste across 5+ disconnected tools",
    description:
      "Synchronize forms, CRM pipelines, client kickoff folders, billing webhooks, and executive status tracking with atomic persistence and dead-letter fallback queues.",
    chips: ["Idempotent Webhooks", "Audit-Logged Handoffs"],
    href: "/services/workflow-automation",
  },
];

const CLIENT_PROFILES = [
  {
    id: "service-businesses",
    badge: "Segment 01",
    title: "Service Businesses & Clinics",
    summary:
      "Capture urgent enquiries 24/7, qualify job or appointment scope automatically, and eliminate missed after-hours calls.",
    outcomes: [
      "Instant enquiry response & booking handoff",
      "Structured job/intake details before staff call back",
      "Automated follow-up reminders so warm leads never stall",
    ],
    icon: Briefcase,
    href: "/solutions#service-businesses",
  },
  {
    id: "consultants",
    badge: "Segment 02",
    title: "Consultants & Advisory Practices",
    summary:
      "Protect senior billable hours by automating discovery qualification, pre-call research briefs, and client onboarding checklists.",
    outcomes: [
      "Pre-call context brief delivered to Slack/WhatsApp",
      "Policy-grounded answers to routine scope questions",
      "1-click client folder & kickoff task provisioning",
    ],
    icon: Users,
    href: "/solutions#consultants",
  },
  {
    id: "agencies",
    badge: "Segment 03",
    title: "Boutique & Growing Agencies",
    summary:
      "Standardize client intake, CRM pipeline hygiene, workspace setup, and recurring operational status digests without hiring extra admin.",
    outcomes: [
      "Zero manual re-entry between CRM, Notion & Slack",
      "Consistent onboarding experience on every new retainer",
      "Clear operational visibility across active accounts",
    ],
    icon: Layers,
    href: "/solutions#agencies",
  },
];

const GOVERNANCE_CARDS = [
  {
    code: "Guardrail 01",
    title: "Deterministic Validation First",
    summary:
      "Every payload passes strict schema validation, spam filtering, and idempotency checks before touching your CRM or triggering AI.",
    chip: "Zod + Atomic SQL Persistence",
    icon: Database,
  },
  {
    code: "Guardrail 02",
    title: "Bounded AI + Human Approval",
    summary:
      "AI never invents discounts, legal commitments, or unapproved policies. High-judgment decisions pause cleanly for one-click team approval.",
    chip: "Human-in-the-Loop Gates",
    icon: Lock,
  },
  {
    code: "Guardrail 03",
    title: "100% Client IP & Repo Handover",
    summary:
      "You retain complete ownership of your workflows, code, prompts, and plain-English runbooks — zero black-box vendor lock-in.",
    chip: "Full Admin Ownership",
    icon: Cpu,
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

function normalizeHomeSections(
  rawSections?: PageSectionBlock[]
): PageSectionBlock[] {
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

  const founder = team.find((m) => m.isFounder) ?? team[0];
  const pricingConfig = resolvePricingConfig(settings);
  const orderedSections = normalizeHomeSections(homePage?.sections);
  const hasFounderIntroVisible = orderedSections.some(
    (s) => s.type === "founder_intro"
  );

  return (
    <div className="bg-canvas text-ink-body">
      {orderedSections.map((section) => {
        switch (section.type) {
          /* 1. SOALE EDITORIAL HERO + LIVE 7-STEP COMMAND SHOWCASE */
          case "hero":
            return (
              <PinnedHero
                key={section.id}
                companyName={settings.companyName}
                tagline={settings.tagline}
                primaryCtaLabel={settings.primaryCtaLabel}
                primaryCtaHref={settings.primaryCtaHref}
                secondaryCtaLabel={settings.secondaryCtaLabel}
                secondaryCtaHref={settings.secondaryCtaHref}
              />
            );

          /* 2. QUIET INTEGRATION ECOSYSTEM MARQUEE & CREDIBILITY STRIP */
          case "trust_strip":
            return (
              <section
                key={section.id}
                aria-label="Connected platforms and regional alignment"
                className="border-y border-line bg-canvas-tertiary/60 py-10"
              >
                <Container>
                  <div className="flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-center">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Engineered to connect cleanly with your existing stack
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <Globe2 className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Serving {settings.targetMarkets.join(" · ")} (EST &amp;
                        GMT Overlap)
                      </span>
                    </div>
                  </div>
                </Container>

                <div className="relative overflow-hidden py-1.5">
                  <div className="animate-marquee flex w-max gap-3 px-4">
                    {[...ECOSYSTEM_ROW_1, ...ECOSYSTEM_ROW_1].map(
                      (tool, idx) => (
                        <span
                          key={`r1-${tool}-${idx}`}
                          className="soale-chip shrink-0 !bg-surface-card"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {tool}
                        </span>
                      )
                    )}
                  </div>
                  <div className="animate-marquee-reverse mt-3 flex w-max gap-3 px-4">
                    {[...ECOSYSTEM_ROW_2, ...ECOSYSTEM_ROW_2].map(
                      (tool, idx) => (
                        <span
                          key={`r2-${tool}-${idx}`}
                          className="soale-chip shrink-0 !bg-surface-card"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {tool}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </section>
            );

          /* 3. SOALE ASYMMETRIC OUTCOME BENTO CARDS + BEFORE/AFTER COMPARE */
          case "problems_outcomes":
            return (
              <section
                key={section.id}
                id="outcomes"
                className="py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Operational Outcomes"
                    title="Replace manual inbox bottlenecks with deterministic execution."
                    description="Where most teams lose hours to delayed follow-ups, repetitive policy questions, and fragile copy-paste routines — OmniFlow installs structured, auditable systems."
                    action={
                      <SoaleArrowButton
                        href="/contact?intent=call"
                        variant="outline"
                      >
                        Audit Your Workflow
                      </SoaleArrowButton>
                    }
                  />

                  {/* 3-Card Soale Outcome Bento Grid */}
                  <div className="mt-14 grid grid-cols-1 gap-7 lg:grid-cols-12">
                    {OUTCOME_BENTO_CARDS.map((card, idx) => (
                      <div
                        key={card.code}
                        data-reveal="card"
                        style={
                          { "--d": idx } as React.CSSProperties
                        }
                        className={
                          idx === 0 ? "lg:col-span-5" : idx === 1 ? "lg:col-span-4" : "lg:col-span-3"
                        }
                      >
                        <SoaleCard
                          as="article"
                          interactive
                          className="group flex h-full flex-col justify-between p-6 sm:p-7"
                        >
                          <div>
                            <div className="soale-media-frame mb-6 border border-line p-5">
                              <div className="soale-media-zoom flex items-center justify-between gap-3">
                                <span className="rounded-full bg-primary px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-primary-foreground">
                                  {card.code}
                                </span>
                                <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                                  {card.tag}
                                </span>
                              </div>
                              <div className="mt-4 space-y-2">
                                {card.chips.map((chip) => (
                                  <div
                                    key={chip}
                                    className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-heading"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span>{chip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <h3 className="soale-h3 text-ink-heading">
                              <Link
                                href={card.href}
                                className="transition-colors hover:text-primary"
                              >
                                {card.title}
                              </Link>
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-ink-body">
                              {card.description}
                            </p>
                          </div>

                          <div className="mt-6 border-t border-line pt-4">
                            <Link
                              href={card.href}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
                            >
                              <span>Inspect system architecture</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </SoaleCard>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Before vs. After Workflow Compare */}
                  <div data-reveal="card" className="mt-12">
                    <BeforeAfterWorkflowCompare />
                  </div>
                </Container>
              </section>
            );

          /* 4. SELECTED WORK & BLUEPRINTS (SOALE TOP-BORDERED TABS + FROSTED HOVER CARDS) */
          case "case_studies_highlight":
            return (
              <section
                key={section.id}
                id="work"
                className="cv-auto border-y border-line bg-canvas-tertiary/45 py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoaleWorkShowcase caseStudies={caseStudies} />
                </Container>
              </section>
            );

          /* 5. 8 SPECIALIZED AUTOMATION SYSTEMS SHOWCASE */
          case "flagship_systems":
            return (
              <section
                key={section.id}
                id="capabilities"
                className="cv-auto py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoaleServicesShowcase services={services} />
                </Container>
              </section>
            );

          /* 6. COMPLEMENTARY 5 PRACTICE PILLARS ARCHITECTURAL MATRIX */
          case "services_overview":
            return (
              <section
                key={section.id}
                id="pillars"
                className="cv-auto border-t border-line bg-canvas-tertiary/35 py-20 sm:py-24"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="5 Architectural Pillars"
                    title="Modular capabilities designed to compound as your operations grow."
                    description="Adopt a single workflow first or connect sales intelligence, customer experience, operations, analytics, and custom AI systems over time."
                    action={
                      <SoaleArrowButton href="/services#pillars" variant="surface">
                        Full Capabilities Matrix
                      </SoaleArrowButton>
                    }
                  />

                  <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
                    {pillars.map((pillar, idx) => (
                      <div
                        key={pillar.id}
                        data-reveal="card"
                        style={{ "--d": idx } as React.CSSProperties}
                      >
                        <SoaleCard
                          interactive
                          className="flex h-full flex-col justify-between p-5"
                        >
                          <div>
                            <span className="font-mono text-xs font-semibold text-primary">
                              Pillar 0{pillar.number}
                            </span>
                            <h3 className="mt-2 text-base font-semibold leading-snug text-ink-heading">
                              {pillar.name}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-ink-body">
                              {pillar.shortSummary}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3.5">
                            {pillar.capabilities.slice(0, 2).map((cap) => (
                              <span
                                key={cap}
                                className="rounded-lg bg-surface-muted px-2.5 py-1 text-[0.7rem] font-medium text-ink-heading"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </SoaleCard>
                      </div>
                    ))}
                  </div>
                </Container>
              </section>
            );

          /* 7. INTERACTIVE SANDBOX PREVIEW */
          case "interactive_demos_preview":
            return (
              <section
                key={section.id}
                id="live-sandbox"
                className="cv-auto py-20 sm:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Interactive Automation Lab"
                    title="Test real deterministic scoring & grounded AI triage right now."
                    description="Explore live simulations powered by our actual validation, scoring, and fallback rules before scheduling a discovery call."
                    action={
                      <SoaleArrowButton href="/demos" variant="primary">
                        Open All 5 Live Tools
                      </SoaleArrowButton>
                    }
                  />
                  <div data-reveal="card" className="mt-12">
                    <HomeAutomationLabPreview />
                  </div>
                </Container>
              </section>
            );

          /* 8. CONNECTED INTEGRATION ECOSYSTEM VISUALIZER */
          case "workflow_demo":
            return (
              <section
                key={section.id}
                id="ecosystem"
                className="cv-auto border-y border-line bg-canvas-tertiary/45 py-20 sm:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Connected Orchestration"
                    title="One reliable operational core across your CRM, inbox, and databases."
                    description="Click any operational domain below to inspect how OmniFlow synchronizes events with signed webhooks, duplicate locks, and audit logs."
                    action={
                      <SoaleArrowButton href="/solutions" variant="surface">
                        Industry Playbooks
                      </SoaleArrowButton>
                    }
                  />
                  <div data-reveal="card" className="mt-12">
                    <IntegrationEcosystemVisualizer />
                  </div>
                </Container>
              </section>
            );

          /* 9. 10-STAGE SCROLL-LINKED SOALE PROCESS PILLS */
          case "how_it_works":
            return (
              <section
                key={section.id}
                id="process"
                className="cv-auto py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoaleProcessSection />
                </Container>
              </section>
            );

          /* 10. WHO WE HELP — 3-COLUMN SOALE BENTO CARDS */
          case "industry_use_cases":
            return (
              <section
                key={section.id}
                id="solutions-fit"
                className="cv-auto border-t border-line bg-canvas-tertiary/40 py-20 sm:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Who We Partner With"
                    title="Tailored for high-touch teams where responsiveness drives revenue."
                    description="Whether you run a multi-location service business, an advisory practice, or a boutique agency, we design around your exact daily workflow."
                    action={
                      <SoaleArrowButton href="/solutions" variant="outline">
                        Explore Solutions
                      </SoaleArrowButton>
                    }
                  />

                  <div className="mt-12 grid grid-cols-1 gap-7 lg:grid-cols-3">
                    {CLIENT_PROFILES.map((profile, idx) => {
                      const Icon = profile.icon;
                      return (
                        <div
                          key={profile.id}
                          data-reveal="card"
                          style={{ "--d": idx } as React.CSSProperties}
                        >
                          <SoaleCard
                            interactive
                            className="flex h-full flex-col justify-between p-6 sm:p-7"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-accent-subtle text-primary">
                                  <Icon className="h-5 w-5" />
                                </span>
                                <SoaleChip>{profile.badge}</SoaleChip>
                              </div>

                              <h3 className="soale-h3 mt-5 text-ink-heading">
                                {profile.title}
                              </h3>
                              <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                                {profile.summary}
                              </p>

                              <ul className="mt-5 space-y-2 border-t border-line pt-4">
                                {profile.outcomes.map((item) => (
                                  <li
                                    key={item}
                                    className="flex items-start gap-2 text-xs leading-relaxed text-ink-body"
                                  >
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mt-6 border-t border-line pt-4">
                              <SoaleArrowButton
                                href={profile.href}
                                variant="surface"
                                size="sm"
                              >
                                View Playbook
                              </SoaleArrowButton>
                            </div>
                          </SoaleCard>
                        </div>
                      );
                    })}
                  </div>
                </Container>
              </section>
            );

          /* 11. ARCHITECTURE & GOVERNANCE GUARDRAILS BENTO */
          case "architecture_governance":
            return (
              <section
                key={section.id}
                id="architecture_governance"
                className="cv-auto py-20 sm:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="center"
                    eyebrow="Safety, Governance & Ownership"
                    title="Reliability engineered in — never bolted on after launch."
                    description="Fragile no-code chains and unconstrained prompts create risk. Every OmniFlow system enforces deterministic schemas, human approval gates, and complete client ownership."
                  />

                  <div className="mt-12 grid grid-cols-1 gap-7 lg:grid-cols-3">
                    {GOVERNANCE_CARDS.map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.code}
                          data-reveal="card"
                          style={{ "--d": idx } as React.CSSProperties}
                        >
                          <SoaleCard className="flex h-full flex-col justify-between p-6 sm:p-7">
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                                  {card.code}
                                </span>
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="soale-h3 mt-4 text-ink-heading">
                                {card.title}
                              </h3>
                              <p className="mt-3 text-sm leading-relaxed text-ink-body">
                                {card.summary}
                              </p>
                            </div>

                            <div className="mt-6 border-t border-line pt-4">
                              <SoaleChip>
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                {card.chip}
                              </SoaleChip>
                            </div>
                          </SoaleCard>
                        </div>
                      );
                    })}
                  </div>
                </Container>
              </section>
            );

          /* 12. SOALE 4-TIER CUSTOM-SCOPED / COMING SOON PRICING ARCHITECTURE */
          case "roi_framing":
            return (
              <section
                key={section.id}
                id="roi_framing"
                className="cv-auto border-y border-line bg-canvas-tertiary/45 py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoalePricingSection pricing={pricingConfig} />
                </Container>
              </section>
            );

          /* 13. EDITORIAL PROOF / PRINCIPAL ARCHITECTURE SHOWCASE */
          case "founder_intro":
            return (
              <section
                key={section.id}
                id="leadership"
                className="cv-auto py-20 sm:py-28"
              >
                <Container>
                  <SoaleEditorialProof
                    testimonials={testimonials}
                    founder={founder}
                    companyName={settings.companyName}
                  />
                </Container>
              </section>
            );

          case "testimonials":
            if (hasFounderIntroVisible || testimonials.length === 0) {
              return null;
            }
            return (
              <section
                key={section.id}
                id="testimonials"
                className="cv-auto py-20 sm:py-28"
              >
                <Container>
                  <SoaleEditorialProof
                    testimonials={testimonials}
                    founder={founder}
                    companyName={settings.companyName}
                  />
                </Container>
              </section>
            );

          /* 14. EDITORIAL INSIGHTS & ENGINEERING GUIDES */
          case "insights_preview":
            return (
              <section
                key={section.id}
                id="insights"
                className="cv-auto border-t border-line py-20 sm:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Engineering Insights & Guides"
                    title="Practical playbooks on deterministic workflows, CRM hygiene, and AI safety."
                    description="Actionable architecture notes written for founders, operations leads, and technical decision-makers."
                    action={
                      <SoaleArrowButton href="/blog" variant="surface">
                        Read All Articles
                      </SoaleArrowButton>
                    }
                  />

                  <div className="mt-12 grid grid-cols-1 gap-7 lg:grid-cols-3">
                    {blogPosts.slice(0, 3).map((post, idx) => (
                      <div
                        key={post.id}
                        data-reveal="card"
                        style={{ "--d": idx } as React.CSSProperties}
                      >
                        <SoaleCard
                          as="article"
                          interactive
                          className="group flex h-full flex-col justify-between p-5 sm:p-6"
                        >
                          <div>
                            <div className="soale-media-frame aspect-[16/9] border border-line">
                              <div className="soale-media-zoom flex h-full w-full flex-col justify-between bg-gradient-to-br from-accent-subtle via-surface to-surface-muted p-5">
                                <div className="flex items-center justify-between gap-2">
                                  <SoaleChip>{post.category}</SoaleChip>
                                  <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] text-ink-muted">
                                    <Clock className="h-3 w-3 text-primary" />
                                    {post.readingTimeMinutes} min read
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-medium text-ink-heading">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <span>{post.authorName}</span>
                                </div>
                              </div>
                            </div>

                            <h3 className="soale-h4 mt-5 text-ink-heading">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="transition-colors hover:text-primary"
                              >
                                {post.title}
                              </Link>
                            </h3>
                            <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-body">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                            <span className="font-mono text-[0.7rem] text-ink-muted">
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )
                                : "Published Guide"}
                            </span>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                            >
                              <span>Read guide</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </SoaleCard>
                      </div>
                    ))}
                  </div>
                </Container>
              </section>
            );

          /* 15. SOALE SPLIT 2-COLUMN FAQ ACCORDION */
          case "faq_section":
            return (
              <section
                key={section.id}
                id="faq"
                className="cv-auto border-t border-line bg-canvas-tertiary/40 py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <SoaleFaqAccordion
                    faqs={faqs.slice(0, 6)}
                    contactEmail={settings.contactEmail}
                  />
                </Container>
              </section>
            );

          /* 16. SIGNATURE SOALE CLOSING CONVERSION BANNER (.on-dark) */
          case "cta_banner":
            return (
              <section
                key={section.id}
                aria-label="Schedule a discovery call"
                className="py-16 sm:py-24"
              >
                <Container>
                  <div className="on-dark relative overflow-hidden rounded-[28px] border border-[var(--of-color-border)] bg-[var(--of-color-surface)] px-6 py-14 text-center shadow-elevated sm:px-12 sm:py-20">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-85"
                      style={{
                        background:
                          "radial-gradient(60% 55% at 22% 18%, rgba(183, 122, 216, 0.18), transparent 70%), radial-gradient(50% 50% at 80% 82%, rgba(167, 143, 202, 0.14), transparent 72%)",
                      }}
                    />

                    <div className="relative z-10 mx-auto max-w-3xl">
                      <SoaleEyebrow className="mb-5">
                        Ready When Your Team Is
                      </SoaleEyebrow>
                      <h2 className="soale-h1 text-[var(--of-color-heading)]">
                        Start with one bottleneck. Leave with a clear, written
                        automation plan.
                      </h2>
                      <p className="soale-lead mx-auto mt-5 !text-[var(--of-color-body)]">
                        Walk us through where enquiries, support threads, or
                        handoffs slow your team down. You will receive honest
                        architectural guidance — whether we build together or
                        not.
                      </p>

                      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                        <SoaleArrowButton
                          href={settings.primaryCtaHref}
                          variant="primary"
                        >
                          {settings.primaryCtaLabel}
                        </SoaleArrowButton>
                        <SoaleArrowButton
                          href={settings.secondaryCtaHref}
                          variant="outline"
                        >
                          {settings.secondaryCtaLabel}
                        </SoaleArrowButton>
                      </div>

                      <p className="mt-5 font-mono text-xs text-[var(--of-color-muted)]">
                        {settings.supportHours} · 100% Client-Owned Systems
                      </p>
                    </div>
                  </div>
                </Container>
              </section>
            );

          /* 17. CUSTOM ADMIN RICH TEXT BLOCK */
          case "rich_text": {
            const markdown =
              typeof section.config?.markdown === "string"
                ? section.config.markdown
                : "";
            const blocks = parseSafeMarkdown(markdown);
            return (
              <section key={section.id} className="py-16 sm:py-20">
                <Container>
                  <SoaleCard className="mx-auto max-w-4xl p-7 sm:p-10">
                    {section.title && (
                      <h2 className="soale-h2 text-ink-heading">
                        {section.title}
                      </h2>
                    )}
                    {section.subtitle && (
                      <p className="soale-lead mt-3">{section.subtitle}</p>
                    )}
                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-body">
                      {blocks.map((blk, i) =>
                        blk.type === "p" ? (
                          <p key={i}>{blk.text}</p>
                        ) : blk.type === "h2" ? (
                          <h3
                            key={i}
                            className="soale-h3 pt-2 text-ink-heading"
                          >
                            {blk.text}
                          </h3>
                        ) : null
                      )}
                    </div>
                  </SoaleCard>
                </Container>
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
