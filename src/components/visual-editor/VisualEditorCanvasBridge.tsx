"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PageSectionBlock, SiteSettings } from "@/types/content";
import type { ThemeDesignTokens, ThemeBundleState } from "@/types/theme";

interface VeSyncPayload {
  type:
    | "OMNIFLOW_VE_SYNC"
    | "OMNIFLOW_NAVBAR_PREVIEW"
    | "OMNIFLOW_THEME_PREVIEW";
  sections?: PageSectionBlock[];
  selectedSectionId?: string | null;
  scrollToSectionId?: string | null;
  canvasPositionDragMode?: boolean;
  themeMode?: "dark" | "light";
  navbarSettings?: Partial<SiteSettings>;
  themePreview?: {
    activePresetId: string;
    draft: ThemeBundleState;
    designSystem?: ThemeDesignTokens;
  };
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

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as VeSyncPayload | undefined;
      if (!data) return;

      if (data.type === "OMNIFLOW_NAVBAR_PREVIEW" && data.navbarSettings) {
        window.dispatchEvent(
          new CustomEvent("omniflow:ve-navbar-update", {
            detail: data.navbarSettings,
          })
        );
        return;
      }

      if (data.type === "OMNIFLOW_THEME_PREVIEW" && data.themePreview) {
        const { buildThemeCssVariables } = await import(
          "@/features/themes/color-utils"
        );
        const previewStyleId = "omniflow-theme-live-preview";
        let previewStyle = document.getElementById(previewStyleId);
        if (!previewStyle) {
          previewStyle = document.createElement("style");
          previewStyle.id = previewStyleId;
          document.head.appendChild(previewStyle);
        }
        previewStyle.textContent = buildThemeCssVariables({
          activePresetId: data.themePreview.activePresetId,
          published: data.themePreview.draft,
          designSystem: data.themePreview.designSystem,
        });
        if (data.themeMode === "dark" || data.themeMode === "light") {
          const root = document.documentElement;
          root.setAttribute("data-theme", data.themeMode);
          root.classList.toggle("dark", data.themeMode === "dark");
        }
        return;
      }

      if (data.type !== "OMNIFLOW_VE_SYNC") return;

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
        }

        data.sections.forEach((sec, idx) => {
          const scope: ParentNode = rootContainer ?? document;
          const node =
            scope.querySelector<HTMLElement>(
              `[data-ve-section-id="${CSS.escape(sec.id)}"]`
            ) ??
            (!rootContainer
              ? document.querySelector<HTMLElement>(
                  `[data-ve-section-type="${CSS.escape(sec.type)}"]`
                )
              : null);
          if (!node) return;
          if (rootContainer) {
            node.style.order = String(idx + 1);
          }
          node.style.display = sec.isVisible ? "" : "none";

          // Live-patch heading/subtitle inside non-home-hero sections when tagged
          if (!rootContainer || sec.type !== "hero") {
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
      const globalElement = target
        .closest<HTMLElement>("[data-ve-global-element]")
        ?.getAttribute("data-ve-global-element");
      if (globalElement === "header" || globalElement === "footer") {
        e.preventDefault();
        e.stopPropagation();
        if (window.parent !== window) {
          window.parent.postMessage(
            { type: "OMNIFLOW_VE_GLOBAL_CLICKED", element: globalElement },
            window.location.origin
          );
        }
        return;
      }
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
