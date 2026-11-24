import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleCard } from "@/components/ui/soale";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OmniFlow collects, processes, protects, and retains business enquiry data across US, UK, and Canadian operations.",
};

export default async function PrivacyPolicyPage() {
  const settings = await db.getSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        breadcrumbs={[{ label: "Privacy Policy" }]}
        badge="Legal & Data Governance"
        title="Privacy Policy"
        description={`Effective Date: November 22, 2026 · ${settings.companyName}`}
      />

      <section className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <SoaleCard className="space-y-8 p-6 text-sm leading-relaxed text-ink-body sm:p-10 sm:text-base">
            <div>
              <h2 className="soale-h4 text-ink-heading">
                1. Information We Collect
              </h2>
              <p className="mt-2.5">
                When you submit a business enquiry through{" "}
                {settings.companyName}, we collect only the information you
                voluntarily provide — such as your name, business email address,
                company name, website URL, industry, workflow description,
                optional budget/timeline ranges, and consent confirmation.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                2. How We Use Enquiry Data
              </h2>
              <p className="mt-2.5">
                We use submitted information strictly to evaluate your
                operational inquiry, respond to your questions, prepare
                requested workflow proposals, and maintain accurate internal
                communication records. We never sell, rent, or publish enquiry
                submissions.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                3. Analytics &amp; Optional Scripts
              </h2>
              <p className="mt-2.5">
                Essential functionality operates without third-party advertising
                trackers. Optional analytics (when enabled by administration)
                load strictly after visitor cookie consent.
              </p>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                4. Data Security, Retention &amp; Your Rights
              </h2>
              <p className="mt-2.5">
                Enquiry records are stored in access-controlled databases
                protected by server-side authentication and role-based
                permissions. Business contacts in the United States, United
                Kingdom, Canada, and other jurisdictions may request access to,
                correction of, or deletion of their enquiry records at any time
                by contacting{" "}
                <strong className="text-ink-heading">
                  {settings.contactEmail}
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-line pt-6 text-xs font-semibold text-primary">
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service →
              </Link>
              <Link href="/cookie-policy" className="hover:underline">
                Cookie &amp; Storage Policy →
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact Data Controller →
              </Link>
            </div>
          </SoaleCard>
        </Container>
      </section>
    </div>
  );
}
