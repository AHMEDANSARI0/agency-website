import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import postgres from "postgres";
import type {
  AuditLogEntry,
  DatabaseBackupSummary,
  SafeUser,
  UserRecord,
} from "@/types/auth";
import type { BrandAssetConfig } from "@/types/brand";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  LeadDashboardMetrics,
  LeadPriority,
  LeadRecord,
  MediaAsset,
  PageDocument,
  RedirectRule,
  ServiceCategoryPillar,
  ServiceItem,
  SiteSettings,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import type { ThemeConfiguration } from "@/types/theme";
import { normalizeStoredThemeConfig } from "@/features/themes/presets";
import {
  DatabaseUnavailableError,
  isNextBuildPhase,
  isPlaceholderEnvValue,
  isProductionEnvironment,
  isServerlessRuntime,
  type DatabaseFailureCode,
} from "@/lib/env";
import { resolvePricingConfig } from "@/features/pricing/default-pricing";
import { normalizeLegacyContactEmail } from "@/lib/placeholders";
import {
  CURRENT_SEED_VERSION,
  DEFAULT_HOME_SECTIONS,
  buildBootstrapSuperAdmin,
  createInitialSeedSnapshot,
  type OmniFlowDatabaseSnapshot,
  type SiteErrorIncident,
  type StoredDatabaseBackup,
} from "./seed-data";

export type DatabaseDriverMode =
  | "supabase_postgres"
  | "local_file_fallback"
  | "unconfigured_production";

export interface DatabaseErrorEvent {
  timestamp: string;
  code: DatabaseFailureCode;
  message: string;
}

export interface DatabaseHealthVerification {
  driver: DatabaseDriverMode;
  connected: boolean;
  schemaReady: boolean;
  appliedMigrations: string[];
  missingTables: string[];
  missingColumns: string[];
  missingMigrations?: string[];
  latencyMs: number;
  backupCount: number;
  lastBackupAt: string | null;
  recentErrorCount: number;
  errorCode?: DatabaseFailureCode;
  message: string;
}

const REQUIRED_POSTGRES_TABLES = [
  "users",
  "audit_logs",
  "kv_configs",
  "pages",
  "services",
  "case_studies",
  "blog_posts",
  "faqs",
  "testimonials",
  "team_members",
  "media_assets",
  "leads",
  "lead_idempotency_keys",
  "redirects",
  "schema_migrations",
  "rate_limits",
  "database_backups",
] as const;

const REQUIRED_MIGRATIONS = [
  "0001_omniflow_schema", "0002_production_upgrade", "0003_crm_and_operations",
  "0004_security_and_performance", "0005_rate_limit_fixed_window",
] as const;
const REQUIRED_RATE_LIMIT_COLUMNS = ["bucket_key", "count", "window_start", "expires_at"] as const;

const REQUIRED_USER_COLUMNS = [
  "must_change_password",
  "session_version",
  "password_changed_at",
  "recovery_token_hash",
  "recovery_expires_at",
] as const;

function getLocalDbFilePath(): string {
  if (process.env.OMNIFLOW_LOCAL_DB_PATH) {
    return path.resolve(process.env.OMNIFLOW_LOCAL_DB_PATH);
  }
  if (isServerlessRuntime()) {
    return path.join(os.tmpdir(), "omniflow-data", "omniflow-db.json");
  }
  return path.join(process.cwd(), "data", "omniflow-db.json");
}

let inMemoryFallbackSnapshot: OmniFlowDatabaseSnapshot | null = null;
let inMemorySnapshotPath = "";
let inMemorySnapshotMtimeMs = -1;
let inMemorySnapshotSize = -1;
let cachedSqlClient: ReturnType<typeof postgres> | null = null;
let cachedSqlUrl = "";
let postgresFallbackUntil = 0;
let loggedFallbackNoticeForUrl = "";
let postgresBootstrapChecked = false;
let postgresBaselineSeeded = false;
const inFlightReads = new Map<string, Promise<unknown>>();
const recentDbErrors: DatabaseErrorEvent[] = [];

function recordSanitizedDbError(code: DatabaseFailureCode, message: string): void {
  recentDbErrors.unshift({
    timestamp: new Date().toISOString(),
    code,
    message,
  });
  if (recentDbErrors.length > 25) {
    recentDbErrors.length = 25;
  }
}

function dedupeInFlight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlightReads.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = factory().finally(() => {
    inFlightReads.delete(key);
  });
  inFlightReads.set(key, pending);
  return pending;
}

function isPlaceholderDatabaseUrl(url: string): boolean {
  return isPlaceholderEnvValue(url) || !/^postgres(ql)?:\/\//i.test(url.trim());
}

const ORM_PSEUDO_QUERY_PARAMS = [
  "pgbouncer",
  "connection_limit",
  "pool_timeout",
  "schema",
  "supa",
  "uselibpqcompat",
] as const;

function stripUnsupportedPostgresQueryParams(rawUrl: string): string {
  const qIndex = rawUrl.indexOf("?");
  if (qIndex === -1) return rawUrl;

  const base = rawUrl.slice(0, qIndex);
  const hashIndex = rawUrl.indexOf("#", qIndex);
  const rawQuery =
    hashIndex === -1
      ? rawUrl.slice(qIndex + 1)
      : rawUrl.slice(qIndex + 1, hashIndex);
  const hashSuffix = hashIndex === -1 ? "" : rawUrl.slice(hashIndex);

  const params = new URLSearchParams(rawQuery);
  let modified = false;
  for (const key of ORM_PSEUDO_QUERY_PARAMS) {
    if (params.has(key)) {
      params.delete(key);
      modified = true;
    }
  }
  if (!modified) return rawUrl;

  const nextQuery = params.toString();
  return nextQuery ? `${base}?${nextQuery}${hashSuffix}` : `${base}${hashSuffix}`;
}

/**
 * On Vercel Serverless, Supabase Session Pooler (:5432, ~15 client cap) saturates under concurrent
 * Lambda invocations (EMAXCONNSESSION). Upgrading to Transaction Pooler (:6543, 200+ clients)
 * works seamlessly with prepare: false. Also strips Prisma/ORM-only query flags (?pgbouncer=true)
 * which otherwise cause postgres.js to send unrecognized GUC startup parameters to PostgreSQL.
 */
export function normalizeDatabaseUrlForRuntime(
  rawUrl: string,
  options?: { serverless?: boolean }
): string {
  let cleaned = stripUnsupportedPostgresQueryParams(rawUrl.trim());
  const serverless = options?.serverless ?? isServerlessRuntime();
  if (
    serverless &&
    process.env.OMNIFLOW_FORCE_SESSION_POOLER !== "true" &&
    /\.pooler\.supabase\.com(?::5432\b|(?=\/|$|\?))/i.test(cleaned)
  ) {
    cleaned = cleaned.replace(
      /(\.pooler\.supabase\.com)(?::5432\b|(?=\/|$|\?))/i,
      "$1:6543"
    );
  }
  return cleaned;
}

interface CachedPostgresKvBundle {
  siteSettings?: SiteSettings;
  themeConfig?: ThemeConfiguration;
  themeConfigUpgraded?: boolean;
  brandAssets?: BrandAssetConfig;
  servicePillars?: ServiceCategoryPillar[];
  expiresAt: number;
}

interface CachedPostgresPublicCatalog {
  services: ServiceItem[];
  caseStudies: CaseStudyItem[];
  blogPosts: BlogPost[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  teamMembers: TeamMember[];
  pages: PageDocument[];
  activeRedirects: RedirectRule[];
  expiresAt: number;
}

let cachedPgKvBundle: CachedPostgresKvBundle | null = null;
let cachedPgPublicCatalog: CachedPostgresPublicCatalog | null = null;

function safeRevalidateNextCache(tags: string[], paths: string[]): void {
  if (Boolean(process.env.VITEST) || process.env.NODE_ENV === "test") {
    return;
  }
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // Safe outside Next.js request context
    }
  }
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Safe outside Next.js request context
    }
  }
}

function invalidatePgKvBundle(): void {
  cachedPgKvBundle = null;
  safeRevalidateNextCache(
    ["settings", "theme", "brand", "services"],
    ["/", "/pricing", "/contact", "/faq", "/services"]
  );
}

function invalidatePgPublicCatalog(): void {
  cachedPgPublicCatalog = null;
  safeRevalidateNextCache(
    [
      "pages",
      "services",
      "caseStudies",
      "blog",
      "faqs",
      "team",
      "testimonials",
      "redirects",
    ],
    [
      "/",
      "/services",
      "/case-studies",
      "/work",
      "/blog",
      "/faq",
      "/team",
      "/sitemap.xml",
      "/feed.xml",
    ]
  );
}

/**
 * Supabase Supavisor Transaction Pooler (:6543) deadlocks when postgres.js
 * pipelines multiple extended-protocol queries onto an already-busy socket
 * (`busy.shift()` in postgres.js triggers whenever concurrent queries > `max`).
 * Pairing `MAX_CONCURRENT_PG_OPS = 3` with `max >= 6` guarantees idle sockets
 * (`open.length + closed.length >= 3`) are always available so query pipelining
 * onto a busy Supavisor socket never occurs.
 */
const MAX_CONCURRENT_PG_OPS = 3;
const pgSlotStorage = new AsyncLocalStorage<boolean>();
let activePgOps = 0;
const pgSlotWaiters: Array<() => void> = [];

export async function withPgConcurrencySlot<T>(
  fn: () => Promise<T>
): Promise<T> {
  if (pgSlotStorage.getStore()) {
    return fn();
  }

  while (activePgOps >= MAX_CONCURRENT_PG_OPS) {
    await new Promise<void>((resolve) => {
      pgSlotWaiters.push(resolve);
    });
  }

  activePgOps += 1;
  try {
    return await pgSlotStorage.run(true, fn);
  } finally {
    activePgOps = Math.max(0, activePgOps - 1);
    const next = pgSlotWaiters.shift();
    if (next) next();
  }
}

function resetCachedSqlClient(): void {
  invalidatePgKvBundle();
  invalidatePgPublicCatalog();
  if (cachedSqlClient) {
    const stale = cachedSqlClient;
    cachedSqlClient = null;
    stale.end({ timeout: 0 }).catch(() => undefined);
  }
}

function getPostgresClient(): ReturnType<typeof postgres> | null {
  // Never open live external Postgres sockets during `next build` compilation
  if (isNextBuildPhase()) return null;

  const rawUrl = process.env.DATABASE_URL?.trim() || "";
  if (isPlaceholderDatabaseUrl(rawUrl)) return null;
  const url = normalizeDatabaseUrlForRuntime(rawUrl);

  // Only suppress retries in non-production dev mode; production always surfaces accurate status
  if (
    !isProductionEnvironment() &&
    Date.now() < postgresFallbackUntil &&
    cachedSqlUrl === url
  ) {
    return null;
  }

  if (!cachedSqlClient || cachedSqlUrl !== url) {
    resetCachedSqlClient();
    cachedSqlUrl = url;
    postgresBootstrapChecked = false;
    postgresBaselineSeeded = false;
    const isSupabaseHost =
      url.includes(".supabase.co") || url.includes(".supabase.com");
    const serverless = isServerlessRuntime();
    const strictProd = isProductionEnvironment();

    cachedSqlClient = postgres(url, {
      // 6 pooled sockets paired with MAX_CONCURRENT_PG_OPS = 3 ensures postgres.js
      // always picks an `open` or `closed` socket and NEVER pipelines onto `busy`.
      max: serverless ? 6 : 8,
      fetch_types: false, // Skip cold pg_catalog.pg_type OID query on serverless connect
      idle_timeout: serverless ? 10 : 15,
      max_lifetime: 60 * 5,
      connect_timeout: strictProd ? 12 : 5,
      prepare: false, // Required for Supabase PgBouncer/Supavisor Transaction Pooler (:6543)
      // Parse DATE (1082) and TIMESTAMP/TIMESTAMPTZ (1114, 1184) directly into ISO-8601 strings
      // instead of JS Date objects so all Admin & RSC string helpers (.replace/.slice/.startsWith) work seamlessly.
      types: {
        isoTimestamp: {
          to: 1184,
          from: [1114, 1184],
          serialize: (x: unknown) =>
            x instanceof Date ? x.toISOString() : String(x),
          parse: (x: string) => {
            const d = new Date(x);
            return Number.isNaN(d.getTime()) ? String(x) : d.toISOString();
          },
        },
        isoDate: {
          to: 1082,
          from: [1082],
          serialize: (x: unknown) =>
            x instanceof Date ? x.toISOString().slice(0, 10) : String(x),
          parse: (x: string) => String(x).slice(0, 10),
        },
      },
      ...(isSupabaseHost ? { ssl: "require" } : {}),
    });
  }
  return cachedSqlClient;
}

export function normalizePgIsoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function normalizePgNullableIsoTimestamp(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  return String(value);
}

export function isDirectIpv6SupabaseHost(url: string): boolean {
  return /@db\.[a-z0-9-]+\.supabase\.co(?::\d+)?(?:\/|$)/i.test(url.trim());
}

function classifyDatabaseError(err: unknown): DatabaseUnavailableError {
  if (err instanceof DatabaseUnavailableError) return err;

  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code || "")
      : "";
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message || "")
      : "Database error";

  if (code === "28P01" || code === "28000" || /password authentication failed|Tenant or user not found/i.test(message)) {
    return new DatabaseUnavailableError(
      "DB_AUTH_FAILED",
      "Database authentication failed. Verify DATABASE_URL username (postgres.<project-ref> on Pooler) and URL-encoded password in Vercel."
    );
  }

  if (code === "42P01" || code === "42703" || code === "3D000") {
    return new DatabaseUnavailableError(
      "DB_SCHEMA_MISSING",
      "Database schema is missing required tables or columns. Run migrations 0001 through 0004 in Supabase SQL Editor."
    );
  }

  if (code === "EMAXCONNSESSION" || code === "53300" || /max clients reached|too many connections/i.test(message)) {
    return new DatabaseUnavailableError(
      "DB_POOL_SATURATED",
      "Database connection pool limit reached. Configure Supabase Transaction Pooler (:6543) for serverless traffic."
    );
  }

  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH" ||
    code === "CONNECT_TIMEOUT" ||
    code === "CONNECTION_CLOSED" ||
    code === "CONNECTION_DESTROYED" ||
    code === "CONNECTION_ENDED" ||
    code === "42704" ||
    code.startsWith("08") ||
    /getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|CONNECT_TIMEOUT|CONNECTION_ENDED|ENETUNREACH/i.test(message)
  ) {
    const activeUrl = cachedSqlUrl || process.env.DATABASE_URL?.trim() || "";
    if (isServerlessRuntime() && isDirectIpv6SupabaseHost(activeUrl)) {
      return new DatabaseUnavailableError(
        "DB_CONNECTION_FAILED",
        "Supabase Direct Connection host (db.<project-ref>.supabase.co) is IPv6-only and unreachable from Vercel IPv4 Serverless. Switch DATABASE_URL in Vercel to Supabase Transaction Pooler (aws-0-<region>.pooler.supabase.com:6543)."
      );
    }

    return new DatabaseUnavailableError(
      "DB_CONNECTION_FAILED",
      "Database service is currently unreachable. Verify Supabase project is active (not paused) and DATABASE_URL uses Supabase Transaction Pooler (:6543)."
    );
  }

  return new DatabaseUnavailableError(
    "DB_QUERY_FAILED",
    "A database operation failed unexpectedly."
  );
}

function isConnectivityOrSchemaError(err: unknown): boolean {
  const classified = classifyDatabaseError(err);
  return classified.code !== "DB_QUERY_FAILED";
}

function tripDevCircuitBreaker(err: unknown): void {
  const url = cachedSqlUrl || process.env.DATABASE_URL?.trim() || "";
  postgresFallbackUntil = Date.now() + 60_000;

  if (cachedSqlClient) {
    const staleClient = cachedSqlClient;
    cachedSqlClient = null;
    staleClient.end({ timeout: 0 }).catch(() => undefined);
  }

  if (loggedFallbackNoticeForUrl !== url) {
    loggedFallbackNoticeForUrl = url;
    const classified = classifyDatabaseError(err);
    console.warn(
      `[OmniFlow Dev DB] PostgreSQL unavailable (${classified.code}) — switched to local development JSON store (data/omniflow-db.json).`
    );
  }
}

function withHardDbTimeout<T>(promise: Promise<T>, timeoutMs = 6_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutErr = Object.assign(
        new Error(`PostgreSQL connection timed out after ${timeoutMs}ms`),
        { code: "CONNECT_TIMEOUT" }
      );
      reject(timeoutErr);
    }, timeoutMs);
    if (typeof timer.unref === "function") {
      timer.unref();
    }

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Seeds baseline CMS records into an empty PostgreSQL database once via an atomic transaction.
 * Deduplicated in-flight so concurrent SSR layout/metadata/page queries never race multiple seed
 * transactions simultaneously. Uses ON CONFLICT DO NOTHING so existing production content, users,
 * and leads are NEVER overwritten.
 */
async function ensurePostgresBaselineSeed(
  sql: ReturnType<typeof postgres>
): Promise<void> {
  if (postgresBaselineSeeded) return;

  await dedupeInFlight("postgres_baseline_seed", async () => {
    if (postgresBaselineSeeded) return;

    const existingKv = await sql<{ cnt: number }[]>`
      SELECT count(*)::int AS cnt
      FROM kv_configs
      WHERE key IN ('site_settings', 'theme_config', 'brand_assets', 'service_pillars')
    `;
    if ((existingKv[0]?.cnt ?? 0) >= 4) {
      postgresBaselineSeeded = true;
      return;
    }

    const initial = createInitialSeedSnapshot();
    const themeSeed = initial.themeConfig;

    // Single-round-trip atomic CTE seed across all 7 baseline tables (~280ms cross-region
    // instead of 28 sequential INSERT round-trips that previously timed out at 6,000ms).
    await sql`
      WITH ins_kv AS (
        INSERT INTO kv_configs (key, payload, updated_at)
        VALUES
          ('site_settings', ${sql.json(initial.siteSettings as unknown as postgres.JSONValue)}, NOW()),
          ('theme_config', ${sql.json(themeSeed as unknown as postgres.JSONValue)}, NOW()),
          ('brand_assets', ${sql.json(initial.brandAssets as unknown as postgres.JSONValue)}, NOW()),
          ('service_pillars', ${sql.json(initial.servicePillars as unknown as postgres.JSONValue)}, NOW())
        ON CONFLICT (key) DO NOTHING
      ),
      ins_pages AS (
        INSERT INTO pages (id, slug, title, status, payload, updated_at)
        SELECT
          elem->>'id',
          elem->>'slug',
          elem->>'title',
          elem->>'status',
          elem,
          COALESCE((elem->>'updatedAt')::timestamptz, NOW())
        FROM jsonb_array_elements(${sql.json(initial.pages as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      ),
      ins_services AS (
        INSERT INTO services (id, slug, title, category_slug, is_flagship_priority, status, sort_order, payload, updated_at)
        SELECT
          elem->>'id',
          elem->>'slug',
          elem->>'title',
          elem->>'categorySlug',
          COALESCE((elem->>'isFlagshipPriority')::boolean, false),
          elem->>'status',
          COALESCE((elem->>'order')::int, 0),
          elem,
          COALESCE((elem->>'updatedAt')::timestamptz, NOW())
        FROM jsonb_array_elements(${sql.json(initial.services as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      ),
      ins_cases AS (
        INSERT INTO case_studies (id, slug, title, work_type, status, payload, updated_at)
        SELECT
          elem->>'id',
          elem->>'slug',
          elem->>'title',
          elem->>'workType',
          elem->>'status',
          elem,
          COALESCE((elem->>'updatedAt')::timestamptz, NOW())
        FROM jsonb_array_elements(${sql.json(initial.caseStudies as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      ),
      ins_posts AS (
        INSERT INTO blog_posts (id, slug, title, category, author_id, status, published_at, payload, updated_at)
        SELECT
          elem->>'id',
          elem->>'slug',
          elem->>'title',
          elem->>'category',
          elem->>'authorId',
          elem->>'status',
          NULLIF(elem->>'publishedAt', '')::timestamptz,
          elem,
          COALESCE((elem->>'updatedAt')::timestamptz, NOW())
        FROM jsonb_array_elements(${sql.json(initial.blogPosts as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      ),
      ins_faqs AS (
        INSERT INTO faqs (id, category, sort_order, is_published, question, answer)
        SELECT
          elem->>'id',
          elem->>'category',
          COALESCE((elem->>'order')::int, 0),
          COALESCE((elem->>'isPublished')::boolean, true),
          elem->>'question',
          elem->>'answer'
        FROM jsonb_array_elements(${sql.json(initial.faqs as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      ),
      ins_team AS (
        INSERT INTO team_members (id, is_founder, sort_order, is_published, payload)
        SELECT
          elem->>'id',
          COALESCE((elem->>'isFounder')::boolean, false),
          COALESCE((elem->>'order')::int, 0),
          COALESCE((elem->>'isPublished')::boolean, true),
          elem
        FROM jsonb_array_elements(${sql.json(initial.teamMembers as unknown as postgres.JSONValue)}) AS elem
        ON CONFLICT DO NOTHING
      )
      SELECT 1
    `;

    postgresBaselineSeeded = true;
  });
}

async function runWithDbFallback<T>(
  pgOp: (sql: ReturnType<typeof postgres>) => Promise<T | undefined>,
  localOp: () => T | Promise<T>
): Promise<T> {
  const strictProd = isProductionEnvironment();
  const rawUrl = process.env.DATABASE_URL?.trim() || "";

  if (strictProd && isPlaceholderDatabaseUrl(rawUrl)) {
    const err = new DatabaseUnavailableError(
      "DB_MISSING_URL",
      "DATABASE_URL is missing or invalid. Production requires a configured PostgreSQL database."
    );
    recordSanitizedDbError(err.code, err.publicMessage);
    throw err;
  }

  const initialSql = getPostgresClient();
  if (initialSql) {
    try {
      const slotOutcome = await withPgConcurrencySlot(async () => {
        const activeSql = getPostgresClient();
        if (!activeSql) {
          return { skippedToLocal: true as const, value: undefined as T | undefined };
        }
        const value = await withHardDbTimeout(
          (async () => {
            await ensurePostgresBaselineSeed(activeSql);
            return pgOp(activeSql);
          })(),
          strictProd ? 12_000 : 6_000
        );
        return { skippedToLocal: false as const, value };
      });
      if (slotOutcome.skippedToLocal) {
        if (strictProd) {
          const err = new DatabaseUnavailableError(
            "DB_CONNECTION_FAILED",
            "PostgreSQL client could not be initialized in production."
          );
          recordSanitizedDbError(err.code, err.publicMessage);
          throw err;
        }
        return await localOp();
      }
      if (slotOutcome.value !== undefined) {
        return slotOutcome.value;
      }
      if (strictProd) {
        const emptyErr = new DatabaseUnavailableError(
          "DB_SCHEMA_MISSING",
          "Required configuration record was not found in PostgreSQL."
        );
        recordSanitizedDbError(emptyErr.code, emptyErr.publicMessage);
        throw emptyErr;
      }
    } catch (err) {
      const classified = classifyDatabaseError(err);
      recordSanitizedDbError(classified.code, classified.publicMessage);

      // Production NEVER silently falls back to local JSON or /tmp storage,
      // but recycles broken socket pools so warm Lambdas recover immediately.
      if (strictProd) {
        if (classified.code === "DB_CONNECTION_FAILED") {
          resetCachedSqlClient();
        }
        if (err instanceof DatabaseUnavailableError) throw err;
        if (isConnectivityOrSchemaError(err)) throw classified;
        throw err;
      }

      if (isConnectivityOrSchemaError(err)) {
        tripDevCircuitBreaker(err);
      } else {
        throw err;
      }
    }
  } else if (strictProd) {
    const err = new DatabaseUnavailableError(
      "DB_CONNECTION_FAILED",
      "PostgreSQL client could not be initialized in production."
    );
    recordSanitizedDbError(err.code, err.publicMessage);
    throw err;
  }

  return await localOp();
}

async function ensurePostgresBootstrapAdmin(
  sql: ReturnType<typeof postgres>
): Promise<void> {
  if (postgresBootstrapChecked) return;
  const countRows = await sql<{ cnt: number }[]>`
    SELECT count(*)::int AS cnt FROM users
  `;
  if ((countRows[0]?.cnt ?? 0) === 0) {
    const seedAdmin = buildBootstrapSuperAdmin();
    if (seedAdmin) {
      await sql`
        INSERT INTO users (
          id, email, name, role, password_hash, is_active,
          must_change_password, session_version, password_changed_at,
          created_at, updated_at, last_login_at
        )
        VALUES (
          ${seedAdmin.id},
          ${seedAdmin.email},
          ${seedAdmin.name},
          ${seedAdmin.role},
          ${seedAdmin.passwordHash},
          ${seedAdmin.isActive},
          ${Boolean(seedAdmin.mustChangePassword)},
          ${seedAdmin.sessionVersion ?? 1},
          ${seedAdmin.passwordChangedAt ?? null},
          ${seedAdmin.createdAt},
          ${seedAdmin.updatedAt},
          ${seedAdmin.lastLoginAt ?? null}
        )
        ON CONFLICT (email) DO NOTHING
      `;
    }
  }
  postgresBootstrapChecked = true;
}

export function getActiveDatabaseMode(): DatabaseDriverMode {
  if (isNextBuildPhase()) return "local_file_fallback";
  const rawUrl = process.env.DATABASE_URL?.trim() || "";
  if (isPlaceholderDatabaseUrl(rawUrl)) {
    return isProductionEnvironment()
      ? "unconfigured_production"
      : "local_file_fallback";
  }
  const url = normalizeDatabaseUrlForRuntime(rawUrl);
  if (
    !isProductionEnvironment() &&
    Date.now() < postgresFallbackUntil &&
    cachedSqlUrl === url
  ) {
    return "local_file_fallback";
  }
  return "supabase_postgres";
}

function mergeByKey<T>(
  existing: T[],
  fresh: T[],
  getKey: (item: T) => string
): T[] {
  const seen = new Set(existing.map(getKey));
  const merged = [...existing];
  for (const item of fresh) {
    if (!seen.has(getKey(item))) {
      merged.push(item);
      seen.add(getKey(item));
    }
  }
  return merged;
}

const LEGACY_PRIMARY_CTA_LABELS = new Set([
  "Request an Automation Audit",
  "Request Workflow Review",
  "Book Discovery Call",
  "Book a Free Discovery Call",
]);

const LEGACY_SECONDARY_CTA_LABELS = new Set([
  "Try Interactive Demos",
  "Explore Interactive Demos",
  "Explore Live Demos",
]);

function normalizeLegacySiteSettings(raw: SiteSettings): SiteSettings {
  const isLegacyPrimary = LEGACY_PRIMARY_CTA_LABELS.has(
    (raw.primaryCtaLabel || "").trim()
  );
  const isLegacySecondary = LEGACY_SECONDARY_CTA_LABELS.has(
    (raw.secondaryCtaLabel || "").trim()
  );
  const isLegacyTagline =
    raw.tagline ===
    "Eliminate repetitive work. Respond faster. Scale connected operations.";

  return {
    ...raw,
    tagline: isLegacyTagline
      ? "Automate the work. Accelerate the business."
      : raw.tagline,
    contactEmail: normalizeLegacyContactEmail(raw.contactEmail),
    primaryCtaLabel: isLegacyPrimary
      ? "Book a free workflow review"
      : raw.primaryCtaLabel,
    primaryCtaHref:
      isLegacyPrimary && raw.primaryCtaHref === "/contact"
        ? "/contact?intent=call"
        : raw.primaryCtaHref,
    secondaryCtaLabel: isLegacySecondary
      ? "See live demo"
      : raw.secondaryCtaLabel,
    pricingConfig: resolvePricingConfig(raw),
  };
}

function normalizeLegacyHomePage(page: PageDocument): PageDocument {
  if (page.slug !== "home") return page;
  if (page.updatedBy) return page;
  const currentSections = page.sections || [];
  const isUntouchedLegacyLayout =
    currentSections.length === 0 ||
    currentSections.length >= 9;

  if (!isUntouchedLegacyLayout) return page;

  return {
    ...page,
    sections: structuredClone(DEFAULT_HOME_SECTIONS),
    draftSections: structuredClone(DEFAULT_HOME_SECTIONS),
  };
}

function upgradeSnapshotIfNeeded(
  snap: OmniFlowDatabaseSnapshot
): OmniFlowDatabaseSnapshot {
  if (snap.schemaVersion && snap.schemaVersion >= CURRENT_SEED_VERSION) {
    return snap;
  }
  const fresh = createInitialSeedSnapshot();
  const hadLegacyNav = snap.siteSettings?.navigation?.some(
    (n) => n.href.startsWith("/#") || n.href === "/work"
  );
  const missingPricingNav = !snap.siteSettings?.navigation?.some(
    (n) => n.href === "/pricing"
  );

  const baseSettings: SiteSettings =
    hadLegacyNav || missingPricingNav
      ? {
          ...snap.siteSettings,
          bookingUrl: fresh.siteSettings.bookingUrl,
          primaryCtaLabel: fresh.siteSettings.primaryCtaLabel,
          primaryCtaHref: fresh.siteSettings.primaryCtaHref,
          secondaryCtaLabel: fresh.siteSettings.secondaryCtaLabel,
          secondaryCtaHref: fresh.siteSettings.secondaryCtaHref,
          navigation: fresh.siteSettings.navigation,
          footerLinks: fresh.siteSettings.footerLinks,
        }
      : snap.siteSettings;

  const nextSettings = normalizeLegacySiteSettings(baseSettings);
  const normalizedTheme = normalizeStoredThemeConfig(snap.themeConfig);

  const upgraded: OmniFlowDatabaseSnapshot = {
    ...snap,
    schemaVersion: CURRENT_SEED_VERSION,
    siteSettings: nextSettings,
    themeConfig: normalizedTheme.upgraded
      ? fresh.themeConfig
      : normalizedTheme.config,
    servicePillars: mergeByKey(
      snap.servicePillars || [],
      fresh.servicePillars,
      (p) => p.slug
    ),
    services: mergeByKey(snap.services || [], fresh.services, (s) => s.slug),
    caseStudies: mergeByKey(
      snap.caseStudies || [],
      fresh.caseStudies,
      (c) => c.slug
    ),
    blogPosts: mergeByKey(
      snap.blogPosts || [],
      fresh.blogPosts,
      (b) => b.slug
    ),
    faqs: mergeByKey(snap.faqs || [], fresh.faqs, (f) => f.id),
    pages: mergeByKey(snap.pages || [], fresh.pages, (p) => p.slug).map(
      normalizeLegacyHomePage
    ),
  };

  writeLocalSnapshot(upgraded);
  return upgraded;
}

function readLocalSnapshot(): OmniFlowDatabaseSnapshot {
  const filePath = getLocalDbFilePath();
  if (!fs.existsSync(filePath)) {
    if (
      inMemoryFallbackSnapshot &&
      inMemorySnapshotPath === filePath &&
      inMemorySnapshotMtimeMs === -2
    ) {
      return inMemoryFallbackSnapshot;
    }
    const initial = createInitialSeedSnapshot();
    writeLocalSnapshot(initial);
    return initial;
  }
  try {
    const stat = fs.statSync(filePath);
    if (
      inMemoryFallbackSnapshot &&
      inMemorySnapshotPath === filePath &&
      inMemorySnapshotMtimeMs === stat.mtimeMs &&
      inMemorySnapshotSize === stat.size
    ) {
      return inMemoryFallbackSnapshot;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as OmniFlowDatabaseSnapshot;
    const ready = upgradeSnapshotIfNeeded(parsed);
    const afterStat = fs.statSync(filePath);
    inMemoryFallbackSnapshot = ready;
    inMemorySnapshotPath = filePath;
    inMemorySnapshotMtimeMs = afterStat.mtimeMs;
    inMemorySnapshotSize = afterStat.size;
    return ready;
  } catch {
    if (inMemoryFallbackSnapshot && inMemorySnapshotPath === filePath) {
      return inMemoryFallbackSnapshot;
    }
    const fallback = createInitialSeedSnapshot();
    writeLocalSnapshot(fallback);
    return fallback;
  }
}

function writeLocalSnapshot(snapshot: OmniFlowDatabaseSnapshot): void {
  const filePath = getLocalDbFilePath();
  inMemoryFallbackSnapshot = snapshot;
  inMemorySnapshotPath = filePath;
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
    const stat = fs.statSync(filePath);
    inMemorySnapshotMtimeMs = stat.mtimeMs;
    inMemorySnapshotSize = stat.size;
  } catch {
    inMemorySnapshotMtimeMs = -2;
    inMemorySnapshotSize = -1;
  }
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: Boolean(user.mustChangePassword),
    sessionVersion: user.sessionVersion ?? 1,
    passwordChangedAt: user.passwordChangedAt ?? null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

const atomicOperationQueues = new Map<string, Promise<unknown>>();

/**
 * Serializes critical read-check-write sections within a Node process so concurrent
 * requests in local/dev/test mode execute strictly one-at-a-time without TOCTOU races.
 * PostgreSQL mode additionally enforces database-level transactional advisory locks.
 */
async function withAtomicKeyLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const previous = atomicOperationQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const currentGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => currentGate);
  atomicOperationQueues.set(key, chained);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (atomicOperationQueues.get(key) === chained) {
      atomicOperationQueues.delete(key);
    }
  }
}

interface PostgresLeadRow {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string | null;
  industry: string;
  interested_service: string;
  business_problem: string;
  budget_range: string | null;
  timeline: string | null;
  additional_details: string | null;
  privacy_consent: boolean;
  status: LeadRecord["status"];
  priority?: LeadPriority | null;
  proposal_value?: string | number | null;
  expected_closing_date?: string | Date | null;
  lost_reason?: string | null;
  source: string;
  is_duplicate_flag: boolean;
  follow_up_date: string | null;
  email_notification_status: LeadRecord["emailNotificationStatus"];
  notes: LeadRecord["notes"];
  status_history: LeadRecord["statusHistory"];
  created_at: string;
  updated_at: string;
}

function normalizeLeadRecord(lead: LeadRecord): LeadRecord {
  return {
    ...lead,
    priority: lead.priority || "Medium",
    proposalValue:
      typeof lead.proposalValue === "number" && Number.isFinite(lead.proposalValue)
        ? lead.proposalValue
        : null,
    expectedClosingDate: lead.expectedClosingDate || null,
    lostReason: lead.lostReason || null,
    notes: Array.isArray(lead.notes) ? lead.notes : [],
    statusHistory: Array.isArray(lead.statusHistory) ? lead.statusHistory : [],
  };
}

function mapPostgresLeadRow(r: PostgresLeadRow): LeadRecord {
  const rawClosing = r.expected_closing_date;
  const closingStr =
    rawClosing instanceof Date
      ? rawClosing.toISOString().slice(0, 10)
      : typeof rawClosing === "string" && rawClosing.trim()
        ? rawClosing.slice(0, 10)
        : null;
  const parsedProposal =
    r.proposal_value !== null && r.proposal_value !== undefined
      ? Number(r.proposal_value)
      : null;

  return normalizeLeadRecord({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    website: r.website ?? undefined,
    industry: r.industry,
    interestedService: r.interested_service,
    businessProblem: r.business_problem,
    budgetRange: r.budget_range ?? undefined,
    timeline: r.timeline ?? undefined,
    additionalDetails: r.additional_details ?? undefined,
    privacyConsent: r.privacy_consent,
    status: r.status,
    priority: r.priority || "Medium",
    proposalValue:
      parsedProposal !== null && Number.isFinite(parsedProposal)
        ? parsedProposal
        : null,
    expectedClosingDate: closingStr,
    lostReason: r.lost_reason ?? null,
    source: r.source,
    isDuplicateFlag: r.is_duplicate_flag,
    followUpDate: normalizePgNullableIsoTimestamp(r.follow_up_date),
    emailNotificationStatus: r.email_notification_status,
    notes: r.notes || [],
    statusHistory: r.status_history || [],
    createdAt: normalizePgIsoTimestamp(r.created_at),
    updatedAt: normalizePgIsoTimestamp(r.updated_at),
  });
}

export function computeLeadDashboardMetrics(
  leads: LeadRecord[],
  now: Date = new Date()
): LeadDashboardMetrics {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const qualifiedLeads = leads.filter((l) =>
    ["Qualified", "Proposal Sent", "Won"].includes(l.status)
  ).length;
  const activePipelineLeads = leads.filter((l) =>
    ["New", "Contacted", "Qualified", "Proposal Sent"].includes(l.status)
  ).length;
  const wonLeads = leads.filter((l) => l.status === "Won").length;
  const lostLeads = leads.filter((l) => l.status === "Lost").length;

  const monthPrefix = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
  const monthlyEnquiries = leads.filter((l) =>
    l.createdAt.startsWith(monthPrefix)
  ).length;

  const todayIso = now.toISOString().slice(0, 10);
  const dueFollowUps = leads.filter(
    (l) =>
      Boolean(l.followUpDate) &&
      (l.followUpDate as string) <= todayIso &&
      !["Won", "Lost"].includes(l.status)
  ).length;

  const totalPipelineValue = leads
    .filter((l) => l.status !== "Lost")
    .reduce((sum, l) => sum + (typeof l.proposalValue === "number" ? l.proposalValue : 0), 0);

  const wonRevenueValue = leads
    .filter((l) => l.status === "Won")
    .reduce((sum, l) => sum + (typeof l.proposalValue === "number" ? l.proposalValue : 0), 0);

  const conversionRatePercent =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0;
  const qualificationRatePercent =
    totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 1000) / 10 : 0;

  const sourceCounts = new Map<string, number>();
  for (const lead of leads) {
    const src = (lead.source || "website_contact_form").trim() || "website_contact_form";
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  }
  const sourcesBreakdown = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      count,
      percent: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
    }));

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    activePipelineLeads,
    wonLeads,
    lostLeads,
    monthlyEnquiries,
    conversionRatePercent,
    qualificationRatePercent,
    dueFollowUps,
    totalPipelineValue,
    wonRevenueValue,
    sourcesBreakdown,
  };
}

async function loadPostgresKvBundle(
  sql: ReturnType<typeof postgres>
): Promise<CachedPostgresKvBundle> {
  if (cachedPgKvBundle && Date.now() < cachedPgKvBundle.expiresAt) {
    return cachedPgKvBundle;
  }
  return dedupeInFlight("pg_kv_bundle", async () => {
    if (cachedPgKvBundle && Date.now() < cachedPgKvBundle.expiresAt) {
      return cachedPgKvBundle;
    }
    const rows = await sql<{ key: string; payload: unknown }[]>`
      SELECT key, payload
      FROM kv_configs
      WHERE key IN ('site_settings', 'theme_config', 'brand_assets', 'service_pillars')
    `;
    const byKey = new Map(rows.map((r) => [r.key, r.payload]));
    const rawSettings = byKey.get("site_settings") as SiteSettings | undefined;
    const normalizedSettings = rawSettings
      ? normalizeLegacySiteSettings(rawSettings)
      : undefined;
    const rawTheme = byKey.get("theme_config") as
      | ThemeConfiguration
      | undefined;
    const normalizedThemeResult = rawTheme
      ? normalizeStoredThemeConfig(rawTheme)
      : undefined;
    const bundle: CachedPostgresKvBundle = {
      siteSettings: normalizedSettings,
      themeConfig: normalizedThemeResult?.config,
      themeConfigUpgraded: normalizedThemeResult?.upgraded ?? false,
      brandAssets: byKey.get("brand_assets") as BrandAssetConfig | undefined,
      servicePillars: byKey.get("service_pillars") as
        | ServiceCategoryPillar[]
        | undefined,
      expiresAt: Date.now() + 4_000,
    };
    cachedPgKvBundle = bundle;
    return bundle;
  });
}

/**
 * Fetches all published public-website collections, pages, and active redirects in
 * ONE zero-parameter Simple Query (`simple: true`), eliminating multi-query RSC waterfalls
 * and Supavisor Transaction Pooler (:6543) extended-protocol pipelining deadlocks on
 * HomePage (/), ServiceDetailPage, CaseStudyDetailPage, and BlogPostDetailPage.
 * Cached for 3 seconds and invalidated immediately on any CMS/Page/Redirect mutation.
 */
async function loadPostgresPublicCatalogBundle(
  sql: ReturnType<typeof postgres>
): Promise<CachedPostgresPublicCatalog> {
  if (cachedPgPublicCatalog && Date.now() < cachedPgPublicCatalog.expiresAt) {
    return cachedPgPublicCatalog;
  }
  return dedupeInFlight("pg_public_catalog", async () => {
    if (cachedPgPublicCatalog && Date.now() < cachedPgPublicCatalog.expiresAt) {
      return cachedPgPublicCatalog;
    }
    const rows = await sql<
      {
        services: ServiceItem[] | null;
        case_studies: CaseStudyItem[] | null;
        blog_posts: BlogPost[] | null;
        faqs: FaqItem[] | null;
        testimonials: TestimonialItem[] | null;
        team_members: TeamMember[] | null;
        pages: PageDocument[] | null;
        active_redirects: RedirectRule[] | null;
      }[]
    >`
      SELECT
        (SELECT COALESCE(jsonb_agg(payload ORDER BY sort_order ASC), '[]'::jsonb) FROM services WHERE status = 'published') AS services,
        (SELECT COALESCE(jsonb_agg(payload ORDER BY updated_at DESC), '[]'::jsonb) FROM case_studies WHERE status = 'published') AS case_studies,
        (SELECT COALESCE(jsonb_agg(payload ORDER BY published_at DESC NULLS LAST), '[]'::jsonb) FROM blog_posts WHERE status = 'published') AS blog_posts,
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'category', category, 'order', sort_order, 'isPublished', is_published, 'question', question, 'answer', answer) ORDER BY sort_order ASC), '[]'::jsonb) FROM faqs WHERE is_published = TRUE) AS faqs,
        (SELECT COALESCE(jsonb_agg(payload ORDER BY created_at DESC), '[]'::jsonb) FROM testimonials WHERE is_published = TRUE AND is_authorized = TRUE AND is_verified = TRUE) AS testimonials,
        (SELECT COALESCE(jsonb_agg(payload ORDER BY sort_order ASC), '[]'::jsonb) FROM team_members WHERE is_published = TRUE) AS team_members,
        (SELECT COALESCE(jsonb_agg(payload ORDER BY slug ASC), '[]'::jsonb) FROM pages) AS pages,
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'sourcePath', source_path, 'destinationPath', destination_path, 'permanent', permanent, 'isActive', is_active, 'createdAt', created_at) ORDER BY created_at DESC), '[]'::jsonb) FROM redirects WHERE is_active = TRUE) AS active_redirects
    `;
    const r = rows[0];
    const catalog: CachedPostgresPublicCatalog = {
      services: Array.isArray(r?.services) ? r.services : [],
      caseStudies: Array.isArray(r?.case_studies) ? r.case_studies : [],
      blogPosts: Array.isArray(r?.blog_posts) ? r.blog_posts : [],
      faqs: Array.isArray(r?.faqs) ? r.faqs : [],
      testimonials: Array.isArray(r?.testimonials) ? r.testimonials : [],
      teamMembers: Array.isArray(r?.team_members) ? r.team_members : [],
      pages: Array.isArray(r?.pages)
        ? r.pages.map(normalizeLegacyHomePage)
        : [],
      activeRedirects: Array.isArray(r?.active_redirects)
        ? r.active_redirects
        : [],
      expiresAt: Date.now() + 3_000,
    };
    cachedPgPublicCatalog = catalog;
    return catalog;
  });
}

export const db = {
  getMode(): DatabaseDriverMode {
    return getActiveDatabaseMode();
  },

  async getSiteSettings(): Promise<SiteSettings> {
    return dedupeInFlight("site_settings", () =>
      runWithDbFallback(
        async (sql) => {
          const kv = await loadPostgresKvBundle(sql);
          if (kv.siteSettings) return kv.siteSettings;
          const fallback = createInitialSeedSnapshot().siteSettings;
          await sql`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES ('site_settings', ${sql.json(fallback as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO NOTHING
          `.catch(() => undefined);
          invalidatePgKvBundle();
          return fallback;
        },
        () => readLocalSnapshot().siteSettings
      )
    );
  },

  async saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    const next = { ...settings, updatedAt: new Date().toISOString() };
    invalidatePgKvBundle();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('site_settings', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
        invalidatePgKvBundle();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.siteSettings = next;
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async getThemeConfig(): Promise<ThemeConfiguration> {
    return dedupeInFlight("theme_config", () =>
      runWithDbFallback(
        async (sql) => {
          const kv = await loadPostgresKvBundle(sql);
          if (!kv.themeConfig) {
            const fallback = createInitialSeedSnapshot().themeConfig;
            await sql`
              INSERT INTO kv_configs (key, payload, updated_at)
              VALUES ('theme_config', ${sql.json(fallback as unknown as postgres.JSONValue)}, NOW())
              ON CONFLICT (key) DO NOTHING
            `.catch(() => undefined);
            invalidatePgKvBundle();
            return fallback;
          }
          const { config, upgraded } = normalizeStoredThemeConfig(kv.themeConfig);
          if (kv.themeConfigUpgraded || upgraded) {
            await sql`
              INSERT INTO kv_configs (key, payload, updated_at)
              VALUES ('theme_config', ${sql.json(config as unknown as postgres.JSONValue)}, NOW())
              ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
            `.catch(() => undefined);
            invalidatePgKvBundle();
          }
          return config;
        },
        () => normalizeStoredThemeConfig(readLocalSnapshot().themeConfig).config
      )
    );
  },

  async saveThemeConfig(
    config: ThemeConfiguration
  ): Promise<ThemeConfiguration> {
    const next = { ...config, updatedAt: new Date().toISOString() };
    invalidatePgKvBundle();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('theme_config', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
        invalidatePgKvBundle();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.themeConfig = next;
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async getBrandAssets(): Promise<BrandAssetConfig> {
    return dedupeInFlight("brand_assets", () =>
      runWithDbFallback(
        async (sql) => {
          const kv = await loadPostgresKvBundle(sql);
          if (kv.brandAssets) return kv.brandAssets;
          const fallback = createInitialSeedSnapshot().brandAssets;
          await sql`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES ('brand_assets', ${sql.json(fallback as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO NOTHING
          `.catch(() => undefined);
          invalidatePgKvBundle();
          return fallback;
        },
        () => readLocalSnapshot().brandAssets
      )
    );
  },

  async saveBrandAssets(assets: BrandAssetConfig): Promise<BrandAssetConfig> {
    const next = { ...assets, updatedAt: new Date().toISOString() };
    invalidatePgKvBundle();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('brand_assets', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
        invalidatePgKvBundle();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.brandAssets = next;
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async getServicePillars(): Promise<ServiceCategoryPillar[]> {
    return dedupeInFlight("service_pillars", () =>
      runWithDbFallback(
        async (sql) => {
          const kv = await loadPostgresKvBundle(sql);
          if (kv.servicePillars) return kv.servicePillars;
          const fallback = createInitialSeedSnapshot().servicePillars;
          await sql`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES ('service_pillars', ${sql.json(fallback as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO NOTHING
          `.catch(() => undefined);
          invalidatePgKvBundle();
          return fallback;
        },
        () => readLocalSnapshot().servicePillars
      )
    );
  },

  async listServices(onlyPublished = false): Promise<ServiceItem[]> {
    return dedupeInFlight(`list_services_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublished) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.services;
          }
          const rows = await sql<{ payload: ServiceItem }[]>`
            SELECT payload FROM services ORDER BY sort_order ASC
          `;
          return rows.map((r) => r.payload);
        },
        () => {
          const all = readLocalSnapshot().services;
          return (
            onlyPublished ? all.filter((s) => s.status === "published") : all
          ).sort((a, b) => a.order - b.order);
        }
      )
    );
  },

  async getServiceBySlug(slug: string): Promise<ServiceItem | null> {
    return dedupeInFlight(`service_slug_${slug}`, () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          const publishedMatch = catalog.services.find((s) => s.slug === slug);
          if (publishedMatch) return publishedMatch;
          const rows = await sql<{ payload: ServiceItem }[]>`
            SELECT payload FROM services WHERE slug = ${slug} LIMIT 1
          `;
          return rows[0]?.payload ?? null;
        },
        () => readLocalSnapshot().services.find((s) => s.slug === slug) ?? null
      )
    );
  },

  async upsertService(service: ServiceItem): Promise<ServiceItem> {
    const next: ServiceItem = {
      ...service,
      updatedAt: new Date().toISOString(),
    };
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO services (id, slug, title, category_slug, is_flagship_priority, status, sort_order, payload, updated_at)
          VALUES (
            ${next.id},
            ${next.slug},
            ${next.title},
            ${next.categorySlug},
            ${next.isFlagshipPriority},
            ${next.status},
            ${next.order},
            ${sql.json(next as unknown as postgres.JSONValue)},
            ${next.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            category_slug = EXCLUDED.category_slug,
            is_flagship_priority = EXCLUDED.is_flagship_priority,
            status = EXCLUDED.status,
            sort_order = EXCLUDED.sort_order,
            payload = EXCLUDED.payload,
            updated_at = EXCLUDED.updated_at
        `;
        invalidatePgPublicCatalog();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.services.findIndex((s) => s.id === next.id);
        if (idx >= 0) snap.services[idx] = next;
        else snap.services.push(next);
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async deleteService(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM services WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.services.length;
        snap.services = snap.services.filter((s) => s.id !== id);
        if (snap.services.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listCaseStudies(onlyPublished = false): Promise<CaseStudyItem[]> {
    return dedupeInFlight(`list_cases_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublished) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.caseStudies;
          }
          const rows = await sql<{ payload: CaseStudyItem }[]>`
            SELECT payload FROM case_studies ORDER BY updated_at DESC
          `;
          return rows.map((r) => r.payload);
        },
        () => {
          const all = readLocalSnapshot().caseStudies;
          return onlyPublished
            ? all.filter((c) => c.status === "published")
            : all;
        }
      )
    );
  },

  async getCaseStudyBySlug(
    slug: string,
    onlyPublished = false
  ): Promise<CaseStudyItem | null> {
    return dedupeInFlight(`case_slug_${slug}_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          const publishedMatch = catalog.caseStudies.find(
            (c) => c.slug === slug
          );
          if (publishedMatch) return publishedMatch;
          if (onlyPublished) return null;
          const rows = await sql<{ payload: CaseStudyItem }[]>`
            SELECT payload FROM case_studies
            WHERE slug = ${slug}
            LIMIT 1
          `;
          return rows[0]?.payload ?? null;
        },
        () => {
          const match = readLocalSnapshot().caseStudies.find(
            (c) => c.slug === slug
          );
          if (!match) return null;
          if (onlyPublished && match.status !== "published") return null;
          return match;
        }
      )
    );
  },

  async upsertCaseStudy(item: CaseStudyItem): Promise<CaseStudyItem> {
    const next: CaseStudyItem = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO case_studies (id, slug, title, work_type, status, payload, updated_at)
          VALUES (
            ${next.id},
            ${next.slug},
            ${next.title},
            ${next.workType},
            ${next.status},
            ${sql.json(next as unknown as postgres.JSONValue)},
            ${next.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            work_type = EXCLUDED.work_type,
            status = EXCLUDED.status,
            payload = EXCLUDED.payload,
            updated_at = EXCLUDED.updated_at
        `;
        invalidatePgPublicCatalog();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.caseStudies.findIndex((c) => c.id === next.id);
        if (idx >= 0) snap.caseStudies[idx] = next;
        else snap.caseStudies.unshift(next);
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async deleteCaseStudy(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM case_studies WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.caseStudies.length;
        snap.caseStudies = snap.caseStudies.filter((c) => c.id !== id);
        if (snap.caseStudies.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listBlogPosts(onlyPublished = false): Promise<BlogPost[]> {
    return dedupeInFlight(`list_posts_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublished) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.blogPosts;
          }
          const rows = await sql<{ payload: BlogPost }[]>`
            SELECT payload FROM blog_posts ORDER BY updated_at DESC
          `;
          return rows.map((r) => r.payload);
        },
        () => {
          const all = readLocalSnapshot().blogPosts;
          return onlyPublished
            ? all.filter((p) => p.status === "published")
            : all;
        }
      )
    );
  },

  async getBlogPostBySlug(
    slug: string,
    onlyPublished = false
  ): Promise<BlogPost | null> {
    return dedupeInFlight(`post_slug_${slug}_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          const publishedMatch = catalog.blogPosts.find((p) => p.slug === slug);
          if (publishedMatch) return publishedMatch;
          if (onlyPublished) return null;
          const rows = await sql<{ payload: BlogPost }[]>`
            SELECT payload FROM blog_posts
            WHERE slug = ${slug}
            LIMIT 1
          `;
          return rows[0]?.payload ?? null;
        },
        () => {
          const match = readLocalSnapshot().blogPosts.find(
            (p) => p.slug === slug
          );
          if (!match) return null;
          if (onlyPublished && match.status !== "published") return null;
          return match;
        }
      )
    );
  },

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: BlogPost }[]>`
          SELECT payload FROM blog_posts WHERE id = ${id} LIMIT 1
        `;
        return rows[0]?.payload ?? null;
      },
      () => readLocalSnapshot().blogPosts.find((p) => p.id === id) ?? null
    );
  },

  async upsertBlogPost(post: BlogPost): Promise<BlogPost> {
    const next: BlogPost = { ...post, updatedAt: new Date().toISOString() };
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO blog_posts (id, slug, title, category, author_id, status, published_at, payload, updated_at)
          VALUES (
            ${next.id},
            ${next.slug},
            ${next.title},
            ${next.category},
            ${next.authorId},
            ${next.status},
            ${next.publishedAt},
            ${sql.json(next as unknown as postgres.JSONValue)},
            ${next.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            status = EXCLUDED.status,
            published_at = EXCLUDED.published_at,
            payload = EXCLUDED.payload,
            updated_at = EXCLUDED.updated_at
        `;
        invalidatePgPublicCatalog();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.blogPosts.findIndex((b) => b.id === next.id);
        if (idx >= 0) snap.blogPosts[idx] = next;
        else snap.blogPosts.unshift(next);
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async deleteBlogPost(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM blog_posts WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.blogPosts.length;
        snap.blogPosts = snap.blogPosts.filter((b) => b.id !== id);
        if (snap.blogPosts.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listFaqs(onlyPublished = false): Promise<FaqItem[]> {
    return dedupeInFlight(`list_faqs_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublished) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.faqs;
          }
          const rows = await sql<FaqItem[]>`
            SELECT id, category, sort_order as "order", is_published as "isPublished", question, answer
            FROM faqs ORDER BY sort_order ASC
          `;
          return rows;
        },
        () => {
          const all = readLocalSnapshot().faqs;
          return (onlyPublished ? all.filter((f) => f.isPublished) : all).sort(
            (a, b) => a.order - b.order
          );
        }
      )
    );
  },

  async upsertFaq(faq: FaqItem): Promise<FaqItem> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO faqs (id, category, sort_order, is_published, question, answer)
          VALUES (${faq.id}, ${faq.category}, ${faq.order}, ${faq.isPublished}, ${faq.question}, ${faq.answer})
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            sort_order = EXCLUDED.sort_order,
            is_published = EXCLUDED.is_published,
            question = EXCLUDED.question,
            answer = EXCLUDED.answer
        `;
        invalidatePgPublicCatalog();
        return faq;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.faqs.findIndex((f) => f.id === faq.id);
        if (idx >= 0) snap.faqs[idx] = faq;
        else snap.faqs.push(faq);
        writeLocalSnapshot(snap);
        return faq;
      }
    );
  },

  async deleteFaq(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM faqs WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.faqs.length;
        snap.faqs = snap.faqs.filter((f) => f.id !== id);
        if (snap.faqs.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listTestimonials(onlyPublicVerified = false): Promise<TestimonialItem[]> {
    return dedupeInFlight(`list_testimonials_${onlyPublicVerified}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublicVerified) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.testimonials;
          }
          const rows = await sql<{ payload: TestimonialItem }[]>`
            SELECT payload FROM testimonials ORDER BY created_at DESC
          `;
          return rows.map((r) => r.payload);
        },
        () => {
          const all = readLocalSnapshot().testimonials;
          return onlyPublicVerified
            ? all.filter((t) => t.isPublished && t.isAuthorized && t.isVerified)
            : all;
        }
      )
    );
  },

  async upsertTestimonial(item: TestimonialItem): Promise<TestimonialItem> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO testimonials (id, is_authorized, is_verified, is_published, payload, created_at)
          VALUES (
            ${item.id},
            ${item.isAuthorized},
            ${item.isVerified},
            ${item.isPublished},
            ${sql.json(item as unknown as postgres.JSONValue)},
            ${item.createdAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            is_authorized = EXCLUDED.is_authorized,
            is_verified = EXCLUDED.is_verified,
            is_published = EXCLUDED.is_published,
            payload = EXCLUDED.payload
        `;
        invalidatePgPublicCatalog();
        return item;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.testimonials.findIndex((t) => t.id === item.id);
        if (idx >= 0) snap.testimonials[idx] = item;
        else snap.testimonials.unshift(item);
        writeLocalSnapshot(snap);
        return item;
      }
    );
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM testimonials WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.testimonials.length;
        snap.testimonials = snap.testimonials.filter((t) => t.id !== id);
        if (snap.testimonials.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listTeamMembers(onlyPublished = false): Promise<TeamMember[]> {
    return dedupeInFlight(`list_team_${onlyPublished}`, () =>
      runWithDbFallback(
        async (sql) => {
          if (onlyPublished) {
            const catalog = await loadPostgresPublicCatalogBundle(sql);
            return catalog.teamMembers;
          }
          const rows = await sql<{ payload: TeamMember }[]>`
            SELECT payload FROM team_members ORDER BY sort_order ASC
          `;
          return rows.map((r) => r.payload);
        },
        () => {
          const all = readLocalSnapshot().teamMembers;
          return (onlyPublished ? all.filter((m) => m.isPublished) : all).sort(
            (a, b) => a.order - b.order
          );
        }
      )
    );
  },

  async upsertTeamMember(member: TeamMember): Promise<TeamMember> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO team_members (id, is_founder, sort_order, is_published, payload)
          VALUES (
            ${member.id},
            ${member.isFounder},
            ${member.order},
            ${member.isPublished},
            ${sql.json(member as unknown as postgres.JSONValue)}
          )
          ON CONFLICT (id) DO UPDATE SET
            is_founder = EXCLUDED.is_founder,
            sort_order = EXCLUDED.sort_order,
            is_published = EXCLUDED.is_published,
            payload = EXCLUDED.payload
        `;
        invalidatePgPublicCatalog();
        return member;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.teamMembers.findIndex((m) => m.id === member.id);
        if (idx >= 0) snap.teamMembers[idx] = member;
        else snap.teamMembers.push(member);
        writeLocalSnapshot(snap);
        return member;
      }
    );
  },

  async deleteTeamMember(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM team_members WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.teamMembers.length;
        snap.teamMembers = snap.teamMembers.filter((m) => m.id !== id);
        if (snap.teamMembers.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async listPages(): Promise<PageDocument[]> {
    return dedupeInFlight("list_pages", () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          return catalog.pages;
        },
        () => readLocalSnapshot().pages
      )
    );
  },

  async getPageBySlug(slug: string): Promise<PageDocument | null> {
    return dedupeInFlight(`page_slug_${slug}`, () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          return catalog.pages.find((p) => p.slug === slug) ?? null;
        },
        () => readLocalSnapshot().pages.find((p) => p.slug === slug) ?? null
      )
    );
  },

  async savePage(page: PageDocument): Promise<PageDocument> {
    const next: PageDocument = { ...page, updatedAt: new Date().toISOString() };
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO pages (id, slug, title, status, payload, updated_at)
          VALUES (
            ${next.id},
            ${next.slug},
            ${next.title},
            ${next.status},
            ${sql.json(next as unknown as postgres.JSONValue)},
            ${next.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            status = EXCLUDED.status,
            payload = EXCLUDED.payload,
            updated_at = EXCLUDED.updated_at
        `;
        invalidatePgPublicCatalog();
        return next;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.pages.findIndex(
          (p) => p.id === next.id || p.slug === next.slug
        );
        if (idx >= 0) snap.pages[idx] = next;
        else snap.pages.push(next);
        writeLocalSnapshot(snap);
        return next;
      }
    );
  },

  async countUsers(): Promise<number> {
    return runWithDbFallback(
      async (sql) => {
        await ensurePostgresBootstrapAdmin(sql);
        const rows = await sql<{ cnt: number }[]>`
          SELECT count(*)::int AS cnt FROM users
        `;
        return rows[0]?.cnt ?? 0;
      },
      () => readLocalSnapshot().users.length
    );
  },

  async hasSuperAdmin(): Promise<boolean> {
    return runWithDbFallback(
      async (sql) => {
        await ensurePostgresBootstrapAdmin(sql);
        const rows = await sql<{ cnt: number }[]>`
          SELECT count(*)::int AS cnt FROM users WHERE role = 'SUPER_ADMIN'
        `;
        return (rows[0]?.cnt ?? 0) > 0;
      },
      () =>
        readLocalSnapshot().users.some((user) => user.role === "SUPER_ADMIN")
    );
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    // Do not share a pre-revocation user read with a later authorization request.
    return runWithDbFallback(
        async (sql) => {
          await ensurePostgresBootstrapAdmin(sql);
          const rows = await sql<
            {
              id: string;
              email: string;
              name: string;
              role: UserRecord["role"];
              password_hash: string;
              is_active: boolean;
              must_change_password?: boolean;
              session_version?: number;
              password_changed_at?: unknown;
              recovery_token_hash?: string | null;
              recovery_expires_at?: unknown;
              created_at: unknown;
              updated_at: unknown;
              last_login_at: unknown;
            }[]
          >`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
          if (!rows[0]) return null;
          const r = rows[0];
          return {
            id: r.id,
            email: r.email,
            name: r.name,
            role: r.role,
            passwordHash: r.password_hash,
            isActive: r.is_active,
            mustChangePassword: Boolean(r.must_change_password),
            sessionVersion: r.session_version ?? 1,
            passwordChangedAt: normalizePgNullableIsoTimestamp(
              r.password_changed_at
            ),
            recoveryTokenHash: r.recovery_token_hash ?? null,
            recoveryExpiresAt: normalizePgNullableIsoTimestamp(
              r.recovery_expires_at
            ),
            createdAt: normalizePgIsoTimestamp(r.created_at),
            updatedAt: normalizePgIsoTimestamp(r.updated_at),
            lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
          };
        },
        () => readLocalSnapshot().users.find((u) => u.id === id) ?? null
      );
  },

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    return runWithDbFallback(
      async (sql) => {
        await ensurePostgresBootstrapAdmin(sql);
        const rows = await sql<
          {
            id: string;
            email: string;
            name: string;
            role: UserRecord["role"];
            password_hash: string;
            is_active: boolean;
            must_change_password?: boolean;
            session_version?: number;
            password_changed_at?: unknown;
            recovery_token_hash?: string | null;
            recovery_expires_at?: unknown;
            created_at: unknown;
            updated_at: unknown;
            last_login_at: unknown;
          }[]
        >`SELECT * FROM users WHERE email = ${normalized} LIMIT 1`;
        if (!rows[0]) return null;
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          passwordHash: r.password_hash,
          isActive: r.is_active,
          mustChangePassword: Boolean(r.must_change_password),
          sessionVersion: r.session_version ?? 1,
          passwordChangedAt: normalizePgNullableIsoTimestamp(
            r.password_changed_at
          ),
          recoveryTokenHash: r.recovery_token_hash ?? null,
          recoveryExpiresAt: normalizePgNullableIsoTimestamp(
            r.recovery_expires_at
          ),
          createdAt: normalizePgIsoTimestamp(r.created_at),
          updatedAt: normalizePgIsoTimestamp(r.updated_at),
          lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
        };
      },
      () =>
        readLocalSnapshot().users.find(
          (u) => u.email.toLowerCase() === normalized
        ) ?? null
    );
  },

  async findUserByRecoveryTokenHash(tokenHash: string): Promise<UserRecord | null> {
    if (!tokenHash) return null;
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<
          {
            id: string;
            email: string;
            name: string;
            role: UserRecord["role"];
            password_hash: string;
            is_active: boolean;
            must_change_password?: boolean;
            session_version?: number;
            password_changed_at?: unknown;
            recovery_token_hash?: string | null;
            recovery_expires_at?: unknown;
            created_at: unknown;
            updated_at: unknown;
            last_login_at: unknown;
          }[]
        >`SELECT * FROM users WHERE recovery_token_hash = ${tokenHash} LIMIT 1`;
        if (!rows[0]) return null;
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          passwordHash: r.password_hash,
          isActive: r.is_active,
          mustChangePassword: Boolean(r.must_change_password),
          sessionVersion: r.session_version ?? 1,
          passwordChangedAt: normalizePgNullableIsoTimestamp(
            r.password_changed_at
          ),
          recoveryTokenHash: r.recovery_token_hash ?? null,
          recoveryExpiresAt: normalizePgNullableIsoTimestamp(
            r.recovery_expires_at
          ),
          createdAt: normalizePgIsoTimestamp(r.created_at),
          updatedAt: normalizePgIsoTimestamp(r.updated_at),
          lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
        };
      },
      () =>
        readLocalSnapshot().users.find(
          (u) => u.recoveryTokenHash === tokenHash
        ) ?? null
    );
  },

  async listUsers(): Promise<SafeUser[]> {
    return dedupeInFlight("list_users", () =>
      runWithDbFallback(
        async (sql) => {
          await ensurePostgresBootstrapAdmin(sql);
          const rows = await sql<
            {
              id: string;
              email: string;
              name: string;
              role: UserRecord["role"];
              is_active: boolean;
              must_change_password?: boolean;
              session_version?: number;
              password_changed_at?: unknown;
              created_at: unknown;
              last_login_at: unknown;
            }[]
          >`SELECT id, email, name, role, is_active, must_change_password, session_version, password_changed_at, created_at, last_login_at FROM users ORDER BY created_at ASC`;
          return rows.map((r) => ({
            id: r.id,
            email: r.email,
            name: r.name,
            role: r.role,
            isActive: r.is_active,
            mustChangePassword: Boolean(r.must_change_password),
            sessionVersion: r.session_version ?? 1,
            passwordChangedAt: normalizePgNullableIsoTimestamp(
              r.password_changed_at
            ),
            createdAt: normalizePgIsoTimestamp(r.created_at),
            lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
          }));
        },
        () => readLocalSnapshot().users.map(toSafeUser)
      )
    );
  },

  async recordUserLogin(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await runWithDbFallback(
      async (sql) => {
        await sql`
          UPDATE users SET last_login_at = ${now}, updated_at = ${now} WHERE id = ${userId}
        `;
        return true;
      },
      () => {
        const snap = readLocalSnapshot();
        const target = snap.users.find((u) => u.id === userId);
        if (target) {
          target.lastLoginAt = now;
          target.updatedAt = now;
          writeLocalSnapshot(snap);
        }
        return true;
      }
    );
  },

  async createUser(input: {
    email: string;
    name: string;
    role: UserRecord["role"];
    passwordHash: string;
    mustChangePassword?: boolean;
  }): Promise<SafeUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error("A user account with this email address already exists.");
    }
    const now = new Date().toISOString();
    const created: UserRecord = {
      id: `usr_${randomBytes(8).toString("hex")}`,
      email: normalizedEmail,
      name: input.name.trim(),
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: true,
      mustChangePassword: Boolean(input.mustChangePassword),
      sessionVersion: 1,
      passwordChangedAt: input.mustChangePassword ? null : now,
      recoveryTokenHash: null,
      recoveryExpiresAt: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };

    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO users (
            id, email, name, role, password_hash, is_active,
            must_change_password, session_version, password_changed_at,
            recovery_token_hash, recovery_expires_at,
            created_at, updated_at, last_login_at
          )
          VALUES (
            ${created.id},
            ${created.email},
            ${created.name},
            ${created.role},
            ${created.passwordHash},
            ${created.isActive},
            ${Boolean(created.mustChangePassword)},
            ${created.sessionVersion ?? 1},
            ${created.passwordChangedAt ?? null},
            ${null},
            ${null},
            ${created.createdAt},
            ${created.updatedAt},
            ${created.lastLoginAt ?? null}
          )
        `;
        return toSafeUser(created);
      },
      () => {
        const snap = readLocalSnapshot();
        snap.users.push(created);
        writeLocalSnapshot(snap);
        return toSafeUser(created);
      }
    );
  },

  /**
   * Atomically creates the very first SUPER_ADMIN account when and only when zero
   * staff users exist. Eliminates TOCTOU race conditions under concurrent requests
   * via PostgreSQL transactional advisory locks + in-process mutex serialization.
   */
  async createInitialSuperAdminAtomically(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<
    { status: "created"; user: SafeUser } | { status: "already_initialized" }
  > {
    const normalizedEmail = input.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const candidate: UserRecord = {
      id: `usr_${randomBytes(8).toString("hex")}`,
      email: normalizedEmail,
      name: input.name.trim(),
      role: "SUPER_ADMIN",
      passwordHash: input.passwordHash,
      isActive: true,
      mustChangePassword: false,
      sessionVersion: 1,
      passwordChangedAt: now,
      recoveryTokenHash: null,
      recoveryExpiresAt: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    return withAtomicKeyLock("initial_setup_super_admin", () =>
      runWithDbFallback(
        async (sql) => {
          return sql.begin(async (txRaw) => {
            const tx = txRaw as unknown as ReturnType<typeof postgres>;
            await tx`SELECT pg_advisory_xact_lock(7946001)`;
            await ensurePostgresBootstrapAdmin(tx);

            const countRows = await tx<{ cnt: number }[]>`
              SELECT count(*)::int AS cnt FROM users
            `;
            if ((countRows[0]?.cnt ?? 0) > 0) {
              return { status: "already_initialized" as const };
            }

            await tx`
              INSERT INTO users (
                id, email, name, role, password_hash, is_active,
                must_change_password, session_version, password_changed_at,
                recovery_token_hash, recovery_expires_at,
                created_at, updated_at, last_login_at
              )
              VALUES (
                ${candidate.id},
                ${candidate.email},
                ${candidate.name},
                ${candidate.role},
                ${candidate.passwordHash},
                ${candidate.isActive},
                ${false},
                ${1},
                ${candidate.passwordChangedAt ?? null},
                ${null},
                ${null},
                ${candidate.createdAt},
                ${candidate.updatedAt},
                ${candidate.lastLoginAt ?? null}
              )
            `;
            return { status: "created" as const, user: toSafeUser(candidate) };
          });
        },
        () => {
          const snap = readLocalSnapshot();
          if (snap.users.length > 0) {
            return { status: "already_initialized" as const };
          }
          snap.users.push(candidate);
          writeLocalSnapshot(snap);
          return { status: "created" as const, user: toSafeUser(candidate) };
        }
      )
    );
  },

  /**
   * Atomically verifies and consumes a single-use password recovery token hash,
   * rotating the password, clearing recovery columns, and bumping sessionVersion
   * in a single conditional UPDATE ... RETURNING so concurrent replay attempts fail.
   */
  async consumeRecoveryTokenAtomically(input: {
    tokenHash: string;
    newPasswordHash: string;
    nowIso?: string;
  }): Promise<SafeUser | null> {
    const nowIso = input.nowIso ?? new Date().toISOString();
    const nowMs = Date.parse(nowIso);

    return withAtomicKeyLock(`recovery_token:${input.tokenHash}`, () =>
      runWithDbFallback(
        async (sql) => {
          await ensurePostgresBootstrapAdmin(sql);
          const rows = await sql<
            {
              id: string;
              email: string;
              name: string;
              role: UserRecord["role"];
              is_active: boolean;
              must_change_password?: boolean;
              session_version?: number;
              password_changed_at?: string | null;
              created_at: string;
              last_login_at: string | null;
            }[]
          >`
            UPDATE users
            SET
              password_hash = ${input.newPasswordHash},
              must_change_password = FALSE,
              session_version = COALESCE(session_version, 1) + 1,
              password_changed_at = ${nowIso},
              recovery_token_hash = NULL,
              recovery_expires_at = NULL,
              updated_at = ${nowIso}
            WHERE recovery_token_hash = ${input.tokenHash}
              AND is_active = TRUE
              AND recovery_expires_at IS NOT NULL
              AND recovery_expires_at > ${nowIso}
            RETURNING
              id, email, name, role, is_active,
              must_change_password, session_version, password_changed_at,
              created_at, last_login_at
          `;

          const r = rows[0];
          if (!r) return null;
          return {
            id: r.id,
            email: r.email,
            name: r.name,
            role: r.role,
            isActive: r.is_active,
            mustChangePassword: Boolean(r.must_change_password),
            sessionVersion: r.session_version ?? 1,
            passwordChangedAt: normalizePgNullableIsoTimestamp(
              r.password_changed_at
            ),
            createdAt: normalizePgIsoTimestamp(r.created_at),
            lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
          };
        },
        () => {
          const snap = readLocalSnapshot();
          const idx = snap.users.findIndex(
            (u) =>
              u.recoveryTokenHash === input.tokenHash &&
              u.isActive &&
              Boolean(u.recoveryExpiresAt) &&
              Date.parse(u.recoveryExpiresAt as string) > nowMs
          );
          if (idx === -1) return null;

          const current = snap.users[idx];
          const updated: UserRecord = {
            ...current,
            passwordHash: input.newPasswordHash,
            mustChangePassword: false,
            sessionVersion: (current.sessionVersion ?? 1) + 1,
            passwordChangedAt: nowIso,
            recoveryTokenHash: null,
            recoveryExpiresAt: null,
            updatedAt: nowIso,
          };
          snap.users[idx] = updated;
          writeLocalSnapshot(snap);
          return toSafeUser(updated);
        }
      )
    );
  },

  async updateUser(
    id: string,
    patch: {
      name?: string;
      role?: UserRecord["role"];
      isActive?: boolean;
      passwordHash?: string;
      mustChangePassword?: boolean;
      bumpSessionVersion?: boolean;
      recoveryTokenHash?: string | null;
      recoveryExpiresAt?: string | null;
    }
  ): Promise<SafeUser | null> {
    const current = await this.findUserById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const shouldBumpSession =
      Boolean(patch.bumpSessionVersion) ||
      Boolean(patch.passwordHash) ||
      patch.isActive === false ||
      (patch.role !== undefined && patch.role !== current.role);

    const updated: UserRecord = {
      ...current,
      name: patch.name !== undefined ? patch.name.trim() : current.name,
      role: patch.role !== undefined ? patch.role : current.role,
      isActive:
        patch.isActive !== undefined ? patch.isActive : current.isActive,
      passwordHash:
        patch.passwordHash !== undefined
          ? patch.passwordHash
          : current.passwordHash,
      mustChangePassword:
        patch.mustChangePassword !== undefined
          ? patch.mustChangePassword
          : patch.passwordHash !== undefined
            ? false
            : Boolean(current.mustChangePassword),
      sessionVersion:
        (current.sessionVersion ?? 1) + (shouldBumpSession ? 1 : 0),
      passwordChangedAt:
        patch.passwordHash !== undefined
          ? now
          : (current.passwordChangedAt ?? null),
      recoveryTokenHash:
        patch.recoveryTokenHash !== undefined
          ? patch.recoveryTokenHash
          : (current.recoveryTokenHash ?? null),
      recoveryExpiresAt:
        patch.recoveryExpiresAt !== undefined
          ? patch.recoveryExpiresAt
          : (current.recoveryExpiresAt ?? null),
      updatedAt: now,
    };

    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ session_version: number }[]>`
          UPDATE users
          SET
            name = ${updated.name},
            role = ${updated.role},
            is_active = ${updated.isActive},
            password_hash = ${updated.passwordHash},
            must_change_password = ${Boolean(updated.mustChangePassword)},
            session_version = COALESCE(session_version, 1) + ${shouldBumpSession ? 1 : 0},
            password_changed_at = ${updated.passwordChangedAt ?? null},
            recovery_token_hash = ${updated.recoveryTokenHash ?? null},
            recovery_expires_at = ${updated.recoveryExpiresAt ?? null},
            updated_at = ${updated.updatedAt}
          WHERE id = ${id}
          RETURNING session_version
        `;
        if (!rows[0]) return null;
        return toSafeUser({ ...updated, sessionVersion: rows[0].session_version });
      },
      () => {
        const snap = readLocalSnapshot();
        const index = snap.users.findIndex((u) => u.id === id);
        if (index === -1) return null;
        const latestVersion = snap.users[index]?.sessionVersion ?? 1;
        const next = { ...updated, sessionVersion: latestVersion + (shouldBumpSession ? 1 : 0) };
        snap.users[index] = next;
        writeLocalSnapshot(snap);
        return toSafeUser(next);
      }
    );
  },

  /** Compare-and-swap revocation: replayed stale tokens cannot revoke newer sessions. */
  async revokeSessionsForVersion(userId: string, expectedVersion: number): Promise<{
    id: string; email: string; name: string; role: UserRecord["role"];
  } | null> {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return null;
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ id: string; email: string; name: string; role: UserRecord["role"] }[]>`
          UPDATE users
          SET session_version = COALESCE(session_version, 1) + 1, updated_at = NOW()
          WHERE id = ${userId} AND is_active = TRUE AND COALESCE(session_version, 1) = ${expectedVersion}
          RETURNING id, email, name, role
        `;
        return rows[0] ?? null;
      },
      () => {
        // The fallback writer suppresses errors and is not cross-process atomic.
        throw new Error("Secure logout requires a writable PostgreSQL database.");
      }
    );
  },

  async revokeUserSessions(userId: string): Promise<number | null> {
    const updated = await this.updateUser(userId, { bumpSessionVersion: true });
    return updated ? updated.sessionVersion : null;
  },

  async listLeads(): Promise<LeadRecord[]> {
    return dedupeInFlight("list_leads", () =>
      runWithDbFallback(
        async (sql) => {
          const rows = await sql<PostgresLeadRow[]>`
            SELECT * FROM leads ORDER BY created_at DESC
          `;
          return rows.map(mapPostgresLeadRow);
        },
        () =>
          readLocalSnapshot()
            .leads.map(normalizeLeadRecord)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
    );
  },

  async getPersistedIdempotentLeadId(
    fingerprint: string,
    nowIso = new Date().toISOString()
  ): Promise<string | null> {
    const nowMs = Date.parse(nowIso);
    return runWithDbFallback(
      async (sql) => {
        try {
          const rows = await sql<{ lead_id: string }[]>`
            SELECT lead_id
            FROM lead_idempotency_keys
            WHERE fingerprint = ${fingerprint}
              AND expires_at > ${nowIso}
            LIMIT 1
          `;
          return rows[0]?.lead_id ?? null;
        } catch (err) {
          const pgCode = (err as { code?: string })?.code;
          if (pgCode === "42P01") return null;
          throw err;
        }
      },
      () => {
        const snap = readLocalSnapshot();
        const store = snap.leadIdempotencyKeys;
        if (!store) return null;
        const entry = store[fingerprint];
        if (!entry) return null;
        if (Date.parse(entry.expiresAt) <= nowMs) {
          delete store[fingerprint];
          writeLocalSnapshot(snap);
          return null;
        }
        return entry.leadId;
      }
    );
  },

  async savePersistedIdempotentLeadId(
    fingerprint: string,
    leadId: string,
    ttlMs = 15 * 60_000,
    nowMs = Date.now()
  ): Promise<void> {
    const createdAtIso = new Date(nowMs).toISOString();
    const expiresAtIso = new Date(nowMs + ttlMs).toISOString();

    await runWithDbFallback(
      async (sql) => {
        try {
          if (Math.random() < 0.08) {
            await sql`
              DELETE FROM lead_idempotency_keys WHERE expires_at <= ${createdAtIso}
            `;
          }
          await sql`
            INSERT INTO lead_idempotency_keys (fingerprint, lead_id, created_at, expires_at)
            VALUES (${fingerprint}, ${leadId}, ${createdAtIso}, ${expiresAtIso})
            ON CONFLICT (fingerprint) DO NOTHING
          `;
        } catch (err) {
          const pgCode = (err as { code?: string })?.code;
          if (pgCode !== "42P01") throw err;
        }
        return true;
      },
      () => {
        const snap = readLocalSnapshot();
        const store = { ...(snap.leadIdempotencyKeys || {}) };
        for (const [key, entry] of Object.entries(store)) {
          if (Date.parse(entry.expiresAt) <= nowMs) {
            delete store[key];
          }
        }
        if (!store[fingerprint]) {
          store[fingerprint] = {
            leadId,
            createdAt: createdAtIso,
            expiresAt: expiresAtIso,
          };
        }
        snap.leadIdempotencyKeys = store;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async getLeadDashboardMetrics(): Promise<LeadDashboardMetrics> {
    const leads = await this.listLeads();
    return computeLeadDashboardMetrics(leads);
  },

  async createLead(
    input: Omit<
      LeadRecord,
      | "id"
      | "status"
      | "isDuplicateFlag"
      | "followUpDate"
      | "notes"
      | "statusHistory"
      | "createdAt"
      | "updatedAt"
    > & {
      status?: LeadRecord["status"];
      followUpDate?: string | null;
      notes?: LeadRecord["notes"];
    }
  ): Promise<LeadRecord> {
    const now = new Date().toISOString();
    const normalizedEmail = input.email.trim().toLowerCase();
    const isDuplicateFlag = await runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ exists: boolean }[]>`
          SELECT EXISTS(
            SELECT 1 FROM leads WHERE LOWER(email) = ${normalizedEmail}
          ) AS exists
        `;
        return Boolean(rows[0]?.exists);
      },
      () =>
        readLocalSnapshot().leads.some(
          (l) => l.email.toLowerCase() === normalizedEmail
        )
    );
    const initialStatus = input.status || "New";

    const lead: LeadRecord = normalizeLeadRecord({
      ...input,
      email: normalizedEmail,
      id: `lead_${randomBytes(8).toString("hex")}`,
      status: initialStatus,
      priority: input.priority || "Medium",
      proposalValue:
        typeof input.proposalValue === "number" && Number.isFinite(input.proposalValue)
          ? input.proposalValue
          : null,
      expectedClosingDate: input.expectedClosingDate || null,
      lostReason: input.lostReason || null,
      isDuplicateFlag,
      followUpDate: input.followUpDate ?? null,
      notes: input.notes || [],
      statusHistory: [
        {
          from: null,
          to: initialStatus,
          changedAt: now,
          changedBy:
            input.source === "csv_import" ? "csv_import" : "public_submission",
          note: isDuplicateFlag
            ? "Enquiry received (existing contact email flagged for unified follow-up)."
            : input.source === "csv_import"
              ? "Lead imported via Admin CRM CSV batch."
              : "Initial enquiry received via website.",
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return runWithDbFallback(
      async (sql) => {
        try {
          await sql`
            INSERT INTO leads (
              id, name, email, company, website, industry, interested_service,
              business_problem, budget_range, timeline, additional_details,
              privacy_consent, status, priority, proposal_value,
              expected_closing_date, lost_reason, source, is_duplicate_flag,
              follow_up_date, email_notification_status, notes, status_history,
              created_at, updated_at
            ) VALUES (
              ${lead.id}, ${lead.name}, ${lead.email}, ${lead.company},
              ${lead.website ?? null}, ${lead.industry}, ${lead.interestedService},
              ${lead.businessProblem}, ${lead.budgetRange ?? null}, ${lead.timeline ?? null},
              ${lead.additionalDetails ?? null}, ${lead.privacyConsent}, ${lead.status},
              ${lead.priority ?? "Medium"}, ${lead.proposalValue ?? null},
              ${lead.expectedClosingDate ?? null}, ${lead.lostReason ?? null},
              ${lead.source}, ${lead.isDuplicateFlag}, ${lead.followUpDate},
              ${lead.emailNotificationStatus},
              ${sql.json(lead.notes as unknown as postgres.JSONValue)},
              ${sql.json(lead.statusHistory as unknown as postgres.JSONValue)},
              ${lead.createdAt}, ${lead.updatedAt}
            )
          `;
        } catch (err) {
          const pgCode = (err as { code?: string })?.code;
          if (pgCode !== "42703") throw err;
          await sql`
            INSERT INTO leads (
              id, name, email, company, website, industry, interested_service,
              business_problem, budget_range, timeline, additional_details,
              privacy_consent, status, source, is_duplicate_flag, follow_up_date,
              email_notification_status, notes, status_history, created_at, updated_at
            ) VALUES (
              ${lead.id}, ${lead.name}, ${lead.email}, ${lead.company},
              ${lead.website ?? null}, ${lead.industry}, ${lead.interestedService},
              ${lead.businessProblem}, ${lead.budgetRange ?? null}, ${lead.timeline ?? null},
              ${lead.additionalDetails ?? null}, ${lead.privacyConsent}, ${lead.status},
              ${lead.source}, ${lead.isDuplicateFlag}, ${lead.followUpDate},
              ${lead.emailNotificationStatus},
              ${sql.json(lead.notes as unknown as postgres.JSONValue)},
              ${sql.json(lead.statusHistory as unknown as postgres.JSONValue)},
              ${lead.createdAt}, ${lead.updatedAt}
            )
          `;
        }
        return lead;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.leads.unshift(lead);
        writeLocalSnapshot(snap);
        return lead;
      }
    );
  },

  async getLeadById(id: string): Promise<LeadRecord | null> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<PostgresLeadRow[]>`
          SELECT * FROM leads WHERE id = ${id} LIMIT 1
        `;
        return rows[0] ? mapPostgresLeadRow(rows[0]) : null;
      },
      () => {
        const match = readLocalSnapshot().leads.find((l) => l.id === id);
        return match ? normalizeLeadRecord(match) : null;
      }
    );
  },

  async updateLead(
    id: string,
    updater: (current: LeadRecord) => LeadRecord
  ): Promise<LeadRecord | null> {
    const current = await this.getLeadById(id);
    if (!current) return null;

    const updated: LeadRecord = normalizeLeadRecord({
      ...updater(current),
      id: current.id,
      updatedAt: new Date().toISOString(),
    });

    return runWithDbFallback(
      async (sql) => {
        try {
          await sql`
            UPDATE leads
            SET
              status = ${updated.status},
              priority = ${updated.priority ?? "Medium"},
              proposal_value = ${updated.proposalValue ?? null},
              expected_closing_date = ${updated.expectedClosingDate ?? null},
              lost_reason = ${updated.lostReason ?? null},
              is_duplicate_flag = ${updated.isDuplicateFlag},
              follow_up_date = ${updated.followUpDate},
              notes = ${sql.json(updated.notes as unknown as postgres.JSONValue)},
              status_history = ${sql.json(updated.statusHistory as unknown as postgres.JSONValue)},
              updated_at = ${updated.updatedAt}
            WHERE id = ${id}
          `;
        } catch (err) {
          const pgCode = (err as { code?: string })?.code;
          if (pgCode !== "42703") throw err;
          await sql`
            UPDATE leads
            SET
              status = ${updated.status},
              is_duplicate_flag = ${updated.isDuplicateFlag},
              follow_up_date = ${updated.followUpDate},
              notes = ${sql.json(updated.notes as unknown as postgres.JSONValue)},
              status_history = ${sql.json(updated.statusHistory as unknown as postgres.JSONValue)},
              updated_at = ${updated.updatedAt}
            WHERE id = ${id}
          `;
        }
        return updated;
      },
      () => {
        const snap = readLocalSnapshot();
        const index = snap.leads.findIndex((l) => l.id === id);
        if (index === -1) return null;
        snap.leads[index] = updated;
        writeLocalSnapshot(snap);
        return updated;
      }
    );
  },

  async listMediaAssets(): Promise<MediaAsset[]> {
    const assets = await runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: MediaAsset }[]>`
          SELECT payload FROM media_assets ORDER BY created_at DESC
        `;
        return rows.map((r) => r.payload);
      },
      () => readLocalSnapshot().mediaAssets
    );

    if (assets.length === 0) {
      return [];
    }

    const [brand, posts, members, pages, services, caseStudies] =
      await Promise.all([
        this.getBrandAssets(),
        this.listBlogPosts(false),
        this.listTeamMembers(false),
        this.listPages(),
        this.listServices(false),
        this.listCaseStudies(false),
      ]);

    // Pre-serialize structured payloads once instead of O(assets * entities) JSON.stringify calls
    const serializedPages = pages.map((pg) => ({
      label: `Page: /${pg.slug === "home" ? "" : pg.slug}`,
      raw: JSON.stringify(pg),
    }));
    const serializedServices = services.map((s) => ({
      label: `Service: ${s.slug}`,
      raw: JSON.stringify(s),
    }));
    const serializedCaseStudies = caseStudies.map((cs) => ({
      label: `Case Study: ${cs.slug}`,
      raw: JSON.stringify(cs),
    }));

    return assets.map((asset) => {
      const usedIn: string[] = [];
      if (brand.lightLogoUrl === asset.url) usedIn.push("Brand: Light Logo");
      if (brand.darkLogoUrl === asset.url) usedIn.push("Brand: Dark Logo");
      if (brand.symbolUrl === asset.url) usedIn.push("Brand: Symbol");
      if (brand.faviconUrl === asset.url) usedIn.push("Brand: Favicon");
      if (brand.ogImageUrl === asset.url) usedIn.push("Brand: OG Image");

      for (const p of posts) {
        if (
          p.featuredImageUrl === asset.url ||
          p.contentMarkdown.includes(asset.url)
        ) {
          usedIn.push(`Blog: ${p.slug}`);
        }
      }
      for (const m of members) {
        if (m.avatarUrl === asset.url) {
          usedIn.push(`Team: ${m.name}`);
        }
      }
      for (const pg of serializedPages) {
        if (pg.raw.includes(asset.url)) {
          usedIn.push(pg.label);
        }
      }
      for (const s of serializedServices) {
        if (s.raw.includes(asset.url)) {
          usedIn.push(s.label);
        }
      }
      for (const cs of serializedCaseStudies) {
        if (cs.raw.includes(asset.url)) {
          usedIn.push(cs.label);
        }
      }
      return { ...asset, usedIn };
    });
  },

  async saveMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO media_assets (id, filename, mime_type, size_bytes, url, storage_provider, category, payload, created_at)
          VALUES (
            ${asset.id},
            ${asset.filename},
            ${asset.mimeType},
            ${asset.sizeBytes},
            ${asset.url},
            ${asset.storageProvider},
            ${asset.category},
            ${sql.json(asset as unknown as postgres.JSONValue)},
            ${asset.createdAt}
          )
        `;
        return asset;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.mediaAssets.unshift(asset);
        writeLocalSnapshot(snap);
        return asset;
      }
    );
  },

  async updateMediaAssetMeta(
    id: string,
    patch: { altText?: string; category?: MediaAsset["category"] }
  ): Promise<MediaAsset | null> {
    const all = await this.listMediaAssets();
    const current = all.find((a) => a.id === id);
    if (!current) return null;

    const updated: MediaAsset = {
      ...current,
      altText: patch.altText !== undefined ? patch.altText : current.altText,
      category:
        patch.category !== undefined ? patch.category : current.category,
    };

    return runWithDbFallback(
      async (sql) => {
        await sql`
          UPDATE media_assets
          SET category = ${updated.category}, payload = ${sql.json(updated as unknown as postgres.JSONValue)}
          WHERE id = ${id}
        `;
        return updated;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.mediaAssets.findIndex((a) => a.id === id);
        if (idx === -1) return null;
        snap.mediaAssets[idx] = updated;
        writeLocalSnapshot(snap);
        return updated;
      }
    );
  },

  async deleteMediaAsset(id: string): Promise<MediaAsset | null> {
    const all = await this.listMediaAssets();
    const target = all.find((a) => a.id === id);
    if (!target) return null;

    return runWithDbFallback(
      async (sql) => {
        await sql`DELETE FROM media_assets WHERE id = ${id}`;
        return target;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.mediaAssets = snap.mediaAssets.filter((a) => a.id !== id);
        writeLocalSnapshot(snap);
        return target;
      }
    );
  },

  async listRedirects(): Promise<RedirectRule[]> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<
          {
            id: string;
            source_path: string;
            destination_path: string;
            permanent: boolean;
            is_active: boolean;
            created_at: unknown;
          }[]
        >`SELECT * FROM redirects ORDER BY created_at DESC`;
        return rows.map((r) => ({
          id: r.id,
          sourcePath: r.source_path,
          destinationPath: r.destination_path,
          permanent: r.permanent,
          isActive: r.is_active,
          createdAt: normalizePgIsoTimestamp(r.created_at),
        }));
      },
      () => readLocalSnapshot().redirects
    );
  },

  async findActiveRedirect(pathname: string): Promise<RedirectRule | null> {
    const clean = pathname.trim();
    if (!clean || clean === "/") return null;
    // Skip static file / icon / asset extensions so browser /favicon.* requests never query redirects
    if (/\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|woff2?|ttf|txt|xml)$/i.test(clean)) {
      return null;
    }
    return dedupeInFlight(`redirect_${clean}`, () =>
      runWithDbFallback(
        async (sql) => {
          const catalog = await loadPostgresPublicCatalogBundle(sql);
          const match = catalog.activeRedirects.find(
            (r) =>
              r.isActive &&
              r.sourcePath === clean &&
              r.destinationPath !== clean
          );
          return match ?? null;
        },
        () =>
          readLocalSnapshot().redirects.find(
            (r) =>
              r.isActive &&
              r.sourcePath === clean &&
              r.destinationPath !== clean
          ) ?? null
      )
    );
  },

  async upsertRedirect(rule: RedirectRule): Promise<RedirectRule> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO redirects (id, source_path, destination_path, permanent, is_active, created_at)
          VALUES (
            ${rule.id},
            ${rule.sourcePath},
            ${rule.destinationPath},
            ${rule.permanent},
            ${rule.isActive},
            ${rule.createdAt}
          )
          ON CONFLICT (source_path) DO UPDATE SET
            destination_path = EXCLUDED.destination_path,
            permanent = EXCLUDED.permanent,
            is_active = EXCLUDED.is_active
        `;
        invalidatePgPublicCatalog();
        return rule;
      },
      () => {
        const snap = readLocalSnapshot();
        const idx = snap.redirects.findIndex(
          (r) => r.id === rule.id || r.sourcePath === rule.sourcePath
        );
        if (idx >= 0) {
          snap.redirects[idx] = { ...rule, id: snap.redirects[idx].id };
          writeLocalSnapshot(snap);
          return snap.redirects[idx];
        }
        snap.redirects.unshift(rule);
        writeLocalSnapshot(snap);
        return rule;
      }
    );
  },

  async deleteRedirect(id: string): Promise<boolean> {
    invalidatePgPublicCatalog();
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM redirects WHERE id = ${id}`;
        invalidatePgPublicCatalog();
        return res.count > 0;
      },
      () => {
        const snap = readLocalSnapshot();
        const before = snap.redirects.length;
        snap.redirects = snap.redirects.filter((r) => r.id !== id);
        if (snap.redirects.length === before) return false;
        writeLocalSnapshot(snap);
        return true;
      }
    );
  },

  async recordAuditLog(
    entry: Omit<AuditLogEntry, "id" | "createdAt">
  ): Promise<AuditLogEntry> {
    const complete: AuditLogEntry = {
      ...entry,
      id: `aud_${randomBytes(8).toString("hex")}`,
      createdAt: new Date().toISOString(),
    };
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, entity_type, entity_id, summary, ip_address, created_at)
          VALUES (
            ${complete.id},
            ${complete.actorId},
            ${complete.actorEmail},
            ${complete.actorRole},
            ${complete.action},
            ${complete.entityType},
            ${complete.entityId ?? null},
            ${complete.summary},
            ${complete.ipAddress ?? null},
            ${complete.createdAt}
          )
        `;
        return complete;
      },
      () => {
        const snap = readLocalSnapshot();
        snap.auditLogs.unshift(complete);
        snap.auditLogs = snap.auditLogs.slice(0, 500);
        writeLocalSnapshot(snap);
        return complete;
      }
    );
  },

  async listAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    return dedupeInFlight(`audit_logs_${limit}`, () =>
      runWithDbFallback(
        async (sql) => {
          const rows = await sql<
            {
              id: string;
              actor_id: string;
              actor_email: string;
              actor_role: AuditLogEntry["actorRole"];
              action: string;
              entity_type: string;
              entity_id: string | null;
              summary: string;
              ip_address: string | null;
              created_at: unknown;
            }[]
          >`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${limit}`;
          return rows.map((r) => ({
            id: r.id,
            actorId: r.actor_id,
            actorEmail: r.actor_email,
            actorRole: r.actor_role,
            action: r.action,
            entityType: r.entity_type,
            entityId: r.entity_id ?? undefined,
            summary: r.summary,
            ipAddress: r.ip_address ?? undefined,
            createdAt: normalizePgIsoTimestamp(r.created_at),
          }));
        },
        () => readLocalSnapshot().auditLogs.slice(0, limit)
      )
    );
  },

  getRecentErrors(): DatabaseErrorEvent[] {
    return [...recentDbErrors];
  },

  async verifyHealth(): Promise<DatabaseHealthVerification> {
    const startMs = Date.now();
    const strictProd = isProductionEnvironment();
    const rawUrl = process.env.DATABASE_URL?.trim() || "";

    if (isPlaceholderDatabaseUrl(rawUrl)) {
      if (strictProd) {
        return {
          driver: "unconfigured_production",
          connected: false,
          schemaReady: false,
          appliedMigrations: [],
          missingTables: [...REQUIRED_POSTGRES_TABLES],
          missingColumns: [...REQUIRED_USER_COLUMNS],
          latencyMs: Date.now() - startMs,
          backupCount: 0,
          lastBackupAt: null,
          recentErrorCount: recentDbErrors.length,
          errorCode: "DB_MISSING_URL",
          message:
            "DATABASE_URL is not configured. Production requires Supabase PostgreSQL.",
        };
      }

      const snap = readLocalSnapshot();
      const backups = snap.databaseBackups || [];
      return {
        driver: "local_file_fallback",
        connected: true,
        schemaReady: true,
        appliedMigrations: [
          "0001_omniflow_schema",
          "0002_production_upgrade",
          "0003_crm_and_operations",
          "0004_security_and_performance",
        ],
        missingTables: [],
        missingColumns: [],
        latencyMs: Date.now() - startMs,
        backupCount: backups.length,
        lastBackupAt: backups[0]?.createdAt ?? null,
        recentErrorCount: recentDbErrors.length,
        message: "Local development JSON store active.",
      };
    }

    const sql = getPostgresClient();
    if (!sql) {
      return {
        driver: strictProd ? "unconfigured_production" : "local_file_fallback",
        connected: !strictProd,
        schemaReady: !strictProd,
        appliedMigrations: strictProd
          ? []
          : [
              "0001_omniflow_schema",
              "0002_production_upgrade",
              "0003_crm_and_operations",
              "0004_security_and_performance",
            ],
        missingTables: strictProd ? [...REQUIRED_POSTGRES_TABLES] : [],
        missingColumns: strictProd ? [...REQUIRED_USER_COLUMNS] : [],
        latencyMs: Date.now() - startMs,
        backupCount: 0,
        lastBackupAt: null,
        recentErrorCount: recentDbErrors.length,
        errorCode: strictProd ? "DB_CONNECTION_FAILED" : undefined,
        message: strictProd
          ? "PostgreSQL client unavailable."
          : "Local fallback active while PostgreSQL host is unreachable.",
      };
    }

    try {
      const verification = await withPgConcurrencySlot(() =>
        withHardDbTimeout(
          (async () => {
            await sql`SELECT 1`;

          const tableRows = await sql<{ table_name: string }[]>`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
          `;
          const presentTables = new Set(tableRows.map((r) => r.table_name));
          const missingTables = REQUIRED_POSTGRES_TABLES.filter(
            (t) => !presentTables.has(t)
          );

          const colRows = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
          `;
          const presentCols = new Set(colRows.map((r) => r.column_name));
          const missingColumns = REQUIRED_USER_COLUMNS.filter(
            (c) => !presentCols.has(c)
          );

          const rateColumns = await sql<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'rate_limits'
          `;
          const presentRateColumns = new Set(rateColumns.map((r) => r.column_name));
          const missingRateColumns = REQUIRED_RATE_LIMIT_COLUMNS.filter((c) => !presentRateColumns.has(c));

          let appliedMigrations: string[] = [];
          if (presentTables.has("schema_migrations")) {
            const migRows = await sql<{ version: string }[]>`
              SELECT version FROM schema_migrations ORDER BY version ASC
            `;
            appliedMigrations = migRows.map((m) => m.version);
          }

          let backupCount = 0;
          let lastBackupAt: string | null = null;
          if (presentTables.has("database_backups")) {
            const bRows = await sql<
              { cnt: number; latest: string | null }[]
            >`
              SELECT count(*)::int AS cnt, max(created_at)::text AS latest FROM database_backups
            `;
            backupCount = bRows[0]?.cnt ?? 0;
            lastBackupAt = bRows[0]?.latest ?? null;
          }

          const missingMigrations = REQUIRED_MIGRATIONS.filter((version) => !appliedMigrations.includes(version));
          const schemaReady = missingTables.length === 0 && missingColumns.length === 0 &&
            missingRateColumns.length === 0 && missingMigrations.length === 0;

          return {
            driver: "supabase_postgres" as const,
            connected: true,
            schemaReady,
            appliedMigrations,
            missingTables,
            missingColumns: [...missingColumns.map((c) => `users.${c}`), ...missingRateColumns.map((c) => `rate_limits.${c}`)],
            missingMigrations: [...missingMigrations],
            latencyMs: Date.now() - startMs,
            backupCount,
            lastBackupAt,
            recentErrorCount: recentDbErrors.length,
            errorCode: schemaReady
              ? undefined
              : ("DB_SCHEMA_MISSING" as DatabaseFailureCode),
            message: schemaReady
              ? "PostgreSQL connected and all schema migrations verified."
              : `PostgreSQL connected, but schema migration is incomplete (${[
                  ...missingTables,
                  ...missingColumns.map((c) => `users.${c}`),
                  ...missingRateColumns.map((c) => `rate_limits.${c}`),
                  ...missingMigrations.map((v) => `migration:${v}`),
                ].join(", ")}).`,
          };
          })(),
          5_000
        )
      );

      return verification;
    } catch (err) {
      const classified = classifyDatabaseError(err);
      recordSanitizedDbError(classified.code, classified.publicMessage);
      return {
        driver: "supabase_postgres",
        connected: false,
        schemaReady: false,
        appliedMigrations: [],
        missingTables: [],
        missingColumns: [],
        latencyMs: Date.now() - startMs,
        backupCount: 0,
        lastBackupAt: null,
        recentErrorCount: recentDbErrors.length,
        errorCode: classified.code,
        message: classified.publicMessage,
      };
    }
  },

  async exportSnapshot(options?: {
    redactPasswordHashes?: boolean;
  }): Promise<{
    snapshot: Omit<OmniFlowDatabaseSnapshot, "databaseBackups">;
    checksumSha256: string;
    sizeBytes: number;
  }> {
    const [
      siteSettings,
      themeConfig,
      brandAssets,
      servicePillars,
      services,
      caseStudies,
      blogPosts,
      faqs,
      testimonials,
      teamMembers,
      pages,
      leads,
      mediaAssets,
      redirects,
      auditLogs,
    ] = await Promise.all([
      this.getSiteSettings(),
      this.getThemeConfig(),
      this.getBrandAssets(),
      this.getServicePillars(),
      this.listServices(false),
      this.listCaseStudies(false),
      this.listBlogPosts(false),
      this.listFaqs(false),
      this.listTestimonials(false),
      this.listTeamMembers(false),
      this.listPages(),
      this.listLeads(),
      this.listMediaAssets(),
      this.listRedirects(),
      this.listAuditLogs(200),
    ]);

    const rawUsers = await runWithDbFallback<UserRecord[]>(
      async (sql) => {
        const rows = await sql<
          {
            id: string;
            email: string;
            name: string;
            role: UserRecord["role"];
            password_hash: string;
            is_active: boolean;
            must_change_password?: boolean;
            session_version?: number;
            password_changed_at?: string | null;
            created_at: string;
            updated_at: string;
            last_login_at: string | null;
          }[]
        >`SELECT * FROM users ORDER BY created_at ASC`;
        return rows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          passwordHash: options?.redactPasswordHashes
            ? "[REDACTED]"
            : r.password_hash,
          isActive: r.is_active,
          mustChangePassword: Boolean(r.must_change_password),
          sessionVersion: r.session_version ?? 1,
          passwordChangedAt: normalizePgNullableIsoTimestamp(
            r.password_changed_at
          ),
          recoveryTokenHash: null,
          recoveryExpiresAt: null,
          createdAt: normalizePgIsoTimestamp(r.created_at),
          updatedAt: normalizePgIsoTimestamp(r.updated_at),
          lastLoginAt: normalizePgNullableIsoTimestamp(r.last_login_at),
        }));
      },
      () =>
        readLocalSnapshot().users.map((u) => ({
          ...u,
          passwordHash: options?.redactPasswordHashes
            ? "[REDACTED]"
            : u.passwordHash,
          recoveryTokenHash: null,
          recoveryExpiresAt: null,
        }))
    );

    const snapshot: Omit<OmniFlowDatabaseSnapshot, "databaseBackups"> = {
      schemaVersion: CURRENT_SEED_VERSION,
      users: rawUsers,
      auditLogs,
      siteSettings,
      themeConfig,
      brandAssets,
      servicePillars,
      services,
      caseStudies,
      blogPosts,
      faqs,
      testimonials,
      teamMembers,
      pages,
      leads,
      mediaAssets,
      redirects,
    };

    const serialized = JSON.stringify(snapshot);
    const sizeBytes = Buffer.byteLength(serialized, "utf8");
    const checksumSha256 = createHash("sha256")
      .update(serialized, "utf8")
      .digest("hex");

    return { snapshot, checksumSha256, sizeBytes };
  },

  async listBackups(): Promise<DatabaseBackupSummary[]> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<
          {
            id: string;
            label: string;
            created_by: string;
            schema_version: number;
            size_bytes: number;
            checksum_sha256: string;
            created_at: string;
          }[]
        >`
          SELECT id, label, created_by, schema_version, size_bytes, checksum_sha256, created_at
          FROM database_backups
          ORDER BY created_at DESC
          LIMIT 25
        `;
        return rows.map((r) => ({
          id: r.id,
          label: r.label,
          createdBy: r.created_by,
          schemaVersion: r.schema_version,
          sizeBytes: r.size_bytes,
          checksumSha256: r.checksum_sha256,
          createdAt: normalizePgIsoTimestamp(r.created_at),
        }));
      },
      () =>
        (readLocalSnapshot().databaseBackups || []).map(
          ({ snapshot: _unused, ...meta }) => {
            void _unused;
            return meta;
          }
        )
    );
  },

  async createBackup(input: {
    label: string;
    createdBy: string;
  }): Promise<DatabaseBackupSummary> {
    const exported = await this.exportSnapshot({ redactPasswordHashes: false });
    const entry: StoredDatabaseBackup = {
      id: `bkp_${randomBytes(6).toString("hex")}`,
      label: input.label.trim().slice(0, 120) || "Manual Snapshot",
      createdBy: input.createdBy,
      schemaVersion: CURRENT_SEED_VERSION,
      sizeBytes: exported.sizeBytes,
      checksumSha256: exported.checksumSha256,
      createdAt: new Date().toISOString(),
      snapshot: exported.snapshot,
    };

    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO database_backups (
            id, label, created_by, schema_version, size_bytes, checksum_sha256, snapshot, created_at
          )
          VALUES (
            ${entry.id},
            ${entry.label},
            ${entry.createdBy},
            ${entry.schemaVersion},
            ${entry.sizeBytes},
            ${entry.checksumSha256},
            ${sql.json(entry.snapshot as unknown as postgres.JSONValue)},
            ${entry.createdAt}
          )
        `;
        const { snapshot: _unused, ...summary } = entry;
        void _unused;
        return summary;
      },
      () => {
        const snap = readLocalSnapshot();
        const existing = snap.databaseBackups || [];
        snap.databaseBackups = [entry, ...existing].slice(0, 20);
        writeLocalSnapshot(snap);
        const { snapshot: _unused, ...summary } = entry;
        void _unused;
        return summary;
      }
    );
  },

  async restoreBackup(
    backupId: string,
    actorEmail: string
  ): Promise<{ restoredId: string; safetyBackupId: string }> {
    // 1. Always capture a pre-restore safety backup first so no records can ever be lost
    const safetyBackup = await this.createBackup({
      label: `Auto Pre-Restore Safety Snapshot (before ${backupId})`,
      createdBy: actorEmail,
    });

    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<
          {
            id: string;
            checksum_sha256: string;
            snapshot: Omit<OmniFlowDatabaseSnapshot, "databaseBackups">;
          }[]
        >`
          SELECT id, checksum_sha256, snapshot
          FROM database_backups
          WHERE id = ${backupId}
          LIMIT 1
        `;
        const row = rows[0];
        if (!row) {
          throw new Error("Backup snapshot not found.");
        }

        const serialized = JSON.stringify(row.snapshot);
        const computedChecksum = createHash("sha256")
          .update(serialized, "utf8")
          .digest("hex");
        if (computedChecksum !== row.checksum_sha256) {
          throw new Error(
            "Backup integrity check failed (SHA-256 mismatch). Restore aborted safely."
          );
        }

        const data = row.snapshot;
        invalidatePgKvBundle();
        invalidatePgPublicCatalog();
        // 2. Restore inside a single atomic PostgreSQL transaction (merges safely without dropping active admins or leads)
        await sql.begin(async (txRaw) => {
          const tx = txRaw as unknown as ReturnType<typeof postgres>;
          await tx`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES
              ('site_settings', ${tx.json(data.siteSettings as unknown as postgres.JSONValue)}, NOW()),
              ('theme_config', ${tx.json(data.themeConfig as unknown as postgres.JSONValue)}, NOW()),
              ('brand_assets', ${tx.json(data.brandAssets as unknown as postgres.JSONValue)}, NOW()),
              ('service_pillars', ${tx.json(data.servicePillars as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;

          for (const page of data.pages || []) {
            await tx`
              INSERT INTO pages (id, slug, title, status, payload, updated_at)
              VALUES (
                ${page.id},
                ${page.slug},
                ${page.title},
                ${page.status},
                ${tx.json(page as unknown as postgres.JSONValue)},
                ${page.updatedAt}
              )
              ON CONFLICT (id) DO UPDATE SET
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                status = EXCLUDED.status,
                payload = EXCLUDED.payload,
                updated_at = EXCLUDED.updated_at
            `;
          }

          for (const svc of data.services || []) {
            await tx`
              INSERT INTO services (id, slug, title, category_slug, is_flagship_priority, status, sort_order, payload, updated_at)
              VALUES (
                ${svc.id},
                ${svc.slug},
                ${svc.title},
                ${svc.categorySlug},
                ${svc.isFlagshipPriority},
                ${svc.status},
                ${svc.order},
                ${tx.json(svc as unknown as postgres.JSONValue)},
                ${svc.updatedAt}
              )
              ON CONFLICT (id) DO UPDATE SET
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                category_slug = EXCLUDED.category_slug,
                is_flagship_priority = EXCLUDED.is_flagship_priority,
                status = EXCLUDED.status,
                sort_order = EXCLUDED.sort_order,
                payload = EXCLUDED.payload,
                updated_at = EXCLUDED.updated_at
            `;
          }

          for (const cs of data.caseStudies || []) {
            await tx`
              INSERT INTO case_studies (id, slug, title, work_type, status, payload, updated_at)
              VALUES (
                ${cs.id},
                ${cs.slug},
                ${cs.title},
                ${cs.workType},
                ${cs.status},
                ${tx.json(cs as unknown as postgres.JSONValue)},
                ${cs.updatedAt}
              )
              ON CONFLICT (id) DO UPDATE SET
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                work_type = EXCLUDED.work_type,
                status = EXCLUDED.status,
                payload = EXCLUDED.payload,
                updated_at = EXCLUDED.updated_at
            `;
          }

          for (const post of data.blogPosts || []) {
            await tx`
              INSERT INTO blog_posts (id, slug, title, category, author_id, status, published_at, payload, updated_at)
              VALUES (
                ${post.id},
                ${post.slug},
                ${post.title},
                ${post.category},
                ${post.authorId},
                ${post.status},
                ${post.publishedAt ?? null},
                ${tx.json(post as unknown as postgres.JSONValue)},
                ${post.updatedAt}
              )
              ON CONFLICT (id) DO UPDATE SET
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                category = EXCLUDED.category,
                status = EXCLUDED.status,
                published_at = EXCLUDED.published_at,
                payload = EXCLUDED.payload,
                updated_at = EXCLUDED.updated_at
            `;
          }

          for (const faq of data.faqs || []) {
            await tx`
              INSERT INTO faqs (id, category, sort_order, is_published, question, answer)
              VALUES (${faq.id}, ${faq.category}, ${faq.order}, ${faq.isPublished}, ${faq.question}, ${faq.answer})
              ON CONFLICT (id) DO UPDATE SET
                category = EXCLUDED.category,
                sort_order = EXCLUDED.sort_order,
                is_published = EXCLUDED.is_published,
                question = EXCLUDED.question,
                answer = EXCLUDED.answer
            `;
          }

          for (const rdr of data.redirects || []) {
            await tx`
              INSERT INTO redirects (id, source_path, destination_path, permanent, is_active, created_at)
              VALUES (${rdr.id}, ${rdr.sourcePath}, ${rdr.destinationPath}, ${rdr.permanent}, ${rdr.isActive}, ${rdr.createdAt})
              ON CONFLICT (source_path) DO UPDATE SET
                destination_path = EXCLUDED.destination_path,
                permanent = EXCLUDED.permanent,
                is_active = EXCLUDED.is_active
            `;
          }
        });
        invalidatePgKvBundle();
        invalidatePgPublicCatalog();

        return { restoredId: backupId, safetyBackupId: safetyBackup.id };
      },
      () => {
        const snap = readLocalSnapshot();
        const backups = snap.databaseBackups || [];
        const target = backups.find((b) => b.id === backupId);
        if (!target) {
          throw new Error("Backup snapshot not found.");
        }
        const computedChecksum = createHash("sha256")
          .update(JSON.stringify(target.snapshot), "utf8")
          .digest("hex");
        if (computedChecksum !== target.checksumSha256) {
          throw new Error(
            "Backup integrity check failed (SHA-256 mismatch). Restore aborted safely."
          );
        }

        // Preserve existing users & leads that aren't in the older snapshot so no live leads or staff lockouts occur
        const mergedUsers = mergeByKey(
          snap.users,
          target.snapshot.users || [],
          (u) => u.id
        );
        const mergedLeads = mergeByKey(
          snap.leads,
          target.snapshot.leads || [],
          (l) => l.id
        );

        const nextSnap: OmniFlowDatabaseSnapshot = {
          ...target.snapshot,
          users: mergedUsers,
          leads: mergedLeads,
          auditLogs: snap.auditLogs,
          databaseBackups: backups,
        };
        writeLocalSnapshot(nextSnap);
        return { restoredId: backupId, safetyBackupId: safetyBackup.id };
      }
    );
  },

  async checkDistributedRateLimitBucket(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number } | null> {
    if (
      !process.env.DATABASE_URL?.trim() ||
      Boolean(process.env.OMNIFLOW_LOCAL_DB_PATH) ||
      Date.now() < postgresFallbackUntil
    ) {
      return null;
    }
    try {
      const sql = getPostgresClient();
      if (!sql) return null;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowMs);

      const rows = await sql<
        Array<{ count: number; expires_at: Date | string }>
      >`
        INSERT INTO rate_limits (bucket_key, count, window_start, expires_at)
        VALUES (${key}, 1, ${now.toISOString()}, ${expiresAt.toISOString()})
        ON CONFLICT (bucket_key) DO UPDATE
        SET
          count = CASE
            WHEN rate_limits.expires_at <= ${now.toISOString()} THEN 1
            ELSE rate_limits.count + 1
          END,
          window_start = CASE
            WHEN rate_limits.expires_at <= ${now.toISOString()} THEN ${now.toISOString()}::timestamptz
            ELSE rate_limits.window_start
          END,
          expires_at = CASE
            WHEN rate_limits.expires_at <= ${now.toISOString()} THEN ${expiresAt.toISOString()}::timestamptz
            ELSE rate_limits.expires_at
          END
        RETURNING count, expires_at
      `;

      const row = rows[0];
      if (!row) return null;
      const count = Number(row.count || 1);
      const expMs = new Date(row.expires_at).getTime();
      const retryAfterSeconds = Math.max(1, Math.ceil((expMs - now.getTime()) / 1000));

      // Opportunistic expired bucket cleanup (~2% of calls)
      if (Math.random() < 0.02) {
        sql`DELETE FROM rate_limits WHERE expires_at < NOW()`.catch(() => undefined);
      }

      if (count > maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds,
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - count),
        retryAfterSeconds: 0,
      };
    } catch {
      return null;
    }
  },

  async listSiteErrorIncidents(): Promise<SiteErrorIncident[]> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: unknown }[]>`
          SELECT payload FROM kv_configs WHERE key = 'site_diagnostics_log' LIMIT 1
        `;
        const list = rows[0]?.payload;
        return Array.isArray(list) ? (list as SiteErrorIncident[]) : [];
      },
      () => readLocalSnapshot().siteErrorIncidents ?? []
    );
  },

  async recordSiteErrorIncident(input: {
    severity?: "critical" | "warning";
    source: SiteErrorIncident["source"];
    route: string;
    message: string;
    digest?: string;
  }): Promise<SiteErrorIncident> {
    const cleanRoute = (input.route || "/").trim().slice(0, 180) || "/";
    const cleanMsg =
      (input.message || "Unexpected runtime error")
        .replace(/[\r\n\t]+/g, " ")
        .trim()
        .slice(0, 320) || "Unexpected runtime error";
    const nowIso = new Date().toISOString();

    return withAtomicKeyLock("site_diagnostics_log", () =>
      runWithDbFallback(
        async (sql) => {
          const rows = await sql<{ payload: unknown }[]>`
            SELECT payload FROM kv_configs WHERE key = 'site_diagnostics_log' LIMIT 1
          `;
          const existing: SiteErrorIncident[] = Array.isArray(rows[0]?.payload)
            ? [...(rows[0].payload as SiteErrorIncident[])]
            : [];
          const matchIdx = existing.findIndex(
            (e) =>
              !e.resolved &&
              e.route === cleanRoute &&
              e.message === cleanMsg &&
              e.source === input.source
          );
          let recorded: SiteErrorIncident;
          if (matchIdx >= 0) {
            recorded = {
              ...existing[matchIdx],
              occurrences: (existing[matchIdx].occurrences || 1) + 1,
              lastSeenAt: nowIso,
            };
            existing.splice(matchIdx, 1);
            existing.unshift(recorded);
          } else {
            recorded = {
              id: `inc_${crypto.randomUUID().slice(0, 10)}`,
              severity: input.severity ?? "critical",
              source: input.source,
              route: cleanRoute,
              message: cleanMsg,
              digest: input.digest?.slice(0, 64),
              occurrences: 1,
              firstSeenAt: nowIso,
              lastSeenAt: nowIso,
              resolved: false,
            };
            existing.unshift(recorded);
          }
          const trimmed = existing.slice(0, 50);
          await sql`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES ('site_diagnostics_log', ${sql.json(trimmed as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
          return recorded;
        },
        () => {
          const snap = readLocalSnapshot();
          const existing = [...(snap.siteErrorIncidents ?? [])];
          const matchIdx = existing.findIndex(
            (e) =>
              !e.resolved &&
              e.route === cleanRoute &&
              e.message === cleanMsg &&
              e.source === input.source
          );
          let recorded: SiteErrorIncident;
          if (matchIdx >= 0) {
            recorded = {
              ...existing[matchIdx],
              occurrences: (existing[matchIdx].occurrences || 1) + 1,
              lastSeenAt: nowIso,
            };
            existing.splice(matchIdx, 1);
            existing.unshift(recorded);
          } else {
            recorded = {
              id: `inc_${crypto.randomUUID().slice(0, 10)}`,
              severity: input.severity ?? "critical",
              source: input.source,
              route: cleanRoute,
              message: cleanMsg,
              digest: input.digest?.slice(0, 64),
              occurrences: 1,
              firstSeenAt: nowIso,
              lastSeenAt: nowIso,
              resolved: false,
            };
            existing.unshift(recorded);
          }
          snap.siteErrorIncidents = existing.slice(0, 50);
          writeLocalSnapshot(snap);
          return recorded;
        }
      )
    );
  },

  async resolveSiteErrorIncidents(options?: {
    incidentId?: string;
    clearAll?: boolean;
  }): Promise<SiteErrorIncident[]> {
    return withAtomicKeyLock("site_diagnostics_log", () =>
      runWithDbFallback(
        async (sql) => {
          if (options?.clearAll) {
            await sql`
              INSERT INTO kv_configs (key, payload, updated_at)
              VALUES ('site_diagnostics_log', ${sql.json([] as unknown as postgres.JSONValue)}, NOW())
              ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
            `;
            return [];
          }
          const rows = await sql<{ payload: unknown }[]>`
            SELECT payload FROM kv_configs WHERE key = 'site_diagnostics_log' LIMIT 1
          `;
          const existing: SiteErrorIncident[] = Array.isArray(rows[0]?.payload)
            ? (rows[0].payload as SiteErrorIncident[])
            : [];
          const next = existing.map((item) =>
            !options?.incidentId || item.id === options.incidentId
              ? { ...item, resolved: true }
              : item
          );
          await sql`
            INSERT INTO kv_configs (key, payload, updated_at)
            VALUES ('site_diagnostics_log', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
            ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
          return next;
        },
        () => {
          const snap = readLocalSnapshot();
          const existing = snap.siteErrorIncidents ?? [];
          const next = options?.clearAll
            ? []
            : existing.map((item) =>
                !options?.incidentId || item.id === options.incidentId
                  ? { ...item, resolved: true }
                  : item
              );
          snap.siteErrorIncidents = next;
          writeLocalSnapshot(snap);
          return next;
        }
      )
    );
  },
};

export type { SiteErrorIncident };
