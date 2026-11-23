"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { X } from "lucide-react";

export const CONSENT_STORAGE_KEY = "omniflow-cookie-consent";
export const OPEN_COOKIE_PREFS_EVENT = "omniflow:open-cookie-preferences";
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
  const [manualOpen, setManualOpen] = useState(false);
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

    const onOpenPrefs = () => setManualOpen(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManualOpen(false);
    };

    window.addEventListener(OPEN_COOKIE_PREFS_EVENT, onOpenPrefs);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_COOKIE_PREFS_EVENT, onOpenPrefs);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  const shouldLoadScript =
    hasValidGa && (!requireCookieConsent || consent === "accepted");
  const shouldShowBanner =
    manualOpen || (hasValidGa && requireCookieConsent && consent === "unknown");

  function handleChoice(choice: "accepted" | "declined") {
    setConsent(choice);
    setManualOpen(false);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Ignore private browsing storage quota restrictions
    }
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: choice === "accepted" ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
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
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
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
          className="fixed bottom-4 left-4 right-4 z-[95] mx-auto max-w-lg rounded-card border border-line-strong bg-surface-elevated/95 p-4 shadow-elevated backdrop-blur sm:left-6 sm:right-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              Privacy &amp; Cookie Preferences
            </p>
            {manualOpen && (
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                aria-label="Close cookie preferences"
                className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-ink-body">
            {hasValidGa
              ? "We use optional privacy-focused analytics to understand which workflow guides and demos help visitors most. Advertising trackers are permanently disabled."
              : "Optional analytics scripts are currently disabled across this website — only strictly essential preference storage is active."}{" "}
            Read our{" "}
            <Link
              href="/cookie-policy"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              Cookie Policy
            </Link>
            .
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleChoice("accepted")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                consent === "accepted"
                  ? "bg-primary text-primary-foreground ring-2 ring-[var(--of-ring-focus)]"
                  : "bg-primary text-primary-foreground hover:bg-primary-hover"
              }`}
            >
              {consent === "accepted" ? "Analytics Enabled ✓" : "Accept Analytics"}
            </button>
            <button
              type="button"
              onClick={() => handleChoice("declined")}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                consent === "declined"
                  ? "border-primary bg-accent-subtle text-primary"
                  : "border-line-strong bg-surface text-ink-heading hover:bg-surface-muted"
              }`}
            >
              {consent === "declined" ? "Essential Only ✓" : "Essential Only"}
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
