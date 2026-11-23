import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_36px_-10px_rgba(210,58,31,0.65)] hover:bg-primary-hover hover:shadow-[0_14px_44px_-8px_rgba(240,106,42,0.75)] active:bg-primary-active",
  secondary:
    "bg-secondary text-secondary-foreground hover:opacity-92 active:opacity-85",
  outline:
    "border border-line-strong bg-transparent text-ink-heading hover:bg-surface-muted active:bg-surface-muted",
  ghost:
    "text-ink-body hover:bg-surface-muted hover:text-ink-heading",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-[0.95rem]",
};

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = SharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className = "", children } = props;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-[240ms] ease-[var(--of-ease-balance)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--of-btn-disabled-bg)] disabled:text-[var(--of-btn-disabled-text)]";

  const combined = `${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        className={combined}
      >
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    ...buttonRest
  } = props as ButtonAsButton;
  void _v;
  void _s;
  void _c;
  void _ch;

  return (
    <button {...buttonRest} className={combined}>
      {children}
    </button>
  );
}
