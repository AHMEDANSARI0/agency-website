#!/usr/bin/env node
/**
 * Pre-dev hygiene guard:
 * 1. Purges any legacy/orphaned route or component files (e.g. `src/app/favicon.ico/route.ts`
 *    which triggers Next.js `conflicting-public-file-page` 500 errors alongside `public/favicon.ico`).
 * 2. Clears `.next` ONLY when switching from a production `npm run build` (`BUILD_ID`) or when
 *    the client module schema marker changes, preventing Next.js 15 Webpack HMR collisions.
 */
import fs from "node:fs";
import path from "node:path";

const CACHE_SCHEMA_MARKER = "phase9-globe-studio-v1";
const cwd = process.cwd();

const LEGACY_ORPHAN_PATHS = [
  "src/app/favicon.ico/route.ts",
  "src/app/favicon.ico",
  "src/components/animations/AmbientSoundToggle.tsx",
  "src/components/animations/LightUpText.tsx",
  "src/components/animations/OpeningSequence.tsx",
  "src/components/animations/Reveal.tsx",
  "scripts/generate-patcher.mjs",
];

let removedLegacy = 0;
for (const relPath of LEGACY_ORPHAN_PATHS) {
  const fullPath = path.join(cwd, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removedLegacy += 1;
    } catch {
      // Ignore file lock
    }
  }
}

if (removedLegacy > 0) {
  console.log(
    `[OmniFlow Dev] Removed ${removedLegacy} conflicting legacy path(s) (including duplicate favicon route).`
  );
}

const nextDir = path.join(cwd, ".next");
const buildIdFile = path.join(nextDir, "BUILD_ID");
const markerFile = path.join(nextDir, ".omniflow-dev-marker");

if (fs.existsSync(nextDir)) {
  const hasProdBuild = fs.existsSync(buildIdFile);
  const currentMarker = fs.existsSync(markerFile)
    ? fs.readFileSync(markerFile, "utf8").trim()
    : "";

  if (hasProdBuild || currentMarker !== CACHE_SCHEMA_MARKER || removedLegacy > 0) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log(
        `[OmniFlow Dev] Cleared stale .next cache (${hasProdBuild ? "production build -> dev switch" : "updated Phase 9 module graph"}).`
      );
    } catch {
      // Ignore Windows file-lock race; Next.js will overwrite unlocked files
    }
  }
}

try {
  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(markerFile, CACHE_SCHEMA_MARKER, "utf8");
} catch {
  // Ignore
}
