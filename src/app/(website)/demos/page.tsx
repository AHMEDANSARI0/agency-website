import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <>
      <JsonLdScript data={[demosSchema, breadcrumbSchema]} />
      <PageHeader
        breadcrumbs={[{ label: "Interactive Demos" }]}
        badge="Live Interactive Lab · Zero Login Required"
        title="Test How OmniFlow Systems Think, Qualify & Guardrail"
        description="Explore five deterministic interactive tools built to demonstrate how OmniFlow structures lead scoring, grounded support answers, fault-tolerant workflows, and operational savings across US, UK, and Canadian teams."
      />

      {/* Transparency & Deterministic Lab Strip */}
      <div className="border-b border-line bg-surface">
        <Container className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instant Browser Execution",
              detail: "Runs deterministically with zero external paid AI calls or login walls.",
            },
            {
              icon: ShieldCheck,
              title: "Guardrail Transparency",
              detail: "See exactly when a query matches approved SOPs vs. escalates to a human.",
            },
            {
              icon: Sparkles,
              title: "Multi-Market Support",
              detail: "Test realistic US (USD), UK (GBP), and Canadian (CAD) team scenarios.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-subtle text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-heading">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-body">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </Container>
      </div>

      <section className="bg-surface py-12 sm:py-16">
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
    </>
  );
}
