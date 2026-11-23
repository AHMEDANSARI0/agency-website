import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--of-btn-primary-bg,var(--of-color-primary))] text-primary-foreground shadow-glow hover:-translate-y-[1px] hover:bg-primary-hover active:translate-y-0 active:bg-primary-active",
  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-[1px] hover:opacity-92 active:translate-y-0 active:opacity-85",
  outline:
    "border border-line-strong bg-surface text-ink-heading shadow-sm hover:-translate-y-[1px] hover:border-primary/40 hover:bg-surface-muted active:translate-y-0 active:bg-surface-muted",
  subtle:
    "border border-primary/15 bg-accent-subtle text-primary hover:border-primary/30 hover:bg-primary/15",
  ghost:
    "text-ink-body hover:bg-surface-muted hover:text-ink-heading",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs sm:text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-[0.94rem]",
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
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-all duration-[220ms] ease-[var(--of-ease-balance)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:bg-[var(--of-btn-disabled-bg)] disabled:text-[var(--of-btn-disabled-text)] disabled:shadow-none";

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
