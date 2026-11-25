import React from "react";
import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  getCachedPublishedServices,
  getCachedServicePillars,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleSectionHeader,
} from "@/components/ui/soale";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("services");
}

export default async function ServicesIndexPage() {
  const [services, pillars, settings] = await Promise.all([
    getCachedPublishedServices(),
    getCachedServicePillars(),
    getCachedSiteSettings(),
  ]);

  const orderedServices = [...services].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="services"
        breadcrumbs={[{ label: "Services" }]}
        badge="AI & Workflow Services"
        title="Practical AI Workflows With Human Approval Built In"
        description="Start with one daily bottleneck or connect your wider stack. Every workflow includes strict validation rules, human sign-off on important steps, and 100% client ownership."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton href="/demos" variant="surface">
              See live demo
            </SoaleArrowButton>
          </>
        }
      />

      {/* Signature Soale Sticky Stacking .service-grid Deck (All 8 OmniFlow Services) */}
      <section className="border-b border-line py-20 sm:py-28">
        <Container>
          <SoaleSectionHeader
            align="split"
            eyebrow="Full Practice Catalog (01 — 08)"
            title="Three flagship revenue & ops cores plus five modular practice pillars."
            description="Scroll through our 8 specialized implementations below — inspect the operational bottleneck eliminated, verified outcomes, and delivery architecture for each system."
            action={
              <SoaleArrowButton href="/pricing" variant="outline" size="sm">
                View Engagement Scopes
              </SoaleArrowButton>
            }
          />

          <div className="mt-14 space-y-8">
            {orderedServices.map((service, idx) => {
              const matchingPillar = pillars.find(
                (p) => p.slug === service.slug
              );
              const stickyTopPx = 104 + Math.min(idx, 5) * 14;

              return (
                <div
                  key={service.id}
                  id={service.slug === "ai-sales-intelligence" ? "pillars" : undefined}
                  style={
                    { "--service-sticky-top": `${stickyTopPx}px` } as React.CSSProperties
                  }
                  className="lg:sticky lg:[top:var(--service-sticky-top)]"
                >
                  <SoaleCard
                    as="article"
                    elevated={service.isFlagshipPriority}
                    className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[0.75fr_1fr] lg:gap-10 lg:p-10"
                  >
                    {/* Left Column (.service-grid 0.72fr) */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-full bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground">
                            0{idx + 1}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-primary">
                            {service.isFlagshipPriority && (
                              <Sparkles className="h-3 w-3" />
                            )}
                            {matchingPillar
                              ? `Pillar 0${matchingPillar.number} · ${service.badgeLabel}`
                              : service.badgeLabel}
                          </span>
                        </div>

                        <h2 className="soale-h3 mt-5 text-ink-heading">
                          <Link
                            href={`/services/${service.slug}`}
                            className="transition-colors hover:text-primary"
                          >
                            {service.title}
                          </Link>
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
                          {service.shortSummary}
                        </p>
                      </div>

                      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                        <SoaleArrowButton
                          href={`/services/${service.slug}`}
                          variant={service.isFlagshipPriority ? "primary" : "surface"}
                          size="sm"
                        >
                          Full Specification
                        </SoaleArrowButton>
                        <Link
                          href={`/contact?service=${encodeURIComponent(
                            service.slug
                          )}&intent=call&source=services_deck_${encodeURIComponent(
                            service.slug
                          )}`}
                          className="px-2 font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          Scope this workflow →
                        </Link>
                      </div>
                    </div>

                    {/* Right Column (.service-grid 1fr — 22px Frame + 14px Service Chips) */}
                    <div className="soale-media-frame flex flex-col justify-between border border-line p-5 sm:p-7">
                      <div>
                        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                          Operational Outcomes &amp; Guardrails
                        </p>

                        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {service.benefits.slice(0, 4).map((benefit) => (
                            <li
                              key={benefit}
                              className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-3.5 text-xs leading-relaxed text-ink-heading"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Signature Soale 14px .service-label Capability Chips */}
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                        {service.processSteps.slice(0, 4).map((step, sIdx) => (
                          <SoaleChip key={step.title} className="!bg-surface">
                            <span className="font-mono text-[0.68rem] text-primary">
                              0{sIdx + 1}
                            </span>
                            <span>{step.title}</span>
                          </SoaleChip>
                        ))}
                      </div>
                    </div>
                  </SoaleCard>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Standard Engineering Deliverables Included in Every Service */}
      <section className="bg-canvas-tertiary/40 py-20 sm:py-24">
        <Container>
          <SoaleSectionHeader
            eyebrow="Standard Engineering Deliverables"
            title="Included in every OmniFlow implementation."
            description="Regardless of which workflow you automate first, every project ships with deterministic contracts, staging tests, and complete handover."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileCheck2,
                title: "Written Scope & Schemas",
                detail:
                  "Explicit input validation rules, field mappings, and fallback paths documented before build.",
              },
              {
                icon: ShieldCheck,
                title: "Policy-Bounded AI Guardrails",
                detail:
                  "Strict separation between deterministic business logic and bounded AI classification.",
              },
              {
                icon: Workflow,
                title: "Staging Edge-Case Testing",
                detail:
                  "Verified against duplicate webhooks, malformed inputs, and third-party API timeouts.",
              },
              {
                icon: Database,
                title: "100% Ownership & Runbooks",
                detail:
                  "Full administrative access, repository/workflow ownership, and plain-English team guides.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  data-reveal="card"
                  style={{ "--d": idx } as React.CSSProperties}
                >
                  <SoaleCard className="h-full p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent-subtle text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-ink-heading">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body sm:text-sm">
                      {item.detail}
                    </p>
                  </SoaleCard>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="services"
        eyebrow="Not Sure Where to Start?"
        title="Begin with one high-friction bottleneck"
        description="Most clients start by automating inbound lead qualification or routine customer support triage, then expand once the time savings are proven."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
