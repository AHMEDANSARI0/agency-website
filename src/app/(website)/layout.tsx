import React from "react";
import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { db } from "@/lib/database";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MotionRuntime } from "@/components/animations/MotionRuntime";
import { OpeningSequence } from "@/components/animations/OpeningSequence";
import { AmbientSoundToggle } from "@/components/animations/AmbientSoundToggle";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { AnalyticsConsentManager } from "@/components/analytics/AnalyticsConsentManager";
import { buildOrganizationAndWebsiteJsonLd } from "@/features/seo/json-ld";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let requestedPath: string | null = null;
  try {
    const reqHeaders = await headers();
    requestedPath = reqHeaders.get("x-omniflow-pathname");
  } catch {
    requestedPath = null;
  }

  if (requestedPath && requestedPath !== "/") {
    const rule = await db.findActiveRedirect(requestedPath);
    if (rule) {
      if (rule.permanent) {
        permanentRedirect(rule.destinationPath);
      }
      redirect(rule.destinationPath);
    }
  }

  const [brand, settings] = await Promise.all([
    db.getBrandAssets(),
    db.getSiteSettings(),
  ]);

  const orgJsonLd = buildOrganizationAndWebsiteJsonLd(settings, brand);

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLdScript data={orgJsonLd} />
      <OpeningSequence brandName={brand.brandName} tagline={settings.tagline} />
      <MotionRuntime />
      <Navbar brand={brand} settings={settings} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer brand={brand} settings={settings} />
      <AmbientSoundToggle />
      <AnalyticsConsentManager
        enabled={settings.analytics.enabled}
        ga4MeasurementId={settings.analytics.ga4MeasurementId}
        requireCookieConsent={settings.analytics.requireCookieConsent}
      />
    </div>
  );
}
