"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ResolvedThemeMode, ThemeMode } from "@/types/theme";

const STORAGE_KEY = "omniflow-theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (next: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  resolvedMode: "light",
  setMode: () => undefined,
});

function resolveTheme(mode: ThemeMode): ResolvedThemeMode {
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode === "dark" ? "dark" : "light";
}

export function ThemeProvider({
  defaultMode = "light",
  children,
}: {
  defaultMode?: ThemeMode;
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>("light");

  const applyToDom = useCallback((nextMode: ThemeMode) => {
    const resolved = resolveTheme(nextMode);
    setResolvedMode(resolved);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initial: ThemeMode =
        saved === "light" || saved === "dark" || saved === "system" ? saved : defaultMode;
      setModeState(initial);
      applyToDom(initial);
    } catch {
      applyToDom(defaultMode);
    }
  }, [applyToDom, defaultMode]);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyToDom("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode, applyToDom]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors in private mode
      }
      applyToDom(next);
    },
    [applyToDom]
  );

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
