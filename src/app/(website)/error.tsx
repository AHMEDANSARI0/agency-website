"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

export default function WebsiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="flex min-h-[65vh] items-center justify-center bg-canvas px-4 py-20 text-center"
    >
      <div className="mx-auto w-full max-w-lg rounded-[20px] border border-line bg-surface-card p-8 sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-muted text-status-warning">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-heading">
          Unable to load this section right now.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Please try loading the page again, or reach out via our contact page
          if you need immediate assistance.
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
    </section>
  );
}
