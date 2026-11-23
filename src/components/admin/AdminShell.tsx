"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  ExternalLink,
  FileEdit,
  FolderOpen,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  SearchCheck,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { PermissionAction, RolePolicyConfig, SafeUser } from "@/types/auth";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/features/themes/ThemeToggle";
import { hasPermission } from "@/lib/auth/rbac";

interface AdminShellProps {
  user: SafeUser;
  rolePolicies: RolePolicyConfig;
  brand: BrandAssetConfig;
  databaseMode: "supabase_postgres" | "local_file_fallback";
  newLeadsCount: number;
  children: React.ReactNode;
}

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionAction;
  badge?: number;
}

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
  const [signingOut, setSigningOut] = useState(false);

  const navItems: AdminNavItem[] = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      permission: "dashboard:view",
    },
    {
      href: "/admin/leads",
      label: "Lead & Enquiry CRM",
      icon: Inbox,
      permission: "leads:view",
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
    },
    {
      href: "/admin/pages",
      label: "Page Section Builder",
      icon: Layers,
      permission: "content:edit_any",
    },
    {
      href: "/admin/cms",
      label: "CMS Content Studio",
      icon: FileEdit,
      permission: "content:create_draft",
    },
    {
      href: "/admin/media",
      label: "Media Library",
      icon: FolderOpen,
      permission: "media:manage",
    },
    {
      href: "/admin/seo",
      label: "SEO, Redirects & GA4",
      icon: SearchCheck,
      permission: "seo:manage",
    },
    {
      href: "/admin/theme",
      label: "Theme & Color Tokens",
      icon: Palette,
      permission: "theme:manage",
    },
    {
      href: "/admin/brand",
      label: "Brand & Logo Assets",
      icon: ImageIcon,
      permission: "brand:manage",
    },
    {
      href: "/admin/settings",
      label: "Nav, Footer & CTAs",
      icon: Settings,
      permission: "settings:manage",
    },
    {
      href: "/admin/users",
      label: "Users & Role Policies",
      icon: Users,
      permission: "users:manage",
    },
    {
      href: "/admin/audit-logs",
      label: "Security Audit Logs",
      icon: Shield,
      permission: "audit:view",
    },
  ];

  const visibleNav = navItems.filter((item) =>
    hasPermission(user.role, item.permission, rolePolicies)
  );

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

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2">
            <BrandMark brand={brand} href="/admin" />
            <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Admin
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

        <nav aria-label="Admin navigation" className="space-y-1 p-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-subtle text-primary"
                    : "text-ink-body hover:bg-surface-muted hover:text-ink-heading"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-line p-4">
        <div className="rounded-control border border-line bg-surface-muted/70 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink-heading">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>
              {databaseMode === "supabase_postgres"
                ? "Supabase PostgreSQL"
                : "Local JSON Store"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">
            {databaseMode === "supabase_postgres"
              ? "Connected to production relational database."
              : "Zero-cost local dev store active (Supabase SQL ready)."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-heading">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.role.replace("_", " ")}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-body transition-colors hover:border-line-strong hover:text-ink-heading"
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
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-control border border-line p-2 text-ink-body hover:bg-surface-muted lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="hidden text-xs font-medium text-ink-muted sm:inline">
              Signed in as <strong className="text-ink-heading">{user.email}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-heading transition-colors hover:bg-surface-muted"
            >
              <span>Public Site</span>
              <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
