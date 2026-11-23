import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { WorkflowDiagram } from "@/components/sections/WorkflowDiagram";
import { BeforeAfterWorkflowCompare } from "@/components/sections/BeforeAfterWorkflowCompare";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const metadata: Metadata = {
  title: "How OmniFlow Works",
  description:
    "Our transparent 4-stage methodology for auditing, designing, testing, and handing over reliable business automation systems.",
};

const PROCESS_STAGES = [
  {
    step: "Stage 01",
    title: "Operational Bottleneck & Data Review",
    summary:
      "We map your current lead, support, or internal process end-to-end—identifying where manual entry, delayed responses, or unclear ownership cost your team time.",
    outputs: [
      "Current-state workflow map & bottleneck priority score",
      "Clear recommendation on deterministic rules vs. bounded AI",
      "Transparent scope, milestone schedule, and tool cost breakdown",
    ],
  },
  {
    step: "Stage 02",
    title: "Architecture, Guardrails & Fallback Design",
    summary:
      "Before writing production integrations, we define validation schemas, duplicate-prevention logic, human escalation rules, and failure recovery paths.",
    outputs: [
      "Input validation & CRM field mapping specification",
      "Approved knowledge boundaries for any AI-assisted steps",
      "Dead-letter / fallback alert plan so zero enquiries are ever lost",
    ],
  },
  {
    step: "Stage 03",
    title: "Staged Implementation & Edge-Case Testing",
    summary:
      "We build and verify the workflow in a controlled staging environment using realistic test payloads—without disrupting your live client channels.",
    outputs: [
      "End-to-end integration across forms, CRM, email, and notifications",
      "Edge-case & malformed-input verification checklist",
      "Live walkthrough with your team prior to production cutover",
    ],
  },
  {
    step: "Stage 04",
    title: "Production Launch, Documentation & Handover",
    summary:
      "Your business retains full ownership and admin control. We provide plain-English runbooks, train your team, and monitor post-launch stability.",
    outputs: [
      "Full administrative ownership of workflows, prompts, and credentials",
      "Concise operational runbook & troubleshooting guide",
      "Optional ongoing iteration as your volume scales",
    ],
  },
];

export default async function HowItWorksPage() {
  const settings = await db.getSiteSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "How It Works" }]}
        badge="Delivery Methodology"
        title="Structured Engineering, Not Trial-and-Error Prompting"
        description="Reliable automation comes from clear business logic, strict guardrails, and clean handover. Here is exactly how an engagement with OmniFlow runs from day one."
      />

      <section className="border-b border-line bg-surface py-16 sm:py-22">
        <Container className="space-y-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PROCESS_STAGES.map((stage) => (
              <div
                key={stage.step}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8"
              >
                <div>
                  <Badge variant="accent">{stage.step}</Badge>
                  <h2 className="mt-3 text-xl font-bold text-ink-heading">{stage.title}</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">{stage.summary}</p>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Milestone Deliverables
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {stage.outputs.map((out) => (
                      <li key={out} className="flex items-start gap-2 text-xs text-ink-body sm:text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Workflow Architecture */}
          <div>
            <div className="mb-6 max-w-2xl">
              <Badge>Interactive Architecture Walkthrough</Badge>
              <h2 className="mt-2.5 text-2xl font-bold text-ink-heading">
                Inspect a Production-Grade Lead &amp; Triage Pipeline
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                Select any stage below to see how deterministic validation, qualification rules, CRM commits, and owner handoffs work together.
              </p>
            </div>
            <WorkflowDiagram />
          </div>

          {/* Interactive Before vs. After Process Comparison */}
          <div>
            <div className="mb-6 max-w-2xl">
              <Badge variant="accent">Before vs. After Process Comparison</Badge>
              <h2 className="mt-2.5 text-2xl font-bold text-ink-heading">
                Compare Manual Busywork Against Automated Execution
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                Switch between manual and automated views across lead intake, support triage, and client onboarding.
              </p>
            </div>
            <BeforeAfterWorkflowCompare />
          </div>
        </Container>
      </section>

      {/* What Automates vs What Stays Human */}
      <section className="bg-surface-muted/45 py-16 sm:py-20">
        <Container>
          <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-10">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Human-in-the-Loop Standard
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-ink-heading">
              Clear Boundaries: What Runs Automatically vs. What Stays Human
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-primary/20 bg-accent-subtle/45 p-5">
                <h3 className="text-sm font-bold text-ink-heading">
                  Handled Automatically (24/7, Sub-Minute)
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-ink-body sm:text-sm">
                  <li>• Field validation, spam filtering, and duplicate CRM checks</li>
                  <li>• Priority fit scoring and territory/owner assignment</li>
                  <li>• Approved policy, turnaround, and onboarding checklist answers</li>
                  <li>• Pre-call summary briefs and scheduled follow-up reminders</li>
                </ul>
              </div>

              <div className="rounded-xl border border-line bg-surface-muted p-5">
                <h3 className="text-sm font-bold text-ink-heading">
                  Always Escalated to Your Team
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-ink-body sm:text-sm">
                  <li>• Custom pricing negotiations and bespoke contract terms</li>
                  <li>• Sensitive client escalations, refunds, or legal/compliance judgements</li>
                  <li>• Final relationship approval on high-value enterprise proposals</li>
                  <li>• Any question outside your explicitly approved knowledge pack</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/demos?tab=support-generator"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                <span>Test our guardrail escalation behavior in the Live Support Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Client Communication, Ownership & Post-Launch Support Options */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <Badge variant="accent">Communication</Badge>
              <h3 className="mt-3 text-lg font-bold text-ink-heading">
                How We Communicate During Projects
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-body">
                You work directly with the Principal Architect via structured milestone check-ins, concise async video demos, and overlapping US/UK/Canada business hours.
              </p>
            </div>

            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <Badge variant="accent">100% Ownership</Badge>
              <h3 className="mt-3 text-lg font-bold text-ink-heading">
                You Own Every Workflow &amp; Credential
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-body">
                Zero proprietary black boxes or hostage retainers. All accounts, code, database schemas, and plain-English runbooks belong completely to your company.
              </p>
            </div>

            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <Badge variant="accent">Maintenance &amp; Support</Badge>
              <h3 className="mt-3 text-lg font-bold text-ink-heading">
                Flexible Post-Launch Care
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-body">
                Every build includes post-launch stabilization monitoring. Afterward, your team can self-manage with our runbooks or opt into lightweight ongoing optimization.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Start With Stage 01"
        title="Ready to map your highest-leverage workflow?"
        description="Book a focused operational review with Ahmed Ansari. You will leave with a clear picture of what to automate and what to keep human."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
