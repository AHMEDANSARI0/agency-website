import React from "react";
import {
  getCachedBrandAssets,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MotionRuntime } from "@/components/animations/MotionRuntime";
import { ScrollCardChoreography } from "@/components/animations/ScrollCardChoreography";
import { ScrollProgressBar } from "@/components/animations/ScrollProgressBar";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { AnalyticsConsentManager } from "@/components/analytics/AnalyticsConsentManager";
import { ClientErrorMonitor } from "@/components/analytics/ClientErrorMonitor";
import { WebVitalsReporter } from "@/components/analytics/WebVitalsReporter";
import { buildOrganizationAndWebsiteJsonLd } from "@/features/seo/json-ld";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brand, settings] = await Promise.all([
    getCachedBrandAssets(),
    getCachedSiteSettings(),
  ]);

  const orgJsonLd = buildOrganizationAndWebsiteJsonLd(settings, brand);

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLdScript data={orgJsonLd} />
      <ScrollProgressBar />
      <MotionRuntime />
      <ScrollCardChoreography />
      <ClientErrorMonitor />
      <WebVitalsReporter />
      <Navbar brand={brand} settings={settings} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer brand={brand} settings={settings} />
      <AnalyticsConsentManager
        enabled={settings.analytics.enabled}
        ga4MeasurementId={settings.analytics.ga4MeasurementId}
        requireCookieConsent={settings.analytics.requireCookieConsent}
      />
    </div>
  );
}
