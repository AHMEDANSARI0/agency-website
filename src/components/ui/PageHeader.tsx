import React from "react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { SoaleEyebrow } from "@/components/ui/soale";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  breadcrumbs,
  badge,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="soale-ambient-wash relative overflow-hidden border-b border-line bg-canvas pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36">
      <Container className="relative z-10">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-2 max-w-3xl">
          {badge && (
            <div className="mb-5">
              <SoaleEyebrow>{badge}</SoaleEyebrow>
            </div>
          )}
          <h1 className="soale-h1 text-ink-heading">{title}</h1>
          <p className="soale-lead mt-5">{description}</p>
          {actions && (
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {actions}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
