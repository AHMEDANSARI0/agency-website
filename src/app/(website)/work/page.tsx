import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkFilterGrid } from "@/components/sections/WorkFilterGrid";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work, Prototypes & Reference Architectures",
  description:
    "Explore OmniFlow’s transparently labeled automation architectures, internal workflow prototypes, and authorized client implementations.",
};

export default async function WorkPage() {
  const [items, settings] = await Promise.all([
    db.listCaseStudies(true),
    db.getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Work & Architectures" }]}
        badge="Transparent Portfolio & Blueprints"
        title="Systems We Design, Test & Deploy"
        description="Every entry below carries an explicit verification badge distinguishing authorized client deployments from internal prototypes and reference architectures—never fabricated claims."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container>
          <div className="mb-8 flex items-start gap-3 rounded-card border border-primary/20 bg-accent-subtle/45 p-4 text-xs text-ink-body sm:items-center sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
            <span>
              <strong className="text-ink-heading">Verification Standard:</strong> Client engagements are published strictly after written client authorization. Internal prototypes and concept architectures are labeled explicitly.
            </span>
          </div>

          <WorkFilterGrid items={items} />
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Architecture Review"
        title="Have a workflow similar to one of our reference blueprints?"
        description="Share your stack and operational requirements. We will adapt a proven architecture to your exact business rules."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
