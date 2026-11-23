import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Cpu, Info, XCircle } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildCaseStudyJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";

export const dynamic = "force-dynamic";

interface CaseStudyDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CaseStudyDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await db.getCaseStudyBySlug(slug, true);
  if (!item) {
    return { title: "Case Study Not Found" };
  }
  const baseUrl = getCanonicalSiteUrl();
  return {
    title: item.seo.seoTitle || item.title,
    description: item.seo.seoDescription || item.problemSummary,
    alternates: {
      canonical: item.seo.canonicalUrl || `${baseUrl}/case-studies/${item.slug}`,
    },
    ...(item.seo.noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailProps) {
  const { slug } = await params;
  const [study, allItems, allServices, testimonials, settings] = await Promise.all([
    db.getCaseStudyBySlug(slug, true),
    db.listCaseStudies(true),
    db.listServices(true),
    db.listTestimonials(true),
    db.getSiteSettings(),
  ]);

  if (!study) {
    notFound();
  }

  const meta = WORK_TYPE_META[study.workType];
  const relatedServices = allServices.filter((s) =>
    study.relatedServiceSlugs.includes(s.slug)
  );
  const authorizedTestimonial =
    study.clientPermissionGranted && study.testimonialId
      ? testimonials.find((t) => t.id === study.testimonialId)
      : null;
  const otherBlueprints = allItems.filter((c) => c.slug !== study.slug).slice(0, 2);
  const caseStudySchema = buildCaseStudyJsonLd(study, meta.label, settings);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Case Studies & Blueprints", path: "/case-studies" },
    { name: study.title, path: `/case-studies/${study.slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={[caseStudySchema, breadcrumbSchema]} />
      <PageHeader
        breadcrumbs={[
          { label: "Case Studies & Blueprints", href: "/case-studies" },
          { label: study.title },
        ]}
        badge={`${meta.label} · ${study.industry}`}
        title={study.title}
        description={study.problemSummary}
      />

      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Transparency Disclosure Box */}
            <div className="flex items-start gap-3 rounded-control border border-primary/20 bg-accent-subtle/45 p-4 text-xs text-ink-body">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <strong className="text-ink-heading">{meta.label}: </strong>
                <span>{meta.disclosure}</span>
              </div>
            </div>

            {/* Manual Before vs Automated After */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                  Manual Process Before
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {study.manualProcessBefore.map((step) => (
                    <li key={step} className="flex items-start gap-2.5 text-sm text-ink-body">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-card border border-primary/25 bg-surface-card p-6 shadow-card">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                  Automated Workflow After
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {study.automatedWorkflowAfter.map((step) => (
                    <li key={step} className="flex items-start gap-2.5 text-sm text-ink-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <Badge variant="accent">System Architecture</Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-heading">
                Proposed &amp; Engineered Automation
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-body">
                {study.proposedAutomation}
              </p>
            </div>

            {study.verifiedResults.length > 0 && (
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
                <Badge variant="accent">Operational Impact</Badge>
                <h2 className="mt-3 text-xl font-bold text-ink-heading">
                  Operational Outcomes &amp; Checkpoints
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {study.verifiedResults.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2.5 text-sm text-ink-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {authorizedTestimonial && (
              <blockquote className="rounded-card border border-primary/25 bg-accent-subtle/40 p-6">
                <p className="text-base italic leading-relaxed text-ink-heading">
                  “{authorizedTestimonial.quote}”
                </p>
                <footer className="mt-3 font-mono text-xs text-ink-muted">
                  {authorizedTestimonial.authorName} · {authorizedTestimonial.authorRole},{" "}
                  {authorizedTestimonial.companyName}
                </footer>
              </blockquote>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-24 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <h2 className="text-base font-bold text-ink-heading">System Profile</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">Business Profile</dt>
                  <dd className="font-medium text-ink-heading">
                    {study.clientPermissionGranted && study.clientName
                      ? study.clientName
                      : study.businessType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Target Sector</dt>
                  <dd className="font-medium text-ink-heading">{study.industry}</dd>
                </div>
                {study.projectDuration && (
                  <div>
                    <dt className="text-xs text-ink-muted">Implementation Window</dt>
                    <dd className="font-medium text-ink-heading">{study.projectDuration}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  Technologies &amp; Patterns
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {study.technologiesUsed.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {relatedServices.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Related Services
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {relatedServices.map((srv) => (
                      <li key={srv.id}>
                        <Link
                          href={`/services/${srv.slug}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {srv.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
                <Link href="/contact">
                  <Button className="w-full">
                    Implement Similar Workflow
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demos">
                  <Button variant="secondary" className="w-full">
                    Test Live Simulator
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </Container>
      </section>

      {otherBlueprints.length > 0 && (
        <section className="bg-surface-muted/45 py-14">
          <Container>
            <h2 className="text-xl font-bold text-ink-heading">More Reference Architectures</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {otherBlueprints.map((other) => (
                <Link
                  key={other.id}
                  href={`/case-studies/${other.slug}`}
                  className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-all hover:border-primary/40"
                >
                  <Badge>{WORK_TYPE_META[other.workType].label}</Badge>
                  <h3 className="mt-3 text-lg font-bold text-ink-heading group-hover:text-primary">
                    {other.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-body">{other.problemSummary}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <PageConversionBanner
        eyebrow="Adapt This Blueprint"
        title="Want this workflow connected to your existing CRM and inbox?"
        description="Share your current tools and volume. We will tailor the validation, routing, and escalation logic to your exact firm."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
