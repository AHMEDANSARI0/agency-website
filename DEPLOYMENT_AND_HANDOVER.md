# OmniFlow v1.0.0 — Master Production Deployment, Operations & Handover Runbook

**Platform:** OmniFlow — AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Principal Architect & Founder:** Ahmed Ansari  
**Target Markets:** United States, United Kingdom, Canada

---

## 1. Completed 9-Phase Production Architecture Summary

| Phase | Scope | Git Tag | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | Production Persistence, Bootstrap Auth, Recovery & Storage Guards | `upgrade-phase-1` | Verified |
| **Phase 2** | Light-First Indigo Signature + Midnight-Navy Dark Mode Foundation | `upgrade-phase-2` | Verified |
| **Phase 3** | Sticky Mega-Menu, 16-Section Homepage & 18 Truthful Public Routes | `upgrade-phase-3` | Verified |
| **Phase 4** | 5-Tool Deterministic Interactive Lab, Multi-Currency & Contact Handoff | `upgrade-phase-4` | Verified |
| **Phase 5** | Executive Admin Console (`⌘K`), Kanban CRM, CMS Preview & WCAG Studio | `upgrade-phase-5` | Verified |
| **Phase 6** | Zero-LCP Motion Choreography, GPU Scroll Bar & Core Web Vitals Polish | `upgrade-phase-6` | Verified |
| **Phase 7** | Dynamic `1200×630` OpenGraph, RSS 2.0 (`/feed.xml`), Schema & Consent v2 | `upgrade-phase-7` | Verified |
| **Phase 8** | CSP Hardening, Bounded Payloads, `Idempotency-Key` & Fault Isolation | `upgrade-phase-8` | Verified |
| **Phase 9** | Pre-Flight Readiness CLI (`npm run preflight`) & Master Handover | `upgrade-phase-9` | Verified |

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

Both scripts use `IF NOT EXISTS` guards and contain zero `DROP TABLE` or `TRUNCATE` statements.

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

- **Quick Jump Command Palette (`Ctrl+K` / `⌘K`):** Press `Ctrl+K` or `⌘K` anywhere inside `/admin` to jump to any permitted workspace module or open public routes.
- **Lead & Enquiry CRM (`/admin/leads`):** Switch between **Split List** and **6-Column Kanban Board**, advance stages with 1 click, schedule follow-up dates, copy prospect emails, launch pre-filled discovery replies, or export formula-safe CSVs.
- **Page Section Builder (`/admin/pages`):** Reorder or toggle visibility across the 16 homepage narrative blocks, save drafts safely, and publish live when ready.
- **CMS Content Studio (`/admin/cms`):** Write Blog Insights with live side-by-side Markdown preview & revision history, publish Services, FAQs, Team profiles, and Case Studies (`Concept Blueprint` / `Prototype` / `Client Case Study` honesty badges), and manage Verified Testimonials (which remain hidden publicly unless *Published*, *Authorized*, AND *Verified* are all checked).
- **Brand & Theme Studio (`/admin/brand`, `/admin/theme`):** Upload custom Light/Dark SVG logos, favicon, and OpenGraph social banners anytime without code edits; customize Light & Dark color tokens with live WCAG 2.1 AA/AAA contrast ratios and 1-click rollback.
- **SEO, Redirects & Consent Analytics (`/admin/seo`):** Preview Google SERP snippets, manage loop-protected `301`/`307` redirects, inspect `/sitemap.xml`, `/robots.txt`, and `/feed.xml`, and toggle Consent Mode v2 GA4 tracking.

---

## 7. Custom Domain, DNS & Final Go-Live Checklist

1. **Run Local Pre-Flight & Full Verification:**
   ```bash
   npm run verify
   ```
   *(Executes `preflight-check.mjs`, `tsc --noEmit`, `next lint`, `vitest run`, and `next build`).*
2. **Attach Custom Domain in Vercel:**
   - Add `yourdomain.com` + `www.yourdomain.com` in **Vercel -> Settings -> Domains**.
   - Configure root `A` (`@`) and `www` `CNAME` records at your DNS provider matching Vercel's live instructions.
3. **Authenticate Transactional Email in Resend (Optional):**
   - Add `DKIM` (`resend._domainkey`), `SPF`, and `_dmarc` `TXT` records in DNS, verify in Resend, and set `NOTIFICATION_FROM_EMAIL`.
4. **Verify Production Readiness Endpoints:**
   - `GET https://yourdomain.com/api/health` -> `status: "ok"`, `version: "1.0.0"`, `database.driver: "supabase_postgres"`, `storage.provider: "supabase_storage"`, `domain.https: true`.
   - Complete `/admin/setup` (using `ADMIN_SETUP_TOKEN`), verify `/sitemap.xml`, `/robots.txt`, `/feed.xml`, and `/opengraph-image`, and submit `https://yourdomain.com/sitemap.xml` to Google Search Console.
