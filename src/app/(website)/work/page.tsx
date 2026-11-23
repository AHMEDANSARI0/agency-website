import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkFilterGrid } from "@/components/sections/WorkFilterGrid";

export const metadata: Metadata = {
  title: "Our Work & System Portfolio",
  description:
    "Explore OmniFlow workflow architectures, internal prototypes, and authorized client implementations with transparent classification.",
};

export default async function WorkPortfolioPage() {
  const items = await db.listCaseStudies(true);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Our Work" }]}
        badge="Portfolio & Reference Systems"
        title="Engineered Workflow Systems & Reference Blueprints"
        description="We label every published system transparently—distinguishing verified client engagements from internal reference prototypes and concept architectures."
        actions={
          <>
            <Button href="/contact">Request Custom Architecture</Button>
            <Button href="/case-studies" variant="outline">
              Detailed Case Studies
            </Button>
          </>
        }
      />

      <section className="py-12 sm:py-16">
        <Container>
          <div className="mb-8 flex items-start gap-3 rounded-card border border-line bg-surface-muted p-4 text-xs text-ink-body sm:items-center">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>
              <strong>Transparency Standard:</strong> Client names, testimonials, and measured
              results are published strictly when verified and explicitly authorized by the client.
            </span>
          </div>

          <WorkFilterGrid items={items} />
        </Container>
      </section>
    </>
  );
}
