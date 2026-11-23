import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "status";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const styles =
    variant === "outline"
      ? "border border-line-strong bg-surface text-ink-body"
      : variant === "status"
        ? "border border-line bg-surface-muted text-ink-muted"
        : "bg-[var(--of-surface-badge)] text-[var(--of-text-badge)] border border-transparent";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
