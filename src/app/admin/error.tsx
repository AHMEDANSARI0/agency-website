"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard, RotateCcw } from "lucide-react";

export default function AdminWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-12 text-center"
    >
      <div className="mx-auto max-w-md rounded-card border border-[var(--of-border-card)] bg-surface-card p-7 shadow-elevated">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-status-warning/15 text-status-warning">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-bold text-ink-heading">
          Admin Module Temporarily Unavailable
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          This administrative view encountered an unexpected error. Your session and database state remain intact.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[11px] text-ink-muted">
            Digest: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Module</span>
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-4 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            <span>Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
