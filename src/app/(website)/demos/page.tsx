import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleArrowButton, SoaleCard } from "@/components/ui/soale";
import { LazyInteractiveDemosHub } from "@/components/sections/LazyClientIslands";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildInteractiveDemosJsonLd,
} from "@/features/seo/json-ld";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("demos");
}

export default async function DemosPage() {
  const settings = await getCachedSiteSettings();
  const demosSchema = buildInteractiveDemosJsonLd(settings);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Interactive Demos", path: "/demos" },
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <JsonLdScript data={[demosSchema, breadcrumbSchema]} />
      <PageHeader
        pageSlug="demos"
        breadcrumbs={[{ label: "Interactive Demos" }]}
        badge="5 Live Interactive Sandboxes"
        title="See How OmniFlow Workflows Run Before You Book a Call"
        description="Try sample enquiries inside our live lead scorer, approved-FAQ support responder, workflow simulator, time-saved calculator, and readiness check."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton href="/services" variant="surface">
              View Services
            </SoaleArrowButton>
          </>
        }
      />

      {/* Trust Strip */}
      <div className="border-b border-line bg-canvas-tertiary/45 py-6">
        <Container className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Interactive Client-Side Sandboxes",
              detail:
                "Adjust inputs in real time to inspect scoring rules, citations, and fallback behavior.",
            },
            {
              icon: ShieldCheck,
              title: "Transparent Guardrails",
              detail:
                "See exactly when routine tasks execute automatically vs. when human sign-off triggers.",
            },
            {
              icon: Zap,
              title: "Exportable Scoping Briefs",
              detail:
                "Carry your simulator configuration straight into a tailored discovery review.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <SoaleCard
                key={item.title}
                className="flex items-start gap-3.5 p-4 sm:p-5"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-accent-subtle text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-heading sm:text-sm">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-body">
                    {item.detail}
                  </p>
                </div>
              </SoaleCard>
            );
          })}
        </Container>
      </div>

      <section className="py-14 sm:py-20">
        <Container>
          <LazyInteractiveDemosHub />
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="demos"
        eyebrow="Custom System Architecture"
        title="Want a workflow like these tailored to your own CRM and SOPs?"
        description="Tell us which process you tested above and what tools your team currently uses. We will map out a production implementation plan."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={`${settings.primaryCtaHref}${
          settings.primaryCtaHref.includes("?") ? "&" : "?"
        }source=demos_footer`}
        secondaryLabel="Compare Pricing Scopes"
        secondaryHref="/pricing"
      />
    </div>
  );
}
