import React from "react";
import Link from "next/link";
import type { BrandAssetConfig } from "@/types/brand";

interface BrandMarkProps {
  brand: BrandAssetConfig;
  href?: string;
  tone?: "auto" | "inverse";
  size?: "sm" | "md" | "lg";
}

const ICON_BOX_SIZES = {
  sm: "h-7 w-7 rounded-[8px]",
  md: "h-8 w-8 rounded-[10px]",
  lg: "h-9 w-9 rounded-[11px]",
} as const;

const TEXT_SIZES = {
  sm: "text-[0.98rem]",
  md: "text-[1.06rem]",
  lg: "text-[1.18rem]",
} as const;

/**
 * Replaceable Brand Identity Slot:
 * - Never copies any third-party Yin-Yang or reference site logo.
 * - Renders uploaded Light/Dark/Symbol assets when configured in /admin/brand.
 * - When tone="inverse" (e.g. dark footer or dark island), prefers darkLogoUrl first.
 * - When tone="auto" (e.g. light-first navbar/cards), switches cleanly between lightLogoUrl and darkLogoUrl via CSS dark mode.
 * - Falls back to a clean, replaceable typographic wordmark + minimal geometric node driven by CSS tokens.
 */
export function BrandMark({
  brand,
  href = "/",
  tone = "auto",
  size = "md",
}: BrandMarkProps) {
  const hasUploadedLogos = Boolean(
    brand.lightLogoUrl || brand.darkLogoUrl || brand.symbolUrl
  );

  const textColorClass =
    tone === "inverse" ? "text-[#F8FAFC]" : "text-ink-heading";

  let content: React.ReactNode;

  if (hasUploadedLogos) {
    if (tone === "inverse") {
      const inverseLogo = brand.darkLogoUrl || brand.lightLogoUrl;
      content = (
        <span className="inline-flex items-center gap-2.5">
          {inverseLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inverseLogo}
              alt={brand.altText || brand.brandName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            brand.symbolUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.symbolUrl}
                alt={brand.altText || brand.brandName}
                className="h-7 w-7 object-contain"
              />
            )
          )}
          {brand.showTextFallback && !inverseLogo && (
            <span
              className={`font-display ${TEXT_SIZES[size]} font-semibold tracking-tight ${textColorClass}`}
            >
              {brand.brandName}
              <span className="text-primary">.</span>
            </span>
          )}
        </span>
      );
    } else {
      content = (
        <span className="inline-flex items-center gap-2.5">
          {brand.lightLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.lightLogoUrl}
              alt={brand.altText || brand.brandName}
              className={`h-8 w-auto object-contain ${
                brand.darkLogoUrl ? "dark:hidden" : ""
              }`}
            />
          )}
          {brand.darkLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.darkLogoUrl}
              alt={brand.altText || brand.brandName}
              className={`h-8 w-auto object-contain ${
                brand.lightLogoUrl ? "hidden dark:block" : ""
              }`}
            />
          )}
          {!brand.lightLogoUrl && !brand.darkLogoUrl && brand.symbolUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.symbolUrl}
              alt={brand.altText || brand.brandName}
              className="h-7 w-7 object-contain"
            />
          )}
          {brand.showTextFallback && !brand.lightLogoUrl && !brand.darkLogoUrl && (
            <span
              className={`font-display ${TEXT_SIZES[size]} font-semibold tracking-tight ${textColorClass}`}
            >
              {brand.brandName}
              <span className="text-primary">.</span>
            </span>
          )}
        </span>
      );
    }
  } else {
    content = (
      <span className="inline-flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`grid ${ICON_BOX_SIZES[size]} place-items-center bg-brand-gradient text-white shadow-glow ring-1 ring-black/5 dark:ring-white/15`}
        >
          {/* Minimal architectural flow-grid mark — 100% original placeholder */}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <rect
              x="4.5"
              y="4.5"
              width="15"
              height="15"
              rx="4.5"
              stroke="currentColor"
              strokeOpacity="0.92"
              strokeWidth="1.7"
            />
            <path
              d="M8.5 12H15.5M12 8.5V15.5"
              stroke="currentColor"
              strokeOpacity="0.78"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2.1" fill="currentColor" />
          </svg>
        </span>
        <span
          className={`font-display ${TEXT_SIZES[size]} font-semibold tracking-tight ${textColorClass}`}
        >
          {brand.brandName}
          <span className="text-primary">.</span>
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`${brand.brandName} home`}
      className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
    >
      {content}
    </Link>
  );
}
