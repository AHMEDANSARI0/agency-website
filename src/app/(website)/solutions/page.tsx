import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Solutions for Service Businesses, Consultants & Small Agencies",
  description:
    "Explore tailored automation workflows for US, UK, and Canadian service businesses, independent consultants, and boutique agencies.",
};

const SEGMENTS = [
  {
    id: "service-businesses",
    badge: "Commercial & Specialist Services",
    title: "For Service Businesses",
    summary:
      "Capture every after-hours enquiry with complete job context, eliminate missed callbacks, and answer routine scheduling or preparation questions automatically.",
    workflows: [
      "Structured web enquiry intake with service-area and urgency routing",
      "Policy-grounded customer FAQ & appointment preparation assistant",
      "Automated CRM follow-up reminders so quoted jobs never go cold",
    ],
    recommendedSlug: "lead-management",
  },
  {
    id: "consultants",
    badge: "Advisory & Independent Practices",
    title: "For Consultants & Advisory Firms",
    summary:
      "Protect billable partner hours by automating pre-call prospect qualification, client document collection checklists, and recurring status digests.",
    workflows: [
      "Inbound discovery-call qualification and pre-meeting summary briefs",
      "Guided client onboarding & document checklist tracking",
      "Automated weekly pipeline and engagement health summaries",
    ],
    recommendedSlug: "ai-customer-support",
  },
  {
    id: "agencies",
    badge: "Marketing, Creative & Ops Studios",
    title: "For Small & Boutique Agencies",
    summary:
      "Standardize retainer lead triage and turn 12-step manual project kickoffs into a single reliable workflow across your existing tools.",
    workflows: [
      "Retainer vs. one-off lead scoring with duplicate client detection",
      "One-click client onboarding provisioning (tasks, folders, welcome packets)",
      "Cross-tool operational alerts when deliverables or approvals stall",
    ],
    recommendedSlug: "workflow-automation",
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Solutions" }]}
        badge="Solutions by Business Type"
        title="Workflow Solutions Engineered Around How Your Firm Operates"
        description="Whether you run a specialist service company, an advisory practice, or a growing agency in the USA, UK, or Canada, OmniFlow adapts to your existing tools."
        actions={
          <>
            <Button href="/contact">Discuss Your Workflow</Button>
            <Button href="/case-studies" variant="outline">
              Inspect Reference Blueprints
            </Button>
          </>
        }
      />

      <section className="py-16 sm:py-20">
        <Container className="space-y-10">
          {SEGMENTS.map((seg) => (
            <div
              key={seg.id}
              id={seg.id}
              className="scroll-mt-24 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-10"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <Badge>{seg.badge}</Badge>
                  <h2 className="mt-3 text-2xl font-bold text-ink-heading sm:text-3xl">
                    {seg.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-body sm:text-base">
                    {seg.summary}
                  </p>
                  <div className="mt-6">
                    <Button href={`/services/${seg.recommendedSlug}`} variant="outline" size="sm">
                      Recommended Starting System
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-control border border-line bg-surface-muted p-6 lg:col-span-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-heading">
                    High-Impact Workflows We Implement
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {seg.workflows.map((wf) => (
                      <li key={wf} className="flex items-start gap-2.5 text-sm text-ink-body">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{wf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <section id="demos" className="scroll-mt-24 border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge>Interactive Automation Lab</Badge>
            <h2 className="mt-3 text-2xl font-bold text-ink-heading sm:text-3xl">
              Try Our Five Interactive Demonstrations
            </h2>
            <p className="mt-3 text-sm text-ink-body sm:text-base">
              Test lead scoring, policy-grounded customer support guardrails, workflow outage
              fallbacks, capacity savings, and automation readiness right in your browser.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Lead Qualification", tab: "lead-qualification", desc: "Score & route inbound enquiries" },
              { title: "AI Support Triage", tab: "support-generator", desc: "Grounded answers vs. human escalation" },
              { title: "Workflow Simulator", tab: "workflow-builder", desc: "Test execution & outage fallbacks" },
              { title: "Savings Calculator", tab: "savings-calculator", desc: "Estimate USD / GBP / CAD capacity" },
              { title: "Readiness Diagnostic", tab: "readiness-assessment", desc: "5-point operational readiness check" },
            ].map((demo) => (
              <div
                key={demo.tab}
                className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card"
              >
                <div>
                  <h3 className="text-sm font-semibold text-ink-heading">{demo.title}</h3>
                  <p className="mt-1.5 text-xs text-ink-muted">{demo.desc}</p>
                </div>
                <div className="mt-4">
                  <Button href={`/demos?tab=${demo.tab}`} variant="outline" size="sm" className="w-full">
                    Launch Demo
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button href="/contact" size="lg">
              Request a Custom Workflow Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
