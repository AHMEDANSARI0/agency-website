import React from "react";

export type BadgeVariant =
  | "default"
  | "outline"
  | "status"
  | "accent"
  | "success"
  | "warning";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--of-surface-badge)] text-[var(--of-text-badge)] border border-primary/15",
  outline:
    "border border-line-strong bg-surface text-ink-body",
  status:
    "border border-line bg-surface-muted text-ink-muted",
  accent:
    "border border-primary/20 bg-accent-subtle text-primary",
  success:
    "border border-status-success/25 bg-status-success/10 text-status-success",
  warning:
    "border border-status-warning/25 bg-status-warning/10 text-status-warning",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
