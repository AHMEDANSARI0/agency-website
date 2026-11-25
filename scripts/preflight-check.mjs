#!/usr/bin/env node
/**
 * ============================================================================
 * OmniFlow v1.0.0 — Production Pre-Flight Readiness & Integrity Audit CLI
 * ============================================================================
 * Zero external dependencies. Run anytime locally or in CI:
 *   npm run preflight
 *   node scripts/preflight-check.mjs --strict-placeholders
 * ============================================================================
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const forceProdCheck =
  args.includes("--mode=production") || process.env.NODE_ENV === "production";
const strictPlaceholders =
  args.includes("--strict-placeholders") || args.includes("--mode=production");
const rootDir = process.cwd();

const REQUIRED_FILES = [
  "DEPLOYMENT_AND_HANDOVER.md",
  "README.md",
  "src/app/layout.tsx",
  "src/app/not-found.tsx",
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "src/app/(website)/error.tsx",
  "src/app/opengraph-image.tsx",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/app/feed.xml/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/leads/route.ts",
  "src/app/(website)/page.tsx",
  "src/app/(website)/services/page.tsx",
  "src/app/(website)/pricing/page.tsx",
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
  "src/components/layout/Navbar.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/login/page.tsx",
  "src/app/admin/setup/page.tsx",
  "src/app/admin/recover/page.tsx",
  "src/app/admin/(protected)/page.tsx",
  "supabase/migrations/0001_omniflow_schema.sql",
  "supabase/migrations/0002_production_upgrade.sql",
  "supabase/migrations/0003_crm_and_operations.sql",
  "supabase/migrations/0004_security_and_performance.sql",
];

const REQUIRED_PUBLIC_ASSETS = [
  "public/logo.svg",
  "public/logo-dark.svg",
  "public/favicon.svg",
  "public/favicon.ico",
  "public/favicon-16x16.png",
  "public/favicon-32x32.png",
  "public/apple-touch-icon.png",
  "public/og-image.png",
  "public/site.webmanifest",
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
  ` OmniFlow v1.0.0 Pre-Flight Audit (${strictPlaceholders ? "STRICT LAUNCH" : "DEVELOPMENT / CI"})`
);
console.log("======================================================================\n");

// 1. Node.js Runtime Check
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 20) {
  pass(`Node.js runtime v${process.versions.node} (>= 20.0.0)`);
} else {
  fail(`Node.js v${process.versions.node} is older than required >= 20.0.0`);
}

// 2. Lockfile Synchronization Check (package.json <-> package-lock.json)
const pkgPath = path.join(rootDir, "package.json");
const lockPath = path.join(rootDir, "package-lock.json");
if (!fs.existsSync(pkgPath) || !fs.existsSync(lockPath)) {
  fail("package.json or package-lock.json is missing");
} else {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    const rootLockPkg = lock.packages?.[""] || {};
    const mismatches = [];

    for (const section of ["dependencies", "devDependencies"]) {
      const pkgDeps = pkg[section] || {};
      const lockDeps = rootLockPkg[section] || {};
      for (const [name, spec] of Object.entries(pkgDeps)) {
        if (lockDeps[name] !== spec) {
          mismatches.push(`${name} (package.json: ${spec}, lock: ${lockDeps[name] || "missing"})`);
        }
        if (!lock.packages?.[`node_modules/${name}`]) {
          mismatches.push(`${name} missing resolved node_modules/${name} entry in lockfile`);
        }
      }
      for (const name of Object.keys(lockDeps)) {
        if (!(name in pkgDeps)) {
          mismatches.push(`${name} present in lockfile ${section} but removed from package.json`);
        }
      }
    }

    if (mismatches.length === 0) {
      pass("package.json and package-lock.json are 100% synchronized");
    } else {
      fail(`package-lock.json is out of sync: ${mismatches.join("; ")}`);
    }
  } catch (err) {
    fail(`Failed to parse package.json / package-lock.json: ${err.message}`);
  }
}

// 3. Route, Handover Docs & Migration File Inventory
const missingFiles = REQUIRED_FILES.filter(
  (rel) => !fs.existsSync(path.join(rootDir, rel))
);
if (missingFiles.length === 0) {
  pass(`All ${REQUIRED_FILES.length} core routes, error boundaries, docs, and SQL migrations present`);
} else {
  fail(`Missing required project files: ${missingFiles.join(", ")}`);
}

// 4. Static Brand Assets Verification (public/)
const missingOrEmptyAssets = REQUIRED_PUBLIC_ASSETS.filter((rel) => {
  const full = path.join(rootDir, rel);
  if (!fs.existsSync(full)) return true;
  return fs.statSync(full).size === 0;
});
if (missingOrEmptyAssets.length === 0) {
  // Also verify OG PNG dimensions (1200x630) via PNG IHDR header
  const ogBuf = fs.readFileSync(path.join(rootDir, "public/og-image.png"));
  const ogWidth = ogBuf.readUInt32BE(16);
  const ogHeight = ogBuf.readUInt32BE(20);
  if (ogWidth === 1200 && ogHeight === 630) {
    pass(`All ${REQUIRED_PUBLIC_ASSETS.length} static public/ brand assets verified (OG 1200x630)`);
  } else {
    fail(`public/og-image.png must be 1200x630 (found ${ogWidth}x${ogHeight})`);
  }
} else {
  fail(`Missing or empty public brand assets: ${missingOrEmptyAssets.join(", ")}`);
}

// 5. Non-Destructive SQL Migration Verification
for (const sqlRel of [
  "supabase/migrations/0001_omniflow_schema.sql",
  "supabase/migrations/0002_production_upgrade.sql",
  "supabase/migrations/0003_crm_and_operations.sql",
  "supabase/migrations/0004_security_and_performance.sql",
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

// 6. Admin NoIndex & CSP Security Baseline
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

// 7. Placeholder Content Audit ({{PLACEHOLDER}} tokens & legacy .example emails)
const seedPath = path.join(rootDir, "src/lib/database/seed-data.ts");
const seedSrc = fs.readFileSync(seedPath, "utf8");
if (seedSrc.includes("hello@omniflow.example")) {
  fail("Legacy hello@omniflow.example still present in src/lib/database/seed-data.ts");
} else {
  pass("No legacy hello@omniflow.example contact email in seed data");
}

const foundPlaceholders = new Set();
for (const match of seedSrc.matchAll(/\{\{[A-Z0-9_]+\}\}/g)) {
  foundPlaceholders.add(`${match[0]} (seed-data.ts)`);
}

const localDbPath = path.join(rootDir, "data/omniflow-db.json");
if (fs.existsSync(localDbPath)) {
  const localDbRaw = fs.readFileSync(localDbPath, "utf8");
  for (const match of localDbRaw.matchAll(/\{\{[A-Z0-9_]+\}\}/g)) {
    foundPlaceholders.add(`${match[0]} (data/omniflow-db.json)`);
  }
}

if (foundPlaceholders.size > 0) {
  const list = Array.from(foundPlaceholders).join(", ");
  if (strictPlaceholders) {
    fail(`Unfilled owner content placeholders remain: ${list}`);
  } else {
    warn(
      `Owner content placeholders awaiting customization in Admin Settings/CMS: ${list}`
    );
  }
} else {
  pass("All {{PLACEHOLDER}} tokens have been filled");
}

if (forceProdCheck) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const authSecret = (
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    ""
  ).trim();
  const dbUrl = (process.env.DATABASE_URL || "").trim();

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
    fail("DATABASE_URL (PostgreSQL) is required in production");
  } else {
    pass("DATABASE_URL PostgreSQL connection string present");
  }
}

console.log("\n----------------------------------------------------------------------");
console.log(
  ` Summary: ${passed} passed · ${warnings} warning(s) · ${failed} failed`
);
console.log("======================================================================\n");

if (failed > 0) {
  process.exit(1);
}
