import React from "react";
import Link from "next/link";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { Container } from "@/components/ui/Container";

interface FooterProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

export function Footer({ brand, settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark border-t border-white/10 bg-[var(--of-surface-footer)] text-[var(--of-text-footer)]">
      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <BrandMark brand={brand} tone="inverse" />
            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-[#D8CCB6]">
              {settings.positioning} — {settings.tagline}
            </p>
            <p className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#B9AE9F]">
              {settings.targetMarkets.join(" · ")} · Founded by {settings.founderName}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#CFC4B4]">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.services
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-[#D8CCB6] transition-colors hover:text-[#F2EADB]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#CFC4B4]">
              Company
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.company
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-[#D8CCB6] transition-colors hover:text-[#F2EADB]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#CFC4B4]">
              Governance
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.legal
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-[#D8CCB6] transition-colors hover:text-[#F2EADB]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs text-[#B9AE9F] sm:flex-row sm:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <p>Engineered for service businesses, consultants &amp; boutique agencies.</p>
        </div>
      </Container>
    </footer>
  );
}
