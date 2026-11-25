"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/types/content";
import { hasConfiguredContactEmail } from "@/lib/placeholders";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleEyebrow,
} from "@/components/ui/soale";

interface SoaleFaqAccordionProps {
  faqs: FaqItem[];
  contactEmail: string;
}

export function SoaleFaqAccordion({
  faqs,
  contactEmail,
}: SoaleFaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Left Sticky Column (.faq-grid left side) */}
      <div className="lg:sticky lg:top-28 lg:col-span-5">
        <SoaleEyebrow className="mb-4">Common Questions</SoaleEyebrow>
        <h2 className="soale-h2 text-ink-heading">
          Frequently Asked Questions
        </h2>
        <p className="soale-lead mt-4">
          Straightforward answers on safety guardrails, CRM compatibility,
          system ownership, and how workflow reviews work.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
          <SoaleArrowButton href="/contact?intent=call" variant="secondary">
            Ask a question
          </SoaleArrowButton>
          <SoaleArrowButton href="/faq" variant="outline" size="sm">
            All FAQs
          </SoaleArrowButton>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          {hasConfiguredContactEmail(contactEmail) ? (
            <>
              Prefer email? Reach us directly at{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-primary hover:underline"
              >
                {contactEmail}
              </a>
            </>
          ) : (
            <>
              Have a question not listed here?{" "}
              <Link
                href="/contact"
                className="font-medium text-primary hover:underline"
              >
                Send us a quick note →
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Right Soale Accordion Column with Sunset-Orange Active Badge & Horizon Line */}
      <div className="space-y-3.5 lg:col-span-7">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          const panelId = `faq-panel-${faq.id}`;

          return (
            <SoaleCard
              key={faq.id}
              className={`overflow-hidden px-4 py-4 sm:px-6 ${
                isOpen ? "soale-faq-card-open" : ""
              }`}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex min-h-[40px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
                >
                  <span className="text-sm font-semibold leading-snug text-ink-heading sm:text-base">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 border-[#FF7023] bg-[#FF7023] text-white shadow-[0_0_18px_rgba(255,112,35,0.45)]"
                        : "border-line bg-surface-muted text-ink-heading"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                data-open={isOpen ? "true" : "false"}
                className="soale-accordion-grid"
              >
                <div className="soale-accordion-inner">
                  <p className="mt-3 border-t border-line pt-3.5 text-sm leading-relaxed text-ink-body">
                    {faq.answer}
                  </p>
                  {isOpen && (
                    <div aria-hidden="true" className="soale-faq-horizon mt-4 rounded-full" />
                  )}
                </div>
              </div>
            </SoaleCard>
          );
        })}
      </div>
    </div>
  );
}
