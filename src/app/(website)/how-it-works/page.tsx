import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkflowDiagram } from "@/components/sections/WorkflowDiagram";

export const metadata: Metadata = {
  title: "How OmniFlow Works — Engagement Process & Guardrails",
  description:
    "Learn how OmniFlow audits bottlenecks, designs deterministic and guardrailed AI workflows, tests edge cases, and hands over full ownership.",
};

const PHASES = [
  {
    number: "01",
    title: "Discovery & Bottleneck Mapping",
    detail:
      "We review your current enquiry forms, support inbox patterns, or back-office SOPs to isolate where manual work causes lost leads or team fatigue.",
    deliverable: "Clear Workflow Scope & Architecture Diagram",
  },
  {
    number: "02",
    title: "Deterministic + Guardrailed Design",
    detail:
      "Validation, routing, permissions, and CRM state transitions are built with deterministic rules. AI is applied strictly where bounded classification or policy-grounded drafting adds real value.",
    deliverable: "Approved Guardrail & Escalation Specification",
  },
  {
    number: "03",
    title: "Staging Build & Edge-Case Verification",
    detail:
      "We test duplicate contacts, malformed payloads, rate limits, and external service fallbacks before connecting live customer channels.",
    deliverable: "Verified Staging Walkthrough",
  },
  {
    number: "04",
    title: "Production Launch, Runbooks & Ownership",
    detail:
      "We deploy cleanly, train your team, and provide plain-English runbooks. Your business retains complete administrative ownership.",
    deliverable: "Live System + Documentation Handover",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "How It Works" }]}
        badge="Process & Engineering Standards"
        title="Transparent Engineering From Audit to Handover"
        description="No black-box templates or vague retainers. Every OmniFlow engagement follows four verifiable milestones."
        actions={<Button href="/contact">Start With Step 01</Button>}
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PHASES.map((phase) => (
              <div
                key={phase.number}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Milestone {phase.number}
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-ink-heading">{phase.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-body">{phase.detail}</p>
                </div>
                <div className="mt-6 rounded-control border border-line bg-surface-muted px-4 py-2.5 text-xs">
                  <span className="font-semibold text-ink-heading">Milestone Output: </span>
                  <span className="text-ink-body">{phase.deliverable}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <WorkflowDiagram />
        </Container>
      </section>

      <section className="border-t border-line py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-bold text-ink-heading">What We Always Include</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-body">
                {[
                  "Server-side input validation, spam protection, and audit logging",
                  "Graceful fallback behaviour if an optional email or external API is unavailable",
                  "Human-in-the-loop escalation for nuanced or high-stakes client replies",
                  "Clear documentation so your team is never locked out of its own systems",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-bold text-ink-heading">What We Never Do</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-body">
                {[
                  "Never deploy ungrounded chatbots allowed to invent pricing or legal commitments",
                  "Never force mandatory expensive AI subscriptions when deterministic logic suffices",
                  "Never fabricate performance guarantees or misleading automation metrics",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button href="/contact" size="lg">
              Book Your Bottleneck Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
