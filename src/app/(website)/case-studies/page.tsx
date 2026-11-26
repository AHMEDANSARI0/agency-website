import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import {
  getCachedPublishedCaseStudies,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleArrowButton, SoaleCard } from "@/components/ui/soale";
import { WorkFilterGrid } from "@/components/sections/WorkFilterGrid";
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
        pageSlug="case-studies"
        breadcrumbs={[{ label: "Case Studies & Blueprints" }]}
        badge="Verified Systems & Reference Architectures"
        title="Case Studies, Prototypes & Workflow Blueprints"
        description="In-depth operational breakdowns covering the business bottleneck, system architecture, technologies used, and verified checkpoints — explicitly labeled to distinguish authorized client builds from internal prototypes."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton href="/demos" variant="surface">
              Test Live Simulators
            </SoaleArrowButton>
          </>
        }
      />

      <section className="py-14 sm:py-20">
        <Container>
          <SoaleCard motionId="app-(website)-case-studies-page.tsx:1" className="mb-10 flex items-start gap-3 border-primary/25 bg-accent-subtle/60 p-4 text-xs text-ink-body sm:items-center sm:px-6 sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
            <span>
              <strong className="text-ink-heading">Verification Standard:</strong>{" "}
              Client deployments are published strictly after written client
              authorization. Internal prototypes and concept architectures carry
              explicit badges — zero fabricated logos or metrics.
            </span>
          </SoaleCard>

          <WorkFilterGrid items={items} />
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="case-studies"
        title="Have a Similar Operational Bottleneck?"
        description="Book a free 25-minute workflow review and we will map a written automation scope tailored to your stack."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
