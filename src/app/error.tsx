"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-tech-grid-subtle flex min-h-[75vh] flex-col items-center justify-center bg-canvas px-4 py-16 text-center"
    >
      <div className="mx-auto max-w-lg rounded-card border border-[var(--of-border-card)] bg-surface-card p-8 shadow-elevated">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-status-warning/15 text-status-warning">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary">
          Graceful Fault Isolation
        </p>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight text-ink-heading sm:text-2xl">
          Service Temporarily Unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          OmniFlow isolated a temporary backend or network condition. No partial or corrupted writes were committed.
        </p>
        {error?.digest && (
          <p className="mt-3 rounded-md border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs text-ink-muted">
            Diagnostic Digest: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Request</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-muted"
          >
            <Home className="h-4 w-4 text-primary" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
