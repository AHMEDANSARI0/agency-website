import React from "react";

interface SoaleEyebrowProps {
  children: React.ReactNode;
  className?: string;
  showStar?: boolean;
}

/**
 * Soale-inspired rounded eyebrow pill (`border-radius: 999px; padding: 9px 16px`)
 * with subtle 4-point architectural star mark and crisp monospace uppercase tracking.
 */
export function SoaleEyebrow({
  children,
  className = "",
  showStar = true,
}: SoaleEyebrowProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/85 px-4 py-2 shadow-sm backdrop-blur-sm ${className}`}
    >
      {showStar && (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0 text-primary"
          fill="currentColor"
        >
          <path d="M8 0.5L9.85 6.15L15.5 8L9.85 9.85L8 15.5L6.15 9.85L0.5 8L6.15 6.15L8 0.5Z" />
        </svg>
      )}
      <span className="soale-eyebrow !text-ink-heading">{children}</span>
    </div>
  );
}
