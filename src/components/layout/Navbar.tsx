"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, SunMoon, X } from "lucide-react";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { useTheme } from "@/features/themes/ThemeProvider";

interface NavbarProps { brand: BrandAssetConfig; settings: SiteSettings }

const DEFAULT_FALLBACK_LINKS = [
  { id: "nav-services", label: "Services", href: "/services" },
  { id: "nav-solutions", label: "Solutions", href: "/solutions" },
  { id: "nav-cases", label: "Case Studies", href: "/case-studies" },
  { id: "nav-pricing", label: "Pricing", href: "/pricing" },
  { id: "nav-how", label: "How It Works", href: "/how-it-works" },
  { id: "nav-about", label: "About", href: "/about" },
];

export function Navbar({ brand, settings }: NavbarProps) {
  const pathname = usePathname();
  const { resolvedMode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => { setMobileOpen(false); setOpenMenu(null); }, [pathname]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenMenu(null); setMobileOpen(false); }
    };
    const onOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null); setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsideClick);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onOutsideClick); };
  }, []);

  // Top-level links remain completely controlled by Admin Settings > Navigation.
  const configuredLinks = settings.navigation.filter((item) =>
    item.isVisible && item.href.trim() !== "/" && item.href.trim() !== "/work" &&
    item.href.trim() !== settings.primaryCtaHref.split("?")[0]
  ).sort((a, b) => a.order - b.order);
  const visibleLinks = configuredLinks.length ? configuredLinks : DEFAULT_FALLBACK_LINKS;
  const primaryCtaHref = settings.primaryCtaHref?.trim() || "/contact?intent=call";
  const primaryCtaLabel = settings.primaryCtaLabel?.trim() || "Book a Free Review";
  const isLinkActive = (href: string) => {
    const clean = href.split("?")[0]?.split("#")[0] || "/";
    return clean === "/" ? pathname === "/" : pathname === clean || pathname.startsWith(`${clean}/`);
  };
  // Dropdown contents are existing, admin-managed footer links rather than
  // hardcoded destinations. Only show a chevron when a group has visible items.
  const getChildren = (href: string) => {
    const base = href.split(/[?#]/)[0]?.replace(/\/$/, "");
    const entries = base === "/services" ? settings.footerLinks.services : base === "/about" ? settings.footerLinks.company : [];
    return [...entries].filter((entry) => entry.isVisible && entry.href.trim() && entry.href !== href)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <header ref={headerRef} className={`of-floating-header ${pathname === "/" ? "of-floating-header-home" : ""} sticky top-3 z-40 mx-auto w-[calc(100%-2rem)] max-w-[1400px] sm:w-[calc(100%-3rem)]`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground">Skip to content</a>
      <div className="of-floating-bar flex min-h-[62px] items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
        <div className="shrink-0"><BrandMark brand={brand} size="sm" tone="auto" /></div>
        <nav aria-label="Primary navigation" className="hidden min-w-0 items-center justify-center gap-0.5 xl:flex">
          {visibleLinks.map((item) => {
            const children = getChildren(item.href);
            const expanded = openMenu === item.id;
            return (
              <div key={item.id} className="of-nav-group relative" onMouseEnter={() => children.length && setOpenMenu(item.id)} onMouseLeave={() => setOpenMenu(null)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null); }}>
                <div className="of-nav-item flex items-center">
                  <Link href={item.href} aria-current={isLinkActive(item.href) ? "page" : undefined} className="of-nav-label">{item.label}</Link>
                  {children.length > 0 && <button type="button" className="of-nav-chevron" aria-label={`${item.label} submenu`} aria-expanded={expanded} aria-controls={`dropdown-${item.id}`} onClick={() => setOpenMenu(expanded ? null : item.id)}><ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></button>}
                </div>
                {children.length > 0 && expanded && <div className="of-dropdown-wrap" id={`dropdown-${item.id}`}><div className="of-dropdown">{children.map((child) => <Link key={child.id} href={child.href} className="of-dropdown-link" onClick={() => setOpenMenu(null)}>{child.label}</Link>)}</div></div>}
              </div>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={primaryCtaHref} className="of-nav-cta hidden sm:inline-flex"><span>{primaryCtaLabel}</span><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          <button type="button" className="of-nav-control" aria-label="Switch color theme" title="Switch light or dark theme" onClick={() => setMode(resolvedMode === "dark" ? "light" : "dark")}><SunMoon className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" className="of-nav-control xl:hidden" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation-drawer" onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); }}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {mobileOpen && <div id="mobile-navigation-drawer" data-lenis-prevent className="of-mobile-drawer max-h-[calc(100dvh-95px)] overflow-y-auto p-3 xl:hidden">
        <nav aria-label="Mobile navigation">
          {visibleLinks.map((item) => {
            const children = getChildren(item.href);
            const expanded = openMenu === item.id;
            return <div key={item.id}>
              <div className="flex items-center"><Link href={item.href} aria-current={isLinkActive(item.href) ? "page" : undefined} className="of-mobile-link flex-1" onClick={() => setMobileOpen(false)}>{item.label}</Link>
                {children.length > 0 && <button type="button" className="of-nav-control" aria-label={`${item.label} submenu`} aria-expanded={expanded} aria-controls={`mobile-dropdown-${item.id}`} onClick={() => setOpenMenu(expanded ? null : item.id)}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></button>}
              </div>
              {children.length > 0 && expanded && <div id={`mobile-dropdown-${item.id}`} className="mb-2 ml-4 border-l border-line-subtle pl-3">{children.map((child) => <Link key={child.id} href={child.href} className="of-mobile-link block text-sm" onClick={() => setMobileOpen(false)}>{child.label}</Link>)}</div>}
            </div>;
          })}
        </nav>
        <Link href={primaryCtaHref} className="of-nav-cta mt-3 flex justify-center sm:hidden" onClick={() => setMobileOpen(false)}>{primaryCtaLabel}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>}
    </header>
  );
}
