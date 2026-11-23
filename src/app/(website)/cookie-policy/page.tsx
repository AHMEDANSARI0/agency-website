import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CookiePreferencesButton } from "@/components/analytics/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Information on essential preference storage, authentication cookies, and optional consent-gated analytics on OmniFlow.",
};

export default async function CookiePolicyPage() {
  const settings = await db.getSiteSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Cookie Policy" }]}
        badge="Privacy & Storage Controls"
        title="Cookie & Local Storage Policy"
        description={`Effective Date: November 22, 2026 · ${settings.companyName}`}
      />

      <section className="bg-surface py-14 sm:py-20">
        <Container className="max-w-3xl">
          <div className="space-y-8 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 text-sm leading-relaxed text-ink-body shadow-card sm:p-10 sm:text-base">
            <div>
              <h2 className="text-xl font-bold text-ink-heading">
                1. Essential Functional Storage
              </h2>
              <p className="mt-2">
                {settings.companyName} uses minimal browser storage strictly required for core functionality:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-ink-heading">Theme Preference (`omniflow-theme-mode`):</strong>{" "}
                  Remembers whether you selected Light, Dark, or System display mode.
                </li>
                <li>
                  <strong className="text-ink-heading">Admin Session Cookie (`omniflow_session`):</strong>{" "}
                  Set strictly for authenticated administrators (`HttpOnly`, `SameSite=Lax`). Regular public visitors do not receive authentication cookies.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-ink-heading">
                2. Optional Analytics Cookies
              </h2>
              <p className="mt-2">
                Optional analytics scripts are disabled by default and never load prior to explicit visitor consent where consent is required. You can clear browser storage or adjust consent preferences at any time without losing access to public content.
              </p>
              <div className="mt-4">
                <CookiePreferencesButton variant="button" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-line pt-6 text-xs font-semibold text-primary">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy →
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service →
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact OmniFlow →
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
