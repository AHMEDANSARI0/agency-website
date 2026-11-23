# OmniFlow — AI Automation & Business Solutions Platform

**Positioning:** AI Automation & Business Solutions  
**Tagline:** Automate the work. Accelerate the business.  
**Founder:** Ahmed Ansari  
**Target Markets:** United States, United Kingdom, Canada

OmniFlow is a full-stack Next.js 15 agency website, interactive workflow demonstration suite, and role-based content/CRM administration platform engineered to run on **100% free-tier cloud infrastructure** (Vercel Hobby + Supabase PostgreSQL + Supabase Storage + Resend) with **zero dedicated VM or paid background servers required**.

---

## Architecture & Security Highlights

- **Strict Production Persistence (`src/lib/database/index.ts`, `src/lib/env.ts`):**
  - **Production (`NODE_ENV=production`):** Requires Supabase PostgreSQL (`DATABASE_URL`) and Supabase Storage (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). Silent fallback to temporary `/tmp` or local JSON files is strictly disabled so production writes can never be lost.
  - **Local Development & Automated Tests:** Supports zero-setup local JSON persistence (`data/omniflow-db.json`) and `public/uploads/` when `DATABASE_URL` is omitted.
- **Hardened Staff Authentication (`src/lib/auth/`, `src/lib/security/`):**
  - Zero default production passwords (`ChangeMe_*` and weak credentials are rejected).
  - Secure one-time Initial Super Admin Setup wizard (`/admin/setup`) protected by `ADMIN_SETUP_TOKEN` when the `users` table is empty.
  - Forced password replacement on first bootstrap login (`/admin/account`), SHA-256 single-use account recovery (`/admin/recover`), and instant server-side session revocation via `users.session_version`.
  - Granular RBAC across `SUPER_ADMIN`, `EDITOR`, and `AUTHOR` roles with self-demotion and last-Super-Admin lockout protection.
- **Persistent Media Library (`src/features/media/storage.ts`):**
  - Server-side binary magic-header verification + SVG XSS sanitization.
  - Separate configurable per-file upload limit (`MEDIA_MAX_FILE_BYTES`, default `4 MB`) and total storage quota (`MEDIA_TOTAL_QUOTA_BYTES`, default `500 MB`).
  - Live reference tracking across Brand, Pages, Services, Case Studies, Blog Posts, and Team profiles with `409 Conflict` deletion protection.
- **Accurate Health & Readiness Probes (`/api/health`):**
  - Separate liveness (`/api/health?probe=liveness`) and deep readiness (`/api/health`) checks verifying live PostgreSQL connectivity, schema migrations, storage bucket reachability, email configuration, and canonical HTTPS domain status without exposing secrets or internal paths.

---

## Local Development Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run static verification, integration tests, and production build:
   ```bash
   npm run verify
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```

---

## Database Migrations & Backups

SQL migrations live in `supabase/migrations/` and are idempotent (`IF NOT EXISTS` / non-destructive):

1. `supabase/migrations/0001_omniflow_schema.sql` — Core 13 tables and Row-Level Security (RLS) policies.
2. `supabase/migrations/0002_production_upgrade.sql` — Staff session revocation, forced first-login password rotation, hashed recovery tokens, serverless rate-limit buckets, migration tracking (`schema_migrations`), and transactional backup snapshots (`database_backups`).

Super Admins can create verified SHA-256 database snapshots, download sanitized JSON backups, and perform safe transactional restores (with automatic pre-restore safety snapshots) from **`/admin/account`**.

See **[`DEPLOYMENT_AND_HANDOVER.md`](./DEPLOYMENT_AND_HANDOVER.md)** for complete Supabase, Vercel, Resend, Custom Domain, and DNS configuration instructions.
