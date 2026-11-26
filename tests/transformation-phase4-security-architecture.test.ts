import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import { POST as resetPasswordHandler } from "@/app/api/admin/auth/reset-password/route";
import { GET as setupStatusHandler, POST as setupHandler } from "@/app/api/admin/auth/setup/route";
import { POST as submitLeadHandler } from "@/app/api/leads/route";
import { verifySessionToken } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { generateSecureRecoveryToken, verifyPassword } from "@/lib/security/password";
import {
  clearInMemoryIdempotencyCache,
  readBoundedJsonBody,
} from "@/lib/security/request-guards";

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "omniflow-transformation-p4-")
);
const dbFilePath = path.join(tempDir, "phase4-security-db.json");

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = dbFilePath;
  // Initialize snapshot with ZERO users so we can test concurrent initial setup atomicity
  const emptyUsersSeed = createInitialSeedSnapshot();
  emptyUsersSeed.users = [];
  fs.writeFileSync(dbFilePath, JSON.stringify(emptyUsersSeed, null, 2), "utf8");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Transformation Phase 4 — Security, Atomicity, Performance & Architecture", () => {
  it("prevents TOCTOU duplicate Super Admin creation under concurrent /api/admin/auth/setup requests", async () => {
    const preCheck = await setupStatusHandler();
    const preJson = (await preCheck.json()) as { setupRequired: boolean };
    expect(preJson.setupRequired).toBe(true);

    const makeSetupRequest = (idx: number) =>
      new Request("http://localhost:3000/api/admin/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          "X-Forwarded-For": `198.51.100.${10 + idx}`,
        },
        body: JSON.stringify({
          name: `Concurrent Admin ${idx}`,
          email: `founder-${idx}@omniflow.example`,
          password: `ResilientVault#${idx}9482!`,
        }),
      });

    const responses = await Promise.all([
      setupHandler(makeSetupRequest(1)),
      setupHandler(makeSetupRequest(2)),
      setupHandler(makeSetupRequest(3)),
    ]);

    const statuses = responses.map((r) => r.status).sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409, 409]);

    const totalUsers = await db.countUsers();
    expect(totalUsers).toBe(1);

    const users = await db.listUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.role).toBe("SUPER_ADMIN");
  });

  it("enforces atomic single-use password recovery token consumption under concurrent replay", async () => {
    const users = await db.listUsers();
    const adminUser = users[0]!;
    const { rawToken, tokenHash, expiresAtIso } = generateSecureRecoveryToken();

    await db.updateUser(adminUser.id, {
      recoveryTokenHash: tokenHash,
      recoveryExpiresAt: expiresAtIso,
    });

    const beforeUser = await db.findUserById(adminUser.id);
    const priorToken =
      "dummy_check_via_session_version_" + String(beforeUser?.sessionVersion ?? 1);
    expect(priorToken).toContain("1");

    const makeResetRequest = (idx: number) =>
      new Request("http://localhost:3000/api/admin/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          "X-Forwarded-For": `203.0.113.${20 + idx}`,
        },
        body: JSON.stringify({
          token: rawToken,
          newPassword: `RotatedAtomicKey#${idx}2026!`,
        }),
      });

    const [resA, resB] = await Promise.all([
      resetPasswordHandler(makeResetRequest(1)),
      resetPasswordHandler(makeResetRequest(2)),
    ]);

    const statuses = [resA.status, resB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 400]);

    const afterUser = await db.findUserById(adminUser.id);
    expect(afterUser?.recoveryTokenHash).toBeNull();
    expect(afterUser?.recoveryExpiresAt).toBeNull();
    expect((afterUser?.sessionVersion ?? 1)).toBeGreaterThan(
      beforeUser?.sessionVersion ?? 1
    );
    expect(
      verifyPassword("RotatedAtomicKey#12026!", afterUser!.passwordHash) ||
        verifyPassword("RotatedAtomicKey#22026!", afterUser!.passwordHash)
    ).toBe(true);
  });

  it("persists Idempotency-Key deduplication across simulated serverless cold starts while keeping keyless repeat enquiries flagged", async () => {
    const leadPayload = {
      name: "Zainab Malik",
      email: "zainab.phase4@acme-logistics.example",
      company: "Acme Logistics",
      industry: "Supply Chain",
      interestedService: "Workflow Automation",
      businessProblem:
        "Need automated dispatch routing and WhatsApp status updates integrated with our ERP.",
      privacyConsent: true,
    };

    const firstReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "X-Forwarded-For": "192.0.2.55",
        "Idempotency-Key": "idem-phase4-coldstart-key-001",
      },
      body: JSON.stringify(leadPayload),
    });

    const firstRes = await submitLeadHandler(firstReq);
    expect(firstRes.status).toBe(201);
    const firstJson = (await firstRes.json()) as { ok: boolean; leadId: string };
    expect(firstJson.ok).toBe(true);
    expect(firstJson.leadId).toMatch(/^lead_/);

    // Simulate serverless cold start wiping in-memory Map
    clearInMemoryIdempotencyCache();

    const retryReq = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "X-Forwarded-For": "192.0.2.55",
        "Idempotency-Key": "idem-phase4-coldstart-key-001",
      },
      body: JSON.stringify(leadPayload),
    });

    const retryRes = await submitLeadHandler(retryReq);
    expect(retryRes.status).toBe(200);
    const retryJson = (await retryRes.json()) as {
      ok: boolean;
      leadId: string;
      deduplicated?: boolean;
    };
    expect(retryJson.deduplicated).toBe(true);
    expect(retryJson.leadId).toBe(firstJson.leadId);

    const matchingAfterRetry = (await db.listLeads()).filter(
      (l) => l.email === leadPayload.email
    );
    expect(matchingAfterRetry).toHaveLength(1);

    // Repeat submission WITHOUT Idempotency-Key must still return 201 with isDuplicateFlag = true
    const secondDistinctEnquiry = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "X-Forwarded-For": "192.0.2.56",
      },
      body: JSON.stringify({
        ...leadPayload,
        businessProblem:
          "Follow-up scope: we also want automated invoice reconciliation in phase two.",
      }),
    });

    const secondRes = await submitLeadHandler(secondDistinctEnquiry);
    expect(secondRes.status).toBe(201);
    const secondJson = (await secondRes.json()) as { leadId: string };
    const storedSecond = await db.getLeadById(secondJson.leadId);
    expect(storedSecond?.isDuplicateFlag).toBe(true);
  });

  it("aborts chunked oversized JSON streams immediately with 413 without Content-Length", async () => {
    let chunksPulled = 0;
    const chunkBlock = new TextEncoder().encode("x".repeat(8 * 1024));
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksPulled += 1;
        if (chunksPulled <= 10) {
          controller.enqueue(chunkBlock);
        } else {
          controller.close();
        }
      },
    });

    const chunkedReq = new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
      },
      body: stream,
      // @ts-expect-error Node fetch duplex option for streaming request bodies
      duplex: "half",
    });

    const result = await readBoundedJsonBody(chunkedReq, 16 * 1024);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
    // Stream aborted at chunk 3 (>16KB) instead of buffering all 10 chunks (80KB)
    expect(chunksPulled).toBeLessThanOrEqual(4);

    // Verify login route also rejects oversized payload with 413
    const oversizedLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "staff@omniflow.example",
          password: "A".repeat(20 * 1024),
        }),
      })
    );
    expect(oversizedLogin.status).toBe(413);
  });

  it("hardens CSRF verification against null origins, cross-origin Referer, and multi-proxy X-Forwarded-Host", () => {
    // 1. Sandboxed iframe Origin: null must be rejected
    const nullOriginReq = new Request("https://omniflow.ai/api/leads", {
      method: "POST",
      headers: {
        Host: "omniflow.ai",
        Origin: "null",
      },
    });
    expect(verifySameOriginRequest(nullOriginReq)).toBe(false);

    // 2. Stripped Origin with cross-origin Referer must be rejected
    const evilRefererReq = new Request("https://omniflow.ai/api/leads", {
      method: "POST",
      headers: {
        Host: "omniflow.ai",
        Referer: "https://attacker.evil.example/phish",
      },
    });
    expect(verifySameOriginRequest(evilRefererReq)).toBe(false);

    // 3. Sec-Fetch-Site: cross-site must be rejected even without Origin
    const crossSiteFetchReq = new Request("https://omniflow.ai/api/leads", {
      method: "POST",
      headers: {
        Host: "omniflow.ai",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    expect(verifySameOriginRequest(crossSiteFetchReq)).toBe(false);

    // 4. Client-provided forwarded Host is untrusted, even behind a multi-hop proxy
    const proxyValidReq = new Request("http://internal:3000/api/leads", {
      method: "POST",
      headers: {
        Host: "internal:3000",
        "X-Forwarded-Host": "omniflow.ai, proxy-edge.internal",
        Origin: "https://omniflow.ai",
      },
    });
    expect(verifySameOriginRequest(proxyValidReq)).toBe(false);
    const proxyMatchingPublicHostReq = new Request("http://internal:3000/api/leads", {
      method: "POST",
      headers: { Host: "omniflow.ai", Origin: "https://omniflow.ai" },
    });
    expect(verifySameOriginRequest(proxyMatchingPublicHostReq)).toBe(true);

    // 5. Tampered session token signature is rejected
    expect(verifySessionToken("eyJ1c2VySWQiOiJ1c3JfMSJ9.tampered_sig")).toBeNull();
  });

  it("resolves single-record slug/id lookups with publication visibility guards and non-destructive SQL migration 0004", async () => {
    const services = await db.listServices(true);
    expect(services.length).toBeGreaterThan(0);
    const singleService = await db.getServiceBySlug(services[0]!.slug);
    expect(singleService?.id).toBe(services[0]!.id);
    expect(await db.getServiceBySlug("non-existent-service-slug")).toBeNull();

    // Draft case study / blog post visibility enforcement on single-slug lookup
    const allPosts = await db.listBlogPosts(false);
    expect(allPosts.length).toBeGreaterThan(0);
    const targetPost = allPosts[0]!;
    await db.upsertBlogPost({ ...targetPost, status: "draft" });

    expect(await db.getBlogPostBySlug(targetPost.slug, true)).toBeNull();
    expect((await db.getBlogPostBySlug(targetPost.slug, false))?.id).toBe(
      targetPost.id
    );
    expect((await db.getBlogPostById(targetPost.id))?.slug).toBe(targetPost.slug);

    // Restore published status
    await db.upsertBlogPost({ ...targetPost, status: "published" });

    // Verify 0004 SQL migration integrity
    const sql0004 = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/0004_security_and_performance.sql"
      ),
      "utf8"
    );
    expect(sql0004).toContain("CREATE TABLE IF NOT EXISTS lead_idempotency_keys");
    expect(sql0004).toContain("idx_leads_email_lower");
    expect(sql0004).toContain("idx_users_recovery_hash");
    expect(sql0004).not.toMatch(/\b(DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i);
  });
});
