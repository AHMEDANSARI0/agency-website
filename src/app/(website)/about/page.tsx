import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { CheckCircle2, Globe2, ShieldCheck, Workflow } from "lucide-react";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleEyebrow,
} from "@/components/ui/soale";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("about");
}

export default async function AboutPage() {
  const settings = await getCachedSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="about"
        breadcrumbs={[{ label: "About" }]}
        badge={`Founded by ${settings.founderName}`}
        title="Practical Engineering for Businesses That Value Reliability"
        description="OmniFlow was founded on a straightforward premise: growing service teams don’t need flashy AI gimmicks — they need dependable workflows that capture leads, answer routine questions accurately, and eliminate manual copy-paste."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton href="/team" variant="surface">
              Meet Leadership &amp; Team
            </SoaleArrowButton>
          </>
        }
      />

      <section className="border-b border-line py-20 sm:py-28">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <SoaleCard motionId="app-(website)-about-page.tsx:1" className="p-7 sm:p-10 lg:col-span-7">
            <SoaleEyebrow className="mb-5">Our Operating Standard</SoaleEyebrow>
            <h2 className="soale-h2 text-ink-heading">
              Why {settings.companyName} Exists
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-body">
              <p>
                Across the United States, United Kingdom, and Canada, thousands
                of strong service businesses, independent consultants, and small
                agencies lose hours every week to fragmented tools — copying
                form entries into CRMs, chasing missing onboarding info, and
                answering the same policy questions repeatedly.
              </p>
              <p>
                At the same time, many businesses have been burned by
                over-promised AI tools that hallucinate policies, lock clients
                into expensive SaaS tiers, or break silently when an upstream
                API changes.
              </p>
              <p>
                Led by founder{" "}
                <strong className="text-ink-heading">
                  {settings.founderName}
                </strong>
                , {settings.companyName} takes an engineering-first approach:
                deterministic business logic where rules are clear,
                policy-grounded AI only where language understanding adds
                genuine value, and complete transparency in everything we build
                and publish.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3.5 border-t border-line pt-6">
              <SoaleArrowButton href="/how-it-works" variant="surface">
                See 4-Phase Process
              </SoaleArrowButton>
              <SoaleArrowButton href="/case-studies" variant="outline">
                Workflow Blueprints
              </SoaleArrowButton>
            </div>
          </SoaleCard>

          <div className="space-y-5 lg:col-span-5">
            {[
              {
                icon: ShieldCheck,
                title: "Truthful Positioning & Proof",
                detail:
                  "Zero fake testimonials, inflated ROI claims, or unverified logos. Reference architectures and prototypes are always labeled honestly.",
              },
              {
                icon: Workflow,
                title: "Cost-Controlled Architecture",
                detail:
                  "We prioritize lean infrastructure and documented free-tier thresholds before recommending any paid third-party subscriptions.",
              },
              {
                icon: Globe2,
                title: "US, UK & Canada Alignment",
                detail:
                  "Structured communication, asynchronous progress demos, and overlapping EST/GMT business-hour collaboration.",
              },
              {
                icon: CheckCircle2,
                title: "100% Client IP & Access Ownership",
                detail:
                  "Every delivered workflow, prompt template, database schema, and operational runbook belongs to your business.",
              },
            ].map((principle) => {
              const Icon = principle.icon;
              return (
                <SoaleCard motionId={"app-(website)-about-page.tsx:2" + ":" + String(principle.title)} key={principle.title} interactive className="p-6">
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent-subtle text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-ink-heading">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {principle.detail}
                  </p>
                </SoaleCard>
              );
            })}
          </div>
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="about"
        eyebrow="Direct Principal Collaboration"
        title="Speak directly with the architect building your system"
        description="No commission sales reps or junior handoffs. Share your operational bottleneck and receive an honest engineering assessment."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
