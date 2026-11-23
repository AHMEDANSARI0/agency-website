import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { POST as submitLeadHandler } from "@/app/api/leads/route";
import { sanitizeEmailHeader } from "@/features/leads/notify";
import { extractClientIp, sanitizeIpCandidate } from "@/lib/security/rate-limit";
import {
  computeLeadIdempotencyFingerprint,
  readBoundedJsonBody,
} from "@/lib/security/request-guards";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase8-test-"));

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase8-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Upgrade Phase 8 — Security, Rate-Limiting, CSP, Idempotency & Fault Isolation", () => {
  it("1. rejects oversized JSON payloads (> 24 KB) on /api/leads with HTTP 413", async () => {
    const hugeProblem = "A".repeat(30 * 1024);
    const req = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Host: "localhost:3000",
        "X-Forwarded-For": "198.51.100.41",
      },
      body: JSON.stringify({
        name: "Test Prospect",
        email: "prospect@example.com",
        company: "Example Co",
        industry: "Consulting & Advisory Practice",
        interestedService: "Lead Management",
        businessProblem: hugeProblem,
        privacyConsent: true,
      }),
    });

    const boundedCheck = await readBoundedJsonBody(req.clone(), 24 * 1024);
    expect(boundedCheck.ok).toBe(false);
    if (!boundedCheck.ok) {
      expect(boundedCheck.status).toBe(413);
    }

    const res = await submitLeadHandler(req);
    expect(res.status).toBe(413);
  });

  it("2. deduplicates retried lead submissions carrying the same Idempotency-Key header", async () => {
    const payload = {
      name: "Claire Whitfield",
      email: "claire.idempotent@northbridge.example",
      company: "Northbridge Advisory UK",
      industry: "Consulting & Advisory Practice",
      interestedService: "Lead Management & Qualification",
      businessProblem:
        "We manually copy 45 inbound enquiries per week from web forms into HubSpot and miss follow-ups.",
      privacyConsent: true,
    };

    const idemKey = "idem_of_test_retry_2026_001";
    const fp1 = computeLeadIdempotencyFingerprint({
      idempotencyKey: idemKey,
      email: payload.email,
      company: payload.company,
    });
    const fp2 = computeLeadIdempotencyFingerprint({
      idempotencyKey: idemKey,
      email: "  CLAIRE.IDEMPOTENT@northbridge.example ",
      company: payload.company,
    });
    expect(fp1).toBe(fp2);

    const makeReq = () =>
      new Request("http://localhost:3000/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
          "X-Forwarded-For": "198.51.100.42",
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify(payload),
      });

    const firstRes = await submitLeadHandler(makeReq());
    expect(firstRes.status).toBe(201);
    const firstJson = (await firstRes.json()) as { leadId: string };

    const secondRes = await submitLeadHandler(makeReq());
    expect(secondRes.status).toBe(200);
    const secondJson = (await secondRes.json()) as {
      leadId: string;
      deduplicated?: boolean;
    };
    expect(secondJson.deduplicated).toBe(true);
    expect(secondJson.leadId).toBe(firstJson.leadId);

    const allLeads = await db.listLeads();
    const matching = allLeads.filter(
      (l) => l.email === "claire.idempotent@northbridge.example"
    );
    expect(matching).toHaveLength(1);
  });

  it("3. strips CRLF email header injection & sanitizes spoofed X-Forwarded-For headers", () => {
    const hostileSubject = sanitizeEmailHeader(
      "Acme Corp\r\nBcc: attacker@evil.example\r\nSubject: Injected"
    );
    expect(hostileSubject).not.toContain("\r");
    expect(hostileSubject).not.toContain("\n");
    expect(hostileSubject).toContain("Acme Corp Bcc:");

    expect(sanitizeIpCandidate("203.0.113.19")).toBe("203.0.113.19");
    expect(sanitizeIpCandidate("2001:db8::1")).toBe("2001:db8::1");
    expect(sanitizeIpCandidate("<script>alert(1)</script>")).toBe("unknown");

    const spoofedHeaders = new Headers({
      "x-forwarded-for": "'; DROP TABLE rate_limits; --, 203.0.113.8",
      "x-real-ip": "203.0.113.8",
    });
    expect(extractClientIp(spoofedHeaders)).toBe("203.0.113.8");
  });

  it("4. configures preview-compatible Content-Security-Policy and cross-domain hardening headers", async () => {
    const headerRules = await nextConfig.headers!();
    const rootRule = headerRules.find((r) => r.source === "/(.*)");
    expect(rootRule).toBeDefined();

    const cspHeader = rootRule!.headers.find(
      (h) => h.key === "Content-Security-Policy"
    );
    expect(cspHeader).toBeDefined();
    expect(cspHeader!.value).toContain("object-src 'none'");
    expect(cspHeader!.value).toContain("base-uri 'self'");
    expect(cspHeader!.value).not.toContain("frame-ancestors");

    const crossDomain = rootRule!.headers.find(
      (h) => h.key === "X-Permitted-Cross-Domain-Policies"
    );
    expect(crossDomain?.value).toBe("none");
  });
});
