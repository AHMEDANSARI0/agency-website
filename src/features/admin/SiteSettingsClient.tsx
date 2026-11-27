"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LayoutTemplate,
  Link2,
  PanelBottom,
  RefreshCw,
  Settings2,
  Send,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { NavItem, SiteSettings } from "@/types/content";
import type { OwnerValues } from "@/lib/owner-config";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { PricingSettingsEditor } from "./PricingSettingsEditor";
import { NavbarStyleEditor } from "./NavbarStyleEditor";
import { resolveNavbarStyleSettings } from "./navbar-style-defaults";
import { OwnerValuesForm } from "./OwnerValuesForm";

interface SiteSettingsClientProps {
  initialSettings: SiteSettings;
  initialOwnerValues: OwnerValues;
}

type SiteSettingsSection = "business" | "navbar" | "navigation" | "footer" | "pricing";
type PreviewViewport = "desktop" | "mobile";

const settingsSections: Array<{
  id: SiteSettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "business", label: "Business details", icon: LayoutTemplate },
  { id: "navbar", label: "Header design", icon: Settings2 },
  { id: "navigation", label: "Menu links", icon: Link2 },
  { id: "footer", label: "Footer links", icon: PanelBottom },
  { id: "pricing", label: "Pricing", icon: CreditCard },
];

export function SiteSettingsClient({
  initialSettings,
  initialOwnerValues,
}: SiteSettingsClientProps) {
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [activeSection, setActiveSection] = useState<SiteSettingsSection>("navbar");
  const [previewPath, setPreviewPath] = useState("/");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [settings, setSettings] = useState<SiteSettings>(() => ({
    ...initialSettings,
    navbarStyle: resolveNavbarStyleSettings(initialSettings.navbarStyle),
    pricingConfig: resolvePricingConfig(initialSettings),
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const syncPreview = useCallback(() => {
    previewFrameRef.current?.contentWindow?.postMessage(
      {
        type: "OMNIFLOW_NAVBAR_PREVIEW",
        navbarSettings: {
          navbarStyle: settings.navbarStyle,
          navigation: settings.navigation,
          primaryCtaHref: settings.primaryCtaHref,
          primaryCtaLabel: settings.primaryCtaLabel,
          footerLinks: settings.footerLinks,
        },
      },
      window.location.origin
    );
  }, [settings.footerLinks, settings.navigation, settings.navbarStyle, settings.primaryCtaHref, settings.primaryCtaLabel]);

  useEffect(() => {
    syncPreview();
  }, [syncPreview]);

  useEffect(() => {
    const onPreviewReady = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "OMNIFLOW_VE_READY"
      ) {
        syncPreview();
      }
    };
    window.addEventListener("message", onPreviewReady);
    return () => window.removeEventListener("message", onPreviewReady);
  }, [syncPreview]);

  useEffect(() => {
    const onOpenSection = (event: Event) => {
      const requested = (event as CustomEvent<SiteSettingsSection>).detail;
      if (settingsSections.some((section) => section.id === requested)) {
        setActiveSection(requested);
      }
    };
    window.addEventListener("omniflow:open-storefront-settings", onOpenSection);
    return () =>
      window.removeEventListener("omniflow:open-storefront-settings", onOpenSection);
  }, []);

  function moveNav(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= settings.navigation.length) return;
    const copy = [...settings.navigation];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setSettings({
      ...settings,
      navigation: copy.map((n, i) => ({ ...n, order: i + 1 })),
    });
  }

  function addNavItem() {
    const next: NavItem = {
      id: `nav_${Date.now().toString(36)}`,
      label: "Resources",
      href: "/blog",
      isVisible: true,
      order: settings.navigation.length + 1,
    };
    setSettings({ ...settings, navigation: [...settings.navigation, next] });
  }

  async function saveAll(publish: boolean) {
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, publish }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not save site settings.",
        });
        return;
      }
      setSettings({
        ...json.settings,
        navbarStyle: resolveNavbarStyleSettings(json.settings.navbarStyle),
        pricingConfig: resolvePricingConfig(json.settings),
      });
      setFeedback({
        type: "success",
        text: publish
          ? "Store settings published live."
          : "Store settings draft saved.",
      });
    } catch {
      setFeedback({ type: "error", text: "Network error saving settings." });
    } finally {
      setSaving(false);
    }
  }

  const previewSrc = `${previewPath}${previewPath.includes("?") ? "&" : "?"}ve=1`;
  const fieldClass =
    "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-heading";
  const sectionHeading = settingsSections.find(
    (section) => section.id === activeSection
  )?.label;

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-sm text-ink-heading"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(390px,0.82fr)_minmax(0,1.35fr)]">
        <section className="flex min-h-[660px] flex-col overflow-hidden rounded-xl border border-line bg-surface-card">
          <div className="border-b border-line px-4 pb-3 pt-4">
            <p className="text-xs font-medium text-ink-muted">Store settings</p>
            <h2 className="mt-1 text-lg font-semibold text-ink-heading">
              {sectionHeading}
            </h2>
            <nav
              aria-label="Store settings sections"
              className="mt-3 flex gap-1 overflow-x-auto pb-1"
            >
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs transition ${
                      selected
                        ? "bg-surface-muted font-semibold text-ink-heading"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
            data-lenis-prevent
          >
            {activeSection === "business" && (
              <>
                <OwnerValuesForm initial={initialOwnerValues} />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveAll(false);
                  }}
                  className="space-y-4"
                >
                  <button type="submit" aria-hidden="true" tabIndex={-1} className="sr-only">
                    Save draft
                  </button>
                <section className="space-y-4 rounded-lg border border-line p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-heading">
                      Company details
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      The public-facing name, summary and contact information.
                    </p>
                  </div>
                  <label className="block text-xs font-medium text-ink-muted">
                    Company name
                    <input
                      value={settings.companyName}
                      onChange={(event) =>
                        setSettings({ ...settings, companyName: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-muted">
                    Positioning line
                    <input
                      value={settings.positioning}
                      onChange={(event) =>
                        setSettings({ ...settings, positioning: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-muted">
                    Primary tagline
                    <input
                      value={settings.tagline}
                      onChange={(event) =>
                        setSettings({ ...settings, tagline: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-muted">
                    Contact email
                    <input
                      inputMode="email"
                      value={settings.contactEmail}
                      onChange={(event) =>
                        setSettings({ ...settings, contactEmail: event.target.value })
                      }
                      className={fieldClass}
                    />
                    {settings.contactEmail.includes("{{") && (
                      <span className="mt-1 block text-[11px] text-ink-muted">
                        Replace the placeholder with your business inbox before launch.
                      </span>
                    )}
                  </label>
                  <label className="block text-xs font-medium text-ink-muted">
                    Support hours
                    <input
                      value={settings.supportHours}
                      onChange={(event) =>
                        setSettings({ ...settings, supportHours: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                </section>
                <section className="space-y-4 rounded-lg border border-line p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-heading">
                      Site-wide buttons
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      Set the main and secondary actions shown across the site.
                    </p>
                  </div>
                  {([
                    ["Primary button label", "primaryCtaLabel"],
                    ["Primary button link", "primaryCtaHref"],
                    ["Secondary button label", "secondaryCtaLabel"],
                    ["Secondary button link", "secondaryCtaHref"],
                    ["Booking link", "bookingUrl"],
                  ] as const).map(([label, key]) => (
                    <label key={key} className="block text-xs font-medium text-ink-muted">
                      {label}
                      <input
                        value={settings[key]}
                        onChange={(event) =>
                          setSettings({ ...settings, [key]: event.target.value })
                        }
                        className={fieldClass}
                      />
                    </label>
                  ))}
                </section>
                </form>
              </>
            )}

            {activeSection !== "business" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveAll(false);
                }}
                className="space-y-4"
              >
                <button type="submit" aria-hidden="true" tabIndex={-1} className="sr-only">
                  Save draft
                </button>
            {activeSection === "navbar" && (
              <div id="storefront-navbar-settings">
                <NavbarStyleEditor
                  value={resolveNavbarStyleSettings(settings.navbarStyle)}
                  onChange={(navbarStyle) => setSettings({ ...settings, navbarStyle })}
                />
              </div>
            )}

            {activeSection === "navigation" && (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-heading">
                      Header menu
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      Reorder links, change their destination, or hide them.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addNavItem}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add link
                  </button>
                </div>
                {settings.navigation.map((item, index) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-lg border border-line p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink-muted">
                        Link {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${item.label} up`}
                          onClick={() => moveNav(index, -1)}
                          disabled={index === 0}
                          className="rounded-md border border-line p-1.5 text-ink-muted disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${item.label} down`}
                          onClick={() => moveNav(index, 1)}
                          disabled={index === settings.navigation.length - 1}
                          className="rounded-md border border-line p-1.5 text-ink-muted disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        {settings.navigation.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove ${item.label}`}
                            onClick={() =>
                              setSettings({
                                ...settings,
                                navigation: settings.navigation.filter(
                                  (link) => link.id !== item.id
                                ),
                              })
                            }
                            className="rounded-md border border-line p-1.5 text-ink-muted hover:text-ink-heading"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-ink-muted">
                        Label
                        <input
                          value={item.label}
                          onChange={(event) => {
                            const navigation = [...settings.navigation];
                            navigation[index] = { ...item, label: event.target.value };
                            setSettings({ ...settings, navigation });
                          }}
                          className={fieldClass}
                        />
                      </label>
                      <label className="block text-xs font-medium text-ink-muted">
                        Link
                        <input
                          value={item.href}
                          onChange={(event) => {
                            const navigation = [...settings.navigation];
                            navigation[index] = { ...item, href: event.target.value };
                            setSettings({ ...settings, navigation });
                          }}
                          className={fieldClass}
                        />
                      </label>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-ink-body">
                      <input
                        type="checkbox"
                        checked={item.isVisible}
                        onChange={(event) => {
                          const navigation = [...settings.navigation];
                          navigation[index] = {
                            ...item,
                            isVisible: event.target.checked,
                          };
                          setSettings({ ...settings, navigation });
                        }}
                      />
                      Show in header
                    </label>
                  </article>
                ))}
              </section>
            )}

            {activeSection === "footer" && (
              <section className="space-y-3" id="storefront-footer-settings">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-ink-heading">
                    Footer menu links
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Update labels and destinations in each footer group.
                  </p>
                </div>
                {(["services", "company", "legal"] as const).map((column) => (
                    <details
                      key={column}
                      className="rounded-lg border border-line p-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium capitalize text-ink-heading">
                        {column} <span className="text-xs text-ink-muted">· {settings.footerLinks[column].length} links</span>
                      </summary>
                      <div className="mt-3 space-y-2">
                        {settings.footerLinks[column].map((link, index) => (
                          <div key={link.id} className="grid grid-cols-2 gap-2">
                            <input
                              aria-label={`${column} link ${index + 1} label`}
                              value={link.label}
                              onChange={(event) => {
                                const links = [...settings.footerLinks[column]];
                                links[index] = { ...link, label: event.target.value };
                                setSettings({
                                  ...settings,
                                  footerLinks: {
                                    ...settings.footerLinks,
                                    [column]: links,
                                  },
                                });
                              }}
                              className="min-w-0 rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink-heading"
                            />
                            <input
                              aria-label={`${column} link ${index + 1} URL`}
                              value={link.href}
                              onChange={(event) => {
                                const links = [...settings.footerLinks[column]];
                                links[index] = { ...link, href: event.target.value };
                                setSettings({
                                  ...settings,
                                  footerLinks: {
                                    ...settings.footerLinks,
                                    [column]: links,
                                  },
                                });
                              }}
                              className="min-w-0 rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-xs text-ink-heading"
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
              </section>
            )}

            {activeSection === "pricing" && (
              <div id="pricing">
                <PricingSettingsEditor
                  pricing={resolvePricingConfig(settings)}
                  onChange={(pricingConfig) =>
                    setSettings({ ...settings, pricingConfig })
                  }
                />
              </div>
            )}
              </form>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3">
            <p className="text-[11px] text-ink-muted">
              Draft changes are preview-only until published.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAll(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Save draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAll(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </section>

        <section className="flex min-h-[660px] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-heading">
                Live preview
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Changes appear here before you publish.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="storefront-preview-page">
                Preview page
              </label>
              <select
                id="storefront-preview-page"
                value={previewPath}
                onChange={(event) => setPreviewPath(event.target.value)}
                className="rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-ink-heading"
              >
                <option value="/">Home</option>
                <option value="/services">Services</option>
                <option value="/about">About</option>
                <option value="/pricing">Pricing</option>
                <option value="/contact">Contact</option>
              </select>
              <div className="flex items-center rounded-lg border border-line p-0.5">
                {(["desktop", "mobile"] as const).map((viewport) => (
                  <button
                    key={viewport}
                    type="button"
                    aria-pressed={previewViewport === viewport}
                    onClick={() => setPreviewViewport(viewport)}
                    className={`rounded-md px-2.5 py-1.5 text-xs capitalize ${
                      previewViewport === viewport
                        ? "bg-surface-muted font-semibold text-ink-heading"
                        : "text-ink-muted hover:text-ink-heading"
                    }`}
                  >
                    {viewport}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (previewFrameRef.current) {
                    previewFrameRef.current.src = previewSrc;
                  }
                }}
                aria-label="Reload preview"
                className="rounded-lg border border-line p-2 text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <a
                href={previewPath}
                target="_blank"
                rel="noreferrer"
                aria-label="Open preview in a new tab"
                className="rounded-lg border border-line p-2 text-ink-muted hover:bg-surface-muted hover:text-ink-heading"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-surface-muted p-3">
            <div
              className={`mx-auto h-full min-h-[620px] overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-[max-width] ${
                previewViewport === "mobile" ? "max-w-[390px]" : "max-w-none"
              }`}
            >
              <iframe
                key={previewPath}
                ref={previewFrameRef}
                src={previewSrc}
                title="Live storefront preview"
                onLoad={syncPreview}
                className="h-[calc(100vh-245px)] min-h-[620px] w-full border-0 bg-white"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
