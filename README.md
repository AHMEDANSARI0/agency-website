# OmniFlow v1.0.0 — AI Automation & Business Solutions Platform

**Positioning:** AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Principal Architect & Founder:** Ahmed Ansari  
**Target Markets:** United States (USD), United Kingdom (GBP), Canada (CAD)

OmniFlow is a production-hardened Next.js 15 agency website, deterministic interactive workflow lab, and executive RBAC content/CRM back-office engineered to operate on **100% free-tier cloud infrastructure** (Vercel Hobby + Supabase PostgreSQL + Supabase Storage + Resend Free Tier) with **zero paid Redis, VPS, or dedicated background VMs required**.

---

## Core Capabilities Across All 9 Upgrade Phases

1. **Production Reliability & Auth Security (Phase 1):**
   - Strict production persistence (`DATABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`); silent fallback to `/tmp` or local JSON is blocked in `NODE_ENV=production`.
   - Secure one-time Initial Super Admin Setup (`/admin/setup`), forced bootstrap password rotation, SHA-256 single-use recovery tokens (`/admin/recover`), and instant session revocation via `users.session_version`.
2. **Light-First Indigo Signature + Midnight-Navy Dark Mode (Phase 2):**
   - High-contrast `#F8FAFC` / `#FFFFFF` + `#4F46E5` Light-First default palette paired with `#090D16` Midnight-Navy Dark Mode (`0` WCAG AA contrast warnings), SSR `<ThemeStyleTag />`, and replaceable brand asset slots.
3. **16-Section Narrative Homepage & 18 Public Routes (Phase 3):**
   - Accessible sticky Mega-Menu Navbar, 5-column dark executive Footer, 16-section homepage architecture, and dedicated inner routes (`/services`, `/services/[slug]`, `/solutions`, `/how-it-works`, `/demos`, `/work`, `/case-studies`, `/case-studies/[slug]`, `/blog`, `/blog/[slug]`, `/about`, `/team`, `/faq`, `/contact`, and legal pages).
   - **Strict Honesty Policy:** Zero fabricated client logos, testimonials, or unverified ROI claims; public testimonials remain auto-hidden until `isPublished && isAuthorized && isVerified`.
4. **Interactive Automation Lab & Calculators (Phase 4):**
   - Five deterministic, zero-login browser tools at `/demos` (*Lead Qualification*, *Grounded AI Support*, *Fault-Tolerant Workflow Simulator*, *USD/GBP/CAD Savings Calculator*, *Readiness Assessment*) with `.txt` brief export and `/contact?service=&context=` handoff.
5. **Executive Admin Console, Kanban CRM & CMS Studio (Phase 5):**
   - Grouped sidebar navigation, `Ctrl+K` / `⌘K` Quick Jump Command Palette, Dual-View Lead CRM (*Split Inspector* + *6-Column Kanban Board*), CMS Live Markdown Preview, Page Section Builder, and Live WCAG Contrast Telemetry.
6. **Motion Choreography & Core Web Vitals Polish (Phase 6):**
   - Non-blocking top architectural sweep (`LCP` unblocked, `CLS = 0`), GPU `scaleX` reading progress bar, hardware-aware progressive `[data-reveal]`, background-tab `Lenis` RAF pause, and `.cv-auto` off-screen paint deferral.
7. **Technical SEO, Dynamic OpenGraph, RSS 2.0 & Consent Mode v2 (Phase 7):**
   - Dynamic `1200×630` branded `/opengraph-image`, `/feed.xml` RSS 2.0 syndication, `/sitemap.xml`, `/robots.txt`, truthful Schema.org JSON-LD (`Organization`, `WebSite`, `Service`, `TechArticle`, `WebApplication`, `Article`, `FAQPage`, `BreadcrumbList`), and GDPR/UK PECR re-openable Cookie Preferences.
8. **Defense-in-Depth Security & Fault Isolation (Phase 8):**
   - Preview-compatible `Content-Security-Policy`, `24 KB` bounded JSON intake (`413`), `Idempotency-Key` lead replay deduplication, `4.5s` Resend `AbortSignal.timeout` + CRLF header sanitization, distributed rate-limiting, and isolated error boundaries.
9. **Pre-Flight Readiness CLI & Master Handover (Phase 9):**
   - Zero-dependency `npm run preflight` audit CLI (`scripts/preflight-check.mjs`) + complete Supabase/Vercel/Resend/DNS deployment runbook.

---

## Quick Start (Local Development & Verification)

```bash
cp .env.example .env
npm install
npm run preflight
npm run verify
npm run dev
```

- **Public Website:** `http://localhost:3000`
- **Interactive Demos Lab:** `http://localhost:3000/demos`
- **Admin Console:** `http://localhost:3000/admin/login` (or `/admin/setup` when `users` table is empty)
- **Health & Readiness Probe:** `http://localhost:3000/api/health`

See **[`DEPLOYMENT_AND_HANDOVER.md`](./DEPLOYMENT_AND_HANDOVER.md)** for step-by-step Supabase SQL migration, Storage bucket, Vercel environment variables, Resend SPF/DKIM/DMARC, and custom domain launch instructions.
