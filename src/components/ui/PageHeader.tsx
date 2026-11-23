import React from "react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

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
    <section className="relative overflow-hidden border-b border-line bg-surface bg-hero-glow pb-14 pt-28 sm:pb-18 sm:pt-32 lg:pb-20 lg:pt-36">
      <div
        aria-hidden="true"
        className="bg-grid-subtle pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <Container className="relative">
        <Breadcrumbs items={breadcrumbs} />
        <div className="max-w-3xl">
          {badge && (
            <div className="mb-4">
              <Badge variant="accent" className="font-mono uppercase tracking-[0.12em]">
                {badge}
              </Badge>
            </div>
          )}
          <h1 className="t-display text-ink-heading">{title}</h1>
          <p className="mt-5 text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-ink-body">
            {description}
          </p>
          {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </Container>
    </section>
  );
}
