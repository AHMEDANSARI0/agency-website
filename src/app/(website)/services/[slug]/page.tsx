import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Workflow,
} from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";
import { getServiceConversionBlueprint } from "@/features/services/blueprint";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

interface ServiceDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServiceDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await db.getServiceBySlug(slug);
  if (!service || service.status !== "published") {
    return { title: "Service Not Found", robots: { index: false, follow: false } };
  }
  const baseUrl = getCanonicalSiteUrl();
  return {
    title: service.seo.seoTitle || service.title,
    description: service.seo.seoDescription || service.shortSummary,
    alternates: {
      canonical: service.seo.canonicalUrl || `${baseUrl}/services/${service.slug}`,
    },
    robots: service.seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params;
  const [service, allServices, caseStudies, settings] = await Promise.all([
    db.getServiceBySlug(slug),
    db.listServices(true),
    db.listCaseStudies(true),
    db.getSiteSettings(),
  ]);

  if (!service || service.status !== "published") {
    notFound();
  }

  const blueprint = getServiceConversionBlueprint(service);
  const relatedCaseStudies = caseStudies.filter((c) =>
    c.relatedServiceSlugs.includes(service.slug)
  );
  const relatedServices = allServices.filter((s) => s.slug !== service.slug).slice(0, 3);

  const discoveryCtaHref = `/contact?service=${encodeURIComponent(service.slug)}&intent=call&source=service_${encodeURIComponent(service.slug)}`;
  const demoHref = `/demos?tab=${encodeURIComponent(blueprint.demo.tabId)}`;

  const structuredData = [
    buildServiceJsonLd(service, settings),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: service.title, path: `/services/${service.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLdScript data={structuredData} />
      <PageHeader
        breadcrumbs={[{ label: "Services", href: "/services" }, { label: service.title }]}
        badge={service.badgeLabel}
        title={service.title}
        description={blueprint.outcomeHeadline || service.shortSummary}
      />

      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main 10-Part Business & Implementation Breakdown */}
          <div className="space-y-8 lg:col-span-8">
            {/* 1. Business Problem & 2. Proposed Solution */}
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">01 · Business Problem &amp; Proposed Solution</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                The Business Problem We Eliminate
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-body">
                {service.problemStatement}
              </p>

              <div className="mt-6 rounded-xl border border-primary/20 bg-accent-subtle/45 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Proposed OmniFlow Solution
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-heading sm:text-base">
                  {service.solutionOverview}
                </p>
              </div>
            </div>

            {/* 3. What Gets Automated (vs. What Stays Human) */}
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">02 · Automation Scope &amp; Human Control</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                What Gets Automated vs. What Stays With Your Team
              </h2>
              <p className="mt-2 text-sm text-ink-body">
                Repetitive data entry, triage, and status handoffs run automatically—while commercial decisions and sensitive client judgement always remain in your hands.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-primary/20 bg-accent-subtle/35 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Workflow className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Automated 24/7 by OmniFlow
                    </h3>
                  </div>
                  <ul className="mt-3.5 space-y-2.5">
                    {blueprint.whatGetsAutomated.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-heading sm:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-line bg-surface-muted p-5">
                  <div className="flex items-center gap-2 text-ink-heading">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Kept Human-Approved
                    </h3>
                  </div>
                  <ul className="mt-3.5 space-y-2.5">
                    {blueprint.staysHumanControlled.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-body sm:text-sm"
                      >
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. How It Works */}
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">03 · How It Works</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                Step-by-Step System Operation
              </h2>
              <ol className="mt-5 space-y-3.5">
                {service.processSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-4 rounded-control border border-line bg-surface-muted p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink-heading">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-body">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 5. Relevant Integrations */}
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge>04 · Connected Business Systems</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                Relevant Integrations &amp; Software Ecosystem
              </h2>
              <p className="mt-2 text-sm text-ink-body">
                We connect the platforms your team already relies on—avoiding rip-and-replace disruptions or unnecessary SaaS subscriptions.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {blueprint.integrations.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-xl border border-line bg-surface-muted/65 p-4"
                  >
                    <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{group.category}</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {group.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-heading"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Implementation Process */}
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">05 · Implementation Process</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                How We Scope, Test, and Hand Over Your System
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {blueprint.implementationProcess.map((milestone) => (
                  <div
                    key={milestone.stage}
                    className="flex flex-col justify-between rounded-xl border border-line bg-surface-muted p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {milestone.stage}
                        </span>
                        <span className="rounded-full bg-surface px-2.5 py-0.5 font-mono text-[0.68rem] text-ink-muted">
                          {milestone.timeframe}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-ink-heading">
                        {milestone.title}
                      </h3>
                    </div>
                    <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-body">
                      <strong className="text-ink-heading">Deliverable:</strong>{" "}
                      {milestone.deliverable}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Expected Outcomes & Sector Use Cases */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <Badge>06 · Expected Outcomes</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-heading">
                  Measurable Operational Improvements
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <Badge>Industry Fit</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-heading">
                  Real-World Sector Scenarios
                </h2>
                <ul className="mt-4 space-y-3">
                  {service.useCases.map((uc) => (
                    <li
                      key={uc.industry}
                      className="rounded-lg border border-line bg-surface-muted p-3"
                    >
                      <p className="flex items-center gap-1.5 text-xs font-bold text-ink-heading">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>{uc.industry}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-body">{uc.scenario}</p>
                      <p className="mt-1 font-mono text-[0.68rem] text-primary">{uc.outcome}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 9. Relevant Live Demonstration */}
            <div className="rounded-card border border-primary/30 bg-accent-subtle/45 p-6 shadow-card sm:p-8">
              <Badge variant="accent">{blueprint.demo.badge}</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                {blueprint.demo.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-body sm:text-base">
                {blueprint.demo.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href={demoHref}>
                  <Button>
                    <Sparkles className="h-4 w-4" />
                    <span>{blueprint.demo.ctaLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={discoveryCtaHref}>
                  <Button variant="secondary">Book a Free Discovery Call</Button>
                </Link>
              </div>
            </div>

            {/* 8. Service-Specific FAQs */}
            {service.faqs.length > 0 && (
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
                <Badge>07 · Service FAQ</Badge>
                <h2 className="mt-3 text-xl font-bold text-ink-heading">
                  Common Questions About {service.title}
                </h2>
                <div className="mt-5 space-y-3">
                  {service.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="more rounded-xl border border-line bg-surface-muted px-5 py-4"
                    >
                      <summary className="flex items-center justify-between gap-4 text-left text-sm font-bold text-ink-heading">
                        <span>{faq.question}</span>
                        <span className="more-icon grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-surface text-primary">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </summary>
                      <p className="mt-2.5 border-t border-line pt-2.5 text-sm leading-relaxed text-ink-body">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Fit, Demo & Discovery Call Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <Badge>{service.categoryName}</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-heading">
                  Book a Free Discovery Call for {service.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-body">
                  In 25 minutes we review your current process, show what can be automated reliably, and outline a clear milestone plan. Full ownership and runbooks included.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link href={discoveryCtaHref}>
                    <Button className="w-full">
                      <span>Book a Free Discovery Call</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={demoHref}>
                    <Button variant="secondary" className="w-full">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>{blueprint.demo.ctaLabel}</span>
                    </Button>
                  </Link>
                </div>

                <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-ink-body">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>100% client ownership of workflows &amp; docs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Connects to your existing CRM &amp; tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Zero obligation · 1-business-day response</span>
                  </li>
                </ul>

                {relatedCaseStudies.length > 0 && (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Reference Blueprints
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {relatedCaseStudies.map((cs) => (
                        <li key={cs.id}>
                          <Link
                            href={`/case-studies/${cs.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <span>{cs.title}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </Container>
      </section>

      {/* Related Systems */}
      {relatedServices.length > 0 && (
        <section className="bg-surface-muted/45 py-16">
          <Container>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink-heading">
                Complementary Automation Services
              </h2>
              <Link
                href="/services"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                <span>All 8 services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/services/${rel.slug}`}
                  className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-all hover:border-primary/40"
                >
                  <Badge>{rel.badgeLabel}</Badge>
                  <h3 className="mt-3 text-base font-bold text-ink-heading group-hover:text-primary">
                    {rel.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-body">
                    {rel.shortSummary}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 10. Conversion CTA Banner */}
      <PageConversionBanner
        eyebrow="Ready to Automate This Workflow?"
        title={`Eliminate manual busywork with ${service.title}`}
        description="Book a free 25-minute discovery call to review your current tools, see what gets automated, and get a clear milestone plan with zero obligation."
        primaryLabel="Book a Free Discovery Call"
        primaryHref={discoveryCtaHref}
        secondaryLabel={blueprint.demo.ctaLabel}
        secondaryHref={demoHref}
      />
    </>
  );
}
