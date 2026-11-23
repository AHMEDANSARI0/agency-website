import React from "react";
import Link from "next/link";
import { ArrowRight, Globe2, Mail, ShieldCheck } from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { Container } from "@/components/ui/Container";
import { CookiePreferencesButton } from "@/components/analytics/CookiePreferencesButton";

interface FooterProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

export function Footer({ brand, settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark border-t border-slate-800/90 bg-[var(--of-surface-footer)] text-[var(--of-text-footer)]">
      {/* Executive Operational Pre-Footer Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <Container className="flex flex-col items-start justify-between gap-5 py-7 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-indigo-300">
              <Globe2 className="h-3.5 w-3.5" />
              {settings.targetMarkets.join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Deterministic Guardrails · 100% Client IP Ownership
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={settings.secondaryCtaHref}
              className="inline-flex items-center gap-1.5 rounded-control border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
            >
              <span>{settings.secondaryCtaLabel}</span>
            </Link>
            <Link
              href={settings.primaryCtaHref}
              className="inline-flex items-center gap-1.5 rounded-control bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              <span>{settings.primaryCtaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </div>

      {/* Main 5-Column Architectural Directory */}
      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandMark brand={brand} tone="inverse" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              {settings.positioning} — {settings.tagline}
            </p>
            <div className="mt-5 space-y-2 text-xs text-slate-400">
              <p className="font-mono uppercase tracking-[0.12em] text-slate-400">
                Principal Architect: {settings.founderName}
              </p>
              <p className="inline-flex items-center gap-2 text-slate-300">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="hover:text-white hover:underline"
                >
                  {settings.contactEmail}
                </a>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Core Systems
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.services
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-slate-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Solutions &amp; Lab
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/solutions"
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Industry Playbooks
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Delivery Methodology
                </Link>
              </li>
              <li>
                <Link
                  href="/demos"
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Interactive Demos Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/demos?tab=savings-calculator"
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Savings Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/demos?tab=readiness-assessment"
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Readiness Assessment
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Company &amp; Proof
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.company
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-slate-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Governance
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {settings.footerLinks.legal
                .filter((i) => i.isVisible)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-slate-300 transition-colors hover:text-white"
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
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  Insights RSS Feed
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-slate-800/80 pt-6 font-mono text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            © {year} {settings.companyName}. All rights reserved.
          </p>
          <p>
            Engineered for service businesses, consultants &amp; boutique agencies · Zero fabricated claims.
          </p>
        </div>
      </Container>
    </footer>
  );
}
