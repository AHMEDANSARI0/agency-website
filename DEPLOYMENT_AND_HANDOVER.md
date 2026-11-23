# OmniFlow — Production Deployment, Security & Operations Handover Guide

**Platform:** OmniFlow (`Automate the work. Accelerate the business.`)  
**Founder:** Ahmed Ansari  
**Target Markets:** United States, United Kingdom, Canada  
**Architecture Status:** All 7 Phases Complete & Verified (`phase-1` through `phase-7`)

---

## 1. Zero-Cost / Free-Tier Production Stack

OmniFlow is engineered to run at **$0/month** on reputable free tiers while scaling cleanly as client volume grows:

| Layer | Recommended Free-Tier Service | Fallback / Local Mode |
| --- | --- | --- |
| **Web & API Hosting** | **Vercel Hobby** (Next.js 15 App Router, HTTPS, Global Edge CDN) | `npm run build && npm run start` on any Node 20+ host |
| **Relational Database** | **Supabase Free Tier PostgreSQL** (`500 MB` DB, RLS enabled) | Automatic atomic JSON store (`data/omniflow-db.json`) |
| **Media & Brand Storage** | **Supabase Storage** (`1 GB` free bucket `omniflow-media`) | Automatic local disk storage (`public/uploads/`) |
| **Lead Email Alerts** | **Resend Free Tier** (`3,000` emails/mo — optional) | Database-first CRM storage (zero lost enquiries even without email API) |
| **DNS & Edge WAF** | **Cloudflare Free DNS** | Standard registrar DNS |
| **Privacy Analytics** | **Google Analytics 4** (optional, consent-gated) | Disabled by default until Measurement ID is configured |

---

## 2. Step-by-Step Production Deployment (Supabase + Vercel)

### Step A — Provision Supabase PostgreSQL & Storage
1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** -> paste the entire contents of `supabase/migrations/0001_omniflow_schema.sql` -> click **Run**.
   - This creates all 13 tables (`kv_configs`, `users`, `services`, `case_studies`, `blog_posts`, `faqs`, `testimonials`, `team_members`, `pages`, `leads`, `media_assets`, `redirects`, `audit_logs`), indexes, and Row-Level Security (RLS) policies.
3. Open **Storage** -> create a **Public** bucket named `omniflow-media` (used for replaceable logos, favicons, OG images, blog covers, and PDFs).
4. Copy from **Project Settings -> Database & API**:
   - `DATABASE_URL` (Transaction Pooler URI, port `6543` or Session URI)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep server-only — never prefix with `NEXT_PUBLIC_`)

### Step B — Configure Environment Variables on Vercel
Import your Git repository into Vercel and set the following Environment Variables:

```env
# Canonical Public URL (used for sitemap.xml, robots.txt, OpenGraph, and JSON-LD)
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Cryptographic HMAC Session Secret (generate 32+ random bytes: openssl rand -hex 32)
SESSION_SECRET="replace_with_64_char_random_hex_secret"

# Initial Super Admin Bootstrap Account
ADMIN_BOOTSTRAP_NAME="Ahmed Ansari"
ADMIN_BOOTSTRAP_EMAIL="ahmed@yourdomain.com"
ADMIN_BOOTSTRAP_PASSWORD="Replace_With_Strong_Unique_Password_2026!"

# Production Database & Media Storage (Supabase Free Tier)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_STORAGE_BUCKET="omniflow-media"

# Strict Frame & HSTS Headers in Production
ENABLE_STRICT_FRAME_HEADERS="true"

# Optional Transactional Lead Notification Emails (Resend)
RESEND_API_KEY=""
LEAD_NOTIFICATION_EMAIL="ahmed@yourdomain.com"
```

### Step C — Deploy & Verify Health
1. Click **Deploy** in Vercel.
2. Verify `/api/health` returns `status: "ok"`, `phase: 7`, `databaseMode: "supabase_postgres"`, and `storageMode: "supabase_storage"`.
3. Verify `/sitemap.xml` and `/robots.txt` list your canonical domain.

---

## 3. Day-1 Founder Operations Checklist (`/admin`)

Sign in at **`/admin/login`** (public registration is permanently disabled):

1. **Replace Placeholder Brand Marks (`/admin/media` -> `/admin/brand`)**:
   - Upload your final SVG/PNG light logo, dark logo, compact symbol, favicon, and `1200x630` OpenGraph card in `/admin/media`.
   - Paste/assign the URLs in `/admin/brand` — Navbar, Footer, Admin Sidebar, and SEO metadata update site-wide without touching code.
2. **Customize or Switch Theme Presets (`/admin/theme`)**:
   - Default palette is **OmniFlow Warm Obsidian & Vermilion** (`#0B0908` / `#F2EADB` / `#D23A1F` dark-first with warm ivory `#F5EFE3` light mode).
   - Built-in contrast checker validates WCAG AA readability before publishing token edits, and every publish stores a 1-click rollback snapshot.
3. **Manage Services, Case Studies & Insights (`/admin/cms` & `/admin/pages`)**:
   - Reorder homepage sections or insert safe Markdown editorial blocks in `/admin/pages`.
   - Publish new articles, FAQs, services, and case studies in `/admin/cms`.
   - **Honesty Guardrail:** Keep illustrative workflows labeled as *Concept Demo* or *Internal Experiment* until written client permission is obtained (`verified_client` requires `clientPermissionGranted = true`). Testimonials remain automatically hidden on public pages until *Authorized + Verified + Published* are all checked.
4. **Track & Export Enquiries (`/admin/leads`)**:
   - Update pipeline stages (`New` -> `Contacted` -> `Qualified` -> `Proposal Sent` -> `Won` / `Lost`), log internal notes, set follow-up dates, and export formula-safe CSV backups.
5. **Configure SEO, 301 Redirects & Privacy-First GA4 (`/admin/seo`)**:
   - Audit every route's title/description/indexability, add 301/307 redirects when changing slugs, and optionally enable consent-gated GA4 (`G-XXXXXXXXXX`).

---

## 4. Applying & Rolling Back Phase Patchers Locally

All 7 standalone Node.js patchers are located in `patches/`:

```bash
node patches/phase-1-patcher.mjs
node patches/phase-2-patcher.mjs
node patches/phase-3-patcher.mjs
node patches/phase-4-patcher.mjs
node patches/phase-5-patcher.mjs
node patches/phase-6-patcher.mjs
node patches/phase-7-patcher.mjs
```

Every patcher verifies SHA-256 checksums after writing and supports instant rollback:

```bash
node patches/phase-7-patcher.mjs --rollback
```

Run the complete automated quality suite anytime with:

```bash
npm run verify
```
