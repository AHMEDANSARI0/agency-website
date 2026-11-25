"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "error_boundary",
        severity: "critical",
        route: window.location.pathname || "/",
        message: error?.message || "Route error boundary triggered",
        digest: error?.digest,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error]);

  return (
    <main
      id="main-content"
      role="alert"
      className="flex min-h-[75vh] flex-col items-center justify-center bg-canvas px-4 py-20 text-center"
    >
      <div className="mx-auto w-full max-w-lg rounded-[20px] border border-line bg-surface-card p-8 sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-muted text-status-warning">
          <AlertCircle className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Temporary interruption
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-heading">
          Something went wrong loading this page.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Please try again in a moment, or return to the home page. Your data
          and any submitted enquiries remain safe.
        </p>
        {error?.digest && (
          <p className="mt-4 rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs text-ink-muted">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
          >
            <Home className="h-4 w-4 text-primary" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
