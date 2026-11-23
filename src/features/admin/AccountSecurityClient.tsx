"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { DatabaseBackupSummary, SafeUser } from "@/types/auth";

interface AccountSecurityClientProps {
  user: SafeUser;
  initialBackups: DatabaseBackupSummary[];
  canManageBackups: boolean;
}

export function AccountSecurityClient({
  user,
  initialBackups,
  canManageBackups,
}: AccountSecurityClientProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [backups, setBackups] = useState<DatabaseBackupSummary[]>(initialBackups);
  const [backupLabel, setBackupLabel] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Unable to update password.");
        setSubmitting(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(
        "Password updated and all sessions on other browsers/devices have been revoked."
      );
      setSubmitting(false);

      if (user.mustChangePassword) {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError("Network error while updating password.");
      setSubmitting(false);
    }
  }

  async function handleRevokeOtherSessions() {
    setError(null);
    setNotice(null);
    setRevoking(true);
    try {
      const res = await fetch("/api/admin/auth/password?keepCurrent=true", {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sessionVersion?: number;
      };
      if (!res.ok) {
        setError(data.error || "Unable to revoke active sessions.");
      } else {
        setNotice(
          `Revoked all other active sessions (active session generation: v${data.sessionVersion ?? user.sessionVersion + 1}).`
        );
        router.refresh();
      }
    } catch {
      setError("Network error while revoking sessions.");
    } finally {
      setRevoking(false);
    }
  }

  async function handleCreateBackup() {
    setBackupBusy(true);
    setBackupMsg(null);
    try {
      const res = await fetch("/api/admin/system/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label: backupLabel.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        backup?: DatabaseBackupSummary;
      };
      if (!res.ok || !data.backup) {
        setBackupMsg(data.error || "Failed to create database snapshot.");
      } else {
        setBackups((prev) => [data.backup!, ...prev]);
        setBackupLabel("");
        setBackupMsg(
          `Created verified snapshot "${data.backup.label}" (sha256:${data.backup.checksumSha256.slice(0, 12)}).`
        );
      }
    } catch {
      setBackupMsg("Network error while creating snapshot.");
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreBackup(backupId: string, label: string) {
    if (
      !window.confirm(
        `Restore snapshot "${label}"? An automatic pre-restore safety backup will be created first.`
      )
    ) {
      return;
    }

    setBackupBusy(true);
    setBackupMsg(null);
    try {
      const res = await fetch("/api/admin/system/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", backupId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        safetyBackupId?: string;
      };
      if (!res.ok) {
        setBackupMsg(data.error || "Restore aborted.");
      } else {
        setBackupMsg(
          `Snapshot restored cleanly. Pre-restore safety snapshot saved (${data.safetyBackupId}).`
        );
        const listRes = await fetch("/api/admin/system/backups");
        const listJson = (await listRes.json().catch(() => ({}))) as {
          backups?: DatabaseBackupSummary[];
        };
        if (listJson.backups) setBackups(listJson.backups);
        router.refresh();
      }
    } catch {
      setBackupMsg("Network error during snapshot restore.");
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {user.mustChangePassword && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-card border border-status-warning/50 bg-status-warning/10 p-5 text-sm text-ink-heading"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
          <div>
            <p className="font-bold">
              Mandatory First-Login Password Replacement Required
            </p>
            <p className="mt-1 text-ink-body">
              Your account is using an initial bootstrap credential. Replace your password below to unlock full administrative access.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Rotate Staff Password
              </h2>
              <p className="text-xs text-ink-muted">
                Minimum 10 characters with uppercase, lowercase, and numeric characters
              </p>
            </div>
            <KeyRound className="h-5 w-5 text-primary" />
          </div>

          <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-control border border-status-error/40 bg-status-error/10 p-3 text-xs text-ink-heading"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 rounded-control border border-status-success/40 bg-status-success/10 p-3 text-xs text-ink-heading">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                <span>{notice}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="current-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                New Unique Password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              <span>{submitting ? "Updating..." : "Update Password"}</span>
            </button>
          </form>
        </section>

        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Active Session Security
              </h2>
              <p className="text-xs text-ink-muted">
                Instant server-side session revocation across devices
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Signed-in Email</dt>
              <dd className="font-semibold text-ink-heading">{user.email}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Assigned Role</dt>
              <dd className="font-semibold text-ink-heading">
                {user.role.replace("_", " ")}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Session Generation</dt>
              <dd className="font-mono font-semibold text-ink-heading">
                v{user.sessionVersion}
              </dd>
            </div>
            <div className="flex justify-between pb-2">
              <dt className="text-ink-muted">Last Password Rotation</dt>
              <dd className="text-ink-heading">
                {user.passwordChangedAt
                  ? user.passwordChangedAt.slice(0, 19).replace("T", " ")
                  : "Initial credential"}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <button
              type="button"
              disabled={revoking}
              onClick={handleRevokeOtherSessions}
              className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface px-4 py-2 text-xs font-semibold text-ink-heading transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {revoking
                  ? "Revoking..."
                  : "Revoke All Other Browser Sessions"}
              </span>
            </button>
          </div>
        </section>
      </div>

      {canManageBackups && !user.mustChangePassword && (
        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Database Snapshots & Safe Transactional Restore
              </h2>
              <p className="text-xs text-ink-muted">
                Create verified SHA-256 snapshots before schema or content changes, or export portable JSON archives.
              </p>
            </div>
            <a
              href="/api/admin/system/backups?download=true"
              className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON Backup</span>
            </a>
          </div>

          {backupMsg && (
            <p className="mt-4 rounded-control border border-line bg-surface-muted px-3.5 py-2.5 text-xs text-ink-heading">
              {backupMsg}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="text"
              value={backupLabel}
              onChange={(e) => setBackupLabel(e.target.value)}
              placeholder="Optional snapshot label (e.g., Pre-migration checkpoint)"
              className="min-w-[240px] flex-1 rounded-control border border-line bg-surface-input px-3 py-2 text-xs text-ink-heading"
            />
            <button
              type="button"
              disabled={backupBusy}
              onClick={handleCreateBackup}
              className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              <Database className="h-3.5 w-3.5" />
              <span>{backupBusy ? "Working..." : "Create Snapshot"}</span>
            </button>
          </div>

          {backups.length === 0 ? (
            <p className="mt-4 text-xs text-ink-muted">
              No stored database snapshots yet. Create one before applying major content or configuration updates.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-line">
              {backups.slice(0, 8).map((bkp) => (
                <div
                  key={bkp.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-ink-heading">{bkp.label}</p>
                    <p className="text-ink-muted">
                      {bkp.createdAt.slice(0, 19).replace("T", " ")} UTC ·{" "}
                      {Math.max(1, Math.round(bkp.sizeBytes / 1024))} KB · sha256:
                      {bkp.checksumSha256.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={backupBusy}
                    onClick={() => handleRestoreBackup(bkp.id, bkp.label)}
                    className="rounded-control border border-line px-3 py-1.5 font-semibold text-ink-heading hover:bg-surface-muted disabled:opacity-60"
                  >
                    Restore Safely
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
