import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
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
import {
  CURRENT_SEED_VERSION,
  buildBootstrapSuperAdmin,
  createInitialSeedSnapshot,
  type OmniFlowDatabaseSnapshot,
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
  "redirects",
  "schema_migrations",
  "rate_limits",
  "database_backups",
] as const;

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

/**
 * On Vercel Serverless, Supabase Session Pooler (:5432, ~15 client cap) saturates under concurrent
 * Lambda invocations (EMAXCONNSESSION). Upgrading to Transaction Pooler (:6543, 200+ clients)
 * works seamlessly with prepare: false. On local machines, port 5432 is preserved because
 * residential ISPs frequently block non-standard port 6543.
 */
export function normalizeDatabaseUrlForRuntime(
  rawUrl: string,
  options?: { serverless?: boolean }
): string {
  const trimmed = rawUrl.trim();
  const serverless = options?.serverless ?? isServerlessRuntime();
  if (
    serverless &&
    process.env.OMNIFLOW_FORCE_SESSION_POOLER !== "true" &&
    /\.pooler\.supabase\.com:5432\b/i.test(trimmed)
  ) {
    return trimmed.replace(
      /(\.pooler\.supabase\.com):5432\b/i,
      "$1:6543"
    );
  }
  return trimmed;
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
    if (cachedSqlClient) {
      cachedSqlClient.end({ timeout: 0 }).catch(() => undefined);
    }
    cachedSqlUrl = url;
    postgresBootstrapChecked = false;
    postgresBaselineSeeded = false;
    const isSupabaseHost =
      url.includes(".supabase.co") || url.includes(".supabase.com");
    const serverless = isServerlessRuntime();

    cachedSqlClient = postgres(url, {
      max: serverless ? 2 : 4,
      idle_timeout: serverless ? 5 : 15,
      max_lifetime: 60 * 5,
      connect_timeout: 5,
      prepare: false, // Required for Supabase PgBouncer Transaction Pooler (:6543)
      ...(isSupabaseHost ? { ssl: "require" } : {}),
    });
  }
  return cachedSqlClient;
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
      "Database authentication failed. Verify DATABASE_URL credentials in your deployment configuration."
    );
  }

  if (code === "42P01" || code === "42703" || code === "3D000") {
    return new DatabaseUnavailableError(
      "DB_SCHEMA_MISSING",
      "Database schema is missing required tables or columns. Run 0001_omniflow_schema.sql and 0002_production_upgrade.sql in Supabase SQL Editor."
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
    code.startsWith("08") ||
    /getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|CONNECT_TIMEOUT/i.test(message)
  ) {
    return new DatabaseUnavailableError(
      "DB_CONNECTION_FAILED",
      "Database service is currently unreachable. Verify network connectivity and Supabase Pooler configuration."
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
 * Uses ON CONFLICT DO NOTHING so existing production content, users, and leads are NEVER overwritten.
 */
async function ensurePostgresBaselineSeed(
  sql: ReturnType<typeof postgres>
): Promise<void> {
  if (postgresBaselineSeeded) return;

  const existingKv = await sql<{ cnt: number }[]>`
    SELECT count(*)::int AS cnt FROM kv_configs WHERE key = 'site_settings'
  `;
  if ((existingKv[0]?.cnt ?? 0) > 0) {
    postgresBaselineSeeded = true;
    return;
  }

  const initial = createInitialSeedSnapshot();
  await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as ReturnType<typeof postgres>;
    await tx`
      INSERT INTO kv_configs (key, payload, updated_at)
      VALUES
        ('site_settings', ${tx.json(initial.siteSettings as unknown as postgres.JSONValue)}, NOW()),
        ('theme_config', ${tx.json(initial.themeConfig as unknown as postgres.JSONValue)}, NOW()),
        ('brand_assets', ${tx.json(initial.brandAssets as unknown as postgres.JSONValue)}, NOW()),
        ('service_pillars', ${tx.json(initial.servicePillars as unknown as postgres.JSONValue)}, NOW())
      ON CONFLICT (key) DO NOTHING
    `;

    for (const page of initial.pages) {
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
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    for (const svc of initial.services) {
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
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    for (const cs of initial.caseStudies) {
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
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    for (const post of initial.blogPosts) {
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
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    for (const faq of initial.faqs) {
      await tx`
        INSERT INTO faqs (id, category, sort_order, is_published, question, answer)
        VALUES (
          ${faq.id},
          ${faq.category},
          ${faq.order},
          ${faq.isPublished},
          ${faq.question},
          ${faq.answer}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    for (const member of initial.teamMembers) {
      await tx`
        INSERT INTO team_members (id, is_founder, sort_order, is_published, payload)
        VALUES (
          ${member.id},
          ${member.isFounder},
          ${member.order},
          ${member.isPublished},
          ${tx.json(member as unknown as postgres.JSONValue)}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  });

  postgresBaselineSeeded = true;
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

  const sql = getPostgresClient();
  if (sql) {
    try {
      const result = await withHardDbTimeout(
        (async () => {
          await ensurePostgresBaselineSeed(sql);
          return pgOp(sql);
        })(),
        6_000
      );
      if (result !== undefined) {
        return result;
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

      // Production NEVER silently falls back to local JSON or /tmp storage
      if (strictProd) {
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

function upgradeSnapshotIfNeeded(
  snap: OmniFlowDatabaseSnapshot
): OmniFlowDatabaseSnapshot {
  if (snap.schemaVersion && snap.schemaVersion >= CURRENT_SEED_VERSION) {
    return snap;
  }
  const fresh = createInitialSeedSnapshot();
  const hadPhase1AnchorNav = snap.siteSettings?.navigation?.some((n) =>
    n.href.startsWith("/#")
  );
  const missingDemosNav = !snap.siteSettings?.navigation?.some(
    (n) => n.href === "/demos"
  );

  const nextSettings: SiteSettings = hadPhase1AnchorNav
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
    : missingDemosNav
      ? {
          ...snap.siteSettings,
          secondaryCtaLabel: fresh.siteSettings.secondaryCtaLabel,
          secondaryCtaHref: fresh.siteSettings.secondaryCtaHref,
          navigation: mergeByKey(
            snap.siteSettings.navigation || [],
            fresh.siteSettings.navigation,
            (n) => n.href
          ).map((item, idx) => ({ ...item, order: idx + 1 })),
        }
      : snap.siteSettings;

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
    pages: mergeByKey(snap.pages || [], fresh.pages, (p) => p.slug).map((page) => {
      if (page.slug !== "home") return page;
      const freshHome = fresh.pages.find((p) => p.slug === "home");
      if (!freshHome) return page;
      const mergeHomeSections = (existing: typeof page.sections) => {
        const byType = new Map(existing.map((s) => [s.type, s]));
        const canonical = freshHome.sections.map((freshSec, idx) => {
          const prev = byType.get(freshSec.type);
          return prev ? { ...prev, order: idx + 1 } : { ...freshSec, order: idx + 1 };
        });
        const customExtras = existing
          .filter((s) => !freshHome.sections.some((fs) => fs.type === s.type) || s.type === "rich_text")
          .map((s, idx) => ({ ...s, order: canonical.length + idx + 1 }));
        return [...canonical, ...customExtras];
      };
      return {
        ...page,
        sections: mergeHomeSections(page.sections || []),
        draftSections: mergeHomeSections(page.draftSections || page.sections || []),
      };
    }),
  };

  writeLocalSnapshot(upgraded);
  return upgraded;
}

function readLocalSnapshot(): OmniFlowDatabaseSnapshot {
  const filePath = getLocalDbFilePath();
  if (!fs.existsSync(filePath)) {
    if (inMemoryFallbackSnapshot && inMemorySnapshotPath === filePath) {
      return inMemoryFallbackSnapshot;
    }
    const initial = createInitialSeedSnapshot();
    writeLocalSnapshot(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as OmniFlowDatabaseSnapshot;
    const ready = upgradeSnapshotIfNeeded(parsed);
    inMemoryFallbackSnapshot = ready;
    inMemorySnapshotPath = filePath;
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
  } catch {
    // Dev/build fallback only; strict production never reaches writeLocalSnapshot
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

export const db = {
  getMode(): DatabaseDriverMode {
    return getActiveDatabaseMode();
  },

  async getSiteSettings(): Promise<SiteSettings> {
    return dedupeInFlight("site_settings", () =>
      runWithDbFallback(
        async (sql) => {
          const rows = await sql<{ payload: SiteSettings }[]>`
            SELECT payload FROM kv_configs WHERE key = 'site_settings' LIMIT 1
          `;
          return rows[0]?.payload;
        },
        () => readLocalSnapshot().siteSettings
      )
    );
  },

  async saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    const next = { ...settings, updatedAt: new Date().toISOString() };
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('site_settings', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
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
          const rows = await sql<{ payload: ThemeConfiguration }[]>`
            SELECT payload FROM kv_configs WHERE key = 'theme_config' LIMIT 1
          `;
          if (!rows[0]?.payload) return undefined;
          const { config, upgraded } = normalizeStoredThemeConfig(rows[0].payload);
          if (upgraded) {
            await sql`
              INSERT INTO kv_configs (key, payload, updated_at)
              VALUES ('theme_config', ${sql.json(config as unknown as postgres.JSONValue)}, NOW())
              ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
            `.catch(() => undefined);
          }
          return config;
        },
        () => readLocalSnapshot().themeConfig
      )
    );
  },

  async saveThemeConfig(
    config: ThemeConfiguration
  ): Promise<ThemeConfiguration> {
    const next = { ...config, updatedAt: new Date().toISOString() };
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('theme_config', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
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
          const rows = await sql<{ payload: BrandAssetConfig }[]>`
            SELECT payload FROM kv_configs WHERE key = 'brand_assets' LIMIT 1
          `;
          return rows[0]?.payload;
        },
        () => readLocalSnapshot().brandAssets
      )
    );
  },

  async saveBrandAssets(assets: BrandAssetConfig): Promise<BrandAssetConfig> {
    const next = { ...assets, updatedAt: new Date().toISOString() };
    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO kv_configs (key, payload, updated_at)
          VALUES ('brand_assets', ${sql.json(next as unknown as postgres.JSONValue)}, NOW())
          ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: ServiceCategoryPillar[] }[]>`
          SELECT payload FROM kv_configs WHERE key = 'service_pillars' LIMIT 1
        `;
        return rows[0]?.payload;
      },
      () => readLocalSnapshot().servicePillars
    );
  },

  async listServices(onlyPublished = false): Promise<ServiceItem[]> {
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublished
          ? await sql<{ payload: ServiceItem }[]>`
              SELECT payload FROM services WHERE status = 'published' ORDER BY sort_order ASC
            `
          : await sql<{ payload: ServiceItem }[]>`
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
    );
  },

  async getServiceBySlug(slug: string): Promise<ServiceItem | null> {
    const all = await this.listServices(false);
    return all.find((s) => s.slug === slug) ?? null;
  },

  async upsertService(service: ServiceItem): Promise<ServiceItem> {
    const next: ServiceItem = {
      ...service,
      updatedAt: new Date().toISOString(),
    };
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM services WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublished
          ? await sql<{ payload: CaseStudyItem }[]>`
              SELECT payload FROM case_studies WHERE status = 'published' ORDER BY updated_at DESC
            `
          : await sql<{ payload: CaseStudyItem }[]>`
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
    );
  },

  async getCaseStudyBySlug(
    slug: string,
    onlyPublished = false
  ): Promise<CaseStudyItem | null> {
    const all = await this.listCaseStudies(onlyPublished);
    return all.find((c) => c.slug === slug) ?? null;
  },

  async upsertCaseStudy(item: CaseStudyItem): Promise<CaseStudyItem> {
    const next: CaseStudyItem = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM case_studies WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublished
          ? await sql<{ payload: BlogPost }[]>`
              SELECT payload FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC NULLS LAST
            `
          : await sql<{ payload: BlogPost }[]>`
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
    );
  },

  async getBlogPostBySlug(
    slug: string,
    onlyPublished = false
  ): Promise<BlogPost | null> {
    const all = await this.listBlogPosts(onlyPublished);
    return all.find((p) => p.slug === slug) ?? null;
  },

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const all = await this.listBlogPosts(false);
    return all.find((p) => p.id === id) ?? null;
  },

  async upsertBlogPost(post: BlogPost): Promise<BlogPost> {
    const next: BlogPost = { ...post, updatedAt: new Date().toISOString() };
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM blog_posts WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublished
          ? await sql<FaqItem[]>`
              SELECT id, category, sort_order as "order", is_published as "isPublished", question, answer
              FROM faqs WHERE is_published = TRUE ORDER BY sort_order ASC
            `
          : await sql<FaqItem[]>`
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
    );
  },

  async upsertFaq(faq: FaqItem): Promise<FaqItem> {
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM faqs WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublicVerified
          ? await sql<{ payload: TestimonialItem }[]>`
              SELECT payload FROM testimonials
              WHERE is_published = TRUE AND is_authorized = TRUE AND is_verified = TRUE
              ORDER BY created_at DESC
            `
          : await sql<{ payload: TestimonialItem }[]>`
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
    );
  },

  async upsertTestimonial(item: TestimonialItem): Promise<TestimonialItem> {
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM testimonials WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = onlyPublished
          ? await sql<{ payload: TeamMember }[]>`
              SELECT payload FROM team_members WHERE is_published = TRUE ORDER BY sort_order ASC
            `
          : await sql<{ payload: TeamMember }[]>`
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
    );
  },

  async upsertTeamMember(member: TeamMember): Promise<TeamMember> {
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM team_members WHERE id = ${id}`;
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
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: PageDocument }[]>`
          SELECT payload FROM pages ORDER BY slug ASC
        `;
        return rows.map((r) => r.payload);
      },
      () => readLocalSnapshot().pages
    );
  },

  async getPageBySlug(slug: string): Promise<PageDocument | null> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: PageDocument }[]>`
          SELECT payload FROM pages WHERE slug = ${slug} LIMIT 1
        `;
        return rows[0]?.payload ?? null;
      },
      () => readLocalSnapshot().pages.find((p) => p.slug === slug) ?? null
    );
  },

  async savePage(page: PageDocument): Promise<PageDocument> {
    const next: PageDocument = { ...page, updatedAt: new Date().toISOString() };
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

  async findUserById(id: string): Promise<UserRecord | null> {
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
            password_changed_at?: string | null;
            recovery_token_hash?: string | null;
            recovery_expires_at?: string | null;
            created_at: string;
            updated_at: string;
            last_login_at: string | null;
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
          passwordChangedAt: r.password_changed_at ?? null,
          recoveryTokenHash: r.recovery_token_hash ?? null,
          recoveryExpiresAt: r.recovery_expires_at ?? null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          lastLoginAt: r.last_login_at,
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
            password_changed_at?: string | null;
            recovery_token_hash?: string | null;
            recovery_expires_at?: string | null;
            created_at: string;
            updated_at: string;
            last_login_at: string | null;
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
          passwordChangedAt: r.password_changed_at ?? null,
          recoveryTokenHash: r.recovery_token_hash ?? null,
          recoveryExpiresAt: r.recovery_expires_at ?? null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          lastLoginAt: r.last_login_at,
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
            password_changed_at?: string | null;
            recovery_token_hash?: string | null;
            recovery_expires_at?: string | null;
            created_at: string;
            updated_at: string;
            last_login_at: string | null;
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
          passwordChangedAt: r.password_changed_at ?? null,
          recoveryTokenHash: r.recovery_token_hash ?? null,
          recoveryExpiresAt: r.recovery_expires_at ?? null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          lastLoginAt: r.last_login_at,
        };
      },
      () =>
        readLocalSnapshot().users.find(
          (u) => u.recoveryTokenHash === tokenHash
        ) ?? null
    );
  },

  async listUsers(): Promise<SafeUser[]> {
    return runWithDbFallback(
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
        >`SELECT id, email, name, role, is_active, must_change_password, session_version, password_changed_at, created_at, last_login_at FROM users ORDER BY created_at ASC`;
        return rows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          isActive: r.is_active,
          mustChangePassword: Boolean(r.must_change_password),
          sessionVersion: r.session_version ?? 1,
          passwordChangedAt: r.password_changed_at ?? null,
          createdAt: r.created_at,
          lastLoginAt: r.last_login_at,
        }));
      },
      () => readLocalSnapshot().users.map(toSafeUser)
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
        await sql`
          UPDATE users
          SET
            name = ${updated.name},
            role = ${updated.role},
            is_active = ${updated.isActive},
            password_hash = ${updated.passwordHash},
            must_change_password = ${Boolean(updated.mustChangePassword)},
            session_version = ${updated.sessionVersion ?? 1},
            password_changed_at = ${updated.passwordChangedAt ?? null},
            recovery_token_hash = ${updated.recoveryTokenHash ?? null},
            recovery_expires_at = ${updated.recoveryExpiresAt ?? null},
            updated_at = ${updated.updatedAt}
          WHERE id = ${id}
        `;
        return toSafeUser(updated);
      },
      () => {
        const snap = readLocalSnapshot();
        const index = snap.users.findIndex((u) => u.id === id);
        if (index === -1) return null;
        snap.users[index] = updated;
        writeLocalSnapshot(snap);
        return toSafeUser(updated);
      }
    );
  },

  async revokeUserSessions(userId: string): Promise<number | null> {
    const updated = await this.updateUser(userId, { bumpSessionVersion: true });
    return updated ? updated.sessionVersion : null;
  },

  async listLeads(): Promise<LeadRecord[]> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<
          {
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
            source: string;
            is_duplicate_flag: boolean;
            follow_up_date: string | null;
            email_notification_status: LeadRecord["emailNotificationStatus"];
            notes: LeadRecord["notes"];
            status_history: LeadRecord["statusHistory"];
            created_at: string;
            updated_at: string;
          }[]
        >`SELECT * FROM leads ORDER BY created_at DESC`;
        return rows.map((r) => ({
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
          source: r.source,
          isDuplicateFlag: r.is_duplicate_flag,
          followUpDate: r.follow_up_date,
          emailNotificationStatus: r.email_notification_status,
          notes: r.notes || [],
          statusHistory: r.status_history || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      },
      () =>
        readLocalSnapshot().leads.sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        )
    );
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
    >
  ): Promise<LeadRecord> {
    const now = new Date().toISOString();
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingLeads = await this.listLeads();
    const isDuplicateFlag = existingLeads.some(
      (l) => l.email.toLowerCase() === normalizedEmail
    );

    const lead: LeadRecord = {
      ...input,
      email: normalizedEmail,
      id: `lead_${randomBytes(8).toString("hex")}`,
      status: "New",
      isDuplicateFlag,
      followUpDate: null,
      notes: [],
      statusHistory: [
        {
          from: null,
          to: "New",
          changedAt: now,
          changedBy: "public_submission",
          note: isDuplicateFlag
            ? "Enquiry received (existing contact email flagged for unified follow-up)."
            : "Initial enquiry received via website.",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    return runWithDbFallback(
      async (sql) => {
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
    const all = await this.listLeads();
    return all.find((l) => l.id === id) ?? null;
  },

  async updateLead(
    id: string,
    updater: (current: LeadRecord) => LeadRecord
  ): Promise<LeadRecord | null> {
    const current = await this.getLeadById(id);
    if (!current) return null;

    const updated: LeadRecord = {
      ...updater(current),
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    return runWithDbFallback(
      async (sql) => {
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

    const [brand, posts, members, pages, services, caseStudies] =
      await Promise.all([
        this.getBrandAssets(),
        this.listBlogPosts(false),
        this.listTeamMembers(false),
        this.listPages(),
        this.listServices(false),
        this.listCaseStudies(false),
      ]);

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
      for (const pg of pages) {
        if (JSON.stringify(pg).includes(asset.url)) {
          usedIn.push(`Page: /${pg.slug === "home" ? "" : pg.slug}`);
        }
      }
      for (const s of services) {
        if (JSON.stringify(s).includes(asset.url)) {
          usedIn.push(`Service: ${s.slug}`);
        }
      }
      for (const cs of caseStudies) {
        if (JSON.stringify(cs).includes(asset.url)) {
          usedIn.push(`Case Study: ${cs.slug}`);
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
            created_at: string;
          }[]
        >`SELECT * FROM redirects ORDER BY created_at DESC`;
        return rows.map((r) => ({
          id: r.id,
          sourcePath: r.source_path,
          destinationPath: r.destination_path,
          permanent: r.permanent,
          isActive: r.is_active,
          createdAt: r.created_at,
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
    const all = await this.listRedirects();
    return (
      all.find(
        (r) => r.isActive && r.sourcePath === clean && r.destinationPath !== clean
      ) ?? null
    );
  },

  async upsertRedirect(rule: RedirectRule): Promise<RedirectRule> {
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
    return runWithDbFallback(
      async (sql) => {
        const res = await sql`DELETE FROM redirects WHERE id = ${id}`;
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
    return runWithDbFallback(
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
            created_at: string;
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
          createdAt: r.created_at,
        }));
      },
      () => readLocalSnapshot().auditLogs.slice(0, limit)
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
          : ["0001_omniflow_schema", "0002_production_upgrade"],
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
      const verification = await withHardDbTimeout(
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

          const schemaReady =
            missingTables.length === 0 && missingColumns.length === 0;

          return {
            driver: "supabase_postgres" as const,
            connected: true,
            schemaReady,
            appliedMigrations,
            missingTables,
            missingColumns,
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
                ].join(", ")}).`,
          };
        })(),
        5_000
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
          passwordChangedAt: r.password_changed_at ?? null,
          recoveryTokenHash: null,
          recoveryExpiresAt: null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          lastLoginAt: r.last_login_at,
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
          createdAt: r.created_at,
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
};
