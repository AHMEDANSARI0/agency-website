import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Globe2,
  Layers,
  Users,
} from "lucide-react";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
} from "@/components/ui/soale";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("solutions");
}

const SEGMENTS = [
  {
    id: "service-businesses",
    badge: "Service Businesses",
    title: "Local, Regional & Commercial Service Operators",
    icon: Briefcase,
    summary:
      "Respond to inbound quote requests faster, eliminate missed after-hours enquiries, and keep scheduling and CRM records synchronized without hiring extra admin staff.",
    bottlenecks: [
      "Missed calls or web enquiries sitting unanswered overnight or on weekends",
      "Staff manually copying enquiry details from email into spreadsheets or job boards",
      "Inconsistent follow-up on pending quotes and service renewals",
    ],
    automations: [
      "Instant multi-channel lead capture with structured qualification questions",
      "Automated routing by service area, postcode/ZIP, or job urgency",
      "Policy-grounded FAQ assistant for hours, service scope, and booking preparation",
    ],
    recommendedLinks: [
      {
        label: "Lead Management & Qualification",
        href: "/services/lead-management",
      },
      {
        label: "Policy-Grounded AI Support",
        href: "/services/ai-customer-support",
      },
    ],
  },
  {
    id: "consultants",
    badge: "Consultants & Advisory Firms",
    title:
      "Independent Consultants, Fractional Leaders & Specialist Practices",
    icon: Users,
    summary:
      "Protect billable hours by automating prospect qualification, pre-call discovery briefs, client onboarding intake, and routine document follow-ups.",
    bottlenecks: [
      "Discovery calls booked by unqualified or out-of-scope prospects",
      "Hours spent chasing onboarding questionnaires and engagement documents",
      "Context scattered across email threads, calendar notes, and Notion/Docs",
    ],
    automations: [
      "Pre-booking intake scoring + automated pre-call summary brief in your inbox",
      "Triggered client onboarding checklist & folder provisioning once a proposal is signed",
      "Internal research & meeting-note synthesis grounded in your own methodology",
    ],
    recommendedLinks: [
      {
        label: "AI Sales & Lead Intelligence",
        href: "/services/ai-sales-intelligence",
      },
      {
        label: "End-to-End Workflow Automation",
        href: "/services/workflow-automation",
      },
    ],
  },
  {
    id: "agencies",
    badge: "Small & Boutique Agencies",
    title: "Marketing, Creative, Technical & Recruitment Agencies",
    icon: Layers,
    summary:
      "Standardize client intake, eliminate chaotic handoffs between sales and delivery, and automate recurring status updates so your team stays focused on client results.",
    bottlenecks: [
      "Sales-to-delivery handoffs missing critical brief details or asset links",
      "Account managers manually compiling weekly reporting emails from 4+ tools",
      "Scope-creep support requests arriving across Slack, email, and forms",
    ],
    automations: [
      "Automated deal-won kickoff workflow (project board, intake form, Slack alert)",
      "Structured client request triage with SLA tracking and escalation rules",
      "Automated KPI digest drafts ready for account-manager review before sending",
    ],
    recommendedLinks: [
      { label: "AI Operations & Workflows", href: "/services/ai-operations" },
      { label: "AI Data & Analytics", href: "/services/ai-analytics" },
    ],
  },
];

export default async function SolutionsPage() {
  const settings = await getCachedSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        breadcrumbs={[{ label: "Solutions" }]}
        badge="Industry Playbooks · USA · UK · Canada"
        title="Automation Tailored to How Service Teams Actually Operate"
        description="We focus exclusively on high-touch B2B and B2C service operations — where speed of response, accuracy, and client trust matter far more than novelty."
      />

      {/* Quick Anchor Bar */}
      <div className="border-b border-line bg-surface-card/70">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Jump to profile:
            </span>
            {SEGMENTS.map((seg) => (
              <a
                key={seg.id}
                href={`#${seg.id}`}
                className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary hover:text-primary"
              >
                {seg.badge}
              </a>
            ))}
          </div>
          <SoaleArrowButton
            href="/demos?tab=readiness-assessment"
            variant="outline"
            size="sm"
          >
            2-Min Readiness Diagnostic
          </SoaleArrowButton>
        </Container>
      </div>

      {/* Sector Playbooks */}
      <section className="border-b border-line py-16 sm:py-24">
        <Container className="space-y-10">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            return (
              <SoaleCard
                key={seg.id}
                as="article"
                className="scroll-mt-28 p-6 sm:p-10"
              >
                <div
                  id={seg.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-accent-subtle text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <SoaleChip active>{seg.badge}</SoaleChip>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {seg.recommendedLinks.map((rec) => (
                      <Link
                        key={rec.href}
                        href={rec.href}
                        className="rounded-full border border-line bg-surface-muted px-3.5 py-1.5 text-xs font-medium text-ink-heading transition-colors hover:border-primary hover:text-primary"
                      >
                        {rec.label} →
                      </Link>
                    ))}
                  </div>
                </div>

                <h2 className="soale-h3 mt-5 text-ink-heading">{seg.title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-body">
                  {seg.summary}
                </p>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-line bg-surface-muted/80 p-5 sm:p-6">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Typical Bottlenecks We Replace
                    </h3>
                    <ul className="mt-3.5 space-y-2.5 text-sm text-ink-body">
                      {seg.bottlenecks.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[20px] border border-primary/25 bg-accent-subtle/70 p-5 sm:p-6">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      High-Impact Workflows Implemented
                    </h3>
                    <ul className="mt-3.5 space-y-2.5 text-sm text-ink-heading">
                      {seg.automations.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <SoaleArrowButton
                    href={`/contact?service=${encodeURIComponent(seg.badge)}`}
                    variant="primary"
                  >
                    Discuss {seg.badge} Automation
                  </SoaleArrowButton>
                  <SoaleArrowButton href="/demos" variant="surface">
                    Try Live Simulator
                  </SoaleArrowButton>
                </div>
              </SoaleCard>
            );
          })}
        </Container>
      </section>

      {/* Regional Alignment Block */}
      <section className="bg-canvas-tertiary/40 py-16 sm:py-20">
        <Container>
          <SoaleCard className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 text-primary">
                <Globe2 className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Cross-Market Delivery
                </span>
              </div>
              <h2 className="soale-h3 mt-3 text-ink-heading">
                Aligned with {settings.targetMarkets.join(", ")} Business Hours
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-body sm:text-base">
                {settings.supportHours}. Multi-currency workflows, regional
                privacy compliance, and clear English documentation come
                standard.
              </p>
            </div>
            <div className="flex lg:col-span-4 lg:justify-end">
              <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
                {settings.primaryCtaLabel}
              </SoaleArrowButton>
            </div>
          </SoaleCard>
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Tailored Architecture"
        title="Don’t see your exact industry listed?"
        description="If your team handles inbound leads, customer enquiries, or multi-tool handoffs, we can design a reliable workflow around your stack."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
