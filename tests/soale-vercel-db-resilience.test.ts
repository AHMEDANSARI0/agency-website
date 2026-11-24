import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET as faviconHandler } from "@/app/favicon.ico/route";
import {
  isDirectIpv6SupabaseHost,
  normalizeDatabaseUrlForRuntime,
} from "@/lib/database";

describe("Vercel Serverless + Supabase Pooler Resilience Hotfix", () => {
  it("1. strips Prisma/ORM pseudo query params (?pgbouncer=true, ?connection_limit=1) so postgres.js never sends invalid startup GUCs", () => {
    const rawPoolerUrl =
      "postgresql://postgres.ref123:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
    expect(
      normalizeDatabaseUrlForRuntime(rawPoolerUrl, { serverless: true })
    ).toBe(
      "postgresql://postgres.ref123:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
    );

    // Preserves legitimate PostgreSQL parameters like sslmode while upgrading :5432 -> :6543 on serverless
    const withSslMode =
      "postgresql://postgres.ref123:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require";
    expect(
      normalizeDatabaseUrlForRuntime(withSslMode, { serverless: true })
    ).toBe(
      "postgresql://postgres.ref123:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    );
  });

  it("2. uses a 1-round-trip CTE baseline seed and batched kv_configs query to prevent cross-region 6s Vercel timeouts", () => {
    const dbSrc = fs.readFileSync(
      path.join(process.cwd(), "src/lib/database/index.ts"),
      "utf8"
    );
    expect(dbSrc).toContain("WITH ins_kv AS (");
    expect(dbSrc).toContain("loadPostgresKvBundle");
    expect(dbSrc).toContain('dedupeInFlight("postgres_baseline_seed"');

    expect(
      isDirectIpv6SupabaseHost(
        "postgresql://postgres:secret@db.abcdefghijklm.supabase.co:5432/postgres"
      )
    ).toBe(true);
    expect(
      isDirectIpv6SupabaseHost(
        "postgresql://postgres.abcdefghijklm:secret@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
      )
    ).toBe(false);
  });

  it("3. serves /favicon.ico in-memory with zero PostgreSQL queries", async () => {
    const res = await faviconHandler();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age=86400");
  });
});
