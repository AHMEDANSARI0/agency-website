import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import {
  Clock,
  FileCheck2,
  Globe2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getCachedPublishedServices,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { hasConfiguredContactEmail } from "@/lib/placeholders";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleArrowButton, SoaleCard } from "@/components/ui/soale";
import { ContactForm } from "@/components/sections/ContactForm";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("contact");
}

export default async function ContactPage() {
  const [settings, services] = await Promise.all([
    getCachedSiteSettings(),
    getCachedPublishedServices(),
  ]);

  const serviceOptions = services.map((s) => ({
    slug: s.slug,
    title: s.title,
  }));

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="contact"
        breadcrumbs={[{ label: "Contact" }]}
        badge="Free 25-Minute Workflow Review"
        title="Book a Free Workflow Review or Share Your Bottleneck"
        description="Tell us where slow lead follow-ups, repeat inbox questions, or disconnected tools cost your team hours. You get a clear, plain-English recommendation within one business day."
      />

      <section className="py-16 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ContactForm
              externalBookingUrl={settings.bookingUrl}
              serviceOptions={serviceOptions}
            />
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <SoaleCard motionId="app-(website)-contact-page.tsx:1" className="p-6 sm:p-7">
              <h2 className="soale-h4 text-ink-heading">
                What to Expect When You Reach Out
              </h2>
              <ul className="mt-5 space-y-4 text-sm text-ink-body">
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">
                      1-Business-Day Reply:
                    </strong>{" "}
                    {settings.founderName} reviews your request directly and
                    confirms your discovery slot or written assessment.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">
                      US, UK &amp; Canada Schedule:
                    </strong>{" "}
                    Calls and async walkthroughs run across overlapping EST and
                    GMT business hours.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">
                      100% Ownership &amp; Clear Scope:
                    </strong>{" "}
                    Every project includes fixed milestone deliverables,
                    plain-English runbooks, and full client ownership.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-ink-heading">
                      Honest Advice First:
                    </strong>{" "}
                    If a simple native integration solves your problem without
                    custom engineering, we tell you upfront.
                  </span>
                </li>
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Direct Email
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ink-heading">
                  <Mail className="h-4 w-4 text-primary" />
                  {hasConfiguredContactEmail(settings.contactEmail) ? (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="hover:text-primary hover:underline"
                    >
                      {settings.contactEmail}
                    </a>
                  ) : (
                    <span className="text-ink-muted">
                      Use the enquiry form on this page for a 1-business-day reply
                    </span>
                  )}
                </p>
              </div>
            </SoaleCard>

            <SoaleCard motionId="app-(website)-contact-page.tsx:2" className="border-primary/25 bg-accent-subtle/60 p-6 sm:p-7">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Prefer to Test First?
                </span>
              </div>
              <h3 className="mt-2.5 text-base font-semibold text-ink-heading">
                Explore All 5 Live Interactive Demos
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-body">
                Test lead qualification, policy-grounded support replies,
                workflow resilience, and USD/GBP/CAD time savings before booking
                a call.
              </p>
              <div className="mt-5">
                <SoaleArrowButton href="/demos" variant="surface" size="sm">
                  Explore Live Demos
                </SoaleArrowButton>
              </div>
            </SoaleCard>
          </aside>
        </Container>
      </section>
    </div>
  );
}
