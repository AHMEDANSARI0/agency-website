"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BrandAssetConfig } from "@/types/brand";
import type { SiteSettings } from "@/types/content";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/features/themes/ThemeToggle";

interface NavbarProps {
  brand: BrandAssetConfig;
  settings: SiteSettings;
}

const LEFT_NOTCH_STYLE: React.CSSProperties = {
  width: 18,
  height: 18,
  left: -18,
  background:
    "radial-gradient(circle at 0 100%, transparent 18px, var(--of-surface-navbar) 18.5px)",
};

const RIGHT_NOTCH_STYLE: React.CSSProperties = {
  width: 18,
  height: 18,
  right: -18,
  background:
    "radial-gradient(circle at 100% 100%, transparent 18px, var(--of-surface-navbar) 18.5px)",
};

export function Navbar({ brand, settings }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const visibleNav = settings.navigation
    .filter((item) => item.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <header className="on-dark pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
      <nav
        aria-label="Primary navigation"
        className={`pointer-events-auto relative flex max-w-[96vw] items-center rounded-b-[22px] border-x border-b border-[var(--of-border-navbar)] bg-[var(--of-surface-navbar)] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-all duration-500 ease-[var(--of-ease-balance)] ${
          scrolled
            ? "gap-3 px-3.5 py-2 sm:gap-5"
            : "gap-4 px-4 py-3 sm:gap-7 sm:px-5"
        }`}
      >
        {/* Concave Top-Edge Notches */}
        <span aria-hidden="true" className="hidden sm:block sm:absolute sm:top-0" style={LEFT_NOTCH_STYLE} />
        <span aria-hidden="true" className="hidden sm:block sm:absolute sm:top-0" style={RIGHT_NOTCH_STYLE} />

        <BrandMark brand={brand} tone="inverse" />

        <ul className="hidden items-center gap-0.5 xl:flex">
          {visibleNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[0.86rem] transition-colors duration-300 ${
                    active
                      ? "bg-white/12 text-[#F2EADB]"
                      : "text-[#F2EADB]/78 hover:text-[#F2EADB]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href={settings.primaryCtaHref}
            className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-[#F2EADB] px-4 py-2 text-[0.84rem] font-medium text-[#0B0908] transition-colors hover:bg-white sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>{settings.primaryCtaLabel}</span>
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="omniflow-mobile-menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/8 text-[#F2EADB] xl:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-px w-4 bg-[#F2EADB] transition-all duration-300 ${
                  mobileOpen ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-4 bg-[#F2EADB] transition-all duration-300 ${
                  mobileOpen ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="omniflow-mobile-menu"
          className="pointer-events-auto absolute inset-x-3 top-[66px] max-h-[82vh] overflow-y-auto rounded-[26px] border border-white/10 bg-[var(--of-surface-navbar)] p-6 shadow-2xl xl:hidden"
        >
          <ul className="flex flex-col gap-1">
            {visibleNav.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-2 py-2.5 text-xl font-medium tracking-tight text-[#F2EADB] hover:bg-white/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={settings.primaryCtaHref}
            onClick={() => setMobileOpen(false)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-[0_10px_36px_-10px_rgba(210,58,31,0.75)]"
          >
            <span>{settings.primaryCtaLabel}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </header>
  );
}
