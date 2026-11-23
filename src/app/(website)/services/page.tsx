import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  Layers,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Automation & Business Services",
  description:
    "Explore OmniFlow’s core automation services: Lead Management, Policy-Grounded AI Customer Support, Workflow Automation, and five specialized AI practice pillars.",
};

export default async function ServicesIndexPage() {
  const [services, pillars, settings] = await Promise.all([
    db.listServices(true),
    db.getServicePillars(),
    db.getSiteSettings(),
  ]);

  const flagship = services.filter((s) => s.isFlagshipPriority);
  const additional = services.filter((s) => !s.isFlagshipPriority);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Services" }]}
        badge="Capabilities & Systems Architecture"
        title="Practical AI & Workflow Systems Built for Reliability"
        description="Every OmniFlow engagement prioritizes deterministic validation, clear human escalation paths, and lean ongoing operating costs across US, UK, and Canadian teams."
      />

      {/* Flagship Priority Services */}
      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <Badge variant="accent">Priority Implementation Focus</Badge>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
                Three Flagship Revenue &amp; Operations Systems
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-body sm:text-base">
                Designed to solve the three highest-friction bottlenecks in service businesses, advisory practices, and boutique agencies.
              </p>
            </div>
            <Link
              href="/demos"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              <span>Test live interactive demos</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {flagship.map((service, idx) => (
              <article
                key={service.id}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-7 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">{service.badgeLabel}</Badge>
                    <span className="font-mono text-xs font-semibold text-ink-muted">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink-heading">
                    <Link href={`/services/${service.slug}`} className="hover:text-primary">
                      {service.title}
                    </Link>
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {service.shortSummary}
                  </p>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Key Outcomes
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {service.benefits.slice(0, 3).map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs text-ink-body sm:text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                  >
                    View full specification
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/contact?service=${encodeURIComponent(service.slug)}&intent=call&source=services_flagship_${encodeURIComponent(service.slug)}`}
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

      {/* Five AI Practice Pillars */}
      <section className="border-b border-line bg-surface-muted/45 py-16 sm:py-22">
        <Container>
          <div className="max-w-2xl">
            <Badge>Practice Architecture</Badge>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
              Five Core AI &amp; Automation Capability Pillars
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-body sm:text-base">
              Comprehensive engineering coverage across your revenue pipeline, client experience, internal operations, reporting, and custom internal tools.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {additional.map((service) => {
              const matchingPillar = pillars.find((p) => p.slug === service.slug);
              return (
                <article
                  key={service.id}
                  className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge>
                        {matchingPillar ? `Pillar 0${matchingPillar.number}` : service.badgeLabel}
                      </Badge>
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-ink-heading">
                      <Link href={`/services/${service.slug}`} className="hover:text-primary">
                        {service.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-body">
                      {service.shortSummary}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Explore capability details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/contact?service=${encodeURIComponent(service.slug)}&intent=call&source=services_pillar_${encodeURIComponent(service.slug)}`}
                      className="font-mono text-xs text-ink-muted hover:text-ink-heading"
                    >
                      Book call →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Engineering Guarantees Included in Every Service */}
      <section className="bg-surface py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="accent">Standard Engineering Deliverables</Badge>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
              Included in Every OmniFlow Implementation
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileCheck2,
                title: "Written Scope & Schemas",
                detail: "Explicit input validation rules, field mappings, and fallback paths documented before build.",
              },
              {
                icon: ShieldCheck,
                title: "Policy-Bounded AI Guardrails",
                detail: "Strict separation between deterministic business logic and bounded AI classification.",
              },
              {
                icon: Workflow,
                title: "Staging Edge-Case Testing",
                detail: "Verified against duplicate webhooks, malformed inputs, and third-party API timeouts.",
              },
              {
                icon: Database,
                title: "100% Ownership & Runbooks",
                detail: "Full administrative access, repository/workflow ownership, and plain-English team guides.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-subtle text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-ink-heading">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-body sm:text-sm">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Custom Workflow Scoping"
        title="Not sure which system fits your highest-friction bottleneck?"
        description="Share your current tools and team workflow. We will recommend the leanest, most reliable starting point within one business day."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
