import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Wrench } from "lucide-react";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "About OmniFlow — Practical AI & Workflow Engineering",
  description:
    "Learn about OmniFlow, founded by Ahmed Ansari to build dependable lead management, AI support, and workflow automation systems for US, UK, and Canadian businesses.",
};

export default async function AboutPage() {
  const settings = await db.getSiteSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "About OmniFlow" }]}
        badge={settings.positioning}
        title="Dependable Automation Without the Hype"
        description={`${settings.companyName} was founded by ${settings.founderName} to help service businesses, consultants, and small agencies eliminate repetitive operational bottlenecks through clean, maintainable engineering.`}
        actions={
          <>
            <Button href="/team">Meet Founder &amp; Team</Button>
            <Button href="/contact" variant="outline">
              Get in Touch
            </Button>
          </>
        }
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Reliability Over Gimmicks",
                body: "We combine deterministic validation and routing with strictly bounded AI steps—so critical client communications and CRM pipelines behave predictably.",
              },
              {
                icon: Wrench,
                title: "Lean, Cost-Controlled Stack",
                body: "We avoid locking small teams into bloated software fees. Systems are architected around sensible infrastructure and transparent operational costs.",
              },
              {
                icon: Globe2,
                title: "Aligned With US, UK & Canada",
                body: "Our scoping, communication standards, privacy practices, and review schedules are structured for North American and British business teams.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-control bg-[var(--of-color-accent-subtle)] text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-ink-heading">{item.title}</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-card border border-[var(--of-border-card)] bg-surface-muted p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-ink-heading">Our Operating Commitments</h2>
            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Honest scoping: if a simple deterministic rule solves your problem, we recommend it over complex AI",
                "Zero fabricated claims: we never invent fake client logos, metrics, or unverified promises",
                "Clear client ownership: you receive clean documentation and administrative control",
                "Human-in-the-loop safety: sensitive customer replies always retain human oversight",
              ].map((commitment) => (
                <li key={commitment} className="flex items-start gap-2.5 text-sm text-ink-body">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 text-center">
            <Button href="/contact" size="lg">
              Discuss Your Operations With OmniFlow
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
