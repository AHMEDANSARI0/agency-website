import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type SoaleButtonVariant = "primary" | "secondary" | "surface" | "outline";
export type SoaleButtonSize = "md" | "sm";

interface BaseSoaleArrowButtonProps {
  children: React.ReactNode;
  variant?: SoaleButtonVariant;
  size?: SoaleButtonSize;
  iconOnly?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface LinkSoaleArrowButtonProps extends BaseSoaleArrowButtonProps {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface ActionSoaleArrowButtonProps extends BaseSoaleArrowButtonProps {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export type SoaleArrowButtonProps =
  | LinkSoaleArrowButtonProps
  | ActionSoaleArrowButtonProps;

const LABEL_VARIANTS: Record<SoaleButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--of-btn-primary-bg,var(--of-color-primary))] text-primary-foreground shadow-sm group-hover:bg-primary-hover",
  secondary:
    "border border-transparent bg-secondary text-secondary-foreground shadow-sm group-hover:opacity-95",
  surface:
    "border border-line bg-surface-card text-ink-heading shadow-sm group-hover:border-primary/40",
  outline:
    "border border-line-strong bg-transparent text-ink-heading group-hover:border-primary group-hover:bg-accent-subtle/60",
};

const BOX_VARIANTS: Record<SoaleButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--of-btn-primary-bg,var(--of-color-primary))] text-primary-foreground shadow-sm group-hover:bg-primary-hover",
  secondary:
    "border border-transparent bg-secondary text-secondary-foreground shadow-sm group-hover:opacity-95",
  surface:
    "border border-line bg-surface-card text-ink-heading shadow-sm group-hover:border-primary/40 group-hover:text-primary",
  outline:
    "border border-line-strong bg-transparent text-ink-heading group-hover:border-primary group-hover:bg-accent-subtle/60 group-hover:text-primary",
};

/**
 * Signature Soale Dual-Capsule CTA:
 * - 17px (`1.0625rem`) rounded label capsule + 45x45px rounded icon box (`overflow: hidden`)
 * - Twin diagonal arrows glide smoothly across on hover/focus via pure GPU translate3d.
 */
export function SoaleArrowButton(props: SoaleArrowButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    iconOnly = false,
    ariaLabel,
    className = "",
  } = props;

  const sizeLabelClass =
    size === "sm"
      ? "!px-4 !py-2.5 !text-[0.84rem]"
      : "px-6 py-3.5 text-[0.94rem]";
  const sizeBoxClass = size === "sm" ? "!h-11 !w-11" : "h-[45px] w-[45px]";
  const responsiveSizeClass =
    size === "md" ? "soale-arrow-btn-md" : "soale-arrow-btn-sm";

  const inner = (
    <>
      {!iconOnly && (
        <span
          className={`soale-arrow-label ${sizeLabelClass} ${LABEL_VARIANTS[variant]}`}
        >
          {children}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`soale-arrow-box ${sizeBoxClass} ${BOX_VARIANTS[variant]}`}
      >
        <ArrowUpRight className="soale-arrow-icon-primary h-4 w-4" />
        <ArrowUpRight className="soale-arrow-icon-secondary h-4 w-4" />
      </span>
    </>
  );

  if (typeof props.href === "string") {
    return (
      <Link
        href={props.href}
        onClick={props.onClick}
        aria-label={ariaLabel}
        className={`group soale-arrow-btn ${responsiveSizeClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] ${className}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={ariaLabel}
      className={`group soale-arrow-btn ${responsiveSizeClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] disabled:pointer-events-none disabled:opacity-55 ${className}`}
    >
      {inner}
    </button>
  );
}
