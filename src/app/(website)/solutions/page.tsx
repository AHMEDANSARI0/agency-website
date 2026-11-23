import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Globe2, Layers, Users } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const metadata: Metadata = {
  title: "Solutions by Industry",
  description:
    "Practical AI and workflow automation solutions tailored for service businesses, consultants, and small agencies across the USA, UK, and Canada.",
};

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
      { label: "Lead Management & Qualification", href: "/services/lead-management" },
      { label: "Policy-Grounded AI Support", href: "/services/ai-customer-support" },
    ],
  },
  {
    id: "consultants",
    badge: "Consultants & Advisory Firms",
    title: "Independent Consultants, Fractional Leaders & Specialist Practices",
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
      { label: "AI Sales & Lead Intelligence", href: "/services/ai-sales-intelligence" },
      { label: "End-to-End Workflow Automation", href: "/services/workflow-automation" },
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
  const settings = await db.getSiteSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Solutions" }]}
        badge="Industry Playbooks · USA · UK · Canada"
        title="Automation Tailored to How Service Teams Actually Operate"
        description="We focus exclusively on high-touch B2B and B2C service operations—where speed of response, accuracy, and client trust matter far more than novelty."
      />

      {/* Quick Anchor Bar */}
      <div className="border-b border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Jump to profile:
            </span>
            {SEGMENTS.map((seg) => (
              <a
                key={seg.id}
                href={`#${seg.id}`}
                className="rounded-full border border-line bg-surface-muted px-3.5 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary hover:text-primary"
              >
                {seg.badge}
              </a>
            ))}
          </div>
          <Link
            href="/demos?tab=readiness-assessment"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <span>2-Min Readiness Diagnostic</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Container>
      </div>

      {/* Sector Playbooks */}
      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container className="space-y-10">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            return (
              <article
                key={seg.id}
                id={seg.id}
                className="scroll-mt-28 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-control border border-primary/20 bg-accent-subtle text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="accent">{seg.badge}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {seg.recommendedLinks.map((rec) => (
                      <Link
                        key={rec.href}
                        href={rec.href}
                        className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-heading hover:border-primary hover:text-primary"
                      >
                        {rec.label} →
                      </Link>
                    ))}
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-ink-heading">{seg.title}</h2>
                <p className="mt-2.5 max-w-3xl text-base leading-relaxed text-ink-body">
                  {seg.summary}
                </p>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-control border border-line bg-surface-muted p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Typical Bottlenecks We Replace
                    </h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-ink-body">
                      {seg.bottlenecks.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-control border border-primary/20 bg-accent-subtle/45 p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      High-ROI Workflows Implemented
                    </h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-ink-body">
                      {seg.automations.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href={`/contact?service=${encodeURIComponent(seg.badge)}`}>
                    <Button size="md">
                      Discuss {seg.badge} Automation
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demos">
                    <Button variant="secondary" size="md">
                      Try Live Simulator
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </Container>
      </section>

      {/* Regional Alignment Block */}
      <section className="bg-surface-muted/45 py-16">
        <Container>
          <div className="grid items-center gap-8 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-primary">
                <Globe2 className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Cross-Market Delivery
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-ink-heading sm:text-2xl">
                Built for US, UK &amp; Canadian Regulatory and Timezone Realities
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-body">
                Whether your team operates in New York, London, Toronto, or distributed across regions, our workflows respect regional privacy consent norms, multi-currency reporting (USD, GBP, CAD), and overlapping EST/GMT review windows.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:col-span-5">
              {[
                { region: "USA", currency: "USD ($)", zone: "EST / CST / PST" },
                { region: "United Kingdom", currency: "GBP (£)", zone: "GMT / BST" },
                { region: "Canada", currency: "CAD ($)", zone: "EST / PST" },
              ].map((m) => (
                <div
                  key={m.region}
                  className="rounded-xl border border-line bg-surface-muted p-4 text-center"
                >
                  <p className="text-sm font-bold text-ink-heading">{m.region}</p>
                  <p className="mt-1 font-mono text-xs text-primary">{m.currency}</p>
                  <p className="mt-1 font-mono text-[0.68rem] text-ink-muted">{m.zone}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Tailored Scoping"
        title="Operate a specialist practice with unique compliance or routing rules?"
        description="Tell us how enquiries and client tasks move through your firm today. We will design a deterministic architecture around your exact stack."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
