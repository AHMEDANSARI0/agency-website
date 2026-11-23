import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { LightUpText } from "@/components/animations/LightUpText";
import { PinnedHero } from "@/components/sections/PinnedHero";
import { WorkflowDiagram } from "@/components/sections/WorkflowDiagram";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import type { PageSectionBlock, PageSectionType } from "@/types/content";

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
  "Salesforce",
  "Slack Workflows",
  "PostgreSQL",
  "Google Workspace",
  "Stripe Billing",
];

const ECOSYSTEM_ROW_2 = [
  "Notion Ops",
  "Zendesk & Intercom",
  "Calendly Routing",
  "Airtable Bases",
  "REST & Webhooks",
  "Supabase Auth",
];

const LEAK_ITEMS = [
  {
    num: "01",
    title: "Missed leads",
    detail: "High-intent enquiries go cold in shared inboxes across time zones.",
  },
  {
    num: "02",
    title: "Slow follow-ups",
    detail: "Every discovery reply and pre-call brief is written from scratch.",
  },
  {
    num: "03",
    title: "Repetitive admin",
    detail: "Skilled specialists spend billable hours copying fields between tabs.",
  },
  {
    num: "04",
    title: "Disconnected tools",
    detail: "CRM, inbox, docs, and project boards each hold a fragment of truth.",
  },
  {
    num: "05",
    title: "Manual reporting",
    detail: "Pipeline and capacity numbers arrive late and take hours to compile.",
  },
];

const MORNING_TIMELINE = [
  { step: "Enquiry lands from website", time: "09:02:00", actor: "machine" },
  { step: "Fit, urgency & duplicate check run", time: "09:02:03", actor: "machine" },
  { step: "CRM record & pre-call brief created", time: "09:02:06", actor: "machine" },
  { step: "Grounded reply drafted for review", time: "09:02:09", actor: "machine" },
  { step: "Reviewed, approved & sent by partner", time: "09:05:30", actor: "human" },
];

const EXECUTION_TRACE = [
  { label: "Rate-limit & CSRF guard", state: "ran", color: "bg-[#3C8F6A] text-[#3C8F6A]" },
  { label: "Zod input schema validation", state: "ran", color: "bg-[#3C8F6A] text-[#3C8F6A]" },
  { label: "Approved SOP policy retrieval", state: "ran", color: "bg-[#3C8F6A] text-[#3C8F6A]" },
  { label: "CRM structured brief synthesis", state: "ran", color: "bg-[#3C8F6A] text-[#3C8F6A]" },
  { label: "External email outage fallback", state: "simulated", color: "bg-[#E6A92E] text-[#E6A92E]" },
];

export default async function HomePage() {
  const [
    homePage,
    settings,
    pillars,
    services,
    caseStudies,
    blogPosts,
    faqs,
    team,
    testimonials,
  ] = await Promise.all([
    db.getPageBySlug("home"),
    db.getSiteSettings(),
    db.getServicePillars(),
    db.listServices(true),
    db.listCaseStudies(true),
    db.listBlogPosts(true),
    db.listFaqs(true),
    db.listTeamMembers(true),
    db.listTestimonials(true),
  ]);

  const flagshipServices = services.filter((s) => s.isFlagshipPriority);
  const founder = team.find((m) => m.isFounder) ?? team[0];

  const orderedSections: PageSectionBlock[] = homePage?.sections
    ? [...homePage.sections]
        .filter((s) => s.isVisible)
        .sort((a, b) => a.order - b.order)
    : ([
        "hero",
        "problems_outcomes",
        "services_overview",
        "how_it_works",
        "workflow_demo",
        "industry_use_cases",
        "case_studies_highlight",
        "founder_intro",
        "testimonials",
        "faq_section",
        "cta_banner",
      ] as PageSectionType[]).map((type, idx) => ({
        id: `default_${type}`,
        type,
        title: type,
        isVisible: true,
        order: idx + 1,
        config: {},
      }));

  const renderSection = (block: PageSectionBlock) => {
    const type = block.type;
    switch (type) {
      case "hero":
        return (
          <div key="hero">
            <PinnedHero
              companyName={settings.companyName}
              tagline={settings.tagline}
              primaryCtaLabel={settings.primaryCtaLabel}
              primaryCtaHref={settings.primaryCtaHref}
              secondaryCtaLabel={settings.secondaryCtaLabel}
              secondaryCtaHref={settings.secondaryCtaHref}
            />

            {/* Purpose Word-by-Word Scroll LightUp */}
            <section className="py-20 sm:py-28">
              <Container>
                <p className="t-eyebrow mb-5">Our purpose</p>
                <LightUpText
                  text="We connect deterministic automation and grounded AI to your everyday operations. Not fragile hype. An engineering partner that audits, integrates, and delivers."
                  accentWords={["deterministic", "grounded", "integrates", "delivers"]}
                  className="max-w-5xl text-[clamp(1.75rem,3.8vw,3.35rem)] font-medium leading-[1.16] tracking-tight"
                />
              </Container>
            </section>

            {/* Connected Ecosystem Dual-Row Smooth Marquee (100% Truthful Integration Stack) */}
            <section className="overflow-hidden border-y border-line py-12 sm:py-16">
              <Container className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="t-eyebrow">Connected stack</p>
                  <h2 className="mt-2 text-xl font-medium tracking-tight text-ink-heading sm:text-2xl">
                    Built to orchestrate the tools your team already relies on
                  </h2>
                </div>
                <p className="font-mono text-xs text-ink-muted">
                  USA · United Kingdom · Canada
                </p>
              </Container>

              <div className="space-y-3">
                <div className="flex w-max animate-marquee gap-3">
                  {[...ECOSYSTEM_ROW_1, ...ECOSYSTEM_ROW_1, ...ECOSYSTEM_ROW_1].map(
                    (tool, idx) => (
                      <span
                        key={`r1-${idx}`}
                        className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-card px-5 py-2.5 font-mono text-xs tracking-wide text-ink-heading"
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
                        className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-card px-5 py-2.5 font-mono text-xs tracking-wide text-ink-body"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E6A92E]" />
                        {tool}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>
          </div>
        );

      case "problems_outcomes":
        return (
          <section key="problems_outcomes" className="border-b border-line py-20 sm:py-28">
            <Container>
              <div data-reveal="">
                <p className="t-eyebrow text-primary">01 — The problem</p>
                <h2 className="t-display mt-3 text-ink-heading">
                  Where operational hours <em>leak.</em>
                </h2>
                <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-ink-body sm:text-lg">
                  Growing service businesses rarely have a talent problem — they have an
                  operational handoff problem across inboxes, spreadsheets, and disconnected tools.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {LEAK_ITEMS.map((item, idx) => (
                  <div
                    key={item.num}
                    data-reveal=""
                    style={{ "--d": idx } as React.CSSProperties}
                    className="spot rounded-card border border-line bg-surface-card p-6 shadow-card transition-colors hover:border-line-strong"
                  >
                    <span className="font-mono text-xs text-primary">{item.num}</span>
                    <h3 className="mt-4 text-lg font-medium text-ink-heading">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-light leading-relaxed text-ink-body">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        );

      case "how_it_works":
        return (
          <section key="how_it_works" className="border-b border-line py-20 sm:py-28">
            <Container>
              <div className="grid items-start gap-12 lg:grid-cols-12">
                <div data-reveal="left" className="lg:col-span-5">
                  <p className="t-eyebrow text-primary">02 — A morning, rebalanced</p>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Nine seconds of machine. <em>One human decision.</em>
                  </h2>
                  <p className="mt-4 text-base font-light leading-relaxed text-ink-body">
                    Instead of discovering a high-fit enquiry hours later, OmniFlow validates,
                    enriches, and prepares a grounded brief immediately — leaving the final
                    relationship decision with your team.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href="/demos?tab=lead-qualification"
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-[0_10px_36px_-10px_rgba(210,58,31,0.7)] transition-all hover:bg-primary-hover"
                    >
                      <span>Run it on a sample enquiry</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/how-it-works"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-5 py-3 text-sm font-medium text-ink-heading hover:bg-surface-muted"
                    >
                      <span>4-Step Delivery Guide</span>
                    </Link>
                  </div>
                </div>

                <div
                  data-reveal="right"
                  className="spot rounded-card border border-line bg-surface-card p-6 shadow-card sm:p-8 lg:col-span-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 font-mono text-xs">
                    <span className="text-primary">9 s · automated prep</span>
                    <span className="text-ink-muted">3 min · partner approval</span>
                  </div>

                  <ol className="mt-5 space-y-3">
                    {MORNING_TIMELINE.map((row, idx) => (
                      <li
                        key={row.time}
                        className="flex items-center justify-between gap-4 rounded-xl border border-line/70 bg-surface-muted/50 px-4 py-3 text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-ink-muted">
                            0{idx + 1}
                          </span>
                          <span className="font-medium text-ink-heading">
                            {row.step}
                          </span>
                        </span>
                        <span
                          className={`font-mono text-xs ${
                            row.actor === "human" ? "text-[#E6A92E]" : "text-primary"
                          }`}
                        >
                          {row.time}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <p className="mt-4 font-mono text-[11px] text-ink-muted">
                    Illustrative reference workflow — not a fabricated client metric.
                  </p>
                </div>
              </div>
            </Container>
          </section>
        );

      case "workflow_demo":
        return (
          <section key="workflow_demo" className="border-b border-line bg-surface-muted/40 py-20 sm:py-24">
            <Container>
              <div data-reveal="" className="mb-8 max-w-2xl">
                <p className="t-eyebrow">Interactive Pipeline Inspector</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink-heading sm:text-3xl">
                  Inspect every handoff from intake to human escalation
                </h2>
              </div>
              <WorkflowDiagram />
            </Container>
          </section>
        );

      case "services_overview":
        return (
          <section key="services_overview" className="border-b border-line py-20 sm:py-28">
            <Container>
              <div
                data-reveal=""
                className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
              >
                <div className="max-w-2xl">
                  <p className="t-eyebrow text-primary">03 — Flagship systems &amp; pillars</p>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Practical architectures built for <em>reliability.</em>
                  </h2>
                </div>
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-heading hover:text-primary"
                >
                  <span>All 8 service specifications</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {flagshipServices.map((service, idx) => (
                  <article
                    key={service.id}
                    data-reveal=""
                    style={{ "--d": idx } as React.CSSProperties}
                    className="spot flex flex-col justify-between rounded-card border border-line bg-surface-card p-7 shadow-card transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div>
                      <span className="inline-block rounded-full bg-accent-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-primary">
                        {service.badgeLabel}
                      </span>
                      <h3 className="mt-5 text-2xl font-medium tracking-tight text-ink-heading">
                        <Link
                          href={`/services/${service.slug}`}
                          className="hover:text-primary"
                        >
                          {service.title}
                        </Link>
                      </h3>
                      <p className="mt-3 text-sm font-light leading-relaxed text-ink-body">
                        {service.shortSummary}
                      </p>
                      <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                        {service.benefits.slice(0, 3).map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-2.5 text-xs text-ink-body"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-7 pt-2">
                      <Link
                        href={`/services/${service.slug}`}
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-link hover:text-link-hover"
                      >
                        <span>Explore architecture</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* 5 Practice Pillars Strip */}
              <div className="mt-10 flex flex-wrap items-center gap-2.5 pt-2">
                <span className="mr-2 font-mono text-xs uppercase tracking-wider text-ink-muted">
                  Practice Pillars:
                </span>
                {pillars.map((pillar) => (
                  <Link
                    key={pillar.id}
                    href={`/services/${pillar.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-4 py-2 text-xs font-medium text-ink-heading transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="font-mono text-[11px] text-primary">
                      0{pillar.number}
                    </span>
                    <span>{pillar.name}</span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        );

      case "industry_use_cases":
        return (
          <section
            key="industry_use_cases"
            className="border-b border-line bg-surface-muted/35 py-20 sm:py-24"
          >
            <Container>
              <div data-reveal="" className="max-w-2xl">
                <p className="t-eyebrow">Who we build for</p>
                <h2 className="t-display mt-3 text-ink-heading">
                  Businesses that run on <em>conversations.</em>
                </h2>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  {
                    title: "Consultants & Advisory Firms",
                    desc: "Automated discovery briefs, document intake checklists, and SOP-grounded client Q&A across US, UK, and Canadian practices.",
                    href: "/solutions#consultants",
                  },
                  {
                    title: "Small & Boutique Agencies",
                    desc: "Instant retainer qualification, automated kickoff workspace provisioning, and recurring client status aggregation.",
                    href: "/solutions#agencies",
                  },
                  {
                    title: "Specialist Service Operators",
                    desc: "24/7 structured enquiry capture, duplicate detection, and deterministic routing so after-hours leads never slip away.",
                    href: "/solutions#service-businesses",
                  },
                ].map((segment, idx) => (
                  <Link
                    key={segment.title}
                    href={segment.href}
                    data-reveal=""
                    style={{ "--d": idx } as React.CSSProperties}
                    className="spot group flex flex-col justify-between rounded-card border border-line bg-surface-card p-7 shadow-card transition-colors hover:border-line-strong"
                  >
                    <div>
                      <h3 className="text-xl font-medium text-ink-heading group-hover:text-primary">
                        {segment.title}
                      </h3>
                      <p className="mt-3 text-sm font-light leading-relaxed text-ink-body">
                        {segment.desc}
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs text-link">
                      <span>See workflows</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        );

      case "case_studies_highlight":
        return (
          <section key="case_studies_highlight" className="border-b border-line py-20 sm:py-28">
            <Container>
              {/* 04 — Proof Over Promise + Live Execution Trace */}
              <div className="grid items-center gap-10 lg:grid-cols-12">
                <div data-reveal="left" className="lg:col-span-6">
                  <p className="t-eyebrow text-primary">04 — Proof over promise</p>
                  <h2 className="t-display mt-3 text-ink-heading">
                    Don&apos;t take our word for it.
                  </h2>
                  <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-ink-body">
                    Test our five deterministic simulators with your own lead scenarios, support
                    questions, and team numbers — or inspect our transparently labeled reference
                    architectures.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/demos"
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-[0_10px_36px_-10px_rgba(210,58,31,0.7)] hover:bg-primary-hover"
                    >
                      <span>Try all 5 interactive demos</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/case-studies"
                      className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-medium text-ink-heading hover:bg-surface-muted"
                    >
                      <span>Reference Case Studies</span>
                    </Link>
                  </div>
                </div>

                <div
                  data-reveal="right"
                  className="blueprint spot rounded-card border border-line bg-surface-card p-6 shadow-card sm:p-8 lg:col-span-6"
                >
                  <div className="flex items-center justify-between border-b border-line pb-3 font-mono text-xs">
                    <span className="text-ink-heading">Execution trace — format</span>
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] text-ink-muted">
                      Illustrative
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {EXECUTION_TRACE.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5 font-mono text-xs"
                      >
                        <span className="text-ink-heading">{item.label}</span>
                        <span className={`inline-flex items-center gap-1.5 ${item.color.split(" ")[1]}`}>
                          <span
                            className={`h-2 w-2 rounded-full ${item.color.split(" ")[0]}`}
                          />
                          {item.state}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 font-mono text-[11px] text-ink-muted">
                    Every step is marked ran, simulated, or escalated. Never a fake success.
                  </p>
                </div>
              </div>

              {/* Labeled Case Study Cards */}
              <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {caseStudies.slice(0, 3).map((cs, idx) => {
                  const meta = WORK_TYPE_META[cs.workType];
                  return (
                    <article
                      key={cs.id}
                      data-reveal=""
                      style={{ "--d": idx } as React.CSSProperties}
                      className="spot flex flex-col justify-between rounded-card border border-line bg-surface-card p-6 shadow-card"
                    >
                      <div>
                        <span className="inline-block rounded-full border border-line-strong bg-surface-muted px-3 py-1 font-mono text-[11px] text-ink-muted">
                          {meta.label}
                        </span>
                        <h3 className="mt-4 text-xl font-medium text-ink-heading">
                          <Link
                            href={`/case-studies/${cs.slug}`}
                            className="hover:text-primary"
                          >
                            {cs.title}
                          </Link>
                        </h3>
                        <p className="mt-1 font-mono text-xs text-ink-muted">
                          {cs.industry}
                        </p>
                        <p className="mt-3 text-sm font-light leading-relaxed text-ink-body">
                          {cs.problemSummary}
                        </p>
                      </div>
                      <div className="mt-6 border-t border-line pt-4">
                        <Link
                          href={`/case-studies/${cs.slug}`}
                          className="group inline-flex items-center gap-1.5 font-mono text-xs text-link hover:text-link-hover"
                        >
                          <span>Inspect blueprint</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Container>
          </section>
        );

      case "founder_intro":
        return (
          <section key="founder_intro" className="border-b border-line py-20 sm:py-28">
            <Container className="space-y-16">
              <div>
                <p className="t-eyebrow mb-4">Our mission</p>
                <LightUpText
                  text="Give growing service firms the operating leverage of a much larger organization, without losing the human judgment clients hired them for."
                  accentWords={["leverage", "human", "judgment"]}
                  className="max-w-5xl text-[clamp(1.65rem,3.4vw,3rem)] font-medium leading-[1.18] tracking-tight"
                />

                <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {[
                    {
                      stage: "01 · Today",
                      title: "Solve specific bottlenecks properly",
                      desc: "One high-friction lead, support, or onboarding workflow at a time.",
                    },
                    {
                      stage: "02 · Next",
                      title: "Turn proven flows into team standards",
                      desc: "Documented schemas, fallback paths, and clean internal handover.",
                    },
                    {
                      stage: "03 · Horizon",
                      title: "Compounding operational capacity",
                      desc: "Scale client delivery across USA, UK, and Canada without admin bloat.",
                    },
                  ].map((item) => (
                    <div
                      key={item.stage}
                      className="spot rounded-card border border-line bg-surface-card p-6 shadow-card"
                    >
                      <span className="font-mono text-xs text-primary">{item.stage}</span>
                      <h3 className="mt-3 text-lg font-medium text-ink-heading">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm font-light text-ink-body">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {founder && (
                <div
                  data-reveal=""
                  className="spot flex flex-col justify-between gap-8 rounded-card border border-line bg-surface-card p-8 shadow-card lg:flex-row lg:items-center lg:p-10"
                >
                  <div className="max-w-2xl">
                    <p className="t-eyebrow text-primary">Founder &amp; Principal Architect</p>
                    <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink-heading sm:text-3xl">
                      {founder.name} · {settings.companyName}
                    </h2>
                    <p className="mt-3 text-base font-light leading-relaxed text-ink-body">
                      {founder.bio}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link
                      href="/team"
                      className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-heading hover:bg-surface-muted"
                    >
                      Founder &amp; Team
                    </Link>
                    <Link
                      href="/about"
                      className="rounded-full bg-surface-muted px-5 py-2.5 text-sm font-medium text-ink-heading hover:opacity-90"
                    >
                      About {settings.companyName}
                    </Link>
                  </div>
                </div>
              )}

              {/* 05 — Insights Preview */}
              {blogPosts.length > 0 && (
                <div>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <p className="t-eyebrow text-primary">05 — Insights</p>
                      <h2 className="t-display mt-2 text-ink-heading">
                        Thinking out loud.
                      </h2>
                    </div>
                    <Link
                      href="/blog"
                      className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-heading hover:text-primary"
                    >
                      <span>All articles</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {blogPosts.slice(0, 3).map((post, idx) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        data-reveal=""
                        style={{ "--d": idx } as React.CSSProperties}
                        className="spot group flex flex-col justify-between rounded-card border border-line bg-surface-card p-6 shadow-card transition-colors hover:border-line-strong"
                      >
                        <div>
                          <p className="font-mono text-xs text-ink-muted">
                            {post.category} · {post.readingTimeMinutes} min
                          </p>
                          <h3 className="mt-3 text-lg font-medium leading-snug text-ink-heading group-hover:text-primary">
                            {post.title}
                          </h3>
                          <p className="mt-2.5 line-clamp-3 text-sm font-light text-ink-body">
                            {post.excerpt}
                          </p>
                        </div>
                        <span className="mt-6 inline-flex items-center gap-1 font-mono text-xs text-link">
                          <span>Read</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Container>
          </section>
        );

      case "testimonials":
        if (testimonials.length === 0) return null;
        return (
          <section key="testimonials" className="border-b border-line py-20">
            <Container>
              <p className="t-eyebrow text-primary">Verified Client Feedback</p>
              <h2 className="t-display mt-2 text-ink-heading">Authorized Reviews</h2>
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                {testimonials.map((t) => (
                  <blockquote
                    key={t.id}
                    className="spot rounded-card border border-line bg-surface-card p-7 shadow-card"
                  >
                    <p className="text-base italic font-light leading-relaxed text-ink-body">
                      “{t.quote}”
                    </p>
                    <footer className="mt-4 font-mono text-xs text-ink-heading">
                      {t.authorName} · {t.authorRole}, {t.companyName} ({t.country})
                    </footer>
                  </blockquote>
                ))}
              </div>
            </Container>
          </section>
        );

      case "faq_section":
        return (
          <section key="faq_section" className="py-20 sm:py-28">
            <Container className="max-w-4xl">
              <div data-reveal="">
                <p className="t-eyebrow text-primary">Common Questions</p>
                <h2 className="t-display mt-3 text-ink-heading">
                  Questions owners ask us
                </h2>
              </div>

              <div className="mt-10 divide-y divide-line border-y border-line">
                {faqs.slice(0, 6).map((faq) => (
                  <details key={faq.id} className="more py-5">
                    <summary className="flex items-center justify-between gap-4 text-left text-lg font-medium text-ink-heading">
                      <span>{faq.question}</span>
                      <span className="more-icon grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink-muted">
                        <Plus className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-ink-body">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-link hover:text-link-hover"
                >
                  <span>Browse full FAQ library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Container>
          </section>
        );

      case "cta_banner":
        return (
          <section key="cta_banner" className="px-2 pb-6 sm:px-3 sm:pb-8">
            <div
              className="on-dark grain mx-auto max-w-[1380px] overflow-hidden rounded-[22px] border border-white/10 px-6 py-20 text-center sm:rounded-[28px] sm:px-12 sm:py-28"
              style={{
                background:
                  "radial-gradient(110% 90% at 50% 100%, #9C240E 0%, #4D1108 42%, #140A07 76%, #0B0908 100%)",
              }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#CFC4B4]">
                Start a project
              </p>
              <h2 className="t-display mx-auto mt-4 max-w-3xl text-[#F2EADB]">
                Let&apos;s find the balance in your operations.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-[#F2EADB]/85 sm:text-lg">
                Tell us what slows your team down. We&apos;ll tell you honestly what should be
                automated deterministically, where AI helps, and what stays human.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={settings.primaryCtaHref}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#F2EADB] px-6 py-3.5 text-sm font-medium text-[#0B0908] transition-all hover:bg-[#FFE3CC] active:scale-[0.97]"
                >
                  <span>{settings.primaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/demos"
                  className="inline-flex items-center gap-2 rounded-full border border-[#F2EADB]/30 px-6 py-3.5 text-sm font-medium text-[#F2EADB] transition-colors hover:bg-[#F2EADB]/10 active:scale-[0.97]"
                >
                  <span>Test a live workflow</span>
                </Link>
              </div>
            </div>
          </section>
        );

      case "rich_text": {
        const md =
          typeof block.config?.markdown === "string"
            ? block.config.markdown
            : "";
        const mdBlocks = parseSafeMarkdown(md);
        return (
          <section key={block.id} className="border-t border-line py-20 sm:py-24">
            <Container className="max-w-4xl">
              <p className="t-eyebrow text-primary">Editorial Note</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink-heading sm:text-3xl">
                {block.title}
              </h2>
              {block.subtitle && (
                <p className="mt-2 text-base font-light text-ink-muted">
                  {block.subtitle}
                </p>
              )}
              {mdBlocks.length > 0 && (
                <div className="mt-6 space-y-4 text-base font-light leading-relaxed text-ink-body">
                  {mdBlocks.map((mb, idx) => {
                    if (mb.type === "h2") {
                      return (
                        <h3
                          key={idx}
                          className="pt-4 text-xl font-medium text-ink-heading"
                        >
                          {mb.text}
                        </h3>
                      );
                    }
                    if (mb.type === "h3") {
                      return (
                        <h4
                          key={idx}
                          className="pt-2 text-lg font-medium text-ink-heading"
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

  return <>{orderedSections.map((block) => renderSection(block))}</>;
}
