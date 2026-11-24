import React from "react";
import { Container } from "@/components/ui/Container";
import { SoaleArrowButton, SoaleEyebrow } from "@/components/ui/soale";

interface PageConversionBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function PageConversionBanner({
  eyebrow = "Free 25-Minute Discovery Call",
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel = "Explore Live Demos",
  secondaryHref = "/demos",
}: PageConversionBannerProps) {
  return (
    <section className="bg-canvas py-16 sm:py-22">
      <Container>
        <div className="on-dark relative overflow-hidden rounded-[28px] border border-[var(--of-color-border)] bg-[var(--of-color-surface)] px-6 py-14 text-center shadow-elevated sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-85"
            style={{
              background:
                "radial-gradient(60% 55% at 20% 16%, rgba(183, 122, 216, 0.18), transparent 70%), radial-gradient(50% 50% at 82% 84%, rgba(167, 143, 202, 0.14), transparent 72%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-3xl">
            <SoaleEyebrow className="mb-5">{eyebrow}</SoaleEyebrow>

            <h2 className="soale-h2 mx-auto text-[var(--of-color-heading)]">
              {title}
            </h2>

            <p className="soale-lead mx-auto mt-4 !text-[var(--of-color-body)]">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <SoaleArrowButton href={primaryHref} variant="primary">
                {primaryLabel}
              </SoaleArrowButton>
              <SoaleArrowButton href={secondaryHref} variant="outline">
                {secondaryLabel}
              </SoaleArrowButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
