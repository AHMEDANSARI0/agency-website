# OmniFlow v1.0.0 — Master Production Deployment, Operations & Handover Runbook

**Platform:** OmniFlow — AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Principal Architect & Founder:** Ahmed Ansari  
**Target Markets:** United States, United Kingdom, Canada

---

## 1. Completed Transformation & Production Architecture Summary

| Phase | Scope | Git Tag | Status |
| :---: | :--- | :--- | :---: |
| **Baseline v1.0** | 9-Phase Foundation (Auth, Light/Dark Tokens, 18 Routes, 5 Demos, SEO, Backups) | `v1.0.0` | Verified |
| **Transformation Phase 1** | Outcome-Driven Positioning, Hero Signal Simulator, ROI Calculator & Discovery Call Flow | `transformation-phase-1` | Verified |
| **Transformation Phase 2** | Futuristic Glass/Grid UI, Ecosystem Network, GPU Motion & `Cyber-Architect` Preset | `transformation-phase-2` | Verified |
| **Transformation Phase 3** | Executive KPI Dashboard, CSV Lead Import/Export, Modular CMS, Undo/Redo Builder & Design Tokens | `transformation-phase-3` | Verified |
| **Transformation Phase 4** | Atomic Setup & Single-Use Recovery Locks, Persistent `Idempotency-Key`, Streaming `413` & Indexed SQL | `transformation-phase-4` | Verified |
| **Transformation Phase 5** | Edge `/admin` HMAC Gate, E2E RBAC/Honesty/Funnel Verification (`106` Tests) & Handover Runbook | `transformation-phase-5` | Verified |

---

## 2. 100% Free-Tier Zero-VM Cloud Stack

OmniFlow runs completely on serverless/managed free tiers — **zero Linux VM, VPS, or paid Redis instance is required** (your only out-of-pocket cost is your custom domain name):

| Layer | Free-Tier Provider | Production Requirement | Local Dev Fallback |
| :--- | :--- | :--- | :--- |
| **Application & Edge CDN** | **Vercel Hobby** | Automatic HTTPS, Next.js 15 Serverless Functions | `npm run dev` (`localhost:3000`) |
| **Relational Database** | **Supabase PostgreSQL** (`500 MB` free) | **Mandatory** (`DATABASE_URL` via Pooler `:6543`) | `data/omniflow-db.json` (dev/test only) |
| **Persistent Media Storage** | **Supabase Storage** (`1 GB` free) | **Mandatory** (`omniflow-media` public bucket) | `public/uploads/` (dev/test only) |
| **Transactional Email** | **Resend Free Tier** (`3,000`/mo) | Optional (leads always save to PostgreSQL first) | Skipped cleanly when unset |
| **DNS & Domain Routing** | **Cloudflare Free DNS** or Registrar | Root `A` + `www` `CNAME` + `SPF/DKIM/DMARC` | `http://localhost:3000` |

---

## 3. Safe Database Migration & Backup Procedure

### 3.1 Applying Non-Destructive SQL Migrations
Open **Supabase Dashboard -> SQL Editor** and execute in order:
1. **`supabase/migrations/0001_omniflow_schema.sql`** — Core 13 relational tables + Row-Level Security (RLS).
2. **`supabase/migrations/0002_production_upgrade.sql`** — Session revocation (`session_version`), hashed recovery tokens, distributed serverless `rate_limits`, `schema_migrations`, and SHA-256 `database_backups`.
3. **`supabase/migrations/0003_crm_and_operations.sql`** — CRM deal pipeline columns (`priority`, `proposal_value`, `expected_closing_date`, `lost_reason`) + `lead_idempotency_keys` table & RLS.
4. **`supabase/migrations/0004_security_and_performance.sql`** — Persistent idempotency expiry index, `LOWER(email)` duplicate-lead index, and single-row lookup performance indexes.

All four scripts use `IF NOT EXISTS` guards and contain zero `DROP TABLE` or `TRUNCATE` statements. Application code also includes graceful column/table fallback (`42703` / `42P01`) so zero downtime occurs if code deploys moments before `0003`/`0004` are executed.

### 3.2 Selecting the Supabase Transaction Pooler (`:6543`)
In **Supabase Dashboard -> Connect -> Pooler**, copy the **Transaction Pooler** URI:
```text
postgresql://postgres.[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
*(Avoid the direct `db.[project-ref].supabase.co:5432` host on Vercel serverless — it resolves IPv6-only, whereas `:6543` supports IPv4 + high serverless concurrency).*

### 3.3 Creating & Restoring Backups (`/admin/account`)
- Sign in as `SUPER_ADMIN` -> open **`/admin/account`**.
- Click **Create Snapshot** or **Download JSON Backup** before major content restructures.
- Clicking **Restore Safely** automatically takes a **Pre-Restore Safety Snapshot** first and restores inside an atomic database transaction without deleting active Super Admin accounts or newer leads.

---

## 4. Persistent Media Storage Setup (Supabase Storage)

1. Open **Supabase Dashboard -> Storage -> New Bucket**:
   - **Bucket Name:** `omniflow-media`
   - **Public Bucket:** `ON` (public read for logos, OG banners, and article media; writes/deletions require `SUPABASE_SERVICE_ROLE_KEY` + RBAC `media:manage`).
2. Copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings -> API**.
3. Built-in Upload Protections:
   - Binary magic-byte verification (`.png`, `.jpg`, `.webp`, `.gif`, `.ico`, `.pdf`) + server-side SVG `<script>` / `on*` XSS sanitization.
   - `409 Conflict` active-reference deletion guard unless `SUPER_ADMIN` confirms force removal.

---

## 5. Production Environment Variables (Vercel)

Configure in **Vercel Dashboard -> Project -> Settings -> Environment Variables**:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical HTTPS URL (e.g., `https://omniflow.ai` — no trailing slash) |
| `AUTH_SECRET` | **Yes** | 32+ random character HMAC session secret (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `SESSION_TTL_HOURS` | No | Session duration in hours (default `24`) |
| `DATABASE_URL` | **Yes** | Supabase Transaction Pooler PostgreSQL URI (`:6543`) |
| `ADMIN_SETUP_TOKEN` | Recommended | One-time secret token required to claim `/admin/setup` when `users` table is empty |
| `ADMIN_BOOTSTRAP_NAME` | Optional | Initial Super Admin display name (default `Ahmed Ansari`) |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional | Optional env-bootstrapped Super Admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Optional | Must be unique & strong (`10+` chars, upper/lower/digit; default placeholders rejected) |
| `ADMIN_FORCE_FIRST_PASSWORD_CHANGE` | No | Forces password rotation on first bootstrap login (default `true`) |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project HTTPS URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only Supabase Service Role key for persistent Storage |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket name (default `omniflow-media`) |
| `MEDIA_MAX_FILE_BYTES` | No | Max single upload size in bytes (default `4194304` = `4 MB`) |
| `MEDIA_TOTAL_QUOTA_BYTES` | No | Total storage quota in bytes (default `524288000` = `500 MB`) |
| `RESEND_API_KEY` | Optional | Resend API key for new-lead and password-recovery emails (`4.5s` timeout protected) |
| `NOTIFICATION_FROM_EMAIL` | Optional | Verified sender address (e.g., `OmniFlow <notifications@yourdomain.com>`) |
| `NOTIFICATION_TO_EMAIL` | Optional | Staff recipient email for new lead notifications |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional | Consent-gated GA4 Measurement ID (`G-XXXXXXXXXX`) |
| `ENABLE_STRICT_FRAME_HEADERS` | Recommended | Set `"true"` on custom HTTPS domain to enable `HSTS`, `X-Frame-Options: SAMEORIGIN` & `frame-ancestors 'self'` |

---

## 6. Daily Admin Console Operations Guide (`/admin`)

- **Edge + Server Dual Authentication:** Unauthenticated requests to `/admin/*` are redirected immediately at the Edge (`307 -> /admin/login` with `Cache-Control: no-store`), while server layouts verify live PostgreSQL `session_version`, `is_active`, and RBAC role policies (`SUPER_ADMIN`, `EDITOR`, `AUTHOR`).
- **Quick Jump Command Palette (`Ctrl+K` / `⌘K`):** Press `Ctrl+K` or `⌘K` anywhere inside `/admin` to jump to any permitted workspace module or open public routes.
- **Executive Overview (`/admin`):** Monitor live DB-calculated KPIs (Total Leads, Monthly Enquiries, Qualified Leads, Won/Lost Revenue, Conversion Rate, Source Attribution, and Due Follow-Ups).
- **Lead & Enquiry CRM (`/admin/leads`):** Switch between **Split List** and **6-Column Kanban Board**, filter by status/priority/source, record deal valuation (`proposalValue`), expected closing dates, lost reasons, and chronological notes, or batch **Import / Export formula-safe CSVs**.
- **Page Section Builder (`/admin/pages`):** Reorder or toggle visibility across homepage narrative blocks with **30-step Undo/Redo (`Ctrl/Cmd+Z`)**, **Desktop / Tablet / Mobile** preview widths, and per-section Eyebrow/Subtitle/CTA overrides.
- **CMS Content Studio (`/admin/cms`):** Edit Blog Insights, Services, Case Studies (`Concept Blueprint` / `Prototype` / `Client Case Study` honesty badges), FAQs, Team profiles, and Verified Testimonials with `localStorage` draft autosave, unsaved-changes guard, live **0–100% SEO Readiness Score + SERP preview**, and Media Library picker.
- **Brand & Theme Studio (`/admin/brand`, `/admin/theme`):** Upload custom Light/Dark SVG logos, favicon, and OpenGraph social banners; customize Light & Dark palettes, built-in presets (including `Cyber-Architect`), and **Controlled Design System Tokens** (`typography`, `buttonStyle`, `borderRadius`, `spacing`, `animationIntensity`) with live WCAG 2.1 AA/AAA contrast validation and 1-click rollback.
- **SEO, Redirects & Consent Analytics (`/admin/seo`):** Preview Google SERP snippets, manage loop-protected `301`/`307` redirects, inspect `/sitemap.xml`, `/robots.txt`, and `/feed.xml`, and toggle Consent Mode v2 GA4 tracking.

---

## 7. Custom Domain, DNS & Honest Manual Go-Live Checklist

> **Honest Scope Note:** All application code, SQL migrations (`0001`–`0004`), security headers, automated tests, and build artifacts are 100% verified inside the repository. External cloud credentials, DNS records, and third-party accounts below require your manual configuration in your own Supabase, Vercel, Domain Registrar, and Resend dashboards:

1. **Run Local Pre-Flight & Full Verification:**
   ```bash
   npm run verify
   npm run preflight -- --mode=production
   ```
2. **Execute Supabase Setup (Manual in Supabase Dashboard):**
   - Run `0001`, `0002`, `0003`, and `0004` in **Supabase SQL Editor**.
   - Create public Storage bucket `omniflow-media`.
   - Copy Transaction Pooler `DATABASE_URL` (`:6543`), `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. **Configure Vercel & Attach Custom Domain (Manual in Vercel + DNS Provider):**
   - Add required environment variables from Section 5 (`AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SETUP_TOKEN`, `ENABLE_STRICT_FRAME_HEADERS="true"`).
   - Add `yourdomain.com` + `www.yourdomain.com` in **Vercel -> Settings -> Domains** and configure root `A` (`@`) + `www` `CNAME` records in DNS.
4. **Authenticate Transactional Email in Resend (Optional Manual Step):**
   - Add `DKIM` (`resend._domainkey`), `SPF`, and `_dmarc` `TXT` records in DNS, verify in Resend, and set `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, and `NOTIFICATION_TO_EMAIL`.
5. **Claim Initial Super Admin & Verify Live Endpoints:**
   - Visit `https://yourdomain.com/api/health` -> verify `status: "ok"`, `database.driver: "supabase_postgres"`, `storage.provider: "supabase_storage"`, `domain.https: true`.
   - Complete one-time setup at `https://yourdomain.com/admin/setup` using `ADMIN_SETUP_TOKEN` (atomic lock prevents duplicate setup), then rotate or remove `ADMIN_SETUP_TOKEN` if desired.
   - Verify `/sitemap.xml`, `/robots.txt`, `/feed.xml`, and `/opengraph-image`, and submit `https://yourdomain.com/sitemap.xml` to Google Search Console.
