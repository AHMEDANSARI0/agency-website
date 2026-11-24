import React from "react";
import Link from "next/link";
import { Globe2, Mail, ShieldCheck } from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { Container } from "@/components/ui/Container";
import { SoaleArrowButton } from "@/components/ui/soale";
import { CookiePreferencesButton } from "@/components/analytics/CookiePreferencesButton";

interface FooterProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

export function Footer({ brand, settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark border-t border-[var(--of-color-border)] bg-[var(--of-surface-footer)] text-[var(--of-text-footer)]">
      {/* Executive Operational Pre-Footer Strip */}
      <div className="border-b border-[var(--of-color-border)] bg-black/15">
        <Container className="flex flex-col items-start justify-between gap-5 py-7 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--of-color-body)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-accent-subtle px-3.5 py-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--of-color-heading)]">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              {settings.targetMarkets.join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--of-color-border)] bg-[var(--of-color-surface)] px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-[var(--of-color-body)]">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Deterministic Guardrails · 100% Client IP Ownership
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

      {/* Main 5-Column Soale Architectural Directory */}
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandMark brand={brand} tone="inverse" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--of-color-body)]">
              {settings.positioning} — {settings.tagline}
            </p>
            <div className="mt-5 space-y-2 text-xs text-[var(--of-color-muted)]">
              <p className="font-mono uppercase tracking-[0.12em]">
                Principal Architect: {settings.founderName}
              </p>
              <p className="inline-flex items-center gap-2 text-[var(--of-color-body)]">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors hover:text-[var(--of-color-heading)] hover:underline"
                >
                  {settings.contactEmail}
                </a>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Core Systems
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
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

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Solutions &amp; Lab
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
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

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Company &amp; Proof
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
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

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--of-color-muted)]">
              Governance
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
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

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--of-color-border)] pt-6 font-mono text-xs text-[var(--of-color-muted)] sm:flex-row sm:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <p>
            Engineered for service businesses, consultants &amp; boutique
            agencies · Zero fabricated claims.
          </p>
        </div>
      </Container>
    </footer>
  );
}
