import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeEach } from "vitest";

// Strip any ambient DATABASE_URL loaded by Vite/Vitest from .env / .env.local so
// automated test suites never connect to or mutate a developer's live PostgreSQL DB.
// Individual tests that explicitly assign process.env.DATABASE_URL inside `it(...)`
// continue to test PostgreSQL URL normalization and fallback behavior as expected.
delete process.env.DATABASE_URL;

// Clean any stale serverless /tmp fallback file left by earlier runs in os.tmpdir().
const sharedTmpFallback = path.join(os.tmpdir(), "omniflow-data", "omniflow-db.json");
try {
  if (fs.existsSync(sharedTmpFallback)) {
    fs.rmSync(sharedTmpFallback, { force: true });
  }
} catch {
  // Ignore concurrent cleanup races across parallel worker threads
}

const workerTempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "omniflow-vitest-worker-")
);

process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(
  workerTempDir,
  `seed-${crypto.randomUUID()}.json`
);

beforeEach(() => {
  delete process.env.DATABASE_URL;
  if (!process.env.OMNIFLOW_LOCAL_DB_PATH) {
    process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(
      workerTempDir,
      `seed-${crypto.randomUUID()}.json`
    );
  }
});

afterAll(() => {
  try {
    fs.rmSync(workerTempDir, { recursive: true, force: true });
  } catch {
    // Ignore Windows EBUSY lock cleanup races
  }
});
