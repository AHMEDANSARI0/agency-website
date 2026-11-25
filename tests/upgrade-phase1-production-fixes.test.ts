import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import { GET as meHandler } from "@/app/api/admin/auth/me/route";
import {
  DELETE as revokeMySessionsHandler,
  POST as changePasswordHandler,
} from "@/app/api/admin/auth/password/route";
import { POST as recoverHandler } from "@/app/api/admin/auth/recover/route";
import { POST as resetPasswordHandler } from "@/app/api/admin/auth/reset-password/route";
import {
  GET as getSetupHandler,
  POST as postSetupHandler,
} from "@/app/api/admin/auth/setup/route";
import { PUT as putBrandHandler } from "@/app/api/admin/brand/route";
import {
  DELETE as deleteMediaHandler,
  GET as getMediaHandler,
  POST as postMediaHandler,
} from "@/app/api/admin/media/route";
import {
  GET as getBackupsHandler,
  POST as postBackupsHandler,
} from "@/app/api/admin/system/backups/route";
import { POST as createUserHandler } from "@/app/api/admin/users/route";
import { PATCH as patchUserHandler } from "@/app/api/admin/users/[id]/route";
import { GET as healthHandler } from "@/app/api/health/route";
import { POST as publicLeadHandler } from "@/app/api/leads/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { buildBootstrapSuperAdmin } from "@/lib/database/seed-data";
import {
  generateSecureRecoveryToken,
  validatePasswordStrength,
} from "@/lib/security/password";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-upg-p1-"));

function extractCookieToken(setCookieHeader: string | null): string {
  const match = (setCookieHeader || "").match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match?.[1] || "";
}

function makeJsonHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    ...(token ? { Cookie: `${SESSION_COOKIE_NAME}=${token}` } : {}),
  };
}

// Valid 1x1 PNG binary fixture
const TINY_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex"
);

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "upg-p1-db.json");
  process.env.OMNIFLOW_UPLOADS_DIR = path.join(tempDir, "uploads");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  delete process.env.OMNIFLOW_UPLOADS_DIR;
  delete process.env.OMNIFLOW_STRICT_PRODUCTION;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Upgrade Phase 1 — Critical Production Reliability, Auth Security, Storage & Health", () => {
  it("1. rejects missing DATABASE_URL, default passwords, and temporary storage in strict production", async () => {
    const prevStrict = process.env.OMNIFLOW_STRICT_PRODUCTION;
    const prevDbUrl = process.env.DATABASE_URL;
    const prevAuthSecret = process.env.AUTH_SECRET;
    const prevBootPass = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const prevBootEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;

    process.env.OMNIFLOW_STRICT_PRODUCTION = "true";
    process.env.AUTH_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    delete process.env.DATABASE_URL;

    try {
      // Known default password rejected in production bootstrap
      process.env.ADMIN_BOOTSTRAP_EMAIL = "founder@omniflow.ai";
      process.env.ADMIN_BOOTSTRAP_PASSWORD = "ChangeMe_StrongPass_2026!";
      expect(buildBootstrapSuperAdmin()).toBeNull();
      expect(
        validatePasswordStrength("ChangeMe_StrongPass_2026!", {
          rejectKnownDefaults: true,
        }).valid
      ).toBe(false);

      // Production write MUST NOT silently save to local JSON when DATABASE_URL is missing
      const leadRes = await publicLeadHandler(
        new Request("http://localhost:3000/api/leads", {
          method: "POST",
          headers: makeJsonHeaders(),
          body: JSON.stringify({
            name: "Strict Prod Visitor",
            email: "strict@enterprise.com",
            company: "Enterprise Corp",
            industry: "Consulting",
            interestedService: "Workflow Automation",
            businessProblem:
              "Testing that missing production DATABASE_URL never silently drops leads into /tmp.",
            privacyConsent: true,
          }),
        })
      );
      expect(leadRes.status).toBe(503);
      const leadJson = await leadRes.json();
      expect(leadJson.code).toBe("DB_MISSING_URL");

      // Public readiness probe returns 503 degraded without leaking any internals, secrets, or paths
      const readinessRes = await healthHandler(
        new Request("http://localhost:3000/api/health")
      );
      expect(readinessRes.status).toBe(503);
      const readinessRaw = await readinessRes.text();
      expect(readinessRaw).not.toContain(process.env.AUTH_SECRET!);
      expect(readinessRaw).not.toContain("/home/user");
      const readinessJson = JSON.parse(readinessRaw);
      expect(readinessJson).toEqual({ status: "degraded" });

      // Liveness probe still returns 200 with minimal public payload
      const livenessRes = await healthHandler(
        new Request("http://localhost:3000/api/health?probe=liveness")
      );
      expect(livenessRes.status).toBe(200);
      expect(await livenessRes.json()).toEqual({ status: "ok" });
    } finally {
      if (prevStrict === undefined) delete process.env.OMNIFLOW_STRICT_PRODUCTION;
      else process.env.OMNIFLOW_STRICT_PRODUCTION = prevStrict;
      if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = prevDbUrl;
      if (prevAuthSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = prevAuthSecret;
      if (prevBootPass === undefined) delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
      else process.env.ADMIN_BOOTSTRAP_PASSWORD = prevBootPass;
      if (prevBootEmail === undefined) delete process.env.ADMIN_BOOTSTRAP_EMAIL;
      else process.env.ADMIN_BOOTSTRAP_EMAIL = prevBootEmail;
    }
  });

  it("2. enforces one-time Initial Super Admin Setup flow when 0 users exist and locks afterward", async () => {
    const emptyDbPath = path.join(tempDir, "empty-users-db.json");
    const baseSnap = JSON.parse(
      JSON.stringify({
        schemaVersion: 5,
        users: [],
        auditLogs: [],
        siteSettings: (await db.getSiteSettings()),
        themeConfig: (await db.getThemeConfig()),
        brandAssets: (await db.getBrandAssets()),
        servicePillars: (await db.getServicePillars()),
        services: (await db.listServices(false)),
        caseStudies: (await db.listCaseStudies(false)),
        blogPosts: (await db.listBlogPosts(false)),
        faqs: (await db.listFaqs(false)),
        testimonials: [],
        teamMembers: (await db.listTeamMembers(false)),
        pages: (await db.listPages()),
        leads: [],
        mediaAssets: [],
        redirects: [],
        databaseBackups: [],
      })
    );
    fs.writeFileSync(emptyDbPath, JSON.stringify(baseSnap, null, 2), "utf8");

    const prevPath = process.env.OMNIFLOW_LOCAL_DB_PATH;
    process.env.OMNIFLOW_LOCAL_DB_PATH = emptyDbPath;

    try {
      const checkBefore = await (await getSetupHandler()).json();
      expect(checkBefore.setupRequired).toBe(true);

      // Login blocked with setupRequired=true when 0 users exist
      const prematureLogin = await loginHandler(
        new Request("http://localhost:3000/api/admin/auth/login", {
          method: "POST",
          headers: makeJsonHeaders(),
          body: JSON.stringify({
            email: "founder@omniflow.ai",
            password: "UniqueFounderPass_2026!",
          }),
        })
      );
      expect(prematureLogin.status).toBe(403);

      // Rejects default password during setup
      const weakSetup = await postSetupHandler(
        new Request("http://localhost:3000/api/admin/auth/setup", {
          method: "POST",
          headers: makeJsonHeaders(),
          body: JSON.stringify({
            name: "Ahmed Ansari",
            email: "founder@omniflow.ai",
            password: "ChangeMe_StrongPass_2026!",
          }),
        })
      );
      expect(weakSetup.status).toBe(400);

      // Succeeds with strong unique password
      const okSetup = await postSetupHandler(
        new Request("http://localhost:3000/api/admin/auth/setup", {
          method: "POST",
          headers: makeJsonHeaders(),
          body: JSON.stringify({
            name: "Ahmed Ansari",
            email: "founder@omniflow.ai",
            password: "UniqueFounderPass_2026!",
          }),
        })
      );
      expect(okSetup.status).toBe(201);

      // Permanently locked against any second setup call (409)
      const secondSetup = await postSetupHandler(
        new Request("http://localhost:3000/api/admin/auth/setup", {
          method: "POST",
          headers: makeJsonHeaders(),
          body: JSON.stringify({
            name: "Attacker",
            email: "attacker@evil.example",
            password: "AttackerStrongPass_2026!",
          }),
        })
      );
      expect(secondSetup.status).toBe(409);
    } finally {
      process.env.OMNIFLOW_LOCAL_DB_PATH = prevPath;
    }
  });

  it("3. enforces first-login password replacement, rotates passwords, revokes sessions, and handles recovery", async () => {
    // Sign in as dev bootstrap Super Admin
    const adminLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    expect(adminLogin.status).toBe(200);
    const adminToken = extractCookieToken(adminLogin.headers.get("set-cookie"));

    // Provision an Editor with mustChangePassword: true
    const createEd = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          name: "First Login Editor",
          email: "firstlogin@omniflow.example",
          role: "EDITOR",
          password: "InitialEditorPass_2026!",
          mustChangePassword: true,
        }),
      })
    );
    expect(createEd.status).toBe(201);
    const createdEditor = (await createEd.json()).user;

    // Editor logs in -> receives mustChangePassword: true
    const edLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({
          email: "firstlogin@omniflow.example",
          password: "InitialEditorPass_2026!",
        }),
      })
    );
    expect(edLogin.status).toBe(200);
    const edLoginJson = await edLogin.json();
    expect(edLoginJson.mustChangePassword).toBe(true);
    const initialEdToken = extractCookieToken(edLogin.headers.get("set-cookie"));

    // Blocked from regular admin APIs while mustChangePassword is true (403 MUST_CHANGE_PASSWORD)
    const blockedMedia = await getMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        headers: makeJsonHeaders(initialEdToken),
      })
    );
    expect(blockedMedia.status).toBe(403);
    expect((await blockedMedia.json()).code).toBe("MUST_CHANGE_PASSWORD");

    // Rotate password via /api/admin/auth/password
    const rotateRes = await changePasswordHandler(
      new Request("http://localhost:3000/api/admin/auth/password", {
        method: "POST",
        headers: makeJsonHeaders(initialEdToken),
        body: JSON.stringify({
          currentPassword: "InitialEditorPass_2026!",
          newPassword: "RotatedEditorPass_2026!",
        }),
      })
    );
    expect(rotateRes.status).toBe(200);
    const freshEdToken = extractCookieToken(rotateRes.headers.get("set-cookie"));

    // Old pre-rotation session token is IMMEDIATELY invalidated (401)
    const oldTokenCheck = await meHandler(
      new Request("http://localhost:3000/api/admin/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${initialEdToken}` },
      })
    );
    expect(oldTokenCheck.status).toBe(401);

    // Fresh session token works and unlocks /api/admin/media (200)
    const unlockedMedia = await getMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        headers: makeJsonHeaders(freshEdToken),
      })
    );
    expect(unlockedMedia.status).toBe(200);

    // Super Admin can explicitly revoke Editor's sessions via PATCH /api/admin/users/[id]
    const revokeByAdmin = await patchUserHandler(
      new Request(`http://localhost:3000/api/admin/users/${createdEditor.id}`, {
        method: "PATCH",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({ revokeSessions: true }),
      }),
      { params: Promise.resolve({ id: createdEditor.id }) }
    );
    expect(revokeByAdmin.status).toBe(200);

    const afterAdminRevoke = await meHandler(
      new Request("http://localhost:3000/api/admin/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${freshEdToken}` },
      })
    );
    expect(afterAdminRevoke.status).toBe(401);

    // Self session revocation endpoint works
    const selfRevoke = await revokeMySessionsHandler(
      new Request("http://localhost:3000/api/admin/auth/password?keepCurrent=true", {
        method: "DELETE",
        headers: makeJsonHeaders(adminToken),
      })
    );
    expect(selfRevoke.status).toBe(200);
    const nextAdminToken = extractCookieToken(selfRevoke.headers.get("set-cookie"));
    expect(nextAdminToken.length).toBeGreaterThan(20);

    // Single-use account recovery flow
    const recoverReq = await recoverHandler(
      new Request("http://localhost:3000/api/admin/auth/recover", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({ email: "firstlogin@omniflow.example" }),
      })
    );
    expect(recoverReq.status).toBe(200);

    // Issue known recovery token hash directly to verify reset-password consumption & single-use lock
    const { rawToken, tokenHash, expiresAtIso } = generateSecureRecoveryToken();
    await db.updateUser(createdEditor.id, {
      recoveryTokenHash: tokenHash,
      recoveryExpiresAt: expiresAtIso,
    });

    const resetOk = await resetPasswordHandler(
      new Request("http://localhost:3000/api/admin/auth/reset-password", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({
          token: rawToken,
          newPassword: "RecoveredEditorPass_2026!",
        }),
      })
    );
    expect(resetOk.status).toBe(200);

    // Reusing the same recovery token fails (400)
    const resetReplay = await resetPasswordHandler(
      new Request("http://localhost:3000/api/admin/auth/reset-password", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({
          token: rawToken,
          newPassword: "AnotherEditorPass_2026!",
        }),
      })
    );
    expect(resetReplay.status).toBe(400);
  });

  it("4. separates 4 MB max file size from 500 MB quota, blocks deleting referenced media, and verifies backups/restore", async () => {
    const loginRes = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: makeJsonHeaders(),
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    const adminToken = extractCookieToken(loginRes.headers.get("set-cookie"));

    // Upload valid PNG
    const form = new FormData();
    form.append(
      "file",
      new File([TINY_PNG_BUFFER], "brand-mark.png", { type: "image/png" })
    );
    form.append("altText", "OmniFlow Mark");
    form.append("category", "brand");

    const uploadRes = await postMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          Cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: form,
      })
    );
    expect(uploadRes.status).toBe(201);
    const uploadedAsset = (await uploadRes.json()).asset;

    // Assign as lightLogoUrl so it becomes actively referenced
    const brandBefore = await db.getBrandAssets();
    const putBrandRes = await putBrandHandler(
      new Request("http://localhost:3000/api/admin/brand", {
        method: "PUT",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          ...brandBefore,
          lightLogoUrl: uploadedAsset.url,
        }),
      })
    );
    expect(putBrandRes.status).toBe(200);

    // Check quota reporting & live usedIn reference
    const mediaListRes = await getMediaHandler(
      new Request("http://localhost:3000/api/admin/media", {
        headers: makeJsonHeaders(adminToken),
      })
    );
    const mediaListJson = await mediaListRes.json();
    expect(mediaListJson.quota.maxSingleUploadBytes).toBe(4 * 1024 * 1024);
    expect(mediaListJson.quota.quotaBytes).toBe(500 * 1024 * 1024);
    const listedAsset = mediaListJson.assets.find(
      (a: { id: string }) => a.id === uploadedAsset.id
    );
    expect(listedAsset.usedIn).toContain("Brand: Light Logo");

    // Deleting referenced media asset without force=true is blocked (409 Conflict)
    const blockedDel = await deleteMediaHandler(
      new Request(
        `http://localhost:3000/api/admin/media?id=${encodeURIComponent(uploadedAsset.id)}`,
        {
          method: "DELETE",
          headers: makeJsonHeaders(adminToken),
        }
      )
    );
    expect(blockedDel.status).toBe(409);

    // Database Backup & Safe Restore verification
    const createBkpRes = await postBackupsHandler(
      new Request("http://localhost:3000/api/admin/system/backups", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          action: "create",
          label: "Phase 1 Test Checkpoint",
        }),
      })
    );
    expect(createBkpRes.status).toBe(201);
    const createdBackup = (await createBkpRes.json()).backup;
    expect(createdBackup.checksumSha256.length).toBe(64);

    // Download JSON backup redacts password hashes
    const downloadRes = await getBackupsHandler(
      new Request("http://localhost:3000/api/admin/system/backups?download=true", {
        headers: makeJsonHeaders(adminToken),
      })
    );
    expect(downloadRes.status).toBe(200);
    const downloadText = await downloadRes.text();
    expect(downloadText).toContain("[REDACTED]");
    expect(downloadText).not.toContain("scrypt$");

    // Mutate tagline, then restore backup and confirm tagline reverts while safety backup is recorded
    const settingsBefore = await db.getSiteSettings();
    await db.saveSiteSettings({
      ...settingsBefore,
      tagline: "Temporary mutated tagline before restore",
    });
    expect((await db.getSiteSettings()).tagline).toBe(
      "Temporary mutated tagline before restore"
    );

    const restoreRes = await postBackupsHandler(
      new Request("http://localhost:3000/api/admin/system/backups", {
        method: "POST",
        headers: makeJsonHeaders(adminToken),
        body: JSON.stringify({
          action: "restore",
          backupId: createdBackup.id,
        }),
      })
    );
    expect(restoreRes.status).toBe(200);
    const restoreJson = await restoreRes.json();
    expect(restoreJson.safetyBackupId).toMatch(/^bkp_/);
    expect((await db.getSiteSettings()).tagline).toBe(settingsBefore.tagline);
  });
});
