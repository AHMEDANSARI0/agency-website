"use client";

import React from "react";
import { OPEN_COOKIE_PREFS_EVENT } from "@/components/analytics/AnalyticsConsentManager";

interface CookiePreferencesButtonProps {
  variant?: "footer-link" | "button";
}

export function CookiePreferencesButton({
  variant = "footer-link",
}: CookiePreferencesButtonProps) {
  function openPreferences() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(OPEN_COOKIE_PREFS_EVENT));
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={openPreferences}
        className="inline-flex items-center rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-semibold text-ink-heading transition-colors hover:border-primary/40 hover:text-primary"
      >
        Manage Cookie Preferences
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="text-left text-[var(--of-color-body)] transition-colors hover:text-[var(--of-color-heading)] hover:underline"
    >
      Cookie Preferences
    </button>
  );
}
