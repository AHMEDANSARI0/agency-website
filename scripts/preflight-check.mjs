#!/usr/bin/env node
/**
 * ============================================================================
 * OmniFlow v1.0.0 — Production Pre-Flight Readiness & Integrity Audit CLI
 * ============================================================================
 * Zero external dependencies. Run anytime locally or in CI:
 *   npm run preflight
 *   node scripts/preflight-check.mjs --mode=production
 * ============================================================================
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const forceProdCheck = args.includes("--mode=production") || process.env.NODE_ENV === "production";
const rootDir = process.cwd();

const REQUIRED_FILES = [
  "src/app/layout.tsx",
  "src/app/opengraph-image.tsx",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/app/feed.xml/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/leads/route.ts",
  "src/app/(website)/page.tsx",
  "src/app/(website)/services/page.tsx",
  "src/app/(website)/solutions/page.tsx",
  "src/app/(website)/how-it-works/page.tsx",
  "src/app/(website)/demos/page.tsx",
  "src/app/(website)/work/page.tsx",
  "src/app/(website)/case-studies/page.tsx",
  "src/app/(website)/blog/page.tsx",
  "src/app/(website)/about/page.tsx",
  "src/app/(website)/team/page.tsx",
  "src/app/(website)/faq/page.tsx",
  "src/app/(website)/contact/page.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/login/page.tsx",
  "src/app/admin/setup/page.tsx",
  "src/app/admin/recover/page.tsx",
  "src/app/admin/(protected)/page.tsx",
  "supabase/migrations/0001_omniflow_schema.sql",
  "supabase/migrations/0002_production_upgrade.sql",
];

let passed = 0;
let warnings = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`  [PASS] ${msg}`);
}

function warn(msg) {
  warnings += 1;
  console.log(`  [WARN] ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`  [FAIL] ${msg}`);
}

console.log("\n======================================================================");
console.log(
  ` OmniFlow v1.0.0 Pre-Flight Audit (${forceProdCheck ? "PRODUCTION STRICT" : "DEVELOPMENT / CI"})`
);
console.log("======================================================================\n");

// 1. Node.js Runtime Check
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 20) {
  pass(`Node.js runtime v${process.versions.node} (>= 20.0.0)`);
} else {
  fail(`Node.js v${process.versions.node} is older than required >= 20.0.0`);
}

// 2. Route & Migration File Inventory
const missingFiles = REQUIRED_FILES.filter(
  (rel) => !fs.existsSync(path.join(rootDir, rel))
);
if (missingFiles.length === 0) {
  pass(`All ${REQUIRED_FILES.length} core routes, APIs, and SQL migrations present`);
} else {
  fail(`Missing required project files: ${missingFiles.join(", ")}`);
}

// 3. Non-Destructive SQL Migration Verification
for (const sqlRel of [
  "supabase/migrations/0001_omniflow_schema.sql",
  "supabase/migrations/0002_production_upgrade.sql",
]) {
  const fullPath = path.join(rootDir, sqlRel);
  if (fs.existsSync(fullPath)) {
    const sql = fs.readFileSync(fullPath, "utf8");
    if (/\b(DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i.test(sql)) {
      fail(`Destructive SQL statement detected in ${sqlRel}`);
    } else if (!/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i.test(sql)) {
      fail(`${sqlRel} is missing idempotent CREATE TABLE IF NOT EXISTS guards`);
    } else {
      pass(`SQL migration ${sqlRel} is non-destructive & idempotent`);
    }
  }
}

// 4. Admin NoIndex & CSP Security Baseline
const adminLayout = fs.readFileSync(
  path.join(rootDir, "src/app/admin/layout.tsx"),
  "utf8"
);
if (adminLayout.includes("index: false") && adminLayout.includes("follow: false")) {
  pass("Admin workspace enforces robots noindex, nofollow");
} else {
  fail("Admin layout is missing robots noindex/nofollow protection");
}

const nextCfg = fs.readFileSync(path.join(rootDir, "next.config.ts"), "utf8");
if (
  nextCfg.includes("Content-Security-Policy") &&
  nextCfg.includes("X-Content-Type-Options")
) {
  pass("Security headers & Content-Security-Policy configured in next.config.ts");
} else {
  fail("Missing Content-Security-Policy or X-Content-Type-Options in next.config.ts");
}

// 5. Environment Variable Readiness
if (forceProdCheck) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const authSecret = (process.env.AUTH_SECRET || process.env.SESSION_SECRET || "").trim();
  const dbUrl = (process.env.DATABASE_URL || "").trim();
  const supaUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supaKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!siteUrl.startsWith("https://")) {
    fail("NEXT_PUBLIC_SITE_URL must start with https:// in production");
  } else {
    pass(`Canonical HTTPS URL configured (${siteUrl})`);
  }

  if (authSecret.length < 32 || authSecret.includes("replace-with")) {
    fail("AUTH_SECRET must be at least 32 random characters in production");
  } else {
    pass("AUTH_SECRET cryptographic length verified (>= 32 chars)");
  }

  if (!dbUrl.startsWith("postgres")) {
    fail("DATABASE_URL (Supabase PostgreSQL) is required in production");
  } else if (dbUrl.includes(".supabase.co:5432")) {
    warn(
      "DATABASE_URL uses direct :5432 host — switch to Supabase Transaction Pooler (:6543) for IPv4 serverless compatibility"
    );
  } else {
    pass("DATABASE_URL PostgreSQL connection string present");
  }

  if (!supaUrl.startsWith("https://") || !supaKey) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production for persistent media storage"
    );
  } else {
    pass("Supabase Storage credentials present");
  }
} else {
  pass(
    "Local/CI mode active — pass --mode=production to enforce live Vercel/Supabase secret checks"
  );
}

console.log("\n----------------------------------------------------------------------");
console.log(
  ` Summary: ${passed} passed · ${warnings} warning(s) · ${failed} failed`
);
console.log("======================================================================\n");

if (failed > 0) {
  process.exit(1);
}
