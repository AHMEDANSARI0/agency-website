# OmniFlow v1.0.0 — AI Automation & Business Solutions Platform

**Positioning:** AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Principal Architect & Founder:** Ahmed Ansari  
**Target Markets:** United States (USD), United Kingdom (GBP), Canada (CAD)

OmniFlow is a production-hardened Next.js 15 agency website, interactive workflow & ROI lab, and executive RBAC CRM/CMS back-office engineered to run on **100% free-tier cloud infrastructure** (Vercel Hobby + Supabase PostgreSQL `:6543` + Supabase Storage + Resend Free Tier) with **zero paid Redis, VPS, or dedicated background VMs required**.

---

## Completed 5-Phase Platform Transformation

1. **Brand, Positioning & Conversion Architecture (`transformation-phase-1`):**
   - Outcome-driven positioning across US/UK/Canada service businesses, interactive Workflow Signal Simulator, interactive multi-currency ROI Calculator (`USD`/`GBP`/`CAD`), and friction-free 25-minute Discovery Call + Custom Scope intake flow (`/contact`).
   - **Strict Brand Honesty:** Zero fabricated client reviews, logos, or `aggregateRating` schemas; every case study carries an explicit `WorkVerificationType` disclosure (`Concept Blueprint`, `Internal Prototype`, `Verified Client Case Study`), and public testimonials stay hidden unless `isPublished && isAuthorized && isVerified`.
2. **Futuristic Design System & GPU-Safe Motion (`transformation-phase-2`):**
   - Light-First Indigo Signature (`#F8FAFC` / `#4F46E5`) + Midnight-Navy Dark Mode (`#090D16`) + `Cyber-Architect` built-in preset, interactive Ecosystem Integration Network (`EcosystemNetworkSection`), and zero-dependency `transform`/`opacity` motion choreography (`MotionRuntime` + Lenis desktop smooth wheel with background-tab pause & `prefers-reduced-motion` / `--of-motion-scale` respect).
3. **Executive Admin Console, CRM Pipeline & Modular CMS (`transformation-phase-3`):**
   - Real-time DB-calculated Executive Dashboard KPIs (`Total Leads`, `Monthly Enquiries`, `Qualified Rate`, `Won/Lost Revenue`, `Conversion Rate`, `Source Attribution`, `Follow-Up Queue`).
   - Dual-View Lead CRM (*Split Inspector* + *6-Column Kanban*) with Deal Valuation (`proposalValue`), Priority, Expected Closing Date, Lost Reason, chronological Activity Timeline, and RFC-4180 formula-safe CSV Import & Export.
   - Modular 7-panel CMS Studio (`localStorage` draft autosave, unsaved-changes guard, live 0–100% SEO Readiness score + SERP preview, Media Library modal picker), 30-step Undo/Redo Page Builder with Desktop/Tablet/Mobile preview switcher, and Controlled Design System Tokens (`typography`, `buttonStyle`, `borderRadius`, `spacing`, `animationIntensity`).
4. **Defense-in-Depth Security, Atomicity & Query Performance (`transformation-phase-4`):**
   - Atomic initial Super Admin setup (`pg_advisory_xact_lock` + mutex) and atomic single-use SHA-256 recovery token consumption preventing concurrent `TOCTOU` replay attacks.
   - Persistent serverless cold-start safe `Idempotency-Key` lead deduplication (`lead_idempotency_keys`), incremental `ReadableStream` chunk payload size guards (`16 KB` auth / `24 KB` leads -> `413`), hardened CSRF (`Origin: null`, cross-origin `Referer`, `Sec-Fetch-Site`, multi-proxy `X-Forwarded-Host`), and indexed `O(log N)` PostgreSQL point lookups.
5. **End-to-End Verification & Production Handover (`transformation-phase-5`):**
   - Edge Web Crypto HMAC session gate on protected `/admin` routes (`307 -> /admin/login` with `Cache-Control: no-store`), 21 automated Vitest suites (`106` tests), non-destructive 4-migration SQL chain (`0001`–`0004`), and `npm run preflight` CLI audit.

---

## Quick Start (Local Development & Full Verification)

```bash
cp .env.example .env
npm install
npm run preflight
npm run verify
npm run dev
```

- **Public Website:** `http://localhost:3000`
- **Interactive Demos & Calculators:** `http://localhost:3000/demos`
- **Admin Console:** `http://localhost:3000/admin/login` (or `/admin/setup` when `users` table is empty)
- **Health & Readiness Probe:** `http://localhost:3000/api/health`

See **[`DEPLOYMENT_AND_HANDOVER.md`](./DEPLOYMENT_AND_HANDOVER.md)** for complete Supabase SQL migrations (`0001`–`0004`), Storage bucket setup, Vercel environment variables, Resend DNS authentication, and custom domain launch instructions.
