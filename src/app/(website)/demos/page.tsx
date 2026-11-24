import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleArrowButton, SoaleCard } from "@/components/ui/soale";
import { InteractiveDemosHub } from "@/features/demos/InteractiveDemosHub";
import type { DemoTabId } from "@/features/demos/engine";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildInteractiveDemosJsonLd,
} from "@/features/seo/json-ld";

export const metadata: Metadata = {
  title: "Interactive Automation Demos & Calculators",
  description:
    "Test OmniFlow’s 5 live interactive workflow demonstrations: Lead Qualification, Grounded AI Customer Support, Workflow Simulator, Multi-Currency Savings Calculator, and Readiness Assessment.",
};

const VALID_TABS: DemoTabId[] = [
  "lead-qualification",
  "support-generator",
  "workflow-builder",
  "savings-calculator",
  "readiness-assessment",
];

interface DemosPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DemosPage({ searchParams }: DemosPageProps) {
  const [{ tab }, settings] = await Promise.all([
    searchParams,
    db.getSiteSettings(),
  ]);
  const initialTab = VALID_TABS.includes(tab as DemoTabId)
    ? (tab as DemoTabId)
    : "lead-qualification";
  const demosSchema = buildInteractiveDemosJsonLd(settings);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Interactive Demos", path: "/demos" },
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <JsonLdScript data={[demosSchema, breadcrumbSchema]} />
      <PageHeader
        breadcrumbs={[{ label: "Interactive Demos" }]}
        badge="Live Interactive Lab · Zero Login Required"
        title="Test How OmniFlow Systems Think, Qualify & Guardrail"
        description="Explore five deterministic interactive tools built to demonstrate how OmniFlow structures lead scoring, grounded support answers, fault-tolerant workflows, and operational savings across US, UK, and Canadian teams."
        actions={
          <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
            {settings.primaryCtaLabel}
          </SoaleArrowButton>
        }
      />

      {/* Transparency & Deterministic Lab Strip */}
      <div className="border-b border-line bg-canvas-tertiary/45 py-8">
        <Container className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instant Browser Execution",
              detail:
                "Runs deterministically with zero external paid AI calls or login walls.",
            },
            {
              icon: ShieldCheck,
              title: "Guardrail Transparency",
              detail:
                "See exactly when a query matches approved SOPs vs. escalates to a human.",
            },
            {
              icon: Sparkles,
              title: "Multi-Market Support",
              detail:
                "Test realistic US (USD), UK (GBP), and Canadian (CAD) team scenarios.",
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
          <InteractiveDemosHub initialTab={initialTab} />
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Custom System Architecture"
        title="Want a workflow like these tailored to your own CRM and SOPs?"
        description="Tell us which process you tested above and what tools your team currently uses. We will map out a production implementation plan."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
        secondaryLabel="Explore All 8 Services"
        secondaryHref="/services"
      />
    </div>
  );
}
