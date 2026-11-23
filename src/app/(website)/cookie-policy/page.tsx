import type { Metadata } from "next";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

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

      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl space-y-8 text-sm leading-relaxed text-ink-body sm:text-base">
          <div>
            <h2 className="text-xl font-bold text-ink-heading">
              1. Essential Functional Storage
            </h2>
            <p className="mt-2">
              {settings.companyName} uses minimal browser storage strictly required for core
              functionality:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-ink-heading">Theme Preference (`omniflow-theme-mode`):</strong>{" "}
                Remembers whether you selected Light, Dark, or System display mode.
              </li>
              <li>
                <strong className="text-ink-heading">Admin Session Cookie (`omniflow_session`):</strong>{" "}
                Set strictly for authenticated administrators (`HttpOnly`, `SameSite=Lax`). Regular
                public visitors do not receive authentication cookies.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-heading">
              2. Optional Analytics Cookies
            </h2>
            <p className="mt-2">
              Optional analytics scripts are disabled by default and never load prior to explicit
              visitor consent where consent is required. You can clear browser storage or adjust
              consent preferences at any time without losing access to public content.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
