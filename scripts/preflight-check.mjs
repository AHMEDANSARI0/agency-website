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
  args.includes("--strict-placeholders") || forceProdCheck;
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
  "supabase/migrations/0005_rate_limit_fixed_window.sql",
  "supabase/migrations/20261128104913_0006_admin_login_lockouts.sql",
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
  const pngHeaderOk = ogBuf.length >= 24 && ogBuf.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && ogBuf.toString("ascii", 12, 16) === "IHDR";
  const ogWidth = pngHeaderOk ? ogBuf.readUInt32BE(16) : 0;
  const ogHeight = pngHeaderOk ? ogBuf.readUInt32BE(20) : 0;
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
  "supabase/migrations/20261128104913_0006_admin_login_lockouts.sql",
]) {
  const fullPath = path.join(rootDir, sqlRel);
  if (fs.existsSync(fullPath)) {
    const sql = fs.readFileSync(fullPath, "utf8");
    if (/\b(DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i.test(sql)) {
      fail(`Destructive SQL statement detected in ${sqlRel}`);
    } else if (!/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i.test(sql)) {
      fail(`${sqlRel} is missing idempotent CREATE TABLE IF NOT EXISTS guards`);
    } else {
      pass(`SQL migration ${sqlRel}: basic TABLE checks passed (not a safety or rerun proof)`);
    }
  }
}

warn("Migration checks are superficial: review SQL and migration history; some statements may not be safe to rerun. Never execute blindly. 0005 was checked for presence only.");

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
    pass("Canonical URL starts with HTTPS (full deployment validity not verified)");
  }

  if (authSecret.length < 32 || authSecret.includes("replace-with")) {
    fail("AUTH_SECRET must be at least 32 random characters in production");
  } else {
    pass("Session secret length check passed (randomness not verified)");
  }

  if (!dbUrl.startsWith("postgres")) {
    fail("DATABASE_URL (PostgreSQL) is required in production");
  } else {
    pass("DATABASE_URL PostgreSQL connection string present");
  }
}

// Operational checks are static heuristics, not a hosting/proxy or database audit.
function normalizeAuthority(input) {
  const value = input.trim().toLowerCase();
  if (!value || value.length > 253 || !/^(?:\[[a-f0-9:.]+\]|[a-z0-9.-]+)(?::[0-9]{1,5})?$/.test(value)) return null;
  try {
    const u = new URL(`https://${value}`);
    if (u.username || u.password || u.pathname !== "/" || u.search || u.hash) return null;
    if (!u.hostname.startsWith("[") && u.hostname.split(".").some(x => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x))) return null;
    return u.host;
  } catch { return null; }
}
if (forceProdCheck) {
  const originFile = path.join(rootDir, "src/lib/security/admin-origin.ts");
  const originSource = fs.existsSync(originFile) ? fs.readFileSync(originFile, "utf8") : "";
  const helperPresent = fs.existsSync(path.join(rootDir, "src/lib/security/write-host.ts"));
  if (!helperPresent || !originSource.includes("isAllowedProductionWriteHost")) {
    fail("Write-host protection not detected; verify security patch 20 before production");
  } else {
    const hosts = process.env.OMNIFLOW_ALLOWED_WRITE_HOSTS || "";
    const entries = hosts.split(",");
    const normalized = entries.map(normalizeAuthority);
    if (!hosts || hosts.length > 4096 || entries.length > 32 || normalized.some(x => !x)) {
      fail("OMNIFLOW_ALLOWED_WRITE_HOSTS missing or invalid; protected production writes will be rejected");
    } else {
      let canonical = null;
      try {
        const u = new URL((process.env.NEXT_PUBLIC_SITE_URL || "").trim());
        if (u.protocol === "https:" && !u.username && !u.password && u.pathname === "/" && !u.search && !u.hash) canonical = normalizeAuthority(u.host);
      } catch { /* Report a generic error without echoing values. */ }
      if (!canonical || !normalized.includes(canonical)) fail("Canonical URL must be a clean HTTPS origin included in OMNIFLOW_ALLOWED_WRITE_HOSTS");
      else pass("Write-host list format and canonical-host inclusion checked (other aliases/proxy require review)");
    }
  }
  const setupToken = (process.env.ADMIN_SETUP_TOKEN || "").trim();
  const signingSecrets = [(process.env.AUTH_SECRET || "").trim(), (process.env.SESSION_SECRET || "").trim()];
  if (setupToken && (!/^[0-9a-f]{64}$/i.test(setupToken) || signingSecrets.includes(setupToken))) {
    fail("Configured ADMIN_SETUP_TOKEN must be a separate random 64-hex token when patch 22 is installed");
  } else if (!setupToken) {
    warn("ADMIN_SETUP_TOKEN absent: production first-admin setup requires it when patch 22 is installed; absence after setup is expected");
  } else {
    pass("Configured setup token has expected format and differs from signing secrets (randomness not verified)");
  }
  const ipHeader = (process.env.OMNIFLOW_TRUSTED_CLIENT_IP_HEADER || "").trim().toLowerCase();
  if (!ipHeader) warn("Client IP defaults to unknown if patch 18 is installed; shared rate limits may block legitimate users");
  else if (!["x-real-ip", "cf-connecting-ip"].includes(ipHeader)) fail("Unsupported trusted client IP header; review proxy configuration");
  else warn("Trusted IP header set: verify proxy overwrites it and direct origin access is blocked; this script cannot verify trust");
  if (process.env.OMNIFLOW_ALLOW_LOCAL_DEV_DB === "true") fail("Local development database override must not be enabled in production");
}
warn("Preflight reads shell environment only, not deployment settings or PostgreSQL; it does not verify migrations, CMS values, edge security, HTTPS, staging or production readiness.");
if (strictPlaceholders) warn("Strict placeholder scan checks seed files and local JSON, not the live CMS; seed templates may remain after real content is configured.");

console.log("\n----------------------------------------------------------------------");
console.log(
  ` Summary: ${passed} passed · ${warnings} warning(s) · ${failed} failed`
);
console.log("======================================================================\n");

if (failed > 0) {
  process.exit(1);
}
