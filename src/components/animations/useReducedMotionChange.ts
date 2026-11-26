"use client";

import { useEffect, useState } from "react";

/** Re-run motion setup when the OS preference changes during the session. */
export function useReducedMotionChange(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setRevision((value) => value + 1);
    if (query.addEventListener) query.addEventListener("change", update);
    else query.addListener(update);
    return () => {
      if (query.removeEventListener) query.removeEventListener("change", update);
      else query.removeListener(update);
    };
  }, []);
  return revision;
}
