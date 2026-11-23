"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, ShieldCheck } from "lucide-react";

interface LoginFormProps {
  showDevHint: boolean;
  defaultDevEmail?: string;
}

export function LoginForm({ showDevHint, defaultDevEmail }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(showDevHint && defaultDevEmail ? defaultDevEmail : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Sign-in failed. Please check your credentials.");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error while signing in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-control border border-status-error/40 bg-status-error/10 p-3 text-sm text-ink-heading"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Staff Email Address
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter staff password"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Lock className="h-4 w-4" />
        <span>{submitting ? "Verifying session..." : "Sign In to Admin Console"}</span>
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>

      <div className="flex items-start gap-2 rounded-control border border-line bg-surface-muted/70 p-3 text-xs text-ink-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-ink-heading">Invitation-Only Staff Access</p>
          <p className="mt-0.5">
            Public registration is permanently disabled. Accounts are provisioned exclusively by
            Super Admins with server-enforced role policies and audit logging.
          </p>
          {showDevHint && (
            <p className="mt-2 rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-body">
              Local Dev Bootstrap: <strong>{defaultDevEmail}</strong> /{" "}
              <strong>ChangeMe_StrongPass_2026!</strong> (override via <code>.env.local</code>)
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
