import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import Link from "next/link";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { hasConfiguredContactEmail } from "@/lib/placeholders";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleCard } from "@/components/ui/soale";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("terms-of-service");
}

export default async function TermsOfServicePage() {
  const settings = await getCachedSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="terms-of-service"
        breadcrumbs={[{ label: "Terms of Service" }]}
        badge="Legal & Engagement Terms"
        title="Terms of Service"
        description={`Effective Date: November 22, 2026 · ${settings.companyName}`}
      />

      <section className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <SoaleCard className="space-y-8 p-6 text-sm leading-relaxed text-ink-body sm:p-10 sm:text-base">
            <div>
              <h2 className="soale-h4 text-ink-heading">
                1. Website Scope &amp; Purpose
              </h2>
              <p className="mt-2.5">
                This website provides information regarding{" "}
                {settings.companyName}’s AI automation and workflow engineering
                services. Browsing this website or submitting an enquiry does
                not create a binding client-agency contract until a written
                Statement of Work (SOW) is mutually executed.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                2. Reference Architectures &amp; Interactive Demonstrations
              </h2>
              <p className="mt-2.5">
                Concept blueprints, internal prototypes, calculators, and
                interactive demonstrations on this website are provided strictly
                for educational and illustrative purposes. Simulated demo
                outputs do not represent guaranteed financial, operational, or
                search-ranking outcomes.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                3. Intellectual Property
              </h2>
              <p className="mt-2.5">
                Original website copy, architecture descriptions, and code
                structures belong to {settings.companyName} unless otherwise
                stated. Client-specific deliverables under a paid engagement are
                governed by the ownership terms in the applicable Statement of
                Work.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">4. Contact</h2>
              <p className="mt-2.5">
                Questions regarding these Terms may be directed{" "}
                {hasConfiguredContactEmail(settings.contactEmail) ? (
                  <>
                    to{" "}
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {settings.contactEmail}
                    </a>
                  </>
                ) : (
                  <Link
                    href="/contact"
                    className="font-semibold text-primary hover:underline"
                  >
                    through our contact page
                  </Link>
                )}
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-line pt-6 text-xs font-semibold text-primary">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy →
              </Link>
              <Link href="/cookie-policy" className="hover:underline">
                Cookie &amp; Storage Policy →
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact OmniFlow →
              </Link>
            </div>
          </SoaleCard>
        </Container>
      </section>
    </div>
  );
}
