import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  FileCheck2,
  Globe2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Free Discovery Call & Workflow Review",
  description:
    "Book a free 25-minute discovery call or send a workflow enquiry to OmniFlow. Eliminate repetitive admin, speed up customer responses, and connect your business tools.",
};

interface ContactPageProps {
  searchParams: Promise<{
    service?: string;
    context?: string;
    intent?: string;
    source?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [
    {
      service: preselectedService,
      context: prefilledContext,
      intent: rawIntent,
      source: rawSource,
    },
    settings,
    services,
  ] = await Promise.all([
    searchParams,
    db.getSiteSettings(),
    db.listServices(true),
  ]);

  const serviceOptions = services.map((s) => ({ slug: s.slug, title: s.title }));
  const defaultIntent = rawIntent === "enquiry" ? "enquiry" : "call";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Contact & Discovery" }]}
        badge="Free 25-Minute Discovery Call"
        title="Book a Free Discovery Call or Share Your Workflow Bottleneck"
        description="Tell us where repetitive admin, slow lead follow-up, or disconnected tools are costing your team hours. You get a practical, plain-English recommendation within one business day."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ContactForm
              defaultService={preselectedService}
              defaultContext={prefilledContext}
              defaultIntent={defaultIntent}
              defaultSource={rawSource}
              externalBookingUrl={settings.bookingUrl}
              serviceOptions={serviceOptions}
            />
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <h2 className="text-lg font-bold text-ink-heading">
                What to Expect When You Reach Out
              </h2>
              <ul className="mt-4 space-y-4 text-sm text-ink-body">
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">1-Business-Day Reply:</strong>{" "}
                    {settings.founderName} reviews your request directly and confirms your discovery slot or written assessment.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">US, UK &amp; Canada Schedule:</strong>{" "}
                    Calls and async walkthroughs run across overlapping EST and GMT business hours.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">100% Ownership &amp; Clear Scope:</strong>{" "}
                    Every project includes fixed milestone deliverables, plain-English runbooks, and full client ownership.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">Honest Advice First:</strong>{" "}
                    If a simple native integration solves your problem without custom engineering, we tell you upfront.
                  </span>
                </li>
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Direct Email
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-ink-heading">
                  <Mail className="h-4 w-4 text-primary" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="hover:text-primary hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-card border border-primary/25 bg-accent-subtle/50 p-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Prefer to Test First?
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-ink-heading">
                Explore All 5 Live Interactive Demos
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                Test lead qualification, policy-grounded support replies, workflow resilience, and USD/GBP/CAD time savings before booking a call.
              </p>
              <Link
                href="/demos"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                <span>Explore Live Demos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
