import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { WORK_TYPE_META } from "@/features/case-studies/constants";

export const metadata: Metadata = {
  title: "Case Studies & Workflow Blueprints",
  description:
    "Detailed breakdowns of OmniFlow automation architectures: manual bottlenecks, proposed workflows, tech stacks, and before-and-after comparisons.",
};

export default async function CaseStudiesPage() {
  const caseStudies = await db.listCaseStudies(true);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Case Studies" }]}
        badge="Architectural Case Studies"
        title="Before-and-After Workflow Breakdowns"
        description="Examine how manual operational bottlenecks translate into structured, maintainable automation pipelines."
        actions={<Button href="/contact">Discuss Similar Workflow</Button>}
      />

      <section className="py-16 sm:py-20">
        <Container className="space-y-8">
          {caseStudies.map((cs) => {
            const meta = WORK_TYPE_META[cs.workType];
            return (
              <article
                key={cs.id}
                className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{meta.label}</Badge>
                    <Badge variant="status">{cs.industry}</Badge>
                    <Badge variant="outline">{cs.businessType}</Badge>
                  </div>
                  {cs.projectDuration && (
                    <span className="text-xs text-ink-muted">{cs.projectDuration}</span>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-bold text-ink-heading">
                  <Link href={`/case-studies/${cs.slug}`} className="hover:text-link-hover">
                    {cs.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-body sm:text-base">
                  {cs.problemSummary}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-control border border-line bg-surface-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Manual Process (Before)
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-ink-body">
                      {cs.manualProcessBefore.slice(0, 2).map((step) => (
                        <li key={step}>• {step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-control border border-primary/25 bg-surface-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Automated Workflow (After)
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-ink-body">
                      {cs.automatedWorkflowAfter.slice(0, 2).map((step) => (
                        <li key={step}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {cs.technologiesUsed.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <Link
                    href={`/case-studies/${cs.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:text-link-hover"
                  >
                    Read Full Case Study
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </Container>
      </section>
    </>
  );
}
