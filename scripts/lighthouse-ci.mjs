#!/usr/bin/env node
/**
 * OmniFlow Performance & Core Web Vitals Budget Auditor (`npm run perf:audit`)
 *
 * Works cross-platform (Windows cmd/PowerShell, macOS, Linux, GitHub Actions):
 * - If a server is already running at AUDIT_BASE_URL (default http://127.0.0.1:3000),
 *   audits it directly.
 * - If nothing is listening on 127.0.0.1:3000 locally and `.next/BUILD_ID` exists,
 *   automatically boots a temporary `next start` server, runs the audit, and shuts it down.
 * - Set `LIGHTHOUSE_CLI=1` when Chrome is installed to also run full mobile Lighthouse.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import zlib from "node:zlib";

const EXPLICIT_URL = process.env.AUDIT_BASE_URL?.trim();

export const CWV_BUDGETS = {
  mobilePerformanceScoreMin: 0.9,
  lcpMaxMs: 2000,
  clsMax: 0.05,
  inpMaxMs: 200,
  tbtMaxMs: 150,
  gzipHtmlMaxBytes: 65_000,
  warmTtfbMaxMs: 350,
};

const ROUTES = ["/", "/services", "/pricing", "/contact", "/demos"];

async function isServerReachable(baseUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl}/`, { signal: controller.signal });
    clearTimeout(timer);
    return res.status > 0;
  } catch {
    return false;
  }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 3099;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function waitForServer(baseUrl, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerReachable(baseUrl)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function startTempNextServer() {
  const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
  const nextBin = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  if (!fs.existsSync(buildIdPath)) {
    console.error(
      "\n[perf:audit] No server is running on http://127.0.0.1:3000 and no production build was found in .next/.\n" +
        "  1. Build first:   npm run build\n" +
        "  2. Run audit:     npm run perf:audit\n" +
        "  (Or audit a deployed URL: set AUDIT_BASE_URL=https://your-domain.vercel.app)\n"
    );
    process.exit(1);
  }

  if (!fs.existsSync(nextBin)) {
    console.error(
      '\n[perf:audit] node_modules/next not found. Run "npm install" inside your project root first.\n'
    );
    process.exit(1);
  }

  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(
    `[perf:audit] Port 3000 not running — auto-starting production Next.js server on ${baseUrl} ...`
  );

  const child = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "production",
        OMNIFLOW_ALLOW_LOCAL_DEV_DB:
          process.env.OMNIFLOW_ALLOW_LOCAL_DEV_DB || "true",
      },
    }
  );

  let bootLogs = "";
  child.stdout?.on("data", (chunk) => {
    bootLogs += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    bootLogs += String(chunk);
  });

  const ready = await waitForServer(baseUrl, 20_000);
  if (!ready) {
    child.kill();
    console.error(
      `\n[perf:audit] Timed out waiting for Next.js server on ${baseUrl}.\n${bootLogs}`
    );
    process.exit(1);
  }

  return {
    baseUrl,
    stop: () => {
      try {
        child.kill();
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

async function auditLiveHttpBudgets(baseUrl) {
  const failures = [];
  console.log(`\nAuditing OmniFlow HTTP & CWV budgets against ${baseUrl} ...`);

  for (const route of ROUTES) {
    const url = `${baseUrl}${route}`;
    // Warm request first so ISR cache is populated
    await fetch(url);

    const t0 = performance.now();
    const res = await fetch(url);
    const ttfbMs = Math.round(performance.now() - t0);
    const html = await res.text();
    const htmlBytes = Buffer.byteLength(html, "utf8");
    const gzipBytes = zlib.gzipSync(html).byteLength;

    const fontPreloads = (
      html.match(/rel="preload"[^>]*as="font"/gi) || []
    ).length;

    console.log(
      `  ${route.padEnd(12)} status=${res.status} warmTTFB=${ttfbMs}ms gzip=${(
        gzipBytes / 1024
      ).toFixed(1)}kB (raw=${(htmlBytes / 1024).toFixed(
        1
      )}kB) fontPreloads=${fontPreloads}`
    );

    if (res.status !== 200) {
      failures.push(`${route}: expected HTTP 200, got ${res.status}`);
    }
    if (ttfbMs > CWV_BUDGETS.warmTtfbMaxMs) {
      failures.push(
        `${route}: warm TTFB ${ttfbMs}ms exceeded ${CWV_BUDGETS.warmTtfbMaxMs}ms`
      );
    }
    if (gzipBytes > CWV_BUDGETS.gzipHtmlMaxBytes) {
      failures.push(
        `${route}: gzipped HTML ${gzipBytes}B exceeded ${CWV_BUDGETS.gzipHtmlMaxBytes}B`
      );
    }
    if (html.includes("JetBrains_Mono")) {
      failures.push(`${route}: unexpected 3rd font family JetBrains_Mono found`);
    }
  }

  const logoRes = await fetch(`${baseUrl}/logo.svg`);
  const cc = logoRes.headers.get("cache-control") || "";
  if (!cc.includes("stale-while-revalidate")) {
    failures.push(
      `/logo.svg: expected stale-while-revalidate Cache-Control, got "${cc}"`
    );
  }

  if (failures.length > 0) {
    console.error("\nPerformance budget violations:");
    for (const f of failures) console.error(`  - ${f}`);
    return false;
  }

  console.log("All HTTP TTFB, HTML payload, font, and cache header budgets passed.");
  return true;
}

function runLighthouseCliIfEnabled(baseUrl) {
  if (process.env.LIGHTHOUSE_CLI !== "1") {
    return true;
  }
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  for (const route of ROUTES) {
    const url = `${baseUrl}${route}`;
    console.log(`\nRunning Lighthouse mobile audit on ${url} ...`);
    const res = spawnSync(
      npxCmd,
      [
        "--yes",
        "lighthouse",
        url,
        "--only-categories=performance",
        "--output=json",
        "--quiet",
        '--chrome-flags="--headless=new --no-sandbox"',
      ],
      {
        encoding: "utf8",
        maxBuffer: 25 * 1024 * 1024,
        shell: process.platform === "win32",
      }
    );
    if (res.status !== 0) {
      console.error(`Lighthouse CLI failed on ${url}:`, res.stderr);
      return false;
    }
    const report = JSON.parse(res.stdout);
    const score = report.categories?.performance?.score ?? 0;
    const lcp = report.audits?.["largest-contentful-paint"]?.numericValue ?? 0;
    const cls = report.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;
    const tbt = report.audits?.["total-blocking-time"]?.numericValue ?? 0;

    console.log(
      `  Lighthouse ${route}: score=${Math.round(score * 100)} LCP=${Math.round(
        lcp
      )}ms CLS=${cls.toFixed(3)} TBT=${Math.round(tbt)}ms`
    );

    if (
      score < CWV_BUDGETS.mobilePerformanceScoreMin ||
      lcp > CWV_BUDGETS.lcpMaxMs ||
      cls > CWV_BUDGETS.clsMax ||
      tbt > CWV_BUDGETS.tbtMaxMs
    ) {
      console.error(`Lighthouse budget failed on ${route}`);
      return false;
    }
  }
  return true;
}

let tempServer = null;
try {
  let targetUrl = (EXPLICIT_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

  if (!(await isServerReachable(targetUrl))) {
    if (EXPLICIT_URL) {
      console.error(
        `\n[perf:audit] Could not reach AUDIT_BASE_URL=${targetUrl}. Make sure the server is running and accessible.\n`
      );
      process.exit(1);
    }
    tempServer = await startTempNextServer();
    targetUrl = tempServer.baseUrl;
  }

  const httpOk = await auditLiveHttpBudgets(targetUrl);
  const lhOk = httpOk ? runLighthouseCliIfEnabled(targetUrl) : false;
  if (!httpOk || !lhOk) {
    process.exitCode = 1;
  }
} finally {
  tempServer?.stop();
}
