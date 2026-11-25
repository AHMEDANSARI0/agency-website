import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import Link from "next/link";
import { getCachedSiteSettings } from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleCard } from "@/components/ui/soale";
import { CookiePreferencesButton } from "@/components/analytics/CookiePreferencesButton";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("cookie-policy");
}

export default async function CookiePolicyPage() {
  const settings = await getCachedSiteSettings();

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        breadcrumbs={[{ label: "Cookie Policy" }]}
        badge="Privacy & Storage Controls"
        title="Cookie & Local Storage Policy"
        description={`Effective Date: November 22, 2026 · ${settings.companyName}`}
      />

      <section className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <SoaleCard className="space-y-8 p-6 text-sm leading-relaxed text-ink-body sm:p-10 sm:text-base">
            <div>
              <h2 className="soale-h4 text-ink-heading">
                1. Essential Functional Storage
              </h2>
              <p className="mt-2.5">
                {settings.companyName} uses minimal browser storage strictly
                required for core functionality:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-ink-heading">
                    Theme Preference (`omniflow-theme-mode`):
                  </strong>{" "}
                  Remembers whether you selected Light, Dark, or System display
                  mode.
                </li>
                <li>
                  <strong className="text-ink-heading">
                    Admin Session Cookie (`omniflow_session`):
                  </strong>{" "}
                  Set strictly for authenticated administrators (`HttpOnly`,
                  `SameSite=Lax`). Regular public visitors do not receive
                  authentication cookies.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="soale-h4 text-ink-heading">
                2. Optional Analytics Cookies
              </h2>
              <p className="mt-2.5">
                Optional analytics scripts are disabled by default and never
                load prior to explicit visitor consent where consent is
                required. You can clear browser storage or adjust consent
                preferences at any time without losing access to public content.
              </p>
              <div className="mt-5">
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
          </SoaleCard>
        </Container>
      </section>
    </div>
  );
}
