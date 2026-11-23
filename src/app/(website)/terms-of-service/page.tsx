import type { Metadata } from "next";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Website terms of use, demonstration disclaimers, and engagement principles for OmniFlow.",
};

export default async function TermsOfServicePage() {
  const settings = await db.getSiteSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Terms of Service" }]}
        badge="Legal & Engagement Terms"
        title="Terms of Service"
        description={`Effective Date: November 22, 2026 · ${settings.companyName}`}
      />

      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl space-y-8 text-sm leading-relaxed text-ink-body sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-ink-heading">1. Website Scope &amp; Purpose</h2>
            <p className="mt-2">
              This website provides information regarding {settings.companyName}’s AI automation and
              workflow engineering services. Browsing this website or submitting an enquiry does not
              create a binding client-agency contract until a written Statement of Work (SOW) is
              mutually executed.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-heading">
              2. Reference Architectures &amp; Interactive Demonstrations
            </h2>
            <p className="mt-2">
              Concept blueprints, internal prototypes, calculators, and interactive demonstrations on
              this website are provided strictly for educational and illustrative purposes. Simulated
              demo outputs do not represent guaranteed financial, operational, or search-ranking
              outcomes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-heading">3. Intellectual Property</h2>
            <p className="mt-2">
              Original website copy, architecture descriptions, and code structures belong to{" "}
              {settings.companyName} unless otherwise stated. Client-specific deliverables under a
              paid engagement are governed by the ownership terms in the applicable Statement of
              Work.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-heading">4. Contact</h2>
            <p className="mt-2">
              Questions regarding these Terms may be directed to{" "}
              <strong className="text-ink-heading">{settings.contactEmail}</strong>.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
