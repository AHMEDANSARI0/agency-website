import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleSectionHeader,
} from "@/components/ui/soale";
import {
  LazyBeforeAfterWorkflowCompare,
  LazySoaleProcessSection,
  LazyWorkflowDiagram,
} from "@/components/sections/LazyClientIslands";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("how-it-works");
}

const PROCESS_STAGES = [
  {
    step: "Phase 01",
    title: "Operational Bottleneck & Data Review",
    summary:
      "We map your current lead, support, or internal process end-to-end — identifying where manual entry, delayed responses, or unclear ownership cost your team time.",
    outputs: [
      "Current-state workflow map & bottleneck priority score",
      "Clear recommendation on deterministic rules vs. bounded AI",
      "Transparent scope, milestone schedule, and tool cost breakdown",
    ],
  },
  {
    step: "Phase 02",
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
    step: "Phase 03",
    title: "Staged Implementation & Edge-Case Testing",
    summary:
      "We build and verify the workflow in a controlled staging environment using realistic test payloads — without disrupting your live client channels.",
    outputs: [
      "End-to-end integration across forms, CRM, email, and notifications",
      "Edge-case & malformed-input verification checklist",
      "Live walkthrough with your team prior to production cutover",
    ],
  },
  {
    step: "Phase 04",
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
  const settings = await getCachedSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="how-it-works"
        breadcrumbs={[{ label: "How It Works" }]}
        badge="4-Phase Delivery"
        title="Four Clear Steps From Workflow Review to Handover"
        description="Reliable automation comes from clear rules, human approval gates, and a clean handover. Here is exactly how an engagement with OmniFlow runs from day one."
        actions={
          <>
            <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton href="/demos" variant="surface">
              See live demo
            </SoaleArrowButton>
          </>
        }
      />

      {/* Interactive 10-Stage Scroll-Linked Soale Process Pills */}
      <section className="border-b border-line py-20 sm:py-28">
        <Container>
          <LazySoaleProcessSection />
        </Container>
      </section>

      {/* 4 Milestone Deliverable Cards + Interactive Pipeline Visualizers */}
      <section className="border-b border-line bg-canvas-tertiary/35 py-20 sm:py-28">
        <Container className="space-y-16">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            {PROCESS_STAGES.map((stage) => (
              <SoaleCard motionId={"app-(website)-how-it-works-page.tsx:1" + ":" + String(stage.step)}
                key={stage.step}
                className="flex flex-col justify-between p-6 sm:p-8"
              >
                <div>
                  <SoaleChip active>{stage.step}</SoaleChip>
                  <h2 className="soale-h3 mt-4 text-ink-heading">
                    {stage.title}
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                    {stage.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Milestone Deliverables
                  </p>
                  <ul className="mt-3 space-y-2">
                    {stage.outputs.map((out) => (
                      <li
                        key={out}
                        className="flex items-start gap-2 text-xs text-ink-body sm:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SoaleCard>
            ))}
          </div>

          <div>
            <SoaleSectionHeader
              eyebrow="Interactive Architecture Walkthrough"
              title="Inspect a production-grade lead & triage pipeline."
              description="Select any stage below to see how deterministic validation, qualification rules, CRM commits, and owner handoffs work together."
              className="mb-8"
            />
            <LazyWorkflowDiagram />
          </div>

          <div>
            <SoaleSectionHeader
              eyebrow="Before vs. After Process Comparison"
              title="Compare manual busywork against automated execution."
              description="Switch between manual and automated views across lead intake, support triage, and client onboarding."
              className="mb-8"
            />
            <LazyBeforeAfterWorkflowCompare />
          </div>
        </Container>
      </section>

      {/* Human-in-the-Loop Boundaries */}
      <section className="py-20 sm:py-24">
        <Container>
          <SoaleCard motionId="app-(website)-how-it-works-page.tsx:2" className="p-7 sm:p-10">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Human-in-the-Loop Standard
              </span>
            </div>
            <h2 className="soale-h3 mt-3 text-ink-heading">
              Clear Boundaries: What Runs Automatically vs. What Stays Human
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-[20px] border border-primary/25 bg-accent-subtle/75 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink-heading">
                  Handled Automatically (24/7, Sub-Minute)
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-ink-heading sm:text-sm">
                  <li>• Field validation, spam filtering, and duplicate CRM checks</li>
                  <li>• Priority fit scoring and territory/owner assignment</li>
                  <li>• Approved policy, turnaround, and onboarding checklist answers</li>
                  <li>• Pre-call summary briefs and scheduled follow-up reminders</li>
                </ul>
              </div>

              <div className="rounded-[20px] border border-line bg-surface-muted p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink-heading">
                  Always Escalated to Your Team
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-ink-body sm:text-sm">
                  <li>• Custom pricing negotiations and bespoke contract terms</li>
                  <li>• Sensitive client escalations, refunds, or compliance judgments</li>
                  <li>• Final relationship approval on high-value enterprise proposals</li>
                  <li>• Any question outside your explicitly approved knowledge pack</li>
                </ul>
              </div>
            </div>

            <div className="mt-7">
              <SoaleArrowButton
                href="/demos?tab=support-generator"
                variant="outline"
                size="sm"
              >
                Test Guardrail Escalation in Live Demo
              </SoaleArrowButton>
            </div>
          </SoaleCard>
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="how-it-works"
        eyebrow="Step 01 Starts Here"
        title="Ready to map out your highest-leverage automation?"
        description="Book a 25-minute discovery call and receive a straightforward written blueprint for your workflow."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
