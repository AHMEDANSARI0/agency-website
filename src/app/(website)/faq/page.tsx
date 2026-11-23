import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
} from "@/features/seo/json-ld";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Clear answers about OmniFlow’s AI automation process, data ownership, cost control, guardrails, and US/UK/Canada engagement workflow.",
};

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([
    db.listFaqs(true),
    db.getSiteSettings(),
  ]);

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
        badge="Answers & Transparency"
        title="Frequently Asked Questions"
        description="Straightforward answers on how we scope, secure, price, and hand over business automation systems."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container className="max-w-4xl space-y-10">
          {categories.map((category) => {
            const group = faqs.filter((f) => f.category === category);
            return (
              <div key={category} className="space-y-4">
                <Badge variant="accent">{category}</Badge>
                <div className="space-y-3">
                  {group.map((faq, idx) => (
                    <details
                      key={faq.id}
                      open={idx === 0}
                      className="more rounded-card border border-[var(--of-border-card)] bg-surface-card px-6 py-5 shadow-card"
                    >
                      <summary className="flex items-center justify-between gap-4 text-left text-base font-bold text-ink-heading sm:text-lg">
                        <span>{faq.question}</span>
                        <span className="more-icon grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface-muted text-primary">
                          <Plus className="h-4 w-4" />
                        </span>
                      </summary>
                      <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-body sm:text-base">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Still Have a Question?"
        title="Ask us about your specific tools, compliance rules, or timeline"
        description="Submit your question through our private enquiry form and receive a direct answer within one business day."
        primaryLabel="Contact OmniFlow"
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
