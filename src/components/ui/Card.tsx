import React from "react";

export type CardVariant = "default" | "elevated" | "muted" | "glass";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  interactive?: boolean;
  spotlight?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "border border-[var(--of-border-card)] bg-surface-card shadow-card",
  elevated: "border border-line-strong bg-surface-elevated shadow-elevated",
  muted: "border border-line bg-surface-muted",
  glass: "border surface-glass shadow-card",
};

const PADDING_CLASSES = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-7",
  lg: "p-7 sm:p-9",
} as const;

export function Card({
  variant = "default",
  interactive = false,
  spotlight = false,
  padding = "md",
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`rounded-card ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${
        interactive ? "card-interactive" : ""
      } ${spotlight ? "spot" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
