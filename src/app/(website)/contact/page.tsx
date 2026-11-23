import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Globe2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Request Automation Review",
  description:
    "Share your lead, customer support, or operational workflow bottleneck with OmniFlow. Serving service businesses, consultants, and agencies across the US, UK, and Canada.",
};

interface ContactPageProps {
  searchParams: Promise<{ service?: string; context?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [{ service: preselectedService, context: prefilledContext }, settings, services] =
    await Promise.all([
      searchParams,
      db.getSiteSettings(),
      db.listServices(true),
    ]);

  const serviceOptions = services.map((s) => ({ slug: s.slug, title: s.title }));

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Contact" }]}
        badge="Start a Conversation"
        title="Request a Practical Workflow & Bottleneck Review"
        description="Tell us what manual process or response bottleneck is slowing your team down. We review every submission personally and reply within one business day."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ContactForm
              defaultService={preselectedService}
              defaultContext={prefilledContext}
              serviceOptions={serviceOptions}
            />
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
              <h2 className="text-lg font-bold text-ink-heading">What Happens Next</h2>
              <ul className="mt-4 space-y-4 text-sm text-ink-body">
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">1-Business-Day Review:</strong>{" "}
                    {settings.founderName} reviews your bottleneck and current tool stack directly.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">US, UK &amp; Canada Hours:</strong>{" "}
                    Discovery calls and async walkthroughs aligned with EST and GMT schedules.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">No Hard Sell:</strong> If a simple native integration solves your need without custom engineering, we will tell you upfront.
                  </span>
                </li>
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Direct Email
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-ink-heading">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary hover:underline">
                    {settings.contactEmail}
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-card border border-primary/25 bg-accent-subtle/50 p-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Prefer to Explore First?
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-ink-heading">
                Try Our 5 Interactive Workflow Demos
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
                Test lead scoring, grounded support answers, fault-tolerant queues, and USD/GBP/CAD time savings before reaching out.
              </p>
              <Link
                href="/demos"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                <span>Open Interactive Lab</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
