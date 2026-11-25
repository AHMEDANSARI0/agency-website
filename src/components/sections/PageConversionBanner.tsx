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
  eyebrow = "Free 25-Minute Workflow Review",
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel = "See live demo",
  secondaryHref = "/demos",
}: PageConversionBannerProps) {
  return (
    <section className="bg-canvas py-14 sm:py-22">
      <Container>
        <div
          data-reveal="card"
          data-scroll-card=""
          className="soale-horizon-card rounded-[26px] px-5 py-12 text-center sm:px-12 sm:py-20"
        >
          <div className="relative z-10 mx-auto max-w-3xl">
            <SoaleEyebrow className="mb-5">{eyebrow}</SoaleEyebrow>

            <h2 className="soale-h2 mx-auto text-ink-heading">
              {title}
            </h2>

            <p className="soale-lead mx-auto mt-4 text-ink-body">
              {description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4">
              <SoaleArrowButton href={primaryHref} variant="secondary">
                {primaryLabel}
              </SoaleArrowButton>
              <SoaleArrowButton href={secondaryHref} variant="outline">
                {secondaryLabel}
              </SoaleArrowButton>
            </div>
          </div>

          <div aria-hidden="true" className="soale-horizon-beam" />
        </div>
      </Container>
    </section>
  );
}
