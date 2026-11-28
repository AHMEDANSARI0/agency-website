import React from "react";
import { Container } from "@/components/ui/Container";
import { SoaleArrowButton, SoaleCard, SoaleEyebrow } from "@/components/ui/soale";
import { parseSafeMarkdown } from "@/features/blog/markdown";
import { getCachedPageBySlug } from "@/lib/cache/public-cache";

interface PageConversionBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  pageSlug?: string;
}

export async function PageConversionBanner({
  eyebrow = "Free 25-Minute Workflow Review",
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel = "See live demo",
  secondaryHref = "/demos",
  pageSlug,
}: PageConversionBannerProps) {
  const pageDoc = pageSlug ? await getCachedPageBySlug(pageSlug) : null;
  const customEditorialBlocks =
    pageDoc?.sections.filter(
      (s) => s.type === "rich_text" && s.isVisible
    ) ?? [];
  const ctaBlock =
    pageDoc?.sections.find((s) => s.type === "cta_banner") ?? null;

  const showBanner = ctaBlock ? ctaBlock.isVisible : true;
  const resolvedTitle = ctaBlock?.title?.trim() || title;
  const resolvedDescription = ctaBlock?.subtitle?.trim() || description;
  const resolvedPrimaryLabel =
    typeof ctaBlock?.config?.ctaLabel === "string" &&
    ctaBlock.config.ctaLabel.trim()
      ? ctaBlock.config.ctaLabel.trim()
      : primaryLabel;
  const resolvedPrimaryHref =
    typeof ctaBlock?.config?.ctaHref === "string" &&
    ctaBlock.config.ctaHref.trim()
      ? ctaBlock.config.ctaHref.trim()
      : primaryHref;

  const veCtaId =
    ctaBlock?.id || (pageSlug ? `sec_${pageSlug}_cta` : undefined);

  return (
    <>
      {customEditorialBlocks.map((sec) => {
        const md =
          typeof sec.config?.markdown === "string" ? sec.config.markdown : "";
        const parsed = parseSafeMarkdown(md);
        const blockCtaLabel =
          typeof sec.config?.ctaLabel === "string"
            ? sec.config.ctaLabel.trim()
            : "";
        const blockCtaHref =
          typeof sec.config?.ctaHref === "string"
            ? sec.config.ctaHref.trim()
            : "";

        return (
          <section
            key={sec.id}
            data-ve-section-id={sec.id}
            data-ve-section-type="rich_text"
            className="border-t border-line-subtle/60 bg-canvas py-12 sm:py-16"
          >
            <Container>
              <SoaleCard motionId={"components-sections-PageConversionBanner.tsx:1" + ":" + String(sec.id)} className="mx-auto max-w-4xl p-6 sm:p-10">
                <h2 data-ve-title="" className="soale-h3 text-ink-heading">
                  {sec.title}
                </h2>
                {sec.subtitle && (
                  <p data-ve-subtitle="" className="mt-2 text-sm text-ink-muted">
                    {sec.subtitle}
                  </p>
                )}
                {parsed.length > 0 && (
                  <div className="mt-5 space-y-3.5 text-sm leading-relaxed text-ink-body sm:text-base">
                    {parsed.map((blk, i) =>
                      blk.type === "p" ? (
                        <p key={i}>{blk.text}</p>
                      ) : blk.type === "h2" || blk.type === "h3" ? (
                        <h3
                          key={i}
                          className="pt-2 text-base font-semibold text-ink-heading"
                        >
                          {blk.text}
                        </h3>
                      ) : blk.type === "ul" ? (
                        <ul
                          key={i}
                          className="list-disc space-y-1.5 pl-5 text-ink-body"
                        >
                          {blk.items.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      ) : blk.type === "blockquote" ? (
                        <blockquote
                          key={i}
                          className="border-l-2 border-primary/50 pl-4 italic text-ink-muted"
                        >
                          {blk.text}
                        </blockquote>
                      ) : null
                    )}
                  </div>
                )}
                {blockCtaLabel && (
                  <div className="mt-6">
                    <SoaleArrowButton
                      href={blockCtaHref || primaryHref}
                      variant="primary"
                      size="sm"
                    >
                      {blockCtaLabel}
                    </SoaleArrowButton>
                  </div>
                )}
              </SoaleCard>
            </Container>
          </section>
        );
      })}

      {showBanner && (
        <section
          data-ve-section-id={veCtaId}
          data-ve-section-type="cta_banner"
          className="bg-canvas py-14 sm:py-20"
        >
          <Container>
            <div
              data-card-motion-id="shared-conversion-banner"
              data-scroll-card=""
              className="soale-horizon-card rounded-[26px] px-4 py-9 text-center sm:px-12 sm:py-18"
            >
              <div className="relative z-10 mx-auto max-w-3xl">
                <SoaleEyebrow className="mb-5">{eyebrow}</SoaleEyebrow>

                <h2
                  data-ve-title=""
                  className="soale-h2 mx-auto text-ink-heading"
                >
                  {resolvedTitle}
                </h2>

                <p
                  data-ve-subtitle=""
                  className="soale-lead mx-auto mt-4 text-ink-body"
                >
                  {resolvedDescription}
                </p>

                <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
                  <SoaleArrowButton
                    href={resolvedPrimaryHref}
                    variant="secondary"
                  >
                    {resolvedPrimaryLabel}
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
      )}
    </>
  );
}
