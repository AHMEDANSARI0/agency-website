import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup-env.ts"],
    globals: false,
    // Retain Vitest's default test discovery, but never execute saved backups.
    exclude: [
      ...configDefaults.exclude,
      "**/.patch-backups/**",
      "**/navbar-backup-*/**",
      "**/navbar-background-backup-*/**",
    ],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
