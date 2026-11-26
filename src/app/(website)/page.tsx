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
  Layers,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import {
  getCachedPageBySlug,
  getCachedPublishedBlogPosts,
  getCachedPublishedCaseStudies,
  getCachedPublishedFaqs,
  getCachedPublishedServices,
  getCachedPublishedTeamMembers,
  getCachedPublishedTestimonials,
  getCachedServicePillars,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
  SoaleSectionHeader,
} from "@/components/ui/soale";
import { PinnedHero } from "@/components/sections/PinnedHero";
import { StackLogoBar } from "@/components/sections/StackLogoBar";
import {
  LazyBeforeAfterWorkflowCompare,
  LazyHomeAutomationLabPreview,
  LazyIntegrationEcosystemVisualizer,
  LazySoaleFaqAccordion,
  LazySoalePricingSection,
  LazySoaleProcessSection,
} from "@/components/sections/LazyClientIslands";
import { SoaleEditorialProof } from "@/components/sections/soale/SoaleEditorialProof";
import { SoaleServicesShowcase } from "@/components/sections/soale/SoaleServicesShowcase";
import { SoaleWorkShowcase } from "@/components/sections/soale/SoaleWorkShowcase";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { buildHomeAbsoluteTitle } from "@/lib/seo/title";
import type { PageSectionBlock, PageSectionType } from "@/types/content";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const [homePage, settings] = await Promise.all([
    getCachedPageBySlug("home"),
    getCachedSiteSettings(),
  ]);
  const baseUrl = getCanonicalSiteUrl();
  const homeTitle = buildHomeAbsoluteTitle(
    homePage?.seo?.seoTitle,
    settings.companyName,
    settings.positioning
  );

  const homeDescription =
    homePage?.seo?.seoDescription ||
    "AI workflows that answer every lead, update your CRM, and support US, UK, and Canadian service teams with human approval gates.";
  const ogTitle = homePage?.seo?.ogTitle?.trim() || homeTitle;
  const ogDescription = homePage?.seo?.ogDescription?.trim() || homeDescription;
  const ogImage =
    homePage?.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;

  return {
    title: {
      absolute: homeTitle,
    },
    description: homeDescription,
    alternates: {
      canonical: homePage?.seo?.canonicalUrl || baseUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: homePage?.seo?.canonicalUrl || baseUrl,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: homePage?.seo?.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

const OUTCOME_BENTO_CARDS = [
  {
    code: "Outcome 01",
    tag: "Faster Replies",
    title: "Every new lead answered & added to your CRM in minutes",
    description:
      "Web forms, booking requests, and after-hours enquiries are checked, scored, saved to your CRM without duplicates, and sent to your team on WhatsApp or email.",
    chips: ["24/7 Lead Capture", "Clean CRM Updates"],
    href: "/services/lead-management",
  },
  {
    code: "Outcome 02",
    tag: "Safe AI Replies",
    title: "Helpful answers from your own policies — human sign-off on the rest",
    description:
      "Common questions on pricing basics, hours, and onboarding get instant replies from your approved FAQs, while custom quotes pause for a teammate to approve.",
    chips: ["Approved FAQs Only", "Human Approval Gates"],
    href: "/services/ai-customer-support",
  },
  {
    code: "Outcome 03",
    tag: "Less Busywork",
    title: "Stop copy-pasting the same client details across five tools",
    description:
      "Keep your forms, CRM pipeline, client folders, billing updates, and weekly summary reports in sync automatically — with clear alerts if anything needs attention.",
    chips: ["Connected Tools", "100% Client Owned"],
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
  "interactive_demos_preview",
  "how_it_works",
  "case_studies_highlight",
  "roi_framing",
  "faq_section",
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

  return [...rawSections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);
}

export default async function HomePage() {
  const [settings, homePage] = await Promise.all([
    getCachedSiteSettings(),
    getCachedPageBySlug("home"),
  ]);

  const orderedSections = normalizeHomeSections(homePage?.sections);
  const visibleTypes = new Set(orderedSections.map((s) => s.type));

  const [
    pillars,
    services,
    caseStudies,
    blogPosts,
    faqs,
    testimonials,
    team,
  ] = await Promise.all([
    visibleTypes.has("services_overview")
      ? getCachedServicePillars()
      : Promise.resolve([]),
    visibleTypes.has("flagship_systems") || visibleTypes.has("services_overview")
      ? getCachedPublishedServices()
      : Promise.resolve([]),
    visibleTypes.has("case_studies_highlight")
      ? getCachedPublishedCaseStudies()
      : Promise.resolve([]),
    visibleTypes.has("insights_preview")
      ? getCachedPublishedBlogPosts()
      : Promise.resolve([]),
    visibleTypes.has("faq_section")
      ? getCachedPublishedFaqs()
      : Promise.resolve([]),
    visibleTypes.has("case_studies_highlight") ||
    visibleTypes.has("testimonials") ||
    visibleTypes.has("founder_intro")
      ? getCachedPublishedTestimonials()
      : Promise.resolve([]),
    visibleTypes.has("case_studies_highlight") ||
    visibleTypes.has("founder_intro") ||
    visibleTypes.has("testimonials")
      ? getCachedPublishedTeamMembers()
      : Promise.resolve([]),
  ]);

  const founder = team.find((m) => m.isFounder) ?? team[0];
  const pricingConfig = resolvePricingConfig(settings);
  const hasFounderIntroVisible = visibleTypes.has("founder_intro");
  const hasStandaloneCtaVisible = visibleTypes.has("cta_banner");

  return (
    <div id="of-home-sections-root" className="bg-canvas text-ink-body">
      {orderedSections.map((section) => {
        const rendered = (() => {
          switch (section.type) {
            /* 1. CENTERED DARK PURPLE AI HERO + 3D GLOBE STUDIO + WORKFLOW COMMAND CENTER */
            case "hero": {
              const secCtaLabel =
                typeof section.config?.ctaLabel === "string" &&
                section.config.ctaLabel.trim()
                  ? section.config.ctaLabel
                  : settings.primaryCtaLabel;
              const secCtaHref =
                typeof section.config?.ctaHref === "string" &&
                section.config.ctaHref.trim()
                  ? section.config.ctaHref
                  : settings.primaryCtaHref;
              return (
                <PinnedHero
                  companyName={settings.companyName}
                  tagline={settings.tagline}
                  primaryCtaLabel={secCtaLabel}
                  primaryCtaHref={secCtaHref}
                  secondaryCtaLabel={settings.secondaryCtaLabel}
                  secondaryCtaHref={settings.secondaryCtaHref}
                  headlineOverride={section.title}
                  subtitleOverride={section.subtitle}
                  heroCanvas={
                    section.config?.heroCanvas as
                      | Record<string, unknown>
                      | undefined
                  }
                />
              );
            }

          /* 2. WORKS WITH YOUR STACK BAR (6 INLINE SVG WORDMARKS) */
          case "trust_strip":
            return <StackLogoBar key={section.id} />;

          /* 3. PLAIN-ENGLISH OUTCOMES + INTERACTIVE BEFORE/AFTER COMPARE */
          case "problems_outcomes":
            return (
              <section
                key={section.id}
                id="outcomes"
                className="py-20 sm:py-24 lg:py-28"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Practical Outcomes"
                    title="Fix missed leads and repetitive admin without hiring extra staff."
                    description="Most small teams lose hours to slow follow-ups, repeat policy questions, and manual copy-pasting. We replace those bottlenecks with clear, reliable workflows."
                    action={
                      <SoaleArrowButton
                        href="/contact?intent=call"
                        variant="outline"
                      >
                        Book a free workflow review
                      </SoaleArrowButton>
                    }
                  />

                  {/* 3-Card Outcome Grid (<= 3 cards per row) */}
                  <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-7 lg:grid-cols-3">
                    {OUTCOME_BENTO_CARDS.map((card, idx) => (
                      <div
                        key={card.code}
                        data-scroll-card=""
                        style={{ "--d": idx } as React.CSSProperties}
                      >
                        <SoaleCard motionId={"app-(website)-page.tsx:1" + ":" + String(card.code)}
                          as="article"
                          interactive
                          className="group flex h-full flex-col justify-between p-5 sm:p-7"
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
                              <span>See how this works</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </SoaleCard>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Before vs. After Workflow Compare */}
                  <LazyBeforeAfterWorkflowCompare className="mt-12" />
                </Container>
              </section>
            );

          /* 7. PROOF: BADGED WORKFLOW BLUEPRINTS + FOUNDER ACCOUNTABILITY */
          case "case_studies_highlight":
            return (
              <section
                key={section.id}
                id="work"
                className="bg-canvas-tertiary/45 py-20 sm:py-24 lg:py-28"
              >
                <Container>
                  <SoaleWorkShowcase caseStudies={caseStudies} />
                  {!hasFounderIntroVisible && (
                    <div className="mt-16 pt-16">
                      <SoaleEditorialProof
                        testimonials={testimonials}
                        founder={founder}
                        companyName={settings.companyName}
                      />
                    </div>
                  )}
                </Container>
              </section>
            );

          /* 5. 8 SPECIALIZED AUTOMATION SYSTEMS SHOWCASE */
          case "flagship_systems":
            return (
              <div key={section.id}>
                {!visibleTypes.has("trust_strip") && <StackLogoBar />}
                <section
                  id="capabilities"
                  className="py-16 sm:py-24 lg:py-28"
                >
                  <Container>
                    <SoaleServicesShowcase services={services} />
                  </Container>
                </section>
              </div>
            );

          /* 6. COMPLEMENTARY 5 PRACTICE PILLARS ARCHITECTURAL MATRIX */
          case "services_overview":
            return (
              <section
                key={section.id}
                id="pillars"
                className="bg-canvas-tertiary/35 py-20 sm:py-24"
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
                        style={{ "--d": idx } as React.CSSProperties}
                      >
                        <SoaleCard motionId={"app-(website)-page.tsx:2" + ":" + String(pillar.id)}
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

          /* 5. INTERACTIVE LEAD SCORER PREVIEW */
          case "interactive_demos_preview":
            return (
              <section
                key={section.id}
                id="live-sandbox"
                className="bg-canvas-tertiary/30 py-20 sm:py-24"
              >
                <Container>
                  <SoaleSectionHeader
                    align="split"
                    eyebrow="Try It Live"
                    title="Test our lead scorer & FAQ triage right in your browser."
                    description="See how OmniFlow checks enquiries, assigns priority, and flags edge cases for human review before you book a call."
                    action={
                      <SoaleArrowButton href="/demos" variant="primary">
                        See all 5 live demos
                      </SoaleArrowButton>
                    }
                  />
                  <LazyHomeAutomationLabPreview className="mt-12" />
                </Container>
              </section>
            );

          /* 8. CONNECTED INTEGRATION ECOSYSTEM VISUALIZER */
          case "workflow_demo":
            return (
              <section
                key={section.id}
                id="ecosystem"
                className="bg-canvas-tertiary/45 py-20 sm:py-28"
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
                  <LazyIntegrationEcosystemVisualizer className="mt-12" />
                </Container>
              </section>
            );

          /* 5. 4-PHASE DELIVERY PROCESS + WRITTEN SCOPE CLARITY */
          case "how_it_works":
            return (
              <section
                key={section.id}
                id="process"
                className="py-16 sm:py-24 lg:py-28"
              >
                <Container>
                  <LazySoaleProcessSection />

                  {!visibleTypes.has("roi_framing") && (
                    <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line-subtle bg-surface-card/75 px-6 py-5 backdrop-blur-md sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
                          Transparent Fixed-Scope Engagement
                        </p>
                        <p className="mt-1 text-sm text-ink-body">
                          {pricingConfig.statusBannerText} — written deliverables, human approval gates, and 100% client code ownership.
                        </p>
                      </div>
                      <SoaleArrowButton href="/pricing" variant="surface" size="sm">
                        View Pricing &amp; Scopes
                      </SoaleArrowButton>
                    </div>
                  )}
                </Container>
              </section>
            );

          /* 10. WHO WE HELP — 3-COLUMN SOALE BENTO CARDS */
          case "industry_use_cases":
            return (
              <section
                key={section.id}
                id="solutions-fit"
                className="bg-canvas-tertiary/40 py-20 sm:py-28"
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
                          style={{ "--d": idx } as React.CSSProperties}
                        >
                          <SoaleCard motionId={"app-(website)-page.tsx:3" + ":" + String(profile.id)}
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
                className="py-20 sm:py-28"
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
                          style={{ "--d": idx } as React.CSSProperties}
                        >
                          <SoaleCard motionId={"app-(website)-page.tsx:4" + ":" + String(card.code)} className="flex h-full flex-col justify-between p-6 sm:p-7">
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
                className="bg-canvas-tertiary/45 py-20 sm:py-28 lg:py-32"
              >
                <Container>
                  <LazySoalePricingSection pricing={pricingConfig} />
                </Container>
              </section>
            );

          /* 13. EDITORIAL PROOF / PRINCIPAL ARCHITECTURE SHOWCASE */
          case "founder_intro":
            return (
              <section
                key={section.id}
                id="leadership"
                className="py-20 sm:py-28"
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
                className="py-20 sm:py-28"
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
                className="py-20 sm:py-28"
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
                        style={{ "--d": idx } as React.CSSProperties}
                      >
                        <SoaleCard motionId={"app-(website)-page.tsx:5" + ":" + String(post.id)}
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

          /* 9. 5 PLAIN-ENGLISH FAQS + FINAL REVIEW CTA */
          case "faq_section":
            return (
              <section
                key={section.id}
                id="faq"
                className="bg-canvas-tertiary/40 py-20 sm:py-24 lg:py-28"
              >
                <Container>
                  <LazySoaleFaqAccordion
                    faqs={faqs.slice(0, 5)}
                    contactEmail={settings.contactEmail}
                  />

                  {!hasStandaloneCtaVisible && (
                    <div
                      data-card-motion-id="home-faq-cta"
                      data-scroll-card=""
                      className="soale-horizon-card mt-14 rounded-[26px] px-5 py-12 text-center sm:mt-16 sm:px-12 sm:py-18"
                    >
                      <div className="relative z-10 mx-auto max-w-2xl">
                        <SoaleEyebrow className="mb-4">
                          Free 25-Minute Workflow Review
                        </SoaleEyebrow>
                        <h2 className="soale-h2 text-ink-heading">
                          Start with one bottleneck. Leave with a written plan.
                        </h2>
                        <p className="mx-auto mt-4 max-w-[54ch] text-sm leading-relaxed text-ink-body sm:text-base">
                          Show us where leads, inbox replies, or handoffs slow
                          your team down. You get a plain-English scope — zero
                          obligation.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap">
                          <SoaleArrowButton
                            href={settings.primaryCtaHref}
                            variant="secondary"
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

                        <p className="mt-4 text-xs text-ink-muted">
                          {settings.supportHours} · 100% Client-Owned Systems
                        </p>
                      </div>

                      <div aria-hidden="true" className="soale-horizon-beam" />
                    </div>
                  )}
                </Container>
              </section>
            );

          /* 16. SIGNATURE SOALE CLOSING CONVERSION BANNER (Dual-Mode Horizon Glow) */
          case "cta_banner": {
            const bannerTitle =
              section.title?.trim() ||
              "Start with one bottleneck. Leave with a clear, written automation plan.";
            const bannerSub =
              section.subtitle?.trim() ||
              "Walk us through where enquiries, support threads, or handoffs slow your team down. You will receive honest architectural guidance — whether we build together or not.";
            const bannerCtaLabel =
              typeof section.config?.ctaLabel === "string" &&
              section.config.ctaLabel.trim()
                ? section.config.ctaLabel.trim()
                : settings.primaryCtaLabel;
            const bannerCtaHref =
              typeof section.config?.ctaHref === "string" &&
              section.config.ctaHref.trim()
                ? section.config.ctaHref.trim()
                : settings.primaryCtaHref;

            return (
              <section
                key={section.id}
                aria-label="Schedule a discovery call"
                className="py-14 sm:py-22"
              >
                <Container>
                  <div
                    data-card-motion-id="home-standalone-cta"
                    data-scroll-card=""
                    className="soale-horizon-card rounded-[28px] px-5 py-12 text-center sm:px-12 sm:py-20"
                  >
                    <div className="relative z-10 mx-auto max-w-3xl">
                      <SoaleEyebrow className="mb-5">
                        Ready When Your Team Is
                      </SoaleEyebrow>
                      <h2
                        data-ve-title=""
                        className="soale-h1 text-ink-heading"
                      >
                        {bannerTitle}
                      </h2>
                      <p
                        data-ve-subtitle=""
                        className="soale-lead mx-auto mt-5 text-ink-body"
                      >
                        {bannerSub}
                      </p>

                      <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4">
                        <SoaleArrowButton
                          href={bannerCtaHref}
                          variant="secondary"
                        >
                          {bannerCtaLabel}
                        </SoaleArrowButton>
                        <SoaleArrowButton
                          href={settings.secondaryCtaHref}
                          variant="outline"
                        >
                          {settings.secondaryCtaLabel}
                        </SoaleArrowButton>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-xs text-ink-muted">
                        <span>{settings.supportHours}</span>
                        <span>·</span>
                        <span>100% Client-Owned Systems</span>
                        <span>·</span>
                        <Link
                          href="/faq"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Read Buyer FAQs
                        </Link>
                      </div>
                    </div>

                    <div aria-hidden="true" className="soale-horizon-beam" />
                  </div>
                </Container>
              </section>
            );
          }

          /* 17. CUSTOM ADMIN RICH TEXT BLOCK */
          case "rich_text": {
            const markdown =
              typeof section.config?.markdown === "string"
                ? section.config.markdown
                : "";
            const blocks = parseSafeMarkdown(markdown);
            return (
              <section key={section.id} className="py-14 sm:py-18">
                <Container>
                  <SoaleCard motionId="app-(website)-page.tsx:6" className="mx-auto max-w-4xl p-7 sm:p-10">
                    {section.title && (
                      <h2
                        data-ve-title=""
                        className="soale-h2 text-ink-heading"
                      >
                        {section.title}
                      </h2>
                    )}
                    {section.subtitle && (
                      <p data-ve-subtitle="" className="soale-lead mt-3">
                        {section.subtitle}
                      </p>
                    )}
                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-body">
                      {blocks.map((blk, i) =>
                        blk.type === "p" ? (
                          <p key={i}>{blk.text}</p>
                        ) : blk.type === "h2" || blk.type === "h3" ? (
                          <h3
                            key={i}
                            className="soale-h3 pt-2 text-ink-heading"
                          >
                            {blk.text}
                          </h3>
                        ) : blk.type === "ul" ? (
                          <ul
                            key={i}
                            className="list-disc space-y-1.5 pl-5 text-ink-body"
                          >
                            {blk.items.map((item, j) => (
                              <li key={j}>{item}</li>
                            ))}
                          </ul>
                        ) : blk.type === "blockquote" ? (
                          <blockquote
                            key={i}
                            className="border-l-2 border-primary/50 pl-4 italic text-ink-muted"
                          >
                            {blk.text}
                          </blockquote>
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
        })();

        if (!rendered) return null;
        return (
          <div
            key={section.id}
            data-ve-section-id={section.id}
            data-ve-section-type={section.type}
          >
            {rendered}
          </div>
        );
      })}
    </div>
  );
}
