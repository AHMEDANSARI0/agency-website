import React from "react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { SoaleArrowButton, SoaleEyebrow } from "@/components/ui/soale";
import { getCachedPageBySlug } from "@/lib/cache/public-cache";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  pageSlug?: string;
}

export async function PageHeader({
  breadcrumbs,
  badge,
  title,
  description,
  actions,
  pageSlug,
}: PageHeaderProps) {
  const pageDoc = pageSlug ? await getCachedPageBySlug(pageSlug) : null;
  const headerBlock = pageDoc?.sections.find((s) => s.type === "hero") ?? null;

  if (headerBlock && !headerBlock.isVisible) {
    return null;
  }

  const resolvedTitle = headerBlock?.title?.trim() || title;
  const resolvedDescription = headerBlock?.subtitle?.trim() || description;
  const customCtaLabel =
    typeof headerBlock?.config?.ctaLabel === "string"
      ? headerBlock.config.ctaLabel.trim()
      : "";
  const customCtaHref =
    typeof headerBlock?.config?.ctaHref === "string"
      ? headerBlock.config.ctaHref.trim()
      : "";

  const veSectionId =
    headerBlock?.id || (pageSlug ? `sec_${pageSlug}_hero` : undefined);

  return (
    <section
      data-ve-section-id={veSectionId}
      data-ve-section-type="hero"
      className="soale-ambient-wash relative overflow-hidden border-b border-line bg-canvas pb-12 pt-24 sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32"
    >
      <Container className="relative z-10">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-2 max-w-3xl">
          {badge && (
            <div className="mb-4">
              <SoaleEyebrow>{badge}</SoaleEyebrow>
            </div>
          )}
          <h1 data-ve-title="" className="soale-h1 text-ink-heading">
            {resolvedTitle}
          </h1>
          <p data-ve-subtitle="" className="soale-lead mt-4">
            {resolvedDescription}
          </p>
          {(customCtaLabel || actions) && (
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              {customCtaLabel ? (
                <SoaleArrowButton
                  href={customCtaHref || "/contact?intent=call"}
                  variant="primary"
                >
                  {customCtaLabel}
                </SoaleArrowButton>
              ) : (
                actions
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
