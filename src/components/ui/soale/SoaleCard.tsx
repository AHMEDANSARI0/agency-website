import React from "react";
import { SoaleEyebrow } from "./SoaleEyebrow";

interface SoaleCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  elevated?: boolean;
  staggerIndex?: number;
  style?: React.CSSProperties;
  className?: string;
  as?: "div" | "article" | "section";
}

/**
 * Soale 24px (`1.5rem`) architectural card shell with GPU scroll-reveal & pointer rim sheen.
 * Adapts automatically between Light (#FFFFFF on #F7F6F3) and Dark (#17141C / #211C28 on #100E13).
 */
export function SoaleCard({
  children,
  interactive = false,
  elevated = false,
  staggerIndex,
  style,
  className = "",
  as: Tag = "div",
}: SoaleCardProps) {
  const mergedStyle =
    typeof staggerIndex === "number"
      ? ({
          "--soale-stagger": staggerIndex,
          "--card-idx": staggerIndex,
          ...style,
        } as React.CSSProperties)
      : style;

  return (
    <Tag
      style={mergedStyle}
      className={`soale-card ${interactive ? "soale-card-interactive" : ""} ${
        elevated ? "!bg-surface-elevated shadow-elevated" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

interface SoaleChipProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * Soale 14px (`0.875rem`) capability / tag pill (.work-label-text / .service-label).
 */
export function SoaleChip({
  children,
  active = false,
  className = "",
}: SoaleChipProps) {
  return (
    <span
      className={`soale-chip ${
        active
          ? "!border-primary/40 !bg-accent-subtle !text-primary font-semibold"
          : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}

interface SoaleSectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center" | "split";
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent Soale editorial section header with progressive-enhancement scroll reveal.
 */
export function SoaleSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className = "",
}: SoaleSectionHeaderProps) {
  if (align === "split") {
    return (
      <div
        data-reveal=""
        className={`flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end ${className}`}
      >
        <div className="max-w-2xl">
          {eyebrow && <SoaleEyebrow className="mb-4">{eyebrow}</SoaleEyebrow>}
          <h2 className="soale-h2 text-ink-heading">{title}</h2>
          {description && <p className="soale-lead mt-4">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  const centered = align === "center";
  return (
    <div
      data-reveal=""
      className={`${
        centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      } ${className}`}
    >
      {eyebrow && <SoaleEyebrow className="mb-4">{eyebrow}</SoaleEyebrow>}
      <h2
        className={`soale-h2 text-ink-heading ${
          centered ? "mx-auto" : "soale-measure-title"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`soale-lead mt-4 ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
      {action && (
        <div className={`mt-6 ${centered ? "flex justify-center" : ""}`}>
          {action}
        </div>
      )}
    </div>
  );
}
