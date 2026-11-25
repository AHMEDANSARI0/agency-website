"use client";

import { useEffect } from "react";

/**
 * Lightweight, privacy-safe client runtime error monitor.
 * Reports uncaught browser exceptions to `/api/telemetry/error` (deduplicated per session)
 * so the Admin Panel Live Site Report immediately alerts site owners if any page breaks.
 */
export function ClientErrorMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reportedKeys = new Set<string>();

    const sendIncident = (message: string) => {
      const clean = (message || "").trim().slice(0, 280);
      if (!clean) return;
      if (/ResizeObserver loop|extension:\/\//i.test(clean)) return;

      const route = window.location.pathname || "/";
      const dedupeKey = `${route}::${clean}`;
      if (reportedKeys.has(dedupeKey) || reportedKeys.size >= 8) return;
      reportedKeys.add(dedupeKey);

      const payload = JSON.stringify({
        source: "client_runtime",
        severity: "critical",
        route,
        message: clean,
      });

      fetch("/api/telemetry/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    };

    const onError = (event: ErrorEvent) => {
      if (event.message) {
        sendIncident(event.message);
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof Error && reason.message) {
        sendIncident(`Unhandled Promise: ${reason.message}`);
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
