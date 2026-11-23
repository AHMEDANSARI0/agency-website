"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, KeyRound, Mail } from "lucide-react";

interface PasswordRecoveryClientProps {
  resetToken?: string;
}

export function PasswordRecoveryClient({ resetToken }: PasswordRecoveryClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleRequestRecovery(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(data.error || "Unable to submit recovery request.");
      } else {
        setSuccessMessage(
          data.message ||
            "If an active staff account matches this email, recovery instructions have been sent."
        );
      }
    } catch {
      setError("Network error while submitting recovery request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(data.error || "Invalid or expired recovery token.");
        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        data.message || "Password updated. Redirecting to sign in..."
      );
      setTimeout(() => {
        router.push("/admin/login");
      }, 1500);
    } catch {
      setError("Network error while resetting password.");
      setSubmitting(false);
    }
  }

  if (resetToken) {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-control border border-status-error/40 bg-status-error/10 p-3 text-sm text-ink-heading"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start gap-2.5 rounded-control border border-status-success/40 bg-status-success/10 p-3 text-sm text-ink-heading">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
            <span>{successMessage}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="recover-new-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            New Strong Password
          </label>
          <input
            id="recover-new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 10 chars with upper, lower, and number"
            className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
          />
        </div>

        <div>
          <label
            htmlFor="recover-confirm-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            Confirm New Password
          </label>
          <input
            id="recover-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          <span>{submitting ? "Updating password..." : "Set New Password"}</span>
        </button>

        <div className="text-center text-xs">
          <Link href="/admin/login" className="font-medium text-link hover:text-link-hover">
            Return to Sign In
          </Link>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestRecovery} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-control border border-status-error/40 bg-status-error/10 p-3 text-sm text-ink-heading"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-control border border-status-success/40 bg-status-success/10 p-3 text-sm text-ink-heading">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
          <span>{successMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="recover-email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Staff Email Address
        </label>
        <input
          id="recover-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          className="w-full rounded-control border border-line bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        <Mail className="h-4 w-4" />
        <span>
          {submitting ? "Requesting link..." : "Send Single-Use Recovery Link"}
        </span>
      </button>

      <div className="text-center text-xs">
        <Link href="/admin/login" className="font-medium text-link hover:text-link-hover">
          Back to Staff Sign In
        </Link>
      </div>
    </form>
  );
}
