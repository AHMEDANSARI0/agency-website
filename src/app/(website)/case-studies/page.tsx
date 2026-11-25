import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  getCachedPublishedCaseStudies,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
} from "@/components/ui/soale";
import { WORK_TYPE_META } from "@/features/case-studies/constants";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("case-studies");
}

export default async function CaseStudiesPage() {
  const [items, settings] = await Promise.all([
    getCachedPublishedCaseStudies(),
    getCachedSiteSettings(),
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        breadcrumbs={[{ label: "Case Studies & Blueprints" }]}
        badge="Detailed System Breakdowns"
        title="Case Studies & Workflow Blueprints"
        description="In-depth operational breakdowns covering the business bottleneck, system architecture, technologies used, and verified operational checkpoints — transparently labeled by verification status."
      />

      <section className="py-16 sm:py-24">
        <Container className="space-y-8">
          {items.map((cs, idx) => {
            const meta = WORK_TYPE_META[cs.workType];
            const contextLabel =
              cs.clientPermissionGranted && cs.clientName
                ? cs.clientName
                : cs.businessType;
            return (
              <SoaleCard
                key={cs.id}
                as="article"
                interactive
                className="p-6 sm:p-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-3.5 py-1 font-mono text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <SoaleChip>{cs.industry}</SoaleChip>
                    <span className="text-xs text-ink-muted">· {contextLabel}</span>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">
                    Blueprint 0{idx + 1}
                  </span>
                </div>

                <h2 className="soale-h3 mt-5 text-ink-heading">
                  <Link
                    href={`/case-studies/${cs.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {cs.title}
                  </Link>
                </h2>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-line bg-surface-muted/80 p-5">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Operational Bottleneck
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-body">
                      {cs.problemSummary}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-primary/25 bg-accent-subtle/65 p-5">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      Proposed &amp; Engineered Architecture
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-heading">
                      {cs.proposedAutomation}
                    </p>
                  </div>
                </div>

                {cs.verifiedResults.length > 0 && (
                  <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {cs.verifiedResults.slice(0, 4).map((out) => (
                      <li
                        key={out}
                        className="flex items-start gap-2 text-xs leading-relaxed text-ink-body sm:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                  <div className="flex flex-wrap gap-2">
                    {cs.technologiesUsed.map((tech) => (
                      <SoaleChip key={tech}>{tech}</SoaleChip>
                    ))}
                  </div>
                  <SoaleArrowButton
                    href={`/case-studies/${cs.slug}`}
                    variant="primary"
                    size="sm"
                  >
                    Read Full Breakdown
                  </SoaleArrowButton>
                </div>
              </SoaleCard>
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
    </div>
  );
}
