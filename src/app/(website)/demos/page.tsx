import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { InteractiveDemosHub } from "@/features/demos/InteractiveDemosHub";
import type { DemoTabId } from "@/features/demos/engine";

export const metadata: Metadata = {
  title: "Interactive Automation Demos & Calculators",
  description:
    "Test OmniFlow's deterministic interactive demonstrations: lead qualification, policy-grounded AI customer support, workflow resilience, savings estimator, and readiness assessment.",
};

const VALID_TABS: ReadonlySet<DemoTabId> = new Set([
  "lead-qualification",
  "support-generator",
  "workflow-builder",
  "savings-calculator",
  "readiness-assessment",
]);

interface DemosPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DemosPage({ searchParams }: DemosPageProps) {
  const { tab } = await searchParams;
  const initialTab: DemoTabId =
    tab && VALID_TABS.has(tab as DemoTabId) ? (tab as DemoTabId) : "lead-qualification";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Interactive Demos" }]}
        badge="Interactive Demonstration Lab"
        title="Test How OmniFlow Systems Think, Route & Protect Guardrails"
        description="Explore five interactive demonstrations powered by deterministic logic—no sign-up or external paid AI keys required."
        actions={
          <>
            <Button href="/contact">Scope a Production System</Button>
            <Button href="/services" variant="outline">
              Explore Services
            </Button>
          </>
        }
      />

      <section className="py-12 sm:py-16">
        <Container>
          <InteractiveDemosHub initialTab={initialTab} />
        </Container>
      </section>
    </>
  );
}
