import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Case Studies & Workflow Blueprints",
  description:
    "Detailed technical breakdowns of OmniFlow lead qualification, policy-grounded customer support, and agency onboarding automation architectures.",
};

export default async function CaseStudiesPage() {
  const [items, settings] = await Promise.all([
    db.listCaseStudies(true),
    db.getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Case Studies & Blueprints" }]}
        badge="Detailed System Breakdowns"
        title="Case Studies & Workflow Blueprints"
        description="In-depth operational breakdowns covering the business bottleneck, system architecture, technologies used, and expected operational impact—transparently labeled by verification status."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container className="space-y-8">
          {items.map((cs) => {
            const meta = WORK_TYPE_META[cs.workType];
            const contextLabel =
              cs.clientPermissionGranted && cs.clientName
                ? cs.clientName
                : cs.businessType;
            return (
              <article
                key={cs.id}
                className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{meta.label}</Badge>
                  <Badge variant="status">{cs.industry}</Badge>
                  <span className="text-xs text-ink-muted">· {contextLabel}</span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-ink-heading">
                  <Link href={`/case-studies/${cs.slug}`} className="hover:text-primary">
                    {cs.title}
                  </Link>
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-line bg-surface-muted p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Operational Bottleneck
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                      {cs.problemSummary}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-accent-subtle/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Proposed Architecture
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                      {cs.proposedAutomation}
                    </p>
                  </div>
                </div>

                {cs.verifiedResults.length > 0 && (
                  <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {cs.verifiedResults.slice(0, 2).map((out) => (
                      <li key={out} className="flex items-start gap-2 text-xs text-ink-body">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                )}

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
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                  >
                    Read full technical breakdown
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Custom Blueprint"
        title="Ready to architect a reliable workflow for your firm?"
        description="Book a focused bottleneck review. We will map out your exact trigger, validation, CRM, and escalation flow before writing a line of code."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
