"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        setupRequired?: boolean;
        mustChangePassword?: boolean;
      };

      if (!res.ok) {
        if (data.setupRequired) {
          router.push("/admin/setup");
          return;
        }
        setError(data.error || "Sign-in failed. Please check your credentials.");
        setSubmitting(false);
        return;
      }

      if (data.mustChangePassword) {
        router.push("/admin/account?forcePasswordChange=1");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError("Network error while signing in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Email address
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
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="admin-password"
            className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            Password
          </label>
          <Link
            href="/admin/recover"
            className="text-xs font-medium text-link hover:text-link-hover"
          >
            Forgot password?
          </Link>
        </div>
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
        <span>{submitting ? "Signing in..." : "Sign in"}</span>
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
