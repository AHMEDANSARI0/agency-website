"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const CONSENT_STORAGE_KEY = "omniflow-cookie-consent";
const GA4_ID_REGEX = /^G-[A-Z0-9]{4,16}$/;

interface AnalyticsConsentManagerProps {
  enabled: boolean;
  ga4MeasurementId: string;
  requireCookieConsent: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackAnalyticsEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, params ?? {});
}

export function AnalyticsConsentManager({
  enabled,
  ga4MeasurementId,
  requireCookieConsent,
}: AnalyticsConsentManagerProps) {
  const cleanId = ga4MeasurementId.trim().toUpperCase();
  const hasValidGa = enabled && GA4_ID_REGEX.test(cleanId);

  const [consent, setConsent] = useState<"unknown" | "accepted" | "declined">(
    "unknown"
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const saved = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved === "accepted" || saved === "declined") {
        setConsent(saved);
      }
    } catch {
      setConsent("declined");
    }
  }, []);

  if (!hasValidGa || !hydrated) {
    return null;
  }

  const shouldLoadScript = !requireCookieConsent || consent === "accepted";
  const shouldShowBanner = requireCookieConsent && consent === "unknown";

  function handleChoice(choice: "accepted" | "declined") {
    setConsent(choice);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Ignore private browsing storage quota restrictions
    }
  }

  return (
    <>
      {shouldLoadScript && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${cleanId}`}
            strategy="afterInteractive"
          />
          <Script id="omniflow-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${cleanId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {shouldShowBanner && (
        <aside
          role="region"
          aria-label="Cookie and analytics preferences"
          className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-lg rounded-card border border-line-strong bg-surface-elevated/95 p-4 shadow-elevated backdrop-blur sm:left-6 sm:right-auto"
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
            Privacy &amp; Analytics
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
            We use optional privacy-focused analytics to understand which
            workflow guides and demos help visitors most. No advertising
            trackers are loaded. Read our{" "}
            <Link
              href="/cookie-policy"
              className="underline underline-offset-2 hover:text-ink-heading"
            >
              Cookie Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleChoice("accepted")}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Accept Analytics
            </button>
            <button
              type="button"
              onClick={() => handleChoice("declined")}
              className="rounded-full border border-line-strong bg-surface px-4 py-1.5 text-xs font-medium text-ink-heading transition-colors hover:bg-surface-muted"
            >
              Essential Only
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
