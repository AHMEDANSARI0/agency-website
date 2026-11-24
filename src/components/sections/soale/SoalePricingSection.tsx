"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { PricingConfig } from "@/types/content";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleEyebrow,
} from "@/components/ui/soale";

interface SoalePricingSectionProps {
  pricing: PricingConfig;
}

export function SoalePricingSection({ pricing }: SoalePricingSectionProps) {
  const [billingScope, setBillingScope] = useState<"project" | "retainer">(
    "project"
  );

  return (
    <div>
      {/* Centered Soale Pricing Header + Rounded Toggle Pill */}
      <div data-reveal="" className="mx-auto max-w-3xl text-center">
        <SoaleEyebrow className="mb-4">{pricing.sectionEyebrow}</SoaleEyebrow>
        <h2 className="soale-h2 text-ink-heading">{pricing.sectionTitle}</h2>
        <p className="soale-lead mx-auto mt-4">{pricing.sectionSubtitle}</p>

        {/* Signature Soale .pricing-tabs-menu Rounded Pill Toggle */}
        <div
          role="tablist"
          aria-label="Select engagement scope mode"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setBillingScope((prev) =>
                prev === "project" ? "retainer" : "project"
              );
            }
          }}
          className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card p-1.5 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={billingScope === "project"}
            onClick={() => setBillingScope("project")}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
              billingScope === "project"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-ink-body hover:text-ink-heading"
            }`}
          >
            {pricing.projectToggleLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billingScope === "retainer"}
            onClick={() => setBillingScope("retainer")}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
              billingScope === "retainer"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-ink-body hover:text-ink-heading"
            }`}
          >
            {pricing.retainerToggleLabel}
          </button>
        </div>

        {pricing.comingSoonMode && pricing.statusBannerText && (
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-accent-subtle px-4 py-1.5 text-xs font-medium text-ink-heading">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{pricing.statusBannerText}</span>
          </div>
        )}
      </div>

      {/* 4-Column Soale 24px Pricing Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {pricing.packages.map((pkg, idx) => {
          const scopeHeadline =
            billingScope === "project"
              ? pkg.projectPriceLabel
              : pkg.retainerPriceLabel;

          return (
            <SoaleCard
              key={pkg.id}
              as="article"
              interactive
              elevated={pkg.isPopular}
              staggerIndex={idx}
              className={`flex flex-col justify-between p-6 ${
                pkg.isPopular ? "ring-2 ring-primary/45" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink-heading">
                    {pkg.name}
                  </h3>
                  {pkg.badge && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider ${
                        pkg.isPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      {pkg.isPopular && <Sparkles className="h-3 w-3" />}
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-xs text-ink-muted">
                  {pkg.targetAudience}
                </p>

                {/* Honest Scope / Coming Soon Display with Smooth Toggle Entrance */}
                <div
                  key={`${billingScope}-${pkg.id}`}
                  className="soale-filter-enter mt-5 rounded-2xl border border-line bg-surface-muted/65 p-4"
                >
                  <p className="font-display text-xl font-semibold tracking-tight text-ink-heading">
                    {scopeHeadline}
                  </p>
                  {pricing.comingSoonMode && (
                    <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-wider text-primary">
                      {pkg.comingSoonNote}
                    </p>
                  )}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-ink-body sm:text-[0.83rem]">
                  {pkg.summary}
                </p>

                <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
                  {pkg.deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs leading-relaxed text-ink-body"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 border-t border-line pt-5">
                <SoaleArrowButton
                  href={pkg.ctaHref}
                  variant={pkg.isPopular ? "primary" : "surface"}
                  size="sm"
                  className="w-full justify-between"
                >
                  {pkg.ctaLabel}
                </SoaleArrowButton>
              </div>
            </SoaleCard>
          );
        })}
      </div>

      {/* Honest Interactive Savings Estimator Strip */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-line bg-surface-card px-6 py-4 text-xs text-ink-body sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Calculator className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Want to model how many manual team hours automation can reclaim
            before booking a scope call?
          </span>
        </div>
        <Link
          href="/demos?tab=savings-calculator"
          className="shrink-0 font-semibold text-primary hover:text-primary-hover"
        >
          Open Multi-Currency Time &amp; Cost Estimator →
        </Link>
      </div>
    </div>
  );
}
