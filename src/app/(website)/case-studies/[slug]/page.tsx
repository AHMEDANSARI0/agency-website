import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Cpu, Info, XCircle } from "lucide-react";
import {
  getCachedCaseStudyBySlug,
  getCachedPublishedCaseStudies,
  getCachedPublishedServices,
  getCachedPublishedTestimonials,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
} from "@/components/ui/soale";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildCaseStudyJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";

export const revalidate = 600;

export async function generateStaticParams() {
  const items = await getCachedPublishedCaseStudies();
  return items.map((c) => ({ slug: c.slug }));
}

interface CaseStudyDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CaseStudyDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCachedCaseStudyBySlug(slug);
  if (!item) {
    return { title: "Case Study Not Found", robots: { index: false, follow: false } };
  }
  const baseUrl = getCanonicalSiteUrl();
  const cleanTitle = (item.seo.seoTitle || item.title)
    .replace(/(?:\s*[|—–\-:]\s*OmniFlow(?:\s+Insights)?)+\s*$/i, "")
    .trim();
  return {
    title: cleanTitle || item.title,
    description: item.seo.seoDescription || item.problemSummary,
    alternates: {
      canonical:
        item.seo.canonicalUrl || `${baseUrl}/case-studies/${item.slug}`,
    },
    ...(item.seo.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function CaseStudyDetailPage({
  params,
}: CaseStudyDetailProps) {
  const { slug } = await params;
  const [study, allItems, allServices, testimonials, settings] =
    await Promise.all([
      getCachedCaseStudyBySlug(slug),
      getCachedPublishedCaseStudies(),
      getCachedPublishedServices(),
      getCachedPublishedTestimonials(),
      getCachedSiteSettings(),
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
  const otherBlueprints = allItems
    .filter((c) => c.slug !== study.slug)
    .slice(0, 2);
  const caseStudySchema = buildCaseStudyJsonLd(study, meta.label, settings);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Case Studies & Blueprints", path: "/case-studies" },
    { name: study.title, path: `/case-studies/${study.slug}` },
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <JsonLdScript data={[caseStudySchema, breadcrumbSchema]} />
      <PageHeader
        breadcrumbs={[
          { label: "Case Studies & Blueprints", href: "/case-studies" },
          { label: study.title },
        ]}
        badge={`${meta.label} · ${study.industry}`}
        title={study.title}
        description={study.problemSummary}
        actions={
          <>
            <SoaleArrowButton href="/contact?intent=call" variant="primary">
              Implement Similar Workflow
            </SoaleArrowButton>
            <SoaleArrowButton href="/demos" variant="surface">
              Test Live Simulator
            </SoaleArrowButton>
          </>
        }
      />

      <section className="border-b border-line py-16 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Transparency Disclosure Box */}
            <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:1" className="flex items-start gap-3 border-primary/25 bg-accent-subtle/60 p-5 text-xs text-ink-body sm:text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <strong className="text-ink-heading">{meta.label}: </strong>
                <span>{meta.disclosure}</span>
              </div>
            </SoaleCard>

            {/* Manual Before vs Automated After */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:2" className="p-6">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Manual Process Before
                </h2>
                <ul className="mt-4 space-y-3">
                  {study.manualProcessBefore.map((step) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-sm text-ink-body"
                    >
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </SoaleCard>

              <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:3" className="border-primary/30 p-6">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                  Automated Workflow After
                </h2>
                <ul className="mt-4 space-y-3">
                  {study.automatedWorkflowAfter.map((step) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-sm text-ink-heading"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </SoaleCard>
            </div>

            <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:4" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">System Architecture</SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                Proposed &amp; Engineered Automation
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-body">
                {study.proposedAutomation}
              </p>
            </SoaleCard>

            {study.verifiedResults.length > 0 && (
              <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:5" className="p-6 sm:p-9">
                <SoaleEyebrow className="mb-4">Operational Impact</SoaleEyebrow>
                <h2 className="soale-h3 text-ink-heading">
                  Operational Outcomes &amp; Checkpoints
                </h2>
                <ul className="mt-4 space-y-3">
                  {study.verifiedResults.map((outcome) => (
                    <li
                      key={outcome}
                      className="flex items-start gap-2.5 text-sm text-ink-body"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </SoaleCard>
            )}

            {authorizedTestimonial && (
              <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:6" className="border-primary/30 bg-accent-subtle/50 p-6 sm:p-8">
                <blockquote className="text-base italic leading-relaxed text-ink-heading">
                  &ldquo;{authorizedTestimonial.quote}&rdquo;
                </blockquote>
                <footer className="mt-3 font-mono text-xs text-ink-muted">
                  {authorizedTestimonial.authorName} ·{" "}
                  {authorizedTestimonial.authorRole},{" "}
                  {authorizedTestimonial.companyName}
                </footer>
              </SoaleCard>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <SoaleCard motionId="app-(website)-case-studies-slug-page.tsx:7" elevated className="sticky top-28 p-6 sm:p-7">
              <h2 className="soale-h4 text-ink-heading">System Profile</h2>
              <dl className="mt-4 space-y-3.5 text-sm">
                <div>
                  <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-muted">
                    Business Profile
                  </dt>
                  <dd className="mt-0.5 font-semibold text-ink-heading">
                    {study.clientPermissionGranted && study.clientName
                      ? study.clientName
                      : study.businessType}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-muted">
                    Target Sector
                  </dt>
                  <dd className="mt-0.5 font-semibold text-ink-heading">
                    {study.industry}
                  </dd>
                </div>
                {study.projectDuration && (
                  <div>
                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-muted">
                      Implementation Window
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink-heading">
                      {study.projectDuration}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 border-t border-line pt-5">
                <p className="flex items-center gap-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  Technologies &amp; Patterns
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {study.technologiesUsed.map((tech) => (
                    <SoaleChip key={tech}>{tech}</SoaleChip>
                  ))}
                </div>
              </div>

              {relatedServices.length > 0 && (
                <div className="mt-6 border-t border-line pt-5">
                  <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                    Related Services
                  </p>
                  <ul className="mt-2.5 space-y-2">
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
                <SoaleArrowButton
                  href="/contact?intent=call"
                  variant="primary"
                  size="sm"
                  className="w-full justify-between"
                >
                  Implement Similar Workflow
                </SoaleArrowButton>
                <SoaleArrowButton
                  href="/demos"
                  variant="surface"
                  size="sm"
                  className="w-full justify-between"
                >
                  Test Live Simulator
                </SoaleArrowButton>
              </div>
            </SoaleCard>
          </aside>
        </Container>
      </section>

      {otherBlueprints.length > 0 && (
        <section className="bg-canvas-tertiary/40 py-16">
          <Container>
            <h2 className="soale-h3 text-ink-heading">
              More Reference Architectures
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {otherBlueprints.map((other) => (
                <Link
                  key={other.id}
                  href={`/case-studies/${other.slug}`}
                  className="group"
                >
                  <SoaleCard motionId={"app-(website)-case-studies-slug-page.tsx:8" + ":" + String(other.id)} interactive className="h-full p-6">
                    <SoaleChip>{WORK_TYPE_META[other.workType].label}</SoaleChip>
                    <h3 className="mt-3 text-lg font-semibold text-ink-heading group-hover:text-primary">
                      {other.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-body">
                      {other.problemSummary}
                    </p>
                  </SoaleCard>
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
    </div>
  );
}
