"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { FaqItem } from "@/types/content";
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
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Left Sticky Column (.faq-grid left side) */}
      <div className="lg:sticky lg:top-28 lg:col-span-5">
        <SoaleEyebrow className="mb-4">Common Questions</SoaleEyebrow>
        <h2 className="soale-h2 text-ink-heading">
          Clear answers before we write a single line of automation.
        </h2>
        <p className="soale-lead mt-4">
          Straightforward answers on safety guardrails, CRM compatibility,
          system ownership, and how discovery calls work.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <SoaleArrowButton href="/contact?intent=call" variant="primary">
            Ask About Your Workflow
          </SoaleArrowButton>
          <SoaleArrowButton href="/faq" variant="outline" size="sm">
            All FAQs
          </SoaleArrowButton>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Prefer email? Reach us directly at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-primary hover:underline"
          >
            {contactEmail}
          </a>
        </p>
      </div>

      {/* Right Smooth Accordion Column with 36x36 Circular Icon Box */}
      <div className="space-y-3.5 lg:col-span-7">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          const panelId = `faq-panel-${faq.id}`;

          return (
            <SoaleCard key={faq.id} className="overflow-hidden px-5 py-4 sm:px-6">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
                >
                  <span className="text-sm font-semibold leading-snug text-ink-heading sm:text-base">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 border-primary bg-primary text-primary-foreground"
                        : "border-line bg-surface-muted text-ink-heading"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
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
                </div>
              </div>
            </SoaleCard>
          );
        })}
      </div>
    </div>
  );
}
