# OmniFlow — Production Deployment, Database Migration, Custom Domain & Operations Guide

**Platform:** OmniFlow — AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Founder:** Ahmed Ansari

---

## 1. Zero-VM Free-Tier Infrastructure Stack

OmniFlow runs completely on serverless/managed free tiers — **no Linux VM, VPS, or paid Redis instance is required** (you only purchase your custom domain name):

| Layer | Free-Tier Provider | Production Requirement | Local Dev Fallback |
| :--- | :--- | :--- | :--- |
| **Application & Edge CDN** | **Vercel Hobby** | Automatic HTTPS, Next.js 15 Serverless Functions | `npm run dev` (`localhost:3000`) |
| **Relational Database** | **Supabase PostgreSQL** (`500 MB` free) | **Mandatory** (`DATABASE_URL` via Pooler `:6543`) | `data/omniflow-db.json` (dev/test only) |
| **Persistent Media Storage** | **Supabase Storage** (`1 GB` free) | **Mandatory** (`omniflow-media` public bucket) | `public/uploads/` (dev/test only) |
| **Transactional Email** | **Resend Free Tier** (`3,000`/mo) | Optional (leads always save to PostgreSQL first) | Skipped cleanly when unset |
| **DNS & Domain Routing** | **Cloudflare Free DNS** or Registrar | Root `A` + `www` `CNAME` + `SPF/DKIM/DMARC` | `http://localhost:3000` |

> **Strict Production Guarantee:** In production (`NODE_ENV=production`), OmniFlow **never** silently writes leads, CMS updates, or media uploads into ephemeral `/tmp` or local JSON storage. Missing or broken database/storage credentials surface explicit `503` readiness states and appear immediately on `/api/health` and `/admin`.

---

## 2. Safe Database Backup & Migration Procedure

### 2.1 Before Modifying an Existing Database
If your Supabase project already contains live enquiries or content:
1. Sign in to `/admin/account` as `SUPER_ADMIN` and click **Download JSON Backup** (or **Create Snapshot**) to save a verified SHA-256 backup archive locally.
2. You can also export directly from Supabase Dashboard -> **Database -> Backups** or via `pg_dump`.

### 2.2 Applying SQL Migrations (Fresh or Existing Project)
Open **Supabase Dashboard -> SQL Editor** and run the migration files **in order**:
1. Paste and run **`supabase/migrations/0001_omniflow_schema.sql`**.
2. Paste and run **`supabase/migrations/0002_production_upgrade.sql`**.

Both scripts use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, preserving 100% of existing rows, users, and leads.

### 2.3 Selecting the Correct Supabase Connection String (`DATABASE_URL`)
1. In Supabase Dashboard, click **Connect** -> **Pooler**.
2. Copy the **Transaction Pooler** URI (port **`6543`**):
   ```text
   postgresql://postgres.[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. Avoid the Direct Connection URI (`db.[project-ref].supabase.co:5432`) on IPv4/Vercel serverless environments: Direct hostnames publish IPv6-only DNS records, whereas the `:6543` Transaction Pooler supports IPv4 and high-concurrency serverless invocations (`prepare: false` is preconfigured).

### 2.4 Restoring From a Snapshot
1. Navigate to **`/admin/account`** -> **Database Snapshots & Safe Transactional Restore**.
2. Click **Restore Safely** next to any verified snapshot.
3. OmniFlow automatically records a **Pre-Restore Safety Snapshot** first, verifies the SHA-256 checksum, and restores records inside a single PostgreSQL transaction without deleting active Super Admin accounts or newer enquiries.

---

## 3. Persistent Media Storage Setup (Supabase Storage)

1. In **Supabase Dashboard -> Storage**, click **New Bucket**:
   - **Name:** `omniflow-media`
   - **Public bucket:** Enabled (`ON` — allows public rendering of uploaded logos, favicons, OG cards, blog images, and PDF guides while uploads/deletions remain server-authenticated via `SUPABASE_SERVICE_ROLE_KEY`).
2. Copy from **Project Settings -> API**:
   - `NEXT_PUBLIC_SUPABASE_URL` (`https://[project-ref].supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` (**Server-only secret** — never expose in client code or `NEXT_PUBLIC_*`).
3. Quota & File Limits:
   - `MEDIA_MAX_FILE_BYTES` defaults to `4194304` (`4 MB` per file, aligned with Vercel Hobby's `4.5 MB` function body limit).
   - `MEDIA_TOTAL_QUOTA_BYTES` defaults to `524288000` (`500 MB` total tracked quota, adjustable up to `1 GB` on Supabase Storage Free Tier).

---

## 4. Production Environment Variables (Vercel)

In **Vercel Dashboard -> Project -> Settings -> Environment Variables**, configure:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical HTTPS URL (e.g., `https://omniflow.ai` — no trailing slash) |
| `AUTH_SECRET` | **Yes** | 32+ random character HMAC session secret (`openssl rand -hex 32`) |
| `SESSION_TTL_HOURS` | No | Session duration in hours (default `24`) |
| `DATABASE_URL` | **Yes** | Supabase Transaction Pooler PostgreSQL URI (`:6543`) |
| `ADMIN_SETUP_TOKEN` | Recommended | One-time secret token required to claim `/admin/setup` when `users` table is empty |
| `ADMIN_BOOTSTRAP_NAME` | Optional | Initial Super Admin display name (e.g., `Ahmed Ansari`) |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional | Optional env-bootstrapped Super Admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Optional | Must be unique & strong (`10+` chars, upper/lower/digit; default placeholders rejected) |
| `ADMIN_FORCE_FIRST_PASSWORD_CHANGE` | No | Forces password rotation on first bootstrap login (default `true`) |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project HTTPS URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only Supabase Service Role key for persistent Storage |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket name (default `omniflow-media`) |
| `MEDIA_MAX_FILE_BYTES` | No | Max single upload size in bytes (default `4194304` = `4 MB`) |
| `MEDIA_TOTAL_QUOTA_BYTES` | No | Total storage quota in bytes (default `524288000` = `500 MB`) |
| `RESEND_API_KEY` | Optional | Resend API key for new-lead and password-recovery emails |
| `NOTIFICATION_FROM_EMAIL` | Optional | Verified sender address (e.g., `OmniFlow <notifications@yourdomain.com>`) |
| `NOTIFICATION_TO_EMAIL` | Optional | Staff recipient email for new lead notifications |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional | Consent-gated GA4 Measurement ID (`G-XXXXXXXXXX`) |
| `ENABLE_STRICT_FRAME_HEADERS` | Recommended | Set `"true"` on custom HTTPS domain to enable `HSTS` & `X-Frame-Options: SAMEORIGIN` |

---

## 5. Initial Administrator Setup & Recovery

1. **Recommended One-Time Setup (`/admin/setup`):**
   - Deploy with `ADMIN_SETUP_TOKEN` set and `ADMIN_BOOTSTRAP_PASSWORD` left empty.
   - Visit `https://yourdomain.com/admin/setup`, enter your name, email, strong unique password, and `ADMIN_SETUP_TOKEN`.
   - Once created, `/admin/setup` permanently locks (`409 Conflict`).
2. **Environment Bootstrap Mode:**
   - If you supply `ADMIN_BOOTSTRAP_EMAIL` and a strong `ADMIN_BOOTSTRAP_PASSWORD`, signing in at `/admin/login` automatically requires you to set a new personal password at `/admin/account` before unlocking other admin modules.
3. **Session Revocation & Account Recovery:**
   - Rotate passwords or click **Revoke All Other Browser Sessions** anytime in `/admin/account`.
   - Super Admins can revoke sessions for any staff user in `/admin/users`.
   - Forgotten passwords can be reset via `/admin/recover` using 30-minute SHA-256 hashed single-use email tokens (requires `RESEND_API_KEY`).

---

## 6. Custom Domain, DNS & SSL Setup (Vercel + Registrar / Cloudflare)

### Step 1 — Add Domain in Vercel
1. Open **Vercel Dashboard -> Project -> Settings -> Domains**.
2. Enter your purchased domain (e.g., `yourdomain.com`) and allow Vercel to add `www.yourdomain.com` with a **308/301 redirect** to your chosen primary canonical hostname.
3. Copy the exact DNS target values shown in your Vercel Domains panel (always trust the live values Vercel displays for your project).

### Step 2 — Configure DNS Records at Your Registrar or Cloudflare
Configure DNS records matching your Vercel dashboard instructions:

- **Root / Apex Domain (`@`):**
  - **Type:** `A`
  - **Name:** `@`
  - **Value:** Use the exact IPv4 address displayed in your Vercel Domains dashboard (commonly `76.76.21.21` — verify in Vercel).
  - *(If using Cloudflare DNS: set Proxy status to **DNS Only / Grey Cloud** initially until Vercel finishes SSL issuance).*
- **`www` Subdomain:**
  - **Type:** `CNAME`
  - **Name:** `www`
  - **Target:** Use the exact CNAME target shown in Vercel (e.g., `cname.vercel-dns.com.` or your project-specific `.vercel-dns-017.com.`).
- **Ownership Verification (if domain was previously linked elsewhere):**
  - **Type:** `TXT`
  - **Name:** `_vercel`
  - **Value:** Provider-generated verification token from Vercel Dashboard.

### Step 3 — Transactional Email DNS Authentication (Resend)
When adding your custom domain in **Resend -> Domains**:
1. Add the **DKIM** `TXT` record (`resend._domainkey`) provided by Resend.
2. Add the **SPF** `TXT` and `MX` records on Resend's sending subdomain (typically `send.yourdomain.com`) exactly as shown in Resend.
3. Add a **DMARC** `TXT` record:
   - **Name:** `_dmarc`
   - **Value:** `v=DMARC1; p=none; rua=mailto:postmaster@yourdomain.com`
4. Click **Verify DNS Records** in Resend, then update `NOTIFICATION_FROM_EMAIL` in Vercel.

### Step 4 — Final Post-Launch Verification
1. Update `NEXT_PUBLIC_SITE_URL="https://yourdomain.com"` and `ENABLE_STRICT_FRAME_HEADERS="true"` in Vercel, then redeploy.
2. Open `https://yourdomain.com/api/health` and confirm:
   - `status: "ok"` (`HTTP 200`)
   - `database.connected: true`, `database.schemaReady: true`, `database.driver: "supabase_postgres"`
   - `storage.provider: "supabase_storage"`, `storage.healthy: true`
   - `domain.https: true`
3. Open `/robots.txt` and `/sitemap.xml` and submit `https://yourdomain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
