import React from "react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";

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
    <section className="grain relative overflow-hidden border-b border-line bg-hero-glow pb-14 pt-28 sm:pb-18 sm:pt-32 lg:pb-22 lg:pt-36">
      <Container>
        <Breadcrumbs items={breadcrumbs} />
        <div className="max-w-3xl">
          {badge && <p className="t-eyebrow mb-3 text-primary">{badge}</p>}
          <h1 className="t-display text-ink-heading">{title}</h1>
          <p className="mt-5 text-[clamp(1rem,1.35vw,1.16rem)] font-light leading-relaxed text-ink-body">
            {description}
          </p>
          {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </Container>
    </section>
  );
}
