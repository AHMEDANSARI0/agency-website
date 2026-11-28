import React from "react";
import Link from "next/link";
import { Globe2, Mail, ShieldCheck } from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { Container } from "@/components/ui/Container";
import { SoaleArrowButton } from "@/components/ui/soale";
import { CookiePreferencesButton } from "@/components/analytics/CookiePreferencesButton";
import { hasConfiguredContactEmail } from "@/lib/placeholders";

interface FooterProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

export function Footer({ brand, settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-ve-global-element="footer"
      className="border-t border-[var(--of-color-border)] bg-[var(--of-surface-footer)] text-[var(--of-text-footer)]"
    >
      <div className="border-b border-[var(--of-color-border)] bg-[var(--of-color-surface)]">
        <Container className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--of-color-body)]">
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-[var(--of-color-muted)]" />
              {settings.targetMarkets.join(" · ")}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--of-color-muted)]" />
              Human Approval Gates · 100% Client-Owned Systems
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SoaleArrowButton
              href={settings.secondaryCtaHref}
              variant="outline"
              size="sm"
            >
              {settings.secondaryCtaLabel}
            </SoaleArrowButton>
            <SoaleArrowButton
              href={settings.primaryCtaHref}
              variant="primary"
              size="sm"
            >
              {settings.primaryCtaLabel}
            </SoaleArrowButton>
          </div>
        </Container>
      </div>

      <Container className="py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
          <div data-reveal="" className="lg:col-span-4 lg:pr-6">
            <BrandMark brand={brand} tone="auto" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--of-color-body)]">
              {settings.positioning} — {settings.tagline}
            </p>
            <div className="mt-5 space-y-2 text-xs text-[var(--of-color-muted)]">
              <p className="font-mono uppercase tracking-[0.12em]">
                Founder: {settings.founderName}
              </p>
              <p className="inline-flex items-center gap-2 text-[var(--of-color-body)]">
                <Mail className="h-3.5 w-3.5 text-primary" />
                {hasConfiguredContactEmail(settings.contactEmail) ? (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="transition-colors hover:text-[var(--of-color-heading)] hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    className="transition-colors hover:text-[var(--of-color-heading)] hover:underline"
                  >
                    Send an enquiry →
                  </Link>
                )}
              </p>
            </div>
          </div>

          <div data-reveal="" className="lg:col-span-2 lg:border-l lg:border-[var(--of-color-border)] lg:pl-6">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Core Systems
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-5">
              {settings.footerLinks.services
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div data-reveal="" className="lg:col-span-3 lg:border-l lg:border-[var(--of-color-border)] lg:pl-6">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Solutions &amp; Lab
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-5">
              <li>
                <Link
                  href="/solutions"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Industry Playbooks
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Delivery Methodology
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Scopes &amp; Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/demos"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Interactive Demos Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/demos?tab=savings-calculator"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Savings Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/demos?tab=readiness-assessment"
                  className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                >
                  Readiness Assessment
                </Link>
              </li>
            </ul>
          </div>

          <div data-reveal="" className="grid gap-8 border-t border-[var(--of-color-border)] pt-8 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
                Company &amp; proof
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-5">
                {settings.footerLinks.company
                  .filter((i) => i.isVisible)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
                Governance
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-5">
                {settings.footerLinks.legal
                  .filter((i) => i.isVisible)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                <li>
                  <CookiePreferencesButton variant="footer-link" />
                </li>
                <li>
                  <a
                    href="/feed.xml"
                    className="text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)]"
                  >
                    Insights RSS Feed
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div data-reveal="" className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--of-color-border)] pt-5 text-xs text-[var(--of-color-muted)] sm:flex-row sm:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <p className="max-w-2xl sm:text-right">
            Engineered for service businesses, consultants &amp; boutique
            agencies · Zero fabricated claims.
          </p>
        </div>
      </Container>
    </footer>
  );
}
