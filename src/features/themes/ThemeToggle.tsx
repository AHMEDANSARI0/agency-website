"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { ThemeMode } from "@/types/theme";

const OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme selector"
      className="inline-flex items-center rounded-control border border-line bg-surface-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-[calc(var(--of-radius-control)-3px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)] ${
              active
                ? "bg-surface text-ink-heading shadow-sm"
                : "text-ink-muted hover:text-ink-heading"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
