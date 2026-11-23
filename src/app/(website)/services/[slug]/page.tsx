import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers, Plus, Sparkles } from "lucide-react";
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

  const relatedCaseStudies = caseStudies.filter((c) =>
    c.relatedServiceSlugs.includes(service.slug)
  );
  const relatedServices = allServices.filter((s) => s.slug !== service.slug).slice(0, 3);

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
        description={service.shortSummary}
      />

      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Detailed Breakdown */}
          <div className="space-y-8 lg:col-span-8">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">01 · Operational Challenge &amp; Solution</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                The Operational Problem Solved
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-body">
                {service.problemStatement}
              </p>

              <div className="mt-6 rounded-xl border border-primary/20 bg-accent-subtle/45 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Engineered Solution Overview
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-heading">
                  {service.solutionOverview}
                </p>
              </div>
            </div>

            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">02 · System Execution</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                How the Workflow Operates
              </h2>
              <ol className="mt-5 space-y-4">
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

            {/* Benefits & Industry Use Cases */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink-heading">Practical Business Benefits</h2>
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
                <h2 className="text-lg font-bold text-ink-heading">Sector Applications</h2>
                <ul className="mt-4 space-y-3">
                  {service.useCases.map((uc) => (
                    <li key={uc.industry} className="rounded-lg border border-line bg-surface-muted p-3">
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

            {/* Service-Specific FAQs */}
            {service.faqs.length > 0 && (
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
                <Badge>Service FAQ</Badge>
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

          {/* Right Fit & Scoping Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <Badge>{service.categoryName}</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-heading">Scope This System</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-body">
                  Scoped in clear milestones after a focused operational review. Full workflow schemas, credentials, and team handover runbooks included.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link href={service.ctaHref || `/contact?service=${encodeURIComponent(service.title)}`}>
                    <Button className="w-full">
                      {service.ctaLabel || settings.primaryCtaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="secondary" className="w-full">
                      See Our 4-Stage Process
                    </Button>
                  </Link>
                </div>

                {relatedCaseStudies.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Related Reference Blueprints
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

              <div className="rounded-card border border-primary/25 bg-accent-subtle/50 p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                    Interactive Lab
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-ink-heading">
                  Test Deterministic Logic Live
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                  Run sample enquiries, support prompts, and multi-currency savings estimates in our browser sandbox.
                </p>
                <Link
                  href="/demos"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  <span>Open Interactive Demos</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
                Complementary Systems &amp; Capabilities
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

      <PageConversionBanner
        eyebrow="Ready to Scope?"
        title={`Scope ${service.title} for your team`}
        description="Tell us about your current tools and bottleneck. We will map out a clean, cost-controlled architecture with zero obligation."
        primaryLabel={service.ctaLabel || settings.primaryCtaLabel}
        primaryHref={service.ctaHref || `/contact?service=${encodeURIComponent(service.title)}`}
      />
    </>
  );
}
