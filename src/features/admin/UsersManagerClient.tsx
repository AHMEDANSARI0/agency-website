"use client";

import React, { useState } from "react";
import { CheckCircle2, KeyRound, Shield, UserPlus } from "lucide-react";
import type { RolePolicyConfig, SafeUser, UserRole } from "@/types/auth";

const ROLES: UserRole[] = ["SUPER_ADMIN", "EDITOR", "AUTHOR"];

interface UsersManagerClientProps {
  initialUsers: SafeUser[];
  initialPolicies: RolePolicyConfig;
  currentUserId: string;
}

export function UsersManagerClient({
  initialUsers,
  initialPolicies,
  currentUserId,
}: UsersManagerClientProps) {
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [policies, setPolicies] = useState<RolePolicyConfig>(initialPolicies);

  // Provision form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EDITOR");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Password reset inline state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          password: newPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: SafeUser;
      };

      if (!res.ok || !data.user) {
        setFeedback({
          type: "error",
          text: data.error || "Failed to provision staff account.",
        });
        setCreating(false);
        return;
      }

      setUsers((prev) => [...prev, data.user!]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("EDITOR");
      setFeedback({
        type: "success",
        text: `Provisioned ${data.user.email} (${data.user.role}).`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while creating staff account.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(
    userId: string,
    payload: Record<string, unknown>,
    successMsg: string
  ) {
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: SafeUser;
      };
      if (!res.ok || !data.user) {
        setFeedback({
          type: "error",
          text: data.error || "Failed to update staff user.",
        });
        return false;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === data.user!.id ? data.user! : u))
      );
      setFeedback({ type: "success", text: successMsg });
      return true;
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while updating staff account.",
      });
      return false;
    }
  }

  async function handleSavePolicies(next: RolePolicyConfig) {
    setSavingPolicy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/role-policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        rolePolicies?: RolePolicyConfig;
      };
      if (!res.ok || !data.rolePolicies) {
        setFeedback({
          type: "error",
          text: data.error || "Failed to update role policy settings.",
        });
        setSavingPolicy(false);
        return;
      }
      setPolicies(data.rolePolicies);
      setFeedback({
        type: "success",
        text: "Server-side Editor role permissions updated.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving role policies.",
      });
    } finally {
      setSavingPolicy(false);
    }
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-control border p-3 text-xs font-medium ${
            feedback.type === "success"
              ? "border-status-success/40 bg-status-success/10 text-ink-heading"
              : "border-status-error/40 bg-status-error/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Role Policy Matrix */}
      <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink-heading">
              Role-Based Access Control (RBAC) Policies
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Super Admins retain full platform control. Authors can create and edit their own drafts only. Customize Editor capabilities below:
            </p>
          </div>
          <Shield className="h-5 w-5 shrink-0 text-primary" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-line bg-surface-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold text-ink-heading">
                Allow Editors to Publish Directly
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                When enabled, users with the <code>EDITOR</code> role can publish pages, blog posts, and case studies without waiting for Super Admin approval.
              </p>
            </div>
            <input
              type="checkbox"
              checked={policies.editorCanPublish}
              disabled={savingPolicy}
              onChange={(e) =>
                handleSavePolicies({
                  ...policies,
                  editorCanPublish: e.target.checked,
                })
              }
              className="mt-1 h-4 w-4 rounded border-line text-primary focus:ring-[var(--of-ring-focus)]"
            />
          </label>

          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-line bg-surface-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold text-ink-heading">
                Allow Editors to Manage Theme Tokens
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                By default, Light/Dark color presets and brand assets are restricted to Super Admins. Enable only if trusted Editors manage visual design.
              </p>
            </div>
            <input
              type="checkbox"
              checked={policies.editorCanManageTheme}
              disabled={savingPolicy}
              onChange={(e) =>
                handleSavePolicies({
                  ...policies,
                  editorCanManageTheme: e.target.checked,
                })
              }
              className="mt-1 h-4 w-4 rounded border-line text-primary focus:ring-[var(--of-ring-focus)]"
            />
          </label>
        </div>
      </section>

      {/* Staff Directory & Provisioning */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Existing Staff List */}
        <section className="space-y-4 rounded-card border border-line bg-surface-card p-6 shadow-card lg:col-span-7">
          <div>
            <h2 className="text-base font-bold text-ink-heading">
              Provisioned Staff Accounts ({users.length})
            </h2>
            <p className="text-xs text-ink-muted">
              Deactivating an account immediately revokes server-side session access.
            </p>
          </div>

          <div className="divide-y divide-line">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isResetting = resetUserId === u.id;
              return (
                <div key={u.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-heading">{u.name}</p>
                        {isSelf && (
                          <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                            You
                          </span>
                        )}
                        {!u.isActive && (
                          <span className="rounded bg-status-error/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-status-error">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted">
                        {u.email} · Last login:{" "}
                        {u.lastLoginAt
                          ? `${u.lastLoginAt.replace("T", " ").slice(0, 16)} UTC`
                          : "Never"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) =>
                          patchUser(
                            u.id,
                            { role: e.target.value as UserRole },
                            `Updated ${u.email} role to ${e.target.value}.`
                          )
                        }
                        className="rounded-control border border-line bg-surface-input px-2.5 py-1.5 text-xs font-semibold text-ink-heading disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setResetUserId(isResetting ? null : u.id);
                          setResetPasswordInput("");
                        }}
                        className="inline-flex items-center gap-1 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-body hover:bg-surface-muted"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>Password</span>
                      </button>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() =>
                            patchUser(
                              u.id,
                              { isActive: !u.isActive },
                              u.isActive
                                ? `Suspended ${u.email}.`
                                : `Reactivated ${u.email}.`
                            )
                          }
                          className={`rounded-control border px-2.5 py-1.5 text-xs font-semibold ${
                            u.isActive
                              ? "border-status-error/40 text-status-error hover:bg-status-error/10"
                              : "border-status-success/40 text-status-success hover:bg-status-success/10"
                          }`}
                        >
                          {u.isActive ? "Suspend" : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>

                  {isResetting && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await patchUser(
                          u.id,
                          { newPassword: resetPasswordInput },
                          `Rotated password for ${u.email}.`
                        );
                        if (ok) {
                          setResetUserId(null);
                          setResetPasswordInput("");
                        }
                      }}
                      className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-surface-muted/50 p-3"
                    >
                      <input
                        type="password"
                        required
                        minLength={10}
                        value={resetPasswordInput}
                        onChange={(e) => setResetPasswordInput(e.target.value)}
                        placeholder="New password (min 10 chars, upper/lower/number)"
                        className="flex-1 rounded-control border border-line bg-surface-input px-3 py-1.5 text-xs text-ink-heading"
                      />
                      <button
                        type="submit"
                        className="rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                      >
                        Save Password
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Provision New Staff Account */}
        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Provision Staff Account
              </h2>
              <p className="text-xs text-ink-muted">
                Invitation-only internal access (no public signup)
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="new-staff-name"
                className="mb-1 block text-xs font-semibold text-ink-muted"
              >
                Full Name
              </label>
              <input
                id="new-staff-name"
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Sara Khan"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-staff-email"
                className="mb-1 block text-xs font-semibold text-ink-muted"
              >
                Work Email
              </label>
              <input
                id="new-staff-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="editor@omniflow.example"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-staff-role"
                className="mb-1 block text-xs font-semibold text-ink-muted"
              >
                Assigned Role
              </label>
              <select
                id="new-staff-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              >
                <option value="EDITOR">EDITOR — Content, Media & Lead CRM</option>
                <option value="AUTHOR">AUTHOR — Own Draft Creation Only</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full Platform Control</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-staff-password"
                className="mb-1 block text-xs font-semibold text-ink-muted"
              >
                Initial Strong Password
              </label>
              <input
                id="new-staff-password"
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 10 chars with A-Z, a-z, 0-9"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              <span>{creating ? "Provisioning..." : "Create Staff Account"}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
