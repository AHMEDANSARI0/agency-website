# OmniFlow — AI Automation & Business Solutions Platform

**Tagline:** Automate the work. Accelerate the business.  
**Founder:** Ahmed Ansari  
**Target Markets:** United States, United Kingdom, Canada

## Phase Status
- **Current Checkpoint:** Phase 7 of 7 — **Production Release Ready** (Technical SEO, Dynamic `sitemap.xml` & `robots.txt`, XSS-Safe JSON-LD Structured Data, 301/307 Redirects Engine with Loop Guard, Consent-Aware GA4 Analytics, Security Headers, and Full Operations Handover Guide in `DEPLOYMENT_AND_HANDOVER.md`)

## Admin Console (`/admin`)
- **Sign-In Route:** `/admin/login` (public registration is permanently disabled)
- **Local Bootstrap Credentials (override via `.env` in production):**
  - Email: `ADMIN_BOOTSTRAP_EMAIL` (default `admin@omniflow.example`)
  - Password: `ADMIN_BOOTSTRAP_PASSWORD` (default `ChangeMe_StrongPass_2026!`)
- **Complete Admin Modules (Phases 1–7):**
  - `/admin` — Real-Data Operational Dashboard
  - `/admin/leads` — Lead & Enquiry CRM (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`, notes, follow-ups, duplicate flags, formula-safe CSV export)
  - `/admin/pages` — Controlled Drag-and-Drop Page Section Builder (approved design-system blocks, safe Markdown rich_text, draft vs publish workflow)
  - `/admin/cms` — Full CMS Content Studio (Blog/Insights with revision history & TOC, Case Studies with honest work-type guardrails, Services, FAQs, Verified Testimonials, Team/Founder)
  - `/admin/media` — Safe Media Asset Library (PNG/JPEG/WebP/GIF/SVG/PDF binary magic-header + SVG XSS sanitizer, 500 MB quota tracker, live `usedIn` references, Supabase Storage + local fallback)
  - `/admin/seo` — Technical SEO Audit Matrix, 301/307 Redirects Manager (with loop protection), and Consent-Aware GA4 Analytics Studio
  - `/admin/theme` — Advanced Light/Dark Theme & Color Token Manager (presets, custom presets, WCAG AA contrast guard, live preview, draft/publish/rollback)
  - `/admin/brand` — Replaceable Brand Identity & Logo Asset Manager (zero hardcoded logos)
  - `/admin/settings` — Global Navigation, Footer Columns & Conversion CTA Manager
  - `/admin/users` — Staff Account Provisioning & Granular Role Policies (`SUPER_ADMIN`, `EDITOR`, `AUTHOR`)
  - `/admin/audit-logs` — Security & Administrative Audit Trail

## Quick Start

1. Copy `.env.example` to `.env` (optional for local development; required for production deployment):
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run full verification (TypeScript, ESLint, Vitest unit/integration tests, and Next.js production build):
   ```bash
   npm run verify
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## Applying Phase Patchers
Each phase delivers a self-verifying, cross-platform Node.js patcher (`patches/phase-X-patcher.mjs`) with automatic backups and SHA-256 verification:

```bash
node phase-1-patcher.mjs
```

To roll back a phase patch if needed:
```bash
node phase-1-patcher.mjs --rollback
```

## Database & Storage Modes
- **Local Development Fallback (Zero Paid Dependencies):** Automatically initializes an atomic local JSON database at `data/omniflow-db.json` when `DATABASE_URL` is empty.
- **Production (Vercel + Supabase Free Tier):** Apply `supabase/migrations/0001_omniflow_schema.sql` in the Supabase SQL Editor and set `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables.
