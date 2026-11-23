import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-ink-heading">
            Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-ink-heading">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink-heading">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
