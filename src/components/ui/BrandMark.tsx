import React from "react";
import Link from "next/link";
import type { BrandAssetConfig } from "@/types/brand";

interface BrandMarkProps {
  brand: BrandAssetConfig;
  href?: string;
  tone?: "auto" | "inverse";
}

/**
 * Replaceable Brand Identity slot:
 * Never copies any third-party Yin-Yang or reference site logo.
 * Renders uploaded Light/Dark/Symbol assets when configured in /admin/brand,
 * otherwise renders a clean typographic wordmark with a minimal geometric flow node.
 */
export function BrandMark({ brand, href = "/", tone = "auto" }: BrandMarkProps) {
  const hasUploadedLogos = Boolean(
    brand.lightLogoUrl || brand.darkLogoUrl || brand.symbolUrl
  );

  const content = hasUploadedLogos ? (
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
          className={`text-[1.05rem] font-medium tracking-tight ${
            tone === "inverse" ? "text-[#F2EADB]" : "text-ink-heading"
          }`}
        >
          {brand.brandName}
          <span className="text-primary">.</span>
        </span>
      )}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-b from-[#2A231D] to-[#120E0B] ring-1 ring-white/10"
      >
        {/* Minimal abstract rounded-square node — distinct from any external logo */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="5"
            stroke="#F2EADB"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="2.6" fill="#D23A1F" />
        </svg>
      </span>
      <span
        className={`text-[1.05rem] font-medium tracking-tight ${
          tone === "inverse" ? "text-[#F2EADB]" : "text-ink-heading"
        }`}
      >
        {brand.brandName}
        <span className="text-primary">.</span>
      </span>
    </span>
  );

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
