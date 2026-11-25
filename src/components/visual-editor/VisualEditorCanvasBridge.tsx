"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PageSectionBlock } from "@/types/content";

interface VeSyncPayload {
  type: "OMNIFLOW_VE_SYNC";
  sections?: PageSectionBlock[];
  selectedSectionId?: string | null;
  scrollToSectionId?: string | null;
  canvasPositionDragMode?: boolean;
  themeMode?: "dark" | "light";
}

/**
 * Zero-overhead Visual Customizer Bridge for the Shopify-style Right-Side Live Canvas.
 * Inactive on normal visitor traffic; activates strictly when `?ve=1` is present in the URL.
 */
export function VisualEditorCanvasBridge() {
  const pathname = usePathname();
  const [isVeActive, setIsVeActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const active = new URLSearchParams(window.location.search).get("ve") === "1";
    setIsVeActive(active);
    if (!active) return;

    // Notify parent Shopify Studio that the canvas route is mounted & ready
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "OMNIFLOW_VE_READY", pathname },
        window.location.origin
      );
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as VeSyncPayload | undefined;
      if (!data || data.type !== "OMNIFLOW_VE_SYNC") return;

      if (data.themeMode === "dark" || data.themeMode === "light") {
        const root = document.documentElement;
        root.setAttribute("data-theme", data.themeMode);
        root.classList.toggle("dark", data.themeMode === "dark");
      }

      if (typeof data.selectedSectionId !== "undefined") {
        setSelectedId(data.selectedSectionId);
      }

      if (Array.isArray(data.sections)) {
        const rootContainer = document.getElementById("of-home-sections-root");
        const heroSec = data.sections.find((s) => s.type === "hero");
        if (heroSec) {
          window.dispatchEvent(
            new CustomEvent("omniflow:ve-hero-update", {
              detail: {
                section: heroSec,
                canvasPositionDragMode: Boolean(data.canvasPositionDragMode),
              },
            })
          );
        }

        if (rootContainer) {
          rootContainer.style.display = "flex";
          rootContainer.style.flexDirection = "column";

          data.sections.forEach((sec, idx) => {
            const node = rootContainer.querySelector<HTMLElement>(
              `[data-ve-section-id="${CSS.escape(sec.id)}"]`
            );
            if (!node) return;
            node.style.order = String(idx + 1);
            node.style.display = sec.isVisible ? "" : "none";

            // Live-patch heading/subtitle inside non-hero sections when tagged
            if (sec.type !== "hero") {
              const titleEl = node.querySelector<HTMLElement>("[data-ve-title]");
              if (titleEl && sec.title) {
                titleEl.textContent = sec.title;
              }
              const subEl =
                node.querySelector<HTMLElement>("[data-ve-subtitle]");
              if (subEl && typeof sec.subtitle === "string") {
                subEl.textContent = sec.subtitle;
              }
            }
          });
        }
      }

      if (data.scrollToSectionId) {
        const target = document.querySelector<HTMLElement>(
          `[data-ve-section-id="${CSS.escape(data.scrollToSectionId)}"]`
        );
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const onSectionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const wrapper = target.closest<HTMLElement>("[data-ve-section-id]");
      if (!wrapper) return;
      const sectionId = wrapper.getAttribute("data-ve-section-id");
      if (sectionId && window.parent !== window) {
        setSelectedId(sectionId);
        window.parent.postMessage(
          { type: "OMNIFLOW_VE_SECTION_CLICKED", sectionId },
          window.location.origin
        );
      }
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onSectionClick, true);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onSectionClick, true);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isVeActive) return;
    const allNodes = document.querySelectorAll<HTMLElement>(
      "[data-ve-section-id]"
    );
    allNodes.forEach((node) => {
      const id = node.getAttribute("data-ve-section-id");
      if (selectedId && id === selectedId) {
        node.setAttribute("data-ve-selected", "true");
      } else {
        node.removeAttribute("data-ve-selected");
      }
    });
  }, [isVeActive, selectedId]);

  if (!isVeActive) return null;

  return (
    <style>{`
      [data-ve-section-id] {
        position: relative;
        transition: outline-color 180ms ease;
      }
      [data-ve-section-id]:hover {
        outline: 2px dashed rgba(126, 34, 206, 0.55);
        outline-offset: -2px;
      }
      [data-ve-section-id][data-ve-selected="true"] {
        outline: 2px solid #FF7023 !important;
        outline-offset: -2px;
      }
      [data-ve-section-id][data-ve-selected="true"]::after {
        content: "Selected in Studio";
        position: absolute;
        top: 10px;
        left: 12px;
        z-index: 45;
        pointer-events: none;
        padding: 3px 10px;
        border-radius: 9999px;
        font-family: var(--font-mono, monospace);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: #FF7023;
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(255, 112, 35, 0.4);
      }
    `}</style>
  );
}
