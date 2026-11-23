"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-lg rounded-card border border-line bg-surface-card p-8 shadow-elevated">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-ink-heading sm:text-2xl">
          Service Temporarily Unavailable
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          OmniFlow encountered a temporary backend or database readiness condition. No partial or unsafe changes were saved.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-ink-muted">
            Reference ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/api/health"
            className="rounded-control border border-line px-4 py-2 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-muted"
          >
            Check Health Status
          </Link>
        </div>
      </div>
    </div>
  );
}
