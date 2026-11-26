"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Quote, ShieldCheck } from "lucide-react";
import type { TeamMember, TestimonialItem } from "@/types/content";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
} from "@/components/ui/soale";

interface SoaleEditorialProofProps {
  testimonials: TestimonialItem[];
  founder?: TeamMember;
  companyName: string;
}

const ARCHITECTURAL_COMMITMENTS = [
  {
    tag: "Commitment 01 · Written Scope First",
    quote:
      "Every OmniFlow engagement starts with a plain-English workflow audit and data-contract specification before we write production automation — so your team knows every boundary upfront.",
    role: "Principal Architecture Standard",
  },
  {
    tag: "Commitment 02 · Policy-Bounded AI Only",
    quote:
      "Customer-facing AI assistants are grounded strictly to your approved policies and pricing rules, with deterministic human escalation whenever an enquiry requires judgment.",
    role: "Safety & Escalation Standard",
  },
  {
    tag: "Commitment 03 · 100% Client IP Ownership",
    quote:
      "You own your code, prompts, database schemas, and runbooks completely — zero black-box agency lock-in and zero fabricated performance claims.",
    role: "Handover & Governance Standard",
  },
];

export function SoaleEditorialProof({
  testimonials,
  founder,
  companyName,
}: SoaleEditorialProofProps) {
  const [index, setIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);

  const hasVerifiedTestimonials = testimonials.length > 0;
  const totalSlides = hasVerifiedTestimonials
    ? testimonials.length
    : ARCHITECTURAL_COMMITMENTS.length;

  const clampedIdx = index % totalSlides;
  const activeTestimonial = hasVerifiedTestimonials
    ? testimonials[clampedIdx]
    : null;
  const activeCommitment = !hasVerifiedTestimonials
    ? ARCHITECTURAL_COMMITMENTS[clampedIdx]
    : null;

  const goPrev = () =>
    setIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goNext = () => setIndex((prev) => (prev + 1) % totalSlides);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Editorial Slider Card (Touch Swipe + Keyboard + Animated Slide Entrance) */}
      <SoaleCard
        staggerIndex={0}
        className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-7"
      >
        <div
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={
            hasVerifiedTestimonials
              ? "Verified client testimonials"
              : "Principal engineering commitments"
          }
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              goPrev();
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              goNext();
            }
          }}
          onPointerDown={(e) => {
            swipeStartX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (swipeStartX.current === null) return;
            const deltaX = e.clientX - swipeStartX.current;
            swipeStartX.current = null;
            if (Math.abs(deltaX) > 38) {
              if (deltaX < 0) goNext();
              else goPrev();
            }
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] rounded-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SoaleEyebrow>
              {hasVerifiedTestimonials
                ? "Verified Client Perspectives"
                : "Principal Engineering Commitments"}
            </SoaleEyebrow>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-heading transition-colors hover:border-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-heading transition-colors hover:border-primary"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div key={clampedIdx} className="soale-filter-enter mt-8">
            <Quote className="h-8 w-8 text-primary/45" aria-hidden="true" />
            <blockquote className="mt-4 font-display text-[clamp(1.25rem,2.1vw,1.78rem)] font-medium leading-[1.38] tracking-tight text-ink-heading">
              &ldquo;
              {activeTestimonial
                ? activeTestimonial.quote
                : activeCommitment?.quote}
              &rdquo;
            </blockquote>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          {activeTestimonial ? (
            <div>
              <p className="text-sm font-semibold text-ink-heading">
                {activeTestimonial.authorName}
              </p>
              <p className="text-xs text-ink-muted">
                {activeTestimonial.authorRole} · {activeTestimonial.companyName}{" "}
                ({activeTestimonial.country})
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-ink-heading">
                {founder?.name ?? "Ahmed Ansari"} · {companyName}
              </p>
              <p className="text-xs text-ink-muted">{activeCommitment?.tag}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Pill Slide Indicators */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: totalSlides }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setIndex(dotIdx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIdx === clampedIdx
                      ? "w-6 bg-primary"
                      : "w-2 bg-line-strong hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-3 py-1 font-mono text-[0.68rem] font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                0{clampedIdx + 1} / 0{totalSlides}
              </span>
            </span>
          </div>
        </div>
      </SoaleCard>

      {/* Right Principal Architect Profile Card */}
      <SoaleCard
        staggerIndex={1}
        className="flex flex-col justify-between p-7 sm:p-9 lg:col-span-5"
      >
        <div>
          <div className="flex items-center gap-4">
            {founder?.avatarUrl && !founder.avatarUrl.includes("{{") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={founder.avatarUrl}
                alt={founder.name}
                className="h-14 w-14 rounded-2xl border border-line object-cover"
              />
            ) : (
              <div
                aria-label="Founder avatar"

                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-accent-subtle font-display text-lg font-bold text-primary"
              >
                AA
              </div>
            )}

            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Founder-Led Delivery
              </p>
              <h3 className="soale-h4 mt-0.5 text-ink-heading">
                {founder?.name ?? "Ahmed Ansari"}
              </h3>
              <p className="text-xs font-medium text-ink-muted">
                {founder?.role ?? "Founder & Principal Automation Architect"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-body">
            {founder?.bio ??
              "Direct founder oversight from workflow review through staging walkthrough and handover — aligned with US, UK, and Canadian business hours."}
          </p>

          {founder?.focusAreas && founder.focusAreas.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {founder.focusAreas.slice(0, 3).map((area) => (
                <SoaleChip key={area}>{area}</SoaleChip>
              ))}
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <SoaleArrowButton href="/about" variant="outline" size="sm">
            About &amp; Standards
          </SoaleArrowButton>

        </div>
      </SoaleCard>
    </div>
  );
}
