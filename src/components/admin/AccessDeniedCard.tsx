import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { UserRole } from "@/types/auth";

interface AccessDeniedCardProps {
  role: UserRole;
  moduleName: string;
}

export function AccessDeniedCard({ role, moduleName }: AccessDeniedCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-card border border-status-warning/40 bg-surface-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/15 text-status-warning">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-bold text-ink-heading">Access Restricted</h1>
      <p className="mt-2 text-sm text-ink-body">
        Your current role (<span className="font-semibold text-ink-heading">{role}</span>) does
        not have server-side permission to access <strong>{moduleName}</strong>.
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Contact a Super Admin if your role policy needs adjustment.
      </p>
      <div className="mt-6">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
