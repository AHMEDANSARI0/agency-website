# OmniFlow — Deployment & Handover

This is a preliminary handover for the current incremental build, **not an approval to deploy**. Further security, production-readiness and verification patches are pending. Confirm your own hosting configuration and back up data before any migration or release. Never paste credentials into chat, source files or this document.

## Database and migrations

Production uses a separately configured PostgreSQL database. Before making any database changes, create and verify a backup, review the SQL files and the migration history of the actual target database, and follow the hosting provider's instructions. Migrations are under `supabase/migrations/`; currently documented source files include:

- `0001_omniflow_schema.sql`
- `0002_production_upgrade.sql`
- `0003_crm_and_operations.sql`
- `0004_security_and_performance.sql`

Do not blindly re-run the complete migration chain: some policy creation statements are not guarded against existing policies. This interim patch does not run migrations or connect to any database. If a later patch supplies additional migrations, follow its release-specific instructions; do not assume they have already been applied.

## Hosting and storage

Use the hosting provider's private environment configuration for the canonical HTTPS domain, database credentials, authentication secret and any storage or notification credentials. HTTPS must be working on the production host before applying HSTS. The provided security headers do not establish a working TLS certificate or complete the security hardening.

For persistent production uploads, configure the approved storage provider and verify its access rules, bucket name and public delivery before launch. `omniflow-media` is the default/example bucket name used by the existing project; confirm the actual configured name. Do not rely on ephemeral serverless local storage for important images. Review allowed upload formats and access controls as part of the pending security work.

## Administration and owner information

On a fresh installation, use `/admin/setup` only according to the application's setup and security instructions. Keep setup authorization and passwords private; never publish them. Existing administrators should sign in at `/admin/login`.

The incremental owner form is under **Admin → Settings & Pricing → Owner launch information**. Enter the real public contact email, starting price and founder photo; do not enter secrets. Uploading a photo requires Media Library permission and configured storage, and a published founder must exist in Content Studio. Changes are saved to the database used by that running application; local and production databases may differ. Review the rest of the published CMS content and placeholder warnings separately; the form alone does not establish launch readiness.

## Verification

Stop active development and build processes before applying patches. Run the checks from the project root:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. Review `npm run preflight` and its warnings separately.

A passing development or CI preflight does **not** establish that real owner details, infrastructure, permissions, security or deployment behavior are production-ready. Verify the real domain, storage, database and deployment separately after the remaining hardening patches. Keep the exact error output if a check fails.

## Rollback

Before applying a patch, preserve a copy of the project and its data. For code changes, use the patcher's backup and manifest to restore the affected files or roll back to a verified deployment through your hosting provider. Database and media data require their own tested backup and restore procedures. Do not assume a code rollback reverses database or CMS changes; never restore a database without reviewing its scope and current data.
