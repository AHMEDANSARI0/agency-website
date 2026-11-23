import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Info, XCircle } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { WORK_TYPE_META } from "@/features/case-studies/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await db.getCaseStudyBySlug(slug, true);
  if (!item) return { title: "Case Study Not Found" };
  return {
    title: item.seo.seoTitle || item.title,
    description: item.seo.seoDescription || item.problemSummary,
  };
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [study, allServices, testimonials] = await Promise.all([
    db.getCaseStudyBySlug(slug, true),
    db.listServices(true),
    db.listTestimonials(true),
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

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Case Studies", href: "/case-studies" },
          { label: study.title },
        ]}
        badge={`${meta.label} · ${study.industry}`}
        title={study.title}
        description={study.problemSummary}
        actions={
          <>
            <Button href="/contact">Scope a Similar System</Button>
            <Button href="/case-studies" variant="outline">
              All Case Studies
            </Button>
          </>
        }
      />

      <section className="py-14 sm:py-20">
        <Container className="space-y-10">
          {/* Classification & Permission Disclosure */}
          <div className="flex items-start gap-3 rounded-card border border-line bg-surface-muted p-4 text-xs text-ink-body">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <strong className="text-ink-heading">Classification Disclosure: </strong>
              {meta.disclosure}
              {study.clientPermissionGranted && study.clientName
                ? ` Published with permission from ${study.clientName}.`
                : ""}
            </div>
          </div>

          {/* Metadata Summary Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card">
              <span className="text-xs font-medium text-ink-muted">Industry</span>
              <p className="mt-1 text-sm font-semibold text-ink-heading">{study.industry}</p>
            </div>
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card">
              <span className="text-xs font-medium text-ink-muted">Business Profile</span>
              <p className="mt-1 text-sm font-semibold text-ink-heading">{study.businessType}</p>
            </div>
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card">
              <span className="text-xs font-medium text-ink-muted">Scope Classification</span>
              <p className="mt-1 text-sm font-semibold text-ink-heading">
                {study.projectDuration || meta.label}
              </p>
            </div>
          </div>

          {/* Proposed Architecture */}
          <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-bold text-ink-heading">Proposed Automation Architecture</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
              {study.proposedAutomation}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {study.technologiesUsed.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-bold text-ink-heading">
                Existing Manual Process (Before)
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-body">
                {study.manualProcessBefore.map((step) => (
                  <li key={step} className="flex items-start gap-2.5">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card border border-primary/30 bg-surface-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-bold text-ink-heading">
                Engineered Workflow (After)
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-body">
                {study.automatedWorkflowAfter.map((step) => (
                  <li key={step} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verified Notes / Outcomes */}
          {study.verifiedResults.length > 0 && (
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-muted p-6">
              <h2 className="text-base font-bold text-ink-heading">
                Verification &amp; Outcome Notes
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-body">
                {study.verifiedResults.map((res) => (
                  <li key={res}>• {res}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Authorized Testimonial (Only if verified and permitted) */}
          {authorizedTestimonial && (
            <blockquote className="rounded-card border border-primary/30 bg-surface-card p-6 shadow-card">
              <p className="text-sm italic text-ink-body">“{authorizedTestimonial.quote}”</p>
              <footer className="mt-3 text-xs font-semibold text-ink-heading">
                {authorizedTestimonial.authorName} · {authorizedTestimonial.authorRole},{" "}
                {authorizedTestimonial.companyName}
              </footer>
            </blockquote>
          )}

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className="border-t border-line pt-8">
              <h2 className="text-lg font-bold text-ink-heading">Related OmniFlow Services</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedServices.map((srv) => (
                  <Link
                    key={srv.id}
                    href={`/services/${srv.slug}`}
                    className="flex items-center justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card hover:border-primary/40"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-heading">{srv.title}</p>
                      <p className="mt-1 text-xs text-ink-muted">{srv.categoryName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
