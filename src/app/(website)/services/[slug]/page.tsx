import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [service, caseStudies, settings] = await Promise.all([
    db.getServiceBySlug(slug),
    db.listCaseStudies(true),
    db.getSiteSettings(),
  ]);

  if (!service || service.status !== "published") {
    notFound();
  }

  const relatedStudies = caseStudies.filter((cs) =>
    cs.relatedServiceSlugs.includes(service.slug)
  );

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
        breadcrumbs={[
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
        badge={service.badgeLabel}
        title={service.title}
        description={service.shortSummary}
        actions={
          <>
            <Button href={service.ctaHref}>{service.ctaLabel}</Button>
            <Button href="/services" variant="outline">
              All Services
            </Button>
          </>
        }
      />

      {/* Problem & Solution */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                The Operational Bottleneck
              </span>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Why Manual Processes Stall Growth
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
                {service.problemStatement}
              </p>
            </div>

            <div className="rounded-card border border-primary/30 bg-surface-card p-6 shadow-card sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                The OmniFlow Approach
              </span>
              <h2 className="mt-2 text-xl font-bold text-ink-heading">
                Structured Solution Architecture
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
                {service.solutionOverview}
              </p>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mt-12 rounded-card border border-[var(--of-border-card)] bg-surface-muted p-6 sm:p-8">
            <h2 className="text-lg font-bold text-ink-heading">Key Operational Benefits</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {service.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-body">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Implementation Process */}
      <section className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-ink-heading sm:text-3xl">
            Implementation Process
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {service.processSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
              >
                <h3 className="text-base font-semibold text-ink-heading">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-body">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Industry Use Cases */}
      {service.useCases.length > 0 && (
        <section className="border-t border-line py-16 sm:py-20">
          <Container>
            <h2 className="text-2xl font-bold text-ink-heading sm:text-3xl">
              Representative Use Cases
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {service.useCases.map((uc) => (
                <div
                  key={uc.industry}
                  className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
                >
                  <Badge>{uc.industry}</Badge>
                  <p className="mt-3 text-sm text-ink-body">
                    <strong className="text-ink-heading">Scenario: </strong>
                    {uc.scenario}
                  </p>
                  <p className="mt-2 text-sm text-ink-body">
                    <strong className="text-ink-heading">Workflow Outcome: </strong>
                    {uc.outcome}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Related Reference Architectures */}
      {relatedStudies.length > 0 && (
        <section className="border-t border-line bg-surface-muted py-16">
          <Container>
            <h2 className="text-xl font-bold text-ink-heading">Related Reference Blueprints</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {relatedStudies.map((cs) => (
                <Link
                  key={cs.id}
                  href={`/case-studies/${cs.slug}`}
                  className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <Badge variant="status">{cs.industry}</Badge>
                  <h3 className="mt-2 text-base font-semibold text-ink-heading">{cs.title}</h3>
                  <p className="mt-1.5 text-xs text-ink-muted">{cs.problemSummary}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Service FAQs & Final CTA */}
      <section className="border-t border-line py-16 sm:py-20">
        <Container className="max-w-4xl">
          {service.faqs.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl font-bold text-ink-heading">Service Questions</h2>
              <div className="mt-6 space-y-4">
                {service.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-ink-heading">
                      {faq.question}
                    </summary>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-body">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-card border border-primary/30 bg-surface-card p-8 text-center shadow-card">
            <h2 className="text-2xl font-bold text-ink-heading">
              Scope {service.title} for Your Team
            </h2>
            <p className="mt-2 text-sm text-ink-body">
              Share your current tools and bottleneck—we will outline a practical implementation
              plan without obligation.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href={service.ctaHref} size="lg">
                {service.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
