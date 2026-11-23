import React from "react";
import { Container } from "@/components/ui/Container";

export type SectionTone = "canvas" | "surface" | "muted" | "dark";
export type SectionAtmosphere = "none" | "grid" | "dots" | "glow";
export type SectionSpacing = "sm" | "md" | "lg";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  atmosphere?: SectionAtmosphere;
  spacing?: SectionSpacing;
  bordered?: boolean;
  containerClassName?: string;
}

const TONE_CLASSES: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink-body",
  surface: "bg-surface text-ink-body",
  muted: "bg-surface-muted text-ink-body",
  dark: "on-dark bg-[#090D16] text-[#CBD5E1]",
};

const ATMOSPHERE_CLASSES: Record<SectionAtmosphere, string> = {
  none: "",
  grid: "bg-grid-subtle",
  dots: "bg-dot-subtle",
  glow: "bg-hero-glow",
};

const SPACING_CLASSES: Record<SectionSpacing, string> = {
  sm: "py-section-sm",
  md: "py-section",
  lg: "py-section-lg",
};

export function Section({
  tone = "canvas",
  atmosphere = "none",
  spacing = "md",
  bordered = false,
  containerClassName = "",
  className = "",
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={`relative overflow-hidden ${TONE_CLASSES[tone]} ${ATMOSPHERE_CLASSES[atmosphere]} ${SPACING_CLASSES[spacing]} ${
        bordered ? "border-y border-line" : ""
      } ${className}`}
      {...rest}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`${
        centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"
      } ${className}`}
    >
      {eyebrow && <p className="t-eyebrow mb-3">{eyebrow}</p>}
      <h2 className="t-display text-ink-heading">{title}</h2>
      {description && (
        <p
          className={`mt-4 text-[clamp(1rem,1.25vw,1.14rem)] leading-relaxed text-ink-body ${
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      )}
      {actions && (
        <div
          className={`mt-6 flex flex-wrap items-center gap-3 ${
            centered ? "justify-center" : ""
          }`}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
