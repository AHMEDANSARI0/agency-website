"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

interface InitialSetupFormProps {
  requiresSetupToken: boolean;
}

export function InitialSetupForm({ requiresSetupToken }: InitialSetupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          setupToken: requiresSetupToken ? setupToken : undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Unable to initialize administrator account.");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error while completing initial setup.");
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
          htmlFor="setup-name"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Full Name
        </label>
        <input
          id="setup-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ahmed Ansari"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <div>
        <label
          htmlFor="setup-email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Super Admin Email
        </label>
        <input
          id="setup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="founder@yourdomain.com"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <div>
        <label
          htmlFor="setup-password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Strong Administrator Password
        </label>
        <input
          id="setup-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 10 chars with upper, lower, and number"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <div>
        <label
          htmlFor="setup-confirm"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Confirm Password
        </label>
        <input
          id="setup-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      {requiresSetupToken && (
        <div>
          <label
            htmlFor="setup-token"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            Deployment Setup Token
          </label>
          <input
            id="setup-token"
            type="password"
            required
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
            placeholder="Enter ADMIN_SETUP_TOKEN (or AUTH_SECRET)"
            className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Matches <code>ADMIN_SETUP_TOKEN</code> (or <code>AUTH_SECRET</code>) from your deployment environment variables.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <KeyRound className="h-4 w-4" />
        <span>
          {submitting
            ? "Provisioning Super Admin..."
            : "Complete One-Time Administrator Setup"}
        </span>
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>

      <div className="flex items-start gap-2 rounded-control border border-line bg-surface-muted/70 p-3 text-xs text-ink-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          This setup endpoint locks permanently as soon as the first Super Admin account is created.
        </p>
      </div>
    </form>
  );
}
