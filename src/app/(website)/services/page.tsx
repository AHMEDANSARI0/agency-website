import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "AI Automation Services & Practice Pillars",
  description:
    "Explore OmniFlow's priority lead management, AI customer support, and workflow automation services alongside our five AI practice pillars.",
};

export default async function ServicesPage() {
  const [pillars, services] = await Promise.all([
    db.getServicePillars(),
    db.listServices(true),
  ]);

  const flagshipServices = services.filter((s) => s.isFlagshipPriority);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Services" }]}
        badge="Services & Capabilities"
        title="Practical AI & Workflow Systems Built for Real Operations"
        description="We focus on dependable lead capture, policy-grounded customer support, and end-to-end operational automation—structured across five clear practice pillars."
        actions={
          <>
            <Button href="/contact">Request Scoping Call</Button>
            <Button href="/how-it-works" variant="outline">
              How We Deliver
            </Button>
          </>
        }
      />

      {/* 3 Flagship Priority Services */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="outline">Initial Business Priorities</Badge>
            <h2 className="mt-3 text-2xl font-bold text-ink-heading sm:text-3xl">
              Flagship Automation Systems
            </h2>
            <p className="mt-2 text-sm text-ink-body sm:text-base">
              Most service businesses, consultants, and agencies begin with one of these three
              high-impact workflows.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {flagshipServices.map((srv) => (
              <article
                key={srv.id}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
              >
                <div>
                  <Badge>{srv.badgeLabel}</Badge>
                  <h3 className="mt-4 text-xl font-semibold text-ink-heading">
                    <Link href={`/services/${srv.slug}`} className="hover:text-link-hover">
                      {srv.title}
                    </Link>
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">{srv.shortSummary}</p>

                  <ul className="mt-5 space-y-2 border-t border-line pt-4">
                    {srv.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-ink-body">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  <Button href={`/services/${srv.slug}`} variant="outline" size="sm" className="w-full">
                    View Full Service Scope
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* 5 Practice Pillars */}
      <section id="pillars" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="outline">5 Service Categories</Badge>
            <h2 className="mt-3 text-2xl font-bold text-ink-heading sm:text-3xl">
              Five Disciplined Automation Practice Areas
            </h2>
            <p className="mt-2 text-sm text-ink-body sm:text-base">
              Select any category below to review problem statements, implementation steps, and
              industry use cases.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.id}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Category 0{pillar.number}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-ink-heading">
                    <Link href={`/services/${pillar.slug}`} className="hover:text-link-hover">
                      {pillar.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-body">
                    {pillar.shortSummary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {pillar.capabilities.map((cap) => (
                      <Badge key={cap} variant="status">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <Link
                    href={`/services/${pillar.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:text-link-hover"
                  >
                    Explore {pillar.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
