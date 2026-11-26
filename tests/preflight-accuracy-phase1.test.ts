import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const script = path.join(root, "scripts/preflight-check.mjs");
const run = (env: Record<string, string | undefined>, cwd = root, args: string[] = []) => {
  const p = spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", env: { ...process.env, NODE_ENV: "test", ...env } });
  if (p.error) throw p.error;
  return { text: p.stdout + p.stderr, status: p.status };
};

describe("preflight operational accuracy", () => {
  it("does not claim migrations are safe or idempotent and explains scan limitations", () => {
    const r = run({});
    expect(r.status).toBe(0);
    expect(r.text).not.toContain("is non-destructive & idempotent");
    expect(r.text).toContain("some statements may not be safe to rerun");
    expect(r.text).toContain("does not verify migrations, CMS values");
  });
  it("warns or fails on unsafe production host, setup and proxy configuration without logging values", () => {
    const env = { NEXT_PUBLIC_SITE_URL: "https://agency.invalid", DATABASE_URL: "postgres://SYNTHETIC_SECRET@invalid/db", AUTH_SECRET: "a".repeat(64), SESSION_SECRET: "", ADMIN_SETUP_TOKEN: "", OMNIFLOW_ALLOWED_WRITE_HOSTS: "", OMNIFLOW_TRUSTED_CLIENT_IP_HEADER: "", OMNIFLOW_ALLOW_LOCAL_DEV_DB: "false" };
    const missing = run(env, root, ["--mode=production"]);
    const guardInstalled = fs.existsSync(path.join(root, "src/lib/security/write-host.ts")) && fs.readFileSync(path.join(root, "src/lib/security/admin-origin.ts"), "utf8").includes("isAllowedProductionWriteHost");
    expect(missing.text).toContain(guardInstalled ? "OMNIFLOW_ALLOWED_WRITE_HOSTS missing or invalid" : "Write-host protection not detected");
    expect(missing.text).toContain("ADMIN_SETUP_TOKEN absent");
    expect(missing.text).toContain("shared rate limits");
    expect(missing.text).not.toContain("SYNTHETIC_SECRET");
    const wrong = run({ ...env, OMNIFLOW_ALLOWED_WRITE_HOSTS: "agency.invalid,*.invalid", ADMIN_SETUP_TOKEN: "a".repeat(64), OMNIFLOW_TRUSTED_CLIENT_IP_HEADER: "x-forwarded-for", OMNIFLOW_ALLOW_LOCAL_DEV_DB: "true" }, root, ["--mode=production"]);
    expect(wrong.text).toContain(guardInstalled ? "OMNIFLOW_ALLOWED_WRITE_HOSTS missing or invalid" : "Write-host protection not detected");
    expect(wrong.text).toContain("ADMIN_SETUP_TOKEN must be a separate");
    expect(wrong.text).toContain("Unsupported trusted client IP header");
    expect(wrong.text).toContain("override must not be enabled");
    const good = run({ ...env, OMNIFLOW_ALLOWED_WRITE_HOSTS: "www.agency.invalid,agency.invalid:443", ADMIN_SETUP_TOKEN: "b".repeat(64), OMNIFLOW_TRUSTED_CLIENT_IP_HEADER: "x-real-ip" }, root, ["--mode=production"]);
    expect(good.text).toContain(guardInstalled ? "canonical-host inclusion checked" : "Write-host protection not detected");
    expect(good.text).toContain("randomness not verified");
    expect(good.text).toContain("this script cannot verify trust");
    const secretUrl = run({ ...env, NEXT_PUBLIC_SITE_URL: "https://LEAKME:pass@agency.invalid", OMNIFLOW_ALLOWED_WRITE_HOSTS: "agency.invalid" }, root, ["--mode=production"]);
    expect(secretUrl.text).not.toContain("LEAKME");
    expect(secretUrl.text).toContain(guardInstalled ? "must be a clean HTTPS origin" : "Write-host protection not detected");
  });
  it("reports missing migration 0005 and handles truncated OG image without crashing", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-preflight-test-"));
    try {
      for (const name of ["src", "public", "supabase", "scripts"]) fs.cpSync(path.join(root, name), path.join(temp, name), {recursive:true});
      for (const name of ["package.json", "package-lock.json", "DEPLOYMENT_AND_HANDOVER.md", "README.md", "next.config.ts"]) fs.copyFileSync(path.join(root, name), path.join(temp, name));
      fs.rmSync(path.join(temp, "supabase/migrations/0005_rate_limit_fixed_window.sql"));
      fs.writeFileSync(path.join(temp, "public/og-image.png"), "broken");
      const r = run({}, temp);
      expect(r.status).toBe(1); expect(r.text).toContain("0005_rate_limit_fixed_window.sql");
      expect(r.text).toContain("public/og-image.png must be 1200x630");
      expect(r.text).not.toContain("RangeError");
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });
});
