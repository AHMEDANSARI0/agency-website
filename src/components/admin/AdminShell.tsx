"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Command,
  Database,
  ExternalLink,
  FileEdit,
  FolderOpen,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Search,
  SearchCheck,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { PermissionAction, RolePolicyConfig, SafeUser } from "@/types/auth";
import type { DatabaseDriverMode } from "@/lib/database";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/features/themes/ThemeToggle";
import { hasPermission } from "@/lib/auth/rbac";

interface AdminShellProps {
  user: SafeUser;
  rolePolicies: RolePolicyConfig;
  brand: BrandAssetConfig;
  databaseMode: DatabaseDriverMode;
  newLeadsCount: number;
  children: React.ReactNode;
}

type NavGroupLabel =
  | "Operations"
  | "Content & SEO"
  | "Design & Identity"
  | "Security & Access";

interface AdminNavItem {
  href: string;
  label: string;
  group: NavGroupLabel;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionAction;
  badge?: number;
}

const GROUP_ORDER: NavGroupLabel[] = [
  "Operations",
  "Content & SEO",
  "Design & Identity",
  "Security & Access",
];

export function AdminShell({
  user,
  rolePolicies,
  brand,
  databaseMode,
  newLeadsCount,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const paletteInputRef = useRef<HTMLInputElement | null>(null);

  const navItems: AdminNavItem[] = useMemo(
    () => [
      {
        href: "/admin",
        label: "Overview",
        group: "Operations",
        keywords: "dashboard health kpi metrics summary",
        icon: LayoutDashboard,
        permission: "dashboard:view",
      },
      {
        href: "/admin/leads",
        label: "Lead & Enquiry CRM",
        group: "Operations",
        keywords: "leads enquiries pipeline kanban csv follow up",
        icon: Inbox,
        permission: "leads:view",
        badge: newLeadsCount > 0 ? newLeadsCount : undefined,
      },
      {
        href: "/admin/pages",
        label: "Page Section Builder",
        group: "Content & SEO",
        keywords: "homepage sections layout order visibility builder",
        icon: Layers,
        permission: "content:edit_any",
      },
      {
        href: "/admin/cms",
        label: "CMS Content Studio",
        group: "Content & SEO",
        keywords: "blog posts case studies services faqs testimonials team",
        icon: FileEdit,
        permission: "content:create_draft",
      },
      {
        href: "/admin/media",
        label: "Media Library",
        group: "Content & SEO",
        keywords: "images uploads storage svg png webp quota",
        icon: FolderOpen,
        permission: "media:manage",
      },
      {
        href: "/admin/seo",
        label: "SEO, Redirects & GA4",
        group: "Content & SEO",
        keywords: "sitemap robots metadata redirects analytics consent",
        icon: SearchCheck,
        permission: "seo:manage",
      },
      {
        href: "/admin/theme",
        label: "Theme & Color Studio",
        group: "Design & Identity",
        keywords: "colors light dark mode tokens contrast presets",
        icon: Palette,
        permission: "theme:manage",
      },
      {
        href: "/admin/brand",
        label: "Brand & Logo Assets",
        group: "Design & Identity",
        keywords: "logo favicon og image symbol identity",
        icon: ImageIcon,
        permission: "brand:manage",
      },
      {
        href: "/admin/settings",
        label: "Nav, Footer & CTAs",
        group: "Design & Identity",
        keywords: "navigation menu footer contact email cta booking",
        icon: Settings,
        permission: "settings:manage",
      },
      {
        href: "/admin/users",
        label: "Users & Role Policies",
        group: "Security & Access",
        keywords: "staff accounts rbac permissions editor author super admin",
        icon: Users,
        permission: "users:manage",
      },
      {
        href: "/admin/audit-logs",
        label: "Security Audit Logs",
        group: "Security & Access",
        keywords: "audit trail security events ip login history",
        icon: Shield,
        permission: "audit:view",
      },
      {
        href: "/admin/account",
        label: "Account & Backups",
        group: "Security & Access",
        keywords: "password security json database backup snapshot",
        icon: KeyRound,
      },
    ],
    [newLeadsCount]
  );

  const visibleNav = useMemo(
    () =>
      user.mustChangePassword
        ? navItems.filter((item) => item.href === "/admin/account")
        : navItems.filter((item) =>
            item.permission
              ? hasPermission(user.role, item.permission, rolePolicies)
              : true
          ),
    [user.mustChangePassword, user.role, rolePolicies, navItems]
  );

  const commandActions = useMemo(() => {
    const adminLinks = visibleNav.map((item) => ({
      id: item.href,
      label: item.label,
      category: item.group,
      keywords: item.keywords,
      href: item.href,
      external: false,
    }));
    const publicLinks = [
      {
        id: "public-home",
        label: "Open Public Homepage",
        category: "Public Website",
        keywords: "website live preview home",
        href: "/",
        external: true,
      },
      {
        id: "public-demos",
        label: "Open Interactive Demos Lab",
        category: "Public Website",
        keywords: "demos calculator simulator",
        href: "/demos",
        external: true,
      },
      {
        id: "public-contact",
        label: "Open Public Contact Form",
        category: "Public Website",
        keywords: "enquiry test lead form",
        href: "/contact",
        external: true,
      },
    ];
    return [...adminLinks, ...publicLinks];
  }, [visibleNav]);

  const filteredCommands = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return commandActions;
    return commandActions.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.keywords.toLowerCase().includes(q)
    );
  }, [commandActions, paletteQuery]);

  useEffect(() => {
    setMobileOpen(false);
    setPaletteOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
        setPaletteQuery("");
        setPaletteIndex(0);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      requestAnimationFrame(() => paletteInputRef.current?.focus());
    }
  }, [paletteOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const activeNavItem = visibleNav.find((item) => isActive(item.href));

  const dbLabel =
    databaseMode === "supabase_postgres"
      ? "Supabase PostgreSQL"
      : databaseMode === "unconfigured_production"
        ? "DB Configuration Required"
        : "Local Dev JSON Store";

  const dbDescription =
    databaseMode === "supabase_postgres"
      ? "Connected to production relational database."
      : databaseMode === "unconfigured_production"
        ? "DATABASE_URL missing — production writes blocked."
        : "Local development JSON store active.";

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2">
            <BrandMark brand={brand} href="/admin" />
            <span className="rounded-md bg-accent-subtle px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Console
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-control p-1.5 text-ink-muted hover:bg-surface-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="space-y-5 p-3.5">
          {GROUP_ORDER.map((groupName) => {
            const groupItems = visibleNav.filter((i) => i.group === groupName);
            if (groupItems.length === 0) return null;
            return (
              <div key={groupName}>
                <p className="mb-1.5 px-2.5 font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                  {groupName}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center justify-between rounded-control px-3 py-2 text-[0.84rem] font-medium transition-colors ${
                          active
                            ? "bg-accent-subtle font-semibold text-primary"
                            : "text-ink-body hover:bg-surface-muted hover:text-ink-heading"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active ? "text-primary" : "text-ink-muted"
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badge !== undefined && (
                          <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-line p-4">
        <div className="rounded-xl border border-line bg-surface-muted/70 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink-heading">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>{dbLabel}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            {dbDescription}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-heading">
              {user.name}
            </p>
            <p className="truncate font-mono text-[11px] text-primary">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-body transition-colors hover:border-line-strong hover:text-ink-heading"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{signingOut ? "..." : "Exit"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarBody}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-surface shadow-elevated">
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-control border border-line p-2 text-ink-body hover:bg-surface-muted lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span className="font-mono uppercase tracking-wider text-ink-muted">
                {activeNavItem?.group || "Workspace"}
              </span>
              <span className="text-ink-muted">/</span>
              <strong className="text-sm font-semibold text-ink-heading">
                {activeNavItem?.label || "Administration"}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!user.mustChangePassword && (
              <button
                type="button"
                onClick={() => {
                  setPaletteQuery("");
                  setPaletteIndex(0);
                  setPaletteOpen(true);
                }}
                aria-label="Open quick jump command palette"
                className="inline-flex items-center gap-2 rounded-control border border-line bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-primary/40 hover:text-ink-heading"
              >
                <Search className="h-3.5 w-3.5 text-primary" />
                <span className="hidden md:inline">Quick Jump…</span>
                <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline-flex sm:items-center sm:gap-0.5">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            )}

            <ThemeToggle />

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
            >
              <span className="hidden sm:inline">Public Site</span>
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Quick Jump Command Palette Modal */}
      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin quick jump palette"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-xs"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 text-primary" />
              <input
                ref={paletteInputRef}
                type="search"
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value);
                  setPaletteIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setPaletteIndex((i) =>
                      filteredCommands.length ? (i + 1) % filteredCommands.length : 0
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setPaletteIndex((i) =>
                      filteredCommands.length
                        ? (i - 1 + filteredCommands.length) % filteredCommands.length
                        : 0
                    );
                  } else if (e.key === "Enter" && filteredCommands[paletteIndex]) {
                    e.preventDefault();
                    const chosen = filteredCommands[paletteIndex];
                    setPaletteOpen(false);
                    if (chosen.external) {
                      window.open(chosen.href, "_blank", "noopener,noreferrer");
                    } else {
                      router.push(chosen.href);
                    }
                  }
                }}
                placeholder="Jump to CRM, Page Builder, CMS, Theme, SEO, Users..."
                className="w-full bg-transparent text-sm text-ink-heading placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-muted hover:text-ink-heading"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <p className="py-8 text-center text-xs text-ink-muted">
                  No matching workspace modules found.
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredCommands.map((cmd, idx) => {
                    const selected = idx === paletteIndex;
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setPaletteIndex(idx)}
                          onClick={() => {
                            setPaletteOpen(false);
                            if (cmd.external) {
                              window.open(cmd.href, "_blank", "noopener,noreferrer");
                            } else {
                              router.push(cmd.href);
                            }
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                            selected
                              ? "bg-accent-subtle text-primary"
                              : "text-ink-heading hover:bg-surface-muted"
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{cmd.label}</span>
                            <span className="ml-2 font-mono text-[10px] text-ink-muted">
                              {cmd.category}
                            </span>
                          </div>
                          {cmd.external ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
