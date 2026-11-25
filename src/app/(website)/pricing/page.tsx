import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { FileCheck2, Layers, ShieldCheck } from "lucide-react";
import {
  getCachedPublishedFaqs,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleSectionHeader,
} from "@/components/ui/soale";
import { SoalePricingSection } from "@/components/sections/soale/SoalePricingSection";
import { LazySoaleFaqAccordion } from "@/components/sections/LazyClientIslands";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("pricing");
}

export default async function PricingPage() {
  const [settings, faqs] = await Promise.all([
    getCachedSiteSettings(),
    getCachedPublishedFaqs(),
  ]);

  const pricing = resolvePricingConfig(settings);

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="pricing"
        breadcrumbs={[{ label: "Pricing & Scopes" }]}
        badge={pricing.sectionEyebrow}
        title="Clear Written Scopes Before Any Work Begins"
        description="Every engagement starts with a free 25-minute workflow review and a fixed written scope — zero surprise agency retainers and 100% client ownership."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton
              href="/demos?tab=savings-calculator"
              variant="surface"
            >
              Estimate Time Saved
            </SoaleArrowButton>
          </>
        }
      />

      <section className="border-b border-line py-20 sm:py-28">
        <Container>
          <SoalePricingSection pricing={pricing} />
        </Container>
      </section>

      {/* What Determines Engagement Scope */}
      <section className="border-b border-line bg-canvas-tertiary/40 py-20 sm:py-24">
        <Container>
          <SoaleSectionHeader
            align="center"
            eyebrow="How We Scope Fairly"
            title="Three practical factors shape every written proposal."
            description="Instead of arbitrary seat fees, we scope strictly around your actual integration surface, data rules, and desired post-launch involvement."
          />

          <div className="mt-12 grid grid-cols-1 gap-7 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "01 · Connected Tool Count",
                detail:
                  "A single form-to-CRM intake pipeline takes days; orchestrating multi-branch CRM, billing, Notion, and SQL webhooks requires deeper staging QA.",
              },
              {
                icon: ShieldCheck,
                title: "02 · Knowledge & Approval Gates",
                detail:
                  "Routine deterministic routing is lightweight, while policy-grounded AI support with multi-owner approval gates includes dedicated retrieval boundaries.",
              },
              {
                icon: FileCheck2,
                title: "03 · Self-Managed vs. Ongoing Care",
                detail:
                  "Every build hands over 100% client ownership and runbooks so your team can self-manage — with optional monthly tuning only if you want it.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <SoaleCard key={item.title} className="p-6 sm:p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-accent-subtle text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="soale-h4 mt-5 text-ink-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {item.detail}
                  </p>
                </SoaleCard>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <LazySoaleFaqAccordion
            faqs={faqs.slice(0, 6)}
            contactEmail={settings.contactEmail}
          />
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="pricing"
        eyebrow="Free 25-Minute Scope Call"
        title="Get a written milestone scope tailored to your exact stack"
        description="Share your current bottleneck on a 25-minute call and receive a straightforward written scope within one business day."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
