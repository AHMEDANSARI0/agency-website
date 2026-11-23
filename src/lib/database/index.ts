import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import type { AuditLogEntry, SafeUser, UserRecord } from "@/types/auth";
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
import {
  CURRENT_SEED_VERSION,
  createInitialSeedSnapshot,
  type OmniFlowDatabaseSnapshot,
} from "./seed-data";

export type DatabaseDriverMode = "supabase_postgres" | "local_file_fallback";

function getLocalDbFilePath(): string {
  if (process.env.OMNIFLOW_LOCAL_DB_PATH) {
    return path.resolve(process.env.OMNIFLOW_LOCAL_DB_PATH);
  }
  return path.join(process.cwd(), "data", "omniflow-db.json");
}

let cachedSqlClient: ReturnType<typeof postgres> | null = null;
let cachedSqlUrl = "";
let postgresFallbackUntil = 0;
let loggedFallbackNoticeForUrl = "";
let postgresBootstrapChecked = false;

function isPlaceholderDatabaseUrl(url: string): boolean {
  return (
    !url ||
    url.includes("[ref]") ||
    url.includes("[password]") ||
    url.includes("YOUR_PASSWORD") ||
    url.includes("<password>")
  );
}

function getPostgresClient(): ReturnType<typeof postgres> | null {
  const url = process.env.DATABASE_URL?.trim() || "";
  if (isPlaceholderDatabaseUrl(url)) return null;
  if (Date.now() < postgresFallbackUntil && cachedSqlUrl === url) {
    return null;
  }

  if (!cachedSqlClient || cachedSqlUrl !== url) {
    if (cachedSqlClient) {
      cachedSqlClient.end({ timeout: 1 }).catch(() => undefined);
    }
    cachedSqlUrl = url;
    postgresBootstrapChecked = false;
    const isSupabaseHost =
      url.includes(".supabase.co") || url.includes(".supabase.com");

    cachedSqlClient = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 6,
      prepare: false, // Required for Supabase PgBouncer Transaction Pooler compatibility
      ...(isSupabaseHost ? { ssl: "require" } : {}),
    });
  }
  return cachedSqlClient;
}

function isConnectivityOrSchemaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = String((err as { code?: unknown }).code || "");
  const message = String((err as { message?: unknown }).message || "");

  // Network / DNS / Socket / Timeout / Unmigrated schema / Auth / Pooler codes
  const fallbackCodes = new Set([
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "CONNECT_TIMEOUT",
    "CONNECTION_CLOSED",
    "CONNECTION_DESTROYED",
    "42P01", // undefined_table (migration not applied yet)
    "28P01", // invalid_password
    "3D000", // invalid_catalog_name
    "08000",
    "08001",
    "08003",
    "08006",
    "XX000", // Supabase Tenant or user not found
  ]);

  if (fallbackCodes.has(code)) return true;
  if (
    /getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|CONNECT_TIMEOUT|Tenant or user not found/i.test(
      message
    )
  ) {
    return true;
  }
  return false;
}

function tripPostgresCircuitBreaker(err: unknown): void {
  const url = process.env.DATABASE_URL?.trim() || "";
  postgresFallbackUntil = Date.now() + 60_000;

  if (loggedFallbackNoticeForUrl !== url) {
    loggedFallbackNoticeForUrl = url;
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : "Unreachable database host";

    console.warn(
      `[OmniFlow DB] PostgreSQL unavailable (${msg}) — automatically switched to Local JSON Store (data/omniflow-db.json).`
    );

    if (/db\.[a-z0-9-]+\.supabase\.co/i.test(url)) {
      console.warn(
        "[OmniFlow DB] Tip: Supabase Direct hostnames (db.<project-ref>.supabase.co) use IPv6-only DNS (or the project may be paused). On IPv4 networks (Windows / ISPs / Vercel), use the Supabase Session/Transaction Pooler URI (aws-0-<region>.pooler.supabase.com:6543) from Supabase Dashboard -> Connect -> Pooler."
      );
    }
  }
}

async function runWithDbFallback<T>(
  pgOp: (sql: ReturnType<typeof postgres>) => Promise<T | undefined>,
  localOp: () => T | Promise<T>
): Promise<T> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      const result = await pgOp(sql);
      if (result !== undefined) {
        return result;
      }
    } catch (err) {
      if (isConnectivityOrSchemaError(err)) {
        tripPostgresCircuitBreaker(err);
      } else {
        throw err;
      }
    }
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
    const seedAdmin = createInitialSeedSnapshot().users[0];
    if (seedAdmin) {
      await sql`
        INSERT INTO users (id, email, name, role, password_hash, is_active, created_at, updated_at, last_login_at)
        VALUES (
          ${seedAdmin.id},
          ${seedAdmin.email},
          ${seedAdmin.name},
          ${seedAdmin.role},
          ${seedAdmin.passwordHash},
          ${seedAdmin.isActive},
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
  const url = process.env.DATABASE_URL?.trim() || "";
  if (isPlaceholderDatabaseUrl(url)) return "local_file_fallback";
  if (Date.now() < postgresFallbackUntil && cachedSqlUrl === url) {
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

  const shouldUpgradeDefaultTheme =
    !snap.themeConfig ||
    (snap.themeConfig.activePresetId === "omniflow-signature" &&
      !snap.themeConfig.previousPublished);

  const upgraded: OmniFlowDatabaseSnapshot = {
    ...snap,
    schemaVersion: CURRENT_SEED_VERSION,
    siteSettings: nextSettings,
    themeConfig: shouldUpgradeDefaultTheme
      ? fresh.themeConfig
      : snap.themeConfig,
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
    pages: mergeByKey(snap.pages || [], fresh.pages, (p) => p.slug),
  };

  writeLocalSnapshot(upgraded);
  return upgraded;
}

function readLocalSnapshot(): OmniFlowDatabaseSnapshot {
  const filePath = getLocalDbFilePath();
  if (!fs.existsSync(filePath)) {
    const initial = createInitialSeedSnapshot();
    writeLocalSnapshot(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as OmniFlowDatabaseSnapshot;
    return upgradeSnapshotIfNeeded(parsed);
  } catch {
    const fallback = createInitialSeedSnapshot();
    writeLocalSnapshot(fallback);
    return fallback;
  }
}

function writeLocalSnapshot(snapshot: OmniFlowDatabaseSnapshot): void {
  const filePath = getLocalDbFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

export const db = {
  getMode(): DatabaseDriverMode {
    return getActiveDatabaseMode();
  },

  async getSiteSettings(): Promise<SiteSettings> {
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: SiteSettings }[]>`
          SELECT payload FROM kv_configs WHERE key = 'site_settings' LIMIT 1
        `;
        return rows[0]?.payload;
      },
      () => readLocalSnapshot().siteSettings
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
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: ThemeConfiguration }[]>`
          SELECT payload FROM kv_configs WHERE key = 'theme_config' LIMIT 1
        `;
        return rows[0]?.payload;
      },
      () => readLocalSnapshot().themeConfig
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
    return runWithDbFallback(
      async (sql) => {
        const rows = await sql<{ payload: BrandAssetConfig }[]>`
          SELECT payload FROM kv_configs WHERE key = 'brand_assets' LIMIT 1
        `;
        return rows[0]?.payload;
      },
      () => readLocalSnapshot().brandAssets
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
        return rows.length > 0 ? rows.map((r) => r.payload) : undefined;
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
        return rows.length > 0 ? rows.map((r) => r.payload) : undefined;
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
        return rows.length > 0 ? rows.map((r) => r.payload) : undefined;
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
        return rows.length > 0 ? rows : undefined;
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
        return rows.length > 0 ? rows.map((r) => r.payload) : undefined;
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
        return rows.length > 0 ? rows.map((r) => r.payload) : undefined;
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
        return rows[0]?.payload;
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
            created_at: string;
            last_login_at: string | null;
          }[]
        >`SELECT id, email, name, role, is_active, created_at, last_login_at FROM users ORDER BY created_at ASC`;
        return rows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          isActive: r.is_active,
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
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };

    return runWithDbFallback(
      async (sql) => {
        await sql`
          INSERT INTO users (id, email, name, role, password_hash, is_active, created_at, updated_at, last_login_at)
          VALUES (
            ${created.id},
            ${created.email},
            ${created.name},
            ${created.role},
            ${created.passwordHash},
            ${created.isActive},
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
    }
  ): Promise<SafeUser | null> {
    const current = await this.findUserById(id);
    if (!current) return null;

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
      updatedAt: new Date().toISOString(),
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

    const [brand, posts, members] = await Promise.all([
      this.getBrandAssets(),
      this.listBlogPosts(false),
      this.listTeamMembers(false),
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
};
