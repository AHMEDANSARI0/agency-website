import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
} from "@/features/seo/json-ld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about OmniFlow services, deterministic vs. AI workflows, security guardrails, ownership, and pricing.",
};

export default async function FaqPage() {
  const faqs = await db.listFaqs(true);
  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  const structuredData = [
    buildFaqPageJsonLd(faqs),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
  ];

  return (
    <>
      <JsonLdScript data={structuredData} />
      <PageHeader
        breadcrumbs={[{ label: "FAQ" }]}
        badge="Questions & Answers"
        title="Frequently Asked Questions"
        description="Straightforward answers on how OmniFlow scopes, builds, secures, and hands over business automation systems."
      />

      <section className="py-14 sm:py-20">
        <Container className="max-w-4xl space-y-12">
          {categories.map((category) => (
            <div key={category}>
              <Badge variant="outline">{category}</Badge>
              <div className="mt-4 space-y-4">
                {faqs
                  .filter((f) => f.category === category)
                  .map((faq) => (
                    <details
                      key={faq.id}
                      className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-ink-heading">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-ink-body">{faq.answer}</p>
                    </details>
                  ))}
              </div>
            </div>
          ))}

          <div className="rounded-card border border-line bg-surface-muted p-8 text-center">
            <h2 className="text-xl font-bold text-ink-heading">Have a Specific Technical Question?</h2>
            <p className="mt-2 text-sm text-ink-body">
              Send us your question directly and we will respond with a clear, practical answer.
            </p>
            <div className="mt-5 flex justify-center">
              <Button href="/contact">
                Ask OmniFlow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
