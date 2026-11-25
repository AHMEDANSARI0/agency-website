# OmniFlow — Deployment & Handover Guide

This guide covers database setup, media storage, initial administrator onboarding, daily content management, and safe rollback procedures for the **OmniFlow** platform.

> **Security Note:** Environment variable configuration is managed privately by the site owner in the hosting and database dashboards. Environment values and credentials are never stored or documented in this repository.

---

## 1. Supabase Database Migrations (`0001` – `0004`)

Before serving production traffic, execute the four non-destructive SQL migration files in **Supabase Dashboard → SQL Editor** in exact numerical order:

1. **`supabase/migrations/0001_omniflow_schema.sql`**
   - Creates the core relational tables (`users`, `audit_logs`, `kv_configs`, `services`, `case_studies`, `blog_posts`, `faqs`, `testimonials`, `team_members`, `pages`, `leads`, `media_assets`, `redirects`) and enables Row-Level Security (RLS).
2. **`supabase/migrations/0002_production_upgrade.sql`**
   - Adds instant session revocation (`session_version`), hashed password-recovery fields, distributed serverless rate limiting (`rate_limits`), `schema_migrations`, and SHA-256 `database_backups`.
3. **`supabase/migrations/0003_crm_and_operations.sql`**
   - Adds CRM pipeline columns (`priority`, `proposal_value`, `expected_closing_date`, `lost_reason`) and the persistent `lead_idempotency_keys` table so retried form submissions never create duplicate leads.
4. **`supabase/migrations/0004_security_and_performance.sql`**
   - Adds performance indexes for duplicate-email lookups, idempotency expiry cleanup, and slug queries.

All four migrations use `IF NOT EXISTS` guards and contain zero destructive `DROP` or `TRUNCATE` statements, making them safe to re-run during upgrades.

---

## 2. Supabase Storage Bucket Setup

Uploaded brand logos, OpenGraph banners, and CMS media assets are stored in Supabase Storage:

1. Open **Supabase Dashboard → Storage → New Bucket**.
2. Set the bucket name to **`omniflow-media`**.
3. Enable **Public Bucket** so published images and logos can be delivered publicly via CDN while uploads and deletions remain restricted to authenticated staff on the server.
4. Built-in upload safeguards automatically validate binary magic bytes (`.png`, `.jpg`, `.webp`, `.gif`, `.ico`, `.pdf`), sanitize uploaded SVGs against inline scripts, and prevent deleting assets still referenced by published content unless confirmed by a Super Admin.

---

## 3. Admin First-Time Setup (`/admin/setup`)

1. On a fresh database with zero administrator accounts, navigate to **`/admin/setup`**.
2. Enter the primary **Super Admin** name, business email address, strong unique password (`10+` characters including uppercase, lowercase, and numbers), and the one-time setup authorization token if prompted in production.
3. Submit the form to create the primary Super Admin account and sign in automatically.
4. **Permanent Lockout:** As soon as the first Super Admin exists, `/admin/setup` and its backing API return `404 Not Found` / locked status permanently. Additional staff accounts (`SUPER_ADMIN`, `EDITOR`, `AUTHOR`) can only be invited by an authenticated Super Admin under **`/admin/users`**.
5. **Health Endpoint Privacy:** Public requests to **`/api/health`** return only `{ "status": "ok" }` or `{ "status": "degraded" }`. Detailed subsystem diagnostics are visible only when signed into an active admin session.

---

## 4. Content Editing & Placeholder Replacement Guide

Default seed content uses explicit `{{PLACEHOLDER}}` markers wherever owner-supplied business details are required. While any placeholder remains unfilled, **`/admin`** displays a yellow Launch Checklist banner linking directly to each field.

### 4.1 Site Settings (`/admin/settings`)
- Replace `{{CONTACT_EMAIL}}` with your live business email address. Public pages (Contact, Footer, FAQ, Legal) automatically hide broken `mailto:` links until a valid email is saved.
- Update company positioning, tagline, support hours, booking link, WhatsApp contact, navigation items, footer links, and pricing tier copy.

### 4.2 Brand & Theme (`/admin/brand` and `/admin/theme`)
- **`/admin/brand`:** Upload custom Light/Dark logos, square symbol mark, favicon, or social OpenGraph image (or keep the built-in `/public` brand assets).
- **`/admin/theme`:** Switch between Light/Dark defaults or adjust palette tokens with automatic WCAG AA contrast checks.

### 4.3 Homepage Builder (`/admin/pages`) & CMS Studio (`/admin/cms`)
- **`/admin/pages`:** Edit section headlines, subtitles, CTAs, visibility, and section order on the homepage with Undo/Redo support.
- **`/admin/cms`:** Create, edit, and publish Services, Case Studies (with honest `Concept Blueprint`, `Prototype`, or `Client Case Study` badges), Blog articles, FAQs, Team profiles, and Verified Testimonials.
- **`/admin/leads`:** Manage incoming enquiries across list or Kanban pipeline stages, add follow-up dates and notes, or export/import CSV records.
- **`/admin/seo`:** Customize per-page SEO titles and descriptions, preview search snippets, manage `301`/`307` redirects, and configure consent-gated analytics.

---

## 5. Rollback & Recovery Procedures

### 5.1 Database & Content Snapshot Rollback (`/admin/account`)
1. Before major content or theme changes, sign in as `SUPER_ADMIN`, open **`/admin/account`**, and click **Create Snapshot** (or **Download JSON Backup**).
2. To revert content or settings, locate the desired snapshot in **`/admin/account`** and click **Restore Safely**.
3. The platform automatically records a pre-restore safety snapshot first and restores inside an atomic transaction without deleting active Super Admin accounts or newer customer enquiries.

### 5.2 Application Deployment Rollback
1. **Instant Hosting Rollback:** In your hosting dashboard (**Deployments**), select the previous known-good production deployment and promote/redeploy it immediately. Because SQL migrations `0001`–`0004` are additive and backward-compatible, rolling back application code requires no destructive database changes.
2. **Git Revert:** Locally run `git revert <commit-sha>`, verify with `npm run verify`, and push to trigger a clean forward deployment.
