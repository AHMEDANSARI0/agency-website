"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  FileEdit,
  Globe,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/features/themes/ThemeToggle";
import type { LiveSiteAlertSummary } from "@/features/system/live-site-report";
import { hasPermission } from "@/lib/auth/rbac";
import type { DatabaseDriverMode } from "@/lib/database";
import type {
  PermissionAction,
  RolePolicyConfig,
  SafeUser,
} from "@/types/auth";
import type { BrandAssetConfig } from "@/types/brand";

interface AdminShellProps {
  user: SafeUser;
  companyName: string;
  brand?: BrandAssetConfig;
  rolePolicies?: RolePolicyConfig;
  persistenceDriver?: DatabaseDriverMode;
  newLeadCount?: number;
  initialAlertSummary?: LiveSiteAlertSummary;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: PermissionAction;
  anyOfPermissions?: PermissionAction[];
  badgeType?: "leads" | "alerts";
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const SIDEBAR_COLLAPSED_KEY = "omniflow_admin_sidebar_collapsed";

const NAV_SECTIONS: NavSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      {
        href: "/admin",
        label: "Overview",
        shortDesc: "Executive KPIs, conversion funnel, and quick actions",
        icon: LayoutDashboard,
        requiredPermission: "dashboard:view",
      },
      {
        href: "/admin/diagnostics",
        label: "Live Site Report",
        shortDesc: "Real-time site errors, route probes, links & SEO checks",
        icon: Activity,
        requiredPermission: "dashboard:view",
        badgeType: "alerts",
      },
      {
        href: "/admin/leads",
        label: "Leads & CRM",
        shortDesc: "Pipeline stages, follow-ups, notes, and CSV export",
        icon: Inbox,
        requiredPermission: "leads:view",
        badgeType: "leads",
      },
    ],
  },
  {
    id: "content",
    title: "Content & SEO",
    items: [
      {
        href: "/admin/pages",
        label: "Pages & Sections",
        shortDesc: "Homepage section ordering, visibility, and page copy",
        icon: Layers,
        requiredPermission: "content:edit_any",
      },
      {
        href: "/admin/cms",
        label: "Content Studio",
        shortDesc: "Services, Case Studies, Insights Blog, FAQs & Team",
        icon: FileEdit,
        anyOfPermissions: [
          "content:create_draft",
          "content:edit_own",
          "content:edit_any",
          "content:publish",
        ],
      },
      {
        href: "/admin/media",
        label: "Media Library",
        shortDesc: "Brand images, portraits, diagrams, and alt-text tags",
        icon: ImageIcon,
        anyOfPermissions: ["media:manage"],
      },
      {
        href: "/admin/seo",
        label: "SEO & Analytics",
        shortDesc: "Meta tags, XML sitemap, 301 redirects, and GA4/GTM",
        icon: Globe,
        requiredPermission: "seo:manage",
      },
    ],
  },
  {
    id: "appearance",
    title: "Appearance & Settings",
    items: [
      {
        href: "/admin/theme",
        label: "Theme Library",
        shortDesc: "Soale Creative AI & OmniFlow Dark/Light theme presets",
        icon: Palette,
        requiredPermission: "theme:manage",
      },
      {
        href: "/admin/brand",
        label: "Brand Identity",
        shortDesc: "Wordmarks, SVG emblems, favicons, and social cards",
        icon: Sparkles,
        requiredPermission: "brand:manage",
      },
      {
        href: "/admin/settings",
        label: "Settings & Pricing",
        shortDesc: "Contact info, navbar/footer menus, CTAs & pricing tiers",
        icon: Settings,
        requiredPermission: "settings:manage",
      },
    ],
  },
  {
    id: "system",
    title: "System & Security",
    items: [
      {
        href: "/admin/users",
        label: "Team & Roles",
        shortDesc: "Admin accounts, RBAC permission matrix & access control",
        icon: Users,
        requiredPermission: "users:manage",
      },
      {
        href: "/admin/audit-logs",
        label: "Audit Logs",
        shortDesc: "Immutable security & publishing activity trail",
        icon: ShieldCheck,
        requiredPermission: "audit:view",
      },
      {
        href: "/admin/account",
        label: "Account & Backups",
        shortDesc: "Password rotation, JSON snapshots & database restores",
        icon: KeyRound,
      },
    ],
  },
];

export function AdminShell({
  user,
  companyName,
  brand,
  rolePolicies,
  persistenceDriver,
  newLeadCount = 0,
  initialAlertSummary,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [alertSummary, setAlertSummary] = useState<LiveSiteAlertSummary | null>(
    initialAlertSummary ?? null
  );

  // Restore saved desktop sidebar collapsed state
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved === "1") setSidebarCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const fetchAlertSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/system/live-report?summary=1", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as LiveSiteAlertSummary;
        setAlertSummary(data);
      }
    } catch {
      // ignore background poll errors
    }
  }, []);

  // Live refresh on custom event or every 60s
  useEffect(() => {
    const onRefresh = () => {
      void fetchAlertSummary();
    };
    window.addEventListener("omniflow:refresh-live-alert", onRefresh);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchAlertSummary();
      }
    }, 60_000);
    return () => {
      window.removeEventListener("omniflow:refresh-live-alert", onRefresh);
      window.clearInterval(timer);
    };
  }, [fetchAlertSummary]);

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requiredPermission) {
          return hasPermission(user.role, item.requiredPermission, rolePolicies);
        }
        if (item.anyOfPermissions && item.anyOfPermissions.length > 0) {
          return item.anyOfPermissions.some((perm) =>
            hasPermission(user.role, perm, rolePolicies)
          );
        }
        return true;
      }),
    })).filter((s) => s.items.length > 0);
  }, [user.role, rolePolicies]);

  const flatItems = useMemo(
    () => visibleSections.flatMap((s) => s.items),
    [visibleSections]
  );

  const activeNavMeta = useMemo(() => {
    for (const sec of visibleSections) {
      for (const item of sec.items) {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        if (active) {
          return { sectionTitle: sec.title, item };
        }
      }
    }
    return {
      sectionTitle: "Workspace",
      item: flatItems[0] ?? NAV_SECTIONS[0].items[0],
    };
  }, [visibleSections, pathname, flatItems]);

  const filteredPaletteItems = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return flatItems;
    return flatItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.shortDesc.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [flatItems, paletteQuery]);

  // Global keyboard shortcuts: Cmd/Ctrl+K (Quick Jump), Cmd/Ctrl+B (Toggle Sidebar), Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "b" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        toggleDesktopSidebar();
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleDesktopSidebar]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const totalAlerts =
    (alertSummary?.criticalCount ?? 0) + (alertSummary?.warningCount ?? 0);
  const hasCriticalAlert = (alertSummary?.criticalCount ?? 0) > 0;

  const userInitials = useMemo(() => {
    const parts = (user.name || "Admin").trim().split(/\s+/);
    return (
      (parts[0]?.[0] || "A") + (parts[1]?.[0] || parts[0]?.[1] || "")
    ).toUpperCase();
  }, [user.name]);

  const renderSidebarContent = (isCompactRail: boolean) => (
    <div className="flex h-full flex-col">
      {/* Sidebar Top Brand & Collapse Header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-line ${
          isCompactRail ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {isCompactRail ? (
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand admin sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-card text-ink-heading transition-colors hover:border-primary hover:text-primary"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <>
            <div className="min-w-0 flex-1 pr-2">
              {brand ? (
                <BrandMark brand={brand} href="/admin" size="sm" />
              ) : (
                <Link
                  href="/admin"
                  className="truncate text-sm font-bold text-ink-heading"
                >
                  {companyName}
                </Link>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse admin sidebar"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-card text-ink-muted transition-colors hover:border-primary hover:text-ink-heading lg:inline-flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>

            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink-heading lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Quick Search Trigger */}
      <div className={isCompactRail ? "px-2.5 pt-3" : "px-3.5 pt-3.5"}>
        {isCompactRail ? (
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setPaletteOpen(true);
            }}
            title="Quick jump (Ctrl+K)"
            aria-label="Quick jump to admin module"
            className="flex h-10 w-full items-center justify-center rounded-xl border border-line bg-surface-muted/70 text-ink-muted transition-colors hover:border-primary hover:text-ink-heading"
          >
            <Search className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setPaletteOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-muted/65 px-3 py-2 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink-heading"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>Quick jump…</span>
            </span>
            <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Grouped & Collapsible Navigation Sections */}
      <nav
        aria-label="Admin navigation"
        className={`flex-1 overflow-y-auto py-3 ${
          isCompactRail ? "space-y-3 px-2" : "space-y-4 px-3"
        }`}
      >
        {visibleSections.map((section, secIdx) => {
          const isSecCollapsed = Boolean(collapsedSections[section.id]);

          return (
            <div
              key={section.id}
              className={
                isCompactRail && secIdx > 0 ? "border-t border-line/70 pt-2.5" : ""
              }
            >
              {!isCompactRail && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [section.id]: !prev[section.id],
                    }))
                  }
                  aria-expanded={!isSecCollapsed}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink-heading"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      isSecCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}

              {(!isSecCollapsed || isCompactRail) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    const showLeadBadge =
                      item.badgeType === "leads" && newLeadCount > 0;
                    const showAlertBadge =
                      item.badgeType === "alerts" && alertSummary !== null;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={
                          isCompactRail
                            ? `${item.label} — ${item.shortDesc}`
                            : undefined
                        }
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex min-h-[40px] items-center rounded-xl transition-all ${
                          isCompactRail
                            ? "justify-center px-2 py-2.5"
                            : "justify-between gap-2.5 px-3 py-2 text-[13px] font-medium"
                        } ${
                          active
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-ink-body hover:bg-surface-muted hover:text-ink-heading"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center ${
                            isCompactRail ? "justify-center" : "gap-2.5 truncate"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active
                                ? "text-primary-foreground"
                                : "text-ink-muted group-hover:text-primary"
                            }`}
                          />
                          {!isCompactRail && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </span>

                        {/* Expanded Badges */}
                        {!isCompactRail && showLeadBadge && (
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              active
                                ? "bg-white/20 text-primary-foreground"
                                : "bg-accent-subtle text-primary"
                            }`}
                          >
                            {newLeadCount}
                          </span>
                        )}

                        {!isCompactRail && showAlertBadge && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              active
                                ? "bg-white/20 text-primary-foreground"
                                : hasCriticalAlert
                                  ? "bg-status-error/15 text-status-error"
                                  : totalAlerts > 0
                                    ? "bg-status-warning/15 text-status-warning"
                                    : "bg-status-success/15 text-status-success"
                            }`}
                          >
                            {totalAlerts > 0 ? totalAlerts : "OK"}
                          </span>
                        )}

                        {/* Compact Rail Corner Dot Badges */}
                        {isCompactRail && (showLeadBadge || (showAlertBadge && totalAlerts > 0)) && (
                          <span
                            aria-hidden="true"
                            className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
                              item.badgeType === "alerts"
                                ? hasCriticalAlert
                                  ? "bg-status-error"
                                  : "bg-status-warning"
                                : "bg-primary"
                            }`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Clean Compact Sidebar Footer: DB Pill + User Card */}
      <div className="shrink-0 space-y-2.5 border-t border-line p-3">
        {!isCompactRail && (
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-muted/55 px-3 py-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-heading">
              <Database className="h-3.5 w-3.5 text-status-success" />
              <span>
                {persistenceDriver === "supabase_postgres"
                  ? "PostgreSQL Live"
                  : "Local JSON Store"}
              </span>
            </span>
            <Link
              href="/admin/diagnostics"
              onClick={() => setMobileOpen(false)}
              className="font-mono text-[10px] font-semibold text-primary hover:underline"
            >
              Health →
            </Link>
          </div>
        )}

        <div
          className={`flex items-center rounded-xl border border-line bg-surface-card ${
            isCompactRail
              ? "flex-col gap-2 p-2"
              : "justify-between gap-2.5 px-3 py-2.5"
          }`}
        >
          <div
            className={`flex min-w-0 items-center ${
              isCompactRail ? "justify-center" : "gap-2.5"
            }`}
          >
            <div
              title={`${user.name} (${user.role.replace("_", " ")})`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle font-mono text-xs font-bold text-primary"
            >
              {userInitials}
            </div>
            {!isCompactRail && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink-heading">
                  {user.name}
                </p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={signingOut}
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-status-error/40 hover:bg-status-error/10 hover:text-status-error"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas text-ink-body">
      {/* Desktop Collapsible Sidebar (`260px` <-> `72px`) */}
      <aside
        className={`hidden shrink-0 border-r border-line bg-surface transition-[width] duration-200 ease-out lg:sticky lg:top-0 lg:block lg:h-screen ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {renderSidebarContent(sidebarCollapsed)}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(86vw,300px)] flex-col border-r border-line bg-surface shadow-elevated">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Command Palette Modal (Cmd/Ctrl + K) */}
      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin quick jump palette"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[10vh] backdrop-blur-xs sm:pt-[13vh]"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-4 w-4 text-primary" />
              <input
                type="search"
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Jump to module (e.g. Live Site Report, Theme, Leads)…"
                className="w-full bg-transparent text-sm text-ink-heading placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-ink-muted hover:text-ink-heading"
              >
                ESC
              </button>
            </div>
            <div className="max-h-[55vh] divide-y divide-line overflow-y-auto">
              {filteredPaletteItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-ink-muted">
                  No matching admin workspace found.
                </p>
              ) : (
                filteredPaletteItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setPaletteOpen(false);
                        setPaletteQuery("");
                        router.push(item.href);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-card text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-heading">
                            {item.label}
                          </p>
                          <p className="truncate text-xs text-ink-muted">
                            {item.shortDesc}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-muted" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Sticky Workspace Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin navigation"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-card text-ink-heading lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav
              aria-label="Admin breadcrumb"
              className="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm"
            >
              <span className="hidden font-medium text-ink-muted sm:inline">
                {activeNavMeta.sectionTitle}
              </span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-ink-muted sm:inline" />
              <span className="truncate font-semibold text-ink-heading">
                {activeNavMeta.item?.label}
              </span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Live Site Health Status Pill -> Always 1 click to /admin/diagnostics */}
            {alertSummary && (
              <Link
                href="/admin/diagnostics"
                title="Open Live Site Health & Error Report"
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${
                  hasCriticalAlert
                    ? "border-status-error/45 bg-status-error/12 text-status-error hover:bg-status-error/20"
                    : totalAlerts > 0
                      ? "border-status-warning/45 bg-status-warning/12 text-status-warning hover:bg-status-warning/20"
                      : "border-status-success/40 bg-status-success/10 text-status-success hover:bg-status-success/18"
                }`}
              >
                {hasCriticalAlert ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                ) : totalAlerts > 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {hasCriticalAlert
                    ? `${alertSummary.criticalCount} Critical Alert${
                        alertSummary.criticalCount === 1 ? "" : "s"
                      }`
                    : totalAlerts > 0
                      ? `${totalAlerts} Site Warning${totalAlerts === 1 ? "" : "s"}`
                      : `Site Healthy · ${alertSummary.score}`}
                </span>
                <span className="font-mono sm:hidden">
                  {totalAlerts > 0 ? totalAlerts : "OK"}
                </span>
              </Link>
            )}

            <ThemeToggle />

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-3 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary hover:text-primary"
            >
              <span className="hidden sm:inline">Live Site</span>
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </Link>
          </div>
        </header>

        {/* Global Live Site Problem / Error Alert Strip */}
        {alertSummary &&
          totalAlerts > 0 &&
          !bannerDismissed &&
          pathname !== "/admin/diagnostics" && (
            <div
              role="alert"
              className={`border-b px-4 py-2.5 text-xs sm:px-6 lg:px-8 ${
                hasCriticalAlert
                  ? "border-status-error/35 bg-status-error/10 text-ink-heading"
                  : "border-status-warning/35 bg-status-warning/10 text-ink-heading"
              }`}
            >
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  {hasCriticalAlert ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-status-error" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-status-warning" />
                  )}
                  <p className="truncate font-medium">
                    <span className="font-bold">
                      {hasCriticalAlert ? "Live Site Error Alert:" : "Live Site Notice:"}
                    </span>{" "}
                    {alertSummary.topAlertTitle}
                    {totalAlerts > 1 ? ` (+${totalAlerts - 1} more)` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/admin/diagnostics"
                    className="inline-flex items-center gap-1 rounded-full bg-surface-card px-3 py-1 font-semibold text-primary shadow-2xs hover:underline"
                  >
                    <span>Open Live Report</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBannerDismissed(true)}
                    aria-label="Dismiss alert banner"
                    className="rounded p-1 text-ink-muted hover:text-ink-heading"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
