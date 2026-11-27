"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { Layers, Palette, Settings, Store } from "lucide-react";
import { CardMotionManager } from "@/features/admin/CardMotionManager";
import { BrandManagerClient } from "@/features/admin/BrandManagerClient";
import { CmsWorkspaceClient } from "@/features/admin/CmsWorkspaceClient";
import { PageBuilderClient } from "@/features/admin/PageBuilderClient";
import { SiteSettingsClient } from "@/features/admin/SiteSettingsClient";
import { ThemeManagerClient } from "@/features/admin/ThemeManagerClient";
import type { OwnerValues } from "@/lib/owner-config";
import type { CardMotionConfig } from "@/features/card-motion/config";
import type { BrandAssetConfig } from "@/types/brand";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PageDocument,
  ServiceItem,
  SiteSettings,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import type { ThemeConfiguration, ThemePreset } from "@/types/theme";

export type StorefrontStudioTab = "pages" | "theme" | "site" | "content";

interface StorefrontStudioClientProps {
  initialTab: StorefrontStudioTab;
  canEditPages: boolean;
  canPublishPages: boolean;
  canManageTheme: boolean;
  canManageBrand: boolean;
  canManageSettings: boolean;
  canManageContent: boolean;
  canEditAnyContent: boolean;
  canPublishContent: boolean;
  initialPages: PageDocument[];
  initialTheme: ThemeConfiguration | null;
  builtInPresets: ThemePreset[];
  initialCardMotion: CardMotionConfig | null;
  initialSiteSettings: SiteSettings | null;
  initialOwnerValues: OwnerValues | null;
  initialBrand: BrandAssetConfig | null;
  initialBlogPosts: BlogPost[];
  initialCaseStudies: CaseStudyItem[];
  initialServices: ServiceItem[];
  initialFaqs: FaqItem[];
  initialTestimonials: TestimonialItem[];
  initialTeamMembers: TeamMember[];
}

export function StorefrontStudioClient({
  initialTab,
  canEditPages,
  canPublishPages,
  canManageTheme,
  canManageBrand,
  canManageSettings,
  canManageContent,
  canEditAnyContent,
  canPublishContent,
  initialPages,
  initialTheme,
  builtInPresets,
  initialCardMotion,
  initialSiteSettings,
  initialOwnerValues,
  initialBrand,
  initialBlogPosts,
  initialCaseStudies,
  initialServices,
  initialFaqs,
  initialTestimonials,
  initialTeamMembers,
}: StorefrontStudioClientProps) {
  const tabs: {
    id: StorefrontStudioTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    ...(canEditPages
      ? [{
          id: "pages" as const,
          label: "Pages & Sections",
          description: "Drag, arrange and edit in the live preview",
          icon: Layers,
        }]
      : []),
    ...(canManageTheme || canManageBrand
      ? [{
          id: "theme" as const,
          label: "Theme & Brand",
          description: "Theme library, logos and design system",
          icon: Palette,
        }]
      : []),
    ...(canManageSettings
      ? [{
          id: "site" as const,
          label: "Header, Footer & Settings",
          description: "Navbar, menus, CTAs and global site details",
          icon: Settings,
        }]
      : []),
    ...(canManageContent
      ? [{
          id: "content" as const,
          label: "Content Library",
          description: "Services, insights, cases, FAQs and team profiles",
          icon: Store,
        }]
      : []),
  ];
  const [activeTab, setActiveTab] = useState<StorefrontStudioTab>(
    tabs.some((tab) => tab.id === initialTab) ? initialTab : tabs[0]?.id ?? "pages"
  );

  const handleGlobalElementClick = useCallback((element: "header" | "footer") => {
    setActiveTab("site");
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("omniflow:open-storefront-settings", {
          detail: element === "header" ? "navbar" : "footer",
        })
      );
    }, 100);
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface-card p-5 shadow-card md:flex-row md:items-center md:px-7">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Online Store · Design Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-heading">
            Storefront Studio
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            Edit pages visually, tune the theme, and manage your header and footer here. Save drafts before publishing changes to visitors.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink-heading transition hover:border-primary/40 hover:text-primary"
        >
          <Store className="h-4 w-4" />
          View storefront
        </Link>
      </header>

      <div className="space-y-3">
        <div
          role="tablist"
          aria-label="Storefront editing areas"
          className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface-card p-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`storefront-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`storefront-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-surface-muted font-semibold text-ink-heading"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          {canEditPages && (
            <section
              id="storefront-panel-pages"
              role="tabpanel"
              aria-labelledby="storefront-tab-pages"
              hidden={activeTab !== "pages"}
            >
              <PageBuilderClient
                initialPages={initialPages}
                canPublish={canPublishPages}
                onEditGlobalElement={
                  canManageSettings ? handleGlobalElementClick : undefined
                }
              />
            </section>
          )}

          {(canManageTheme || canManageBrand) && (
            <section
              id="storefront-panel-theme"
              role="tabpanel"
              aria-labelledby="storefront-tab-theme"
              hidden={activeTab !== "theme"}
              className="space-y-6"
            >
              {canManageTheme && initialCardMotion && (
                <CardMotionManager initial={initialCardMotion} />
              )}
              {canManageTheme && initialTheme && (
                <ThemeManagerClient
                  initialConfig={initialTheme}
                  builtInPresets={builtInPresets}
                />
              )}
              {canManageBrand && initialBrand && (
                <BrandManagerClient initialBrand={initialBrand} />
              )}
            </section>
          )}

          {canManageSettings && initialSiteSettings && initialOwnerValues && (
            <section
              id="storefront-panel-site"
              role="tabpanel"
              aria-labelledby="storefront-tab-site"
              hidden={activeTab !== "site"}
              className="space-y-6"
            >
              <SiteSettingsClient
                initialSettings={initialSiteSettings}
                initialOwnerValues={initialOwnerValues}
              />
            </section>
          )}

          {canManageContent && (
            <section
              id="storefront-panel-content"
              role="tabpanel"
              aria-labelledby="storefront-tab-content"
              hidden={activeTab !== "content"}
            >
              <CmsWorkspaceClient
                initialTab="blog"
                initialBlogPosts={initialBlogPosts}
                initialCaseStudies={initialCaseStudies}
                initialServices={initialServices}
                initialFaqs={initialFaqs}
                initialTestimonials={initialTestimonials}
                initialTeamMembers={initialTeamMembers}
                canEditAny={canEditAnyContent}
                canPublish={canPublishContent}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
