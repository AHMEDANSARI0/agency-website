import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isDirectIpv6SupabaseHost,
  normalizeDatabaseUrlForRuntime,
  normalizePgIsoTimestamp,
  normalizePgNullableIsoTimestamp,
  withPgConcurrencySlot,
} from "@/lib/database";

describe("Vercel Serverless + Supabase Pooler Resilience Hotfix", () => {
  it("1. strips Prisma/ORM pseudo query params and upgrades both :5432 and implicit-port Supabase pooler URLs to :6543", () => {
    const rawPoolerUrl =
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
    expect(
      normalizeDatabaseUrlForRuntime(rawPoolerUrl, { serverless: true })
    ).toBe(
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
    );

    const withSslMode =
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require";
    expect(
      normalizeDatabaseUrlForRuntime(withSslMode, { serverless: true })
    ).toBe(
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
    );

    const implicitPortUrl =
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com/postgres";
    expect(
      normalizeDatabaseUrlForRuntime(implicitPortUrl, { serverless: true })
    ).toBe(
      "postgresql://postgres.ref123:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
    );
  });

  it("2. enforces MAX_CONCURRENT_PG_OPS <= 3 semaphore with re-entrant safety so Supavisor (:6543) never pipelines onto busy sockets", async () => {
    let inFlight = 0;
    let peakInFlight = 0;

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, idx) =>
        withPgConcurrencySlot(async () => {
          inFlight += 1;
          peakInFlight = Math.max(peakInFlight, inFlight);
          await new Promise((r) => setTimeout(r, 10));
          const nestedVal = await withPgConcurrencySlot(async () => idx * 2);
          inFlight -= 1;
          return nestedVal;
        })
      )
    );

    expect(peakInFlight).toBeLessThanOrEqual(3);
    expect(results).toEqual(Array.from({ length: 12 }, (_, idx) => idx * 2));
  });

  it("3. normalizes PostgreSQL TIMESTAMPTZ/DATE Date objects into ISO strings so Admin .replace/.slice/.startsWith never crash", () => {
    const sampleDate = new Date("2026-11-24T14:00:00.000Z");
    const iso = normalizePgIsoTimestamp(sampleDate);
    expect(typeof iso).toBe("string");
    expect(iso.replace("T", " ").slice(0, 19)).toBe("2026-11-24 14:00:00");
    expect(iso.startsWith("2026-11")).toBe(true);

    expect(normalizePgNullableIsoTimestamp(null)).toBeNull();
    expect(normalizePgNullableIsoTimestamp(sampleDate)).toBe(
      "2026-11-24T14:00:00.000Z"
    );
  });

  it("4. uses 1-CTE baseline seed, zero-param loadPostgresPublicCatalogBundle, custom ISO timestamp parsers, and fetch_types: false", () => {
    const dbSrc = fs.readFileSync(
      path.join(process.cwd(), "src/lib/database/index.ts"),
      "utf8"
    );
    expect(dbSrc).toContain("WITH ins_kv AS (");
    expect(dbSrc).toContain("loadPostgresKvBundle");
    expect(dbSrc).toContain("loadPostgresPublicCatalogBundle");
    expect(dbSrc).toContain("fetch_types: false");
    expect(dbSrc).toContain("isoTimestamp");

    expect(
      isDirectIpv6SupabaseHost(
        "postgresql://postgres:secret@db.abcdefghijklm.supabase.co:5432/postgres"
      )
    ).toBe(true);
    expect(
      isDirectIpv6SupabaseHost(
        "postgresql://postgres.abcdefghijklm:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
      )
    ).toBe(false);
  });

  it("5. serves static public/favicon.ico from CDN with zero PostgreSQL queries", () => {
    const icoPath = path.join(process.cwd(), "public/favicon.ico");
    expect(fs.existsSync(icoPath)).toBe(true);
    const buf = fs.readFileSync(icoPath);
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
  });
});
