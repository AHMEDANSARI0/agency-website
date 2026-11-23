import type { Metadata } from "next";
import { Clock, Globe2, Mail, ShieldCheck } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";

export const metadata: Metadata = {
  title: "Contact OmniFlow — Request an Automation Audit",
  description:
    "Share your workflow bottleneck with OmniFlow. Serving service businesses, consultants, and small agencies across the USA, UK, and Canada.",
};

interface ContactPageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service: requestedSlug } = await searchParams;
  const [settings, services] = await Promise.all([
    db.getSiteSettings(),
    db.listServices(true),
  ]);

  const matchedService = requestedSlug
    ? services.find((s) => s.slug === requestedSlug)?.title ?? ""
    : "";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Contact" }]}
        badge="Scoping & Enquiries"
        title="Start With a Clear Workflow Review"
        description="Tell us where manual admin work, slow lead follow-ups, or repetitive customer questions are holding your team back."
      />

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
                <h2 className="text-base font-bold text-ink-heading">What Happens Next</h2>
                <ol className="mt-4 space-y-3 text-sm text-ink-body">
                  <li>
                    <strong className="text-ink-heading">1. Structured Review:</strong> We review
                    your bottleneck, current software stack, and timeline.
                  </li>
                  <li>
                    <strong className="text-ink-heading">2. Honest Recommendation:</strong> We reply
                    with practical options—deterministic rules first, AI only where helpful.
                  </li>
                  <li>
                    <strong className="text-ink-heading">3. Focused Discovery Call:</strong> If
                    there is a strong fit, we map milestones and transparent pricing.
                  </li>
                </ol>
              </div>

              <div className="space-y-4 rounded-card border border-[var(--of-border-card)] bg-surface-muted p-6 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Direct Email
                    </p>
                    <p className="mt-0.5 font-medium text-ink-heading">{settings.contactEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Operating Hours
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-body">
                      {settings.supportHours}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Primary Markets
                    </p>
                    <p className="mt-0.5 text-xs text-ink-body">
                      {settings.targetMarkets.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Confidentiality
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-body">
                      Submissions are stored privately in our secure CRM and never exposed publicly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <ContactForm
                defaultService={matchedService}
                serviceOptions={services.map((s) => ({ slug: s.slug, title: s.title }))}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
