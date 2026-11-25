"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";
import { trackAnalyticsEvent } from "@/components/analytics/AnalyticsConsentManager";

declare global {
  interface Window {
    __OMNIFLOW_VITALS__?: Record<
      string,
      { value: number; rating: string; delta: number }
    >;
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const runOnIdle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : (cb: () => void) => window.setTimeout(cb, 1200);

    let cancelled = false;
    const handle = runOnIdle(() => {
      import("web-vitals")
        .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
          if (cancelled) return;
          const record = (metric: Metric) => {
            window.__OMNIFLOW_VITALS__ = window.__OMNIFLOW_VITALS__ || {};
            window.__OMNIFLOW_VITALS__[metric.name] = {
              value: Number(metric.value.toFixed(3)),
              rating: metric.rating,
              delta: Number(metric.delta.toFixed(3)),
            };
            trackAnalyticsEvent("web_vital", {
              metric_name: metric.name,
              metric_value: Math.round(
                metric.name === "CLS" ? metric.value * 1000 : metric.value
              ),
              metric_rating: metric.rating,
            });
          };
          onCLS(record);
          onFCP(record);
          onINP(record);
          onLCP(record);
          onTTFB(record);
        })
        .catch(() => undefined);
    });

    return () => {
      cancelled = true;
      if (
        typeof window.cancelIdleCallback === "function" &&
        typeof handle === "number"
      ) {
        window.cancelIdleCallback(handle);
      }
    };
  }, []);

  return null;
}
