import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as loginHandler } from "@/app/api/admin/auth/login/route";
import { POST as logoutHandler } from "@/app/api/admin/auth/logout/route";
import { GET as meHandler } from "@/app/api/admin/auth/me/route";
import { PATCH as patchLeadHandler } from "@/app/api/admin/leads/[id]/route";
import { GET as exportLeadsHandler } from "@/app/api/admin/leads/export/route";
import { PATCH as patchPoliciesHandler } from "@/app/api/admin/role-policies/route";
import { PATCH as patchUserHandler } from "@/app/api/admin/users/[id]/route";
import { GET as getUsersHandler, POST as createUserHandler } from "@/app/api/admin/users/route";
import { escapeCsvCell } from "@/features/leads/csv";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniflow-phase4-test-"));

function extractCookieToken(setCookieHeader: string | null): string {
  expect(setCookieHeader).toBeTruthy();
  const match = (setCookieHeader as string).match(
    new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  expect(match?.[1]).toBeTruthy();
  return match![1] as string;
}

function makeAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
    Host: "localhost:3000",
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

beforeAll(() => {
  process.env.OMNIFLOW_LOCAL_DB_PATH = path.join(tempDir, "phase4-db.json");
});

afterAll(() => {
  delete process.env.OMNIFLOW_LOCAL_DB_PATH;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Phase 4 — Admin Auth, Server-Side RBAC, Users, Audit Logs & Lead CRM", () => {
  let superAdminToken = "";
  let superAdminId = "";
  let editorToken = "";
  let authorToken = "";
  let authorId = "";

  it("1. rejects invalid credentials and issues signed session cookie on valid Super Admin login", async () => {
    const badRes = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "WrongPassword123!",
        }),
      })
    );
    expect(badRes.status).toBe(401);

    const okRes = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@omniflow.example",
          password: "ChangeMe_StrongPass_2026!",
        }),
      })
    );
    expect(okRes.status).toBe(200);
    const body = (await okRes.json()) as { user: { id: string; role: string } };
    expect(body.user.role).toBe("SUPER_ADMIN");
    superAdminId = body.user.id;
    superAdminToken = extractCookieToken(okRes.headers.get("set-cookie"));

    const meRes = await meHandler(
      new Request("http://localhost:3000/api/admin/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${superAdminToken}` },
      })
    );
    expect(meRes.status).toBe(200);
  });

  it("2. provisions EDITOR and AUTHOR accounts, prevents self-lockout, and enforces RBAC on /api/admin/users", async () => {
    // Super Admin creates Editor
    const createEditorRes = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({
          name: "Emma Editor",
          email: "editor@omniflow.example",
          role: "EDITOR",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    expect(createEditorRes.status).toBe(201);

    // Super Admin creates Author
    const createAuthorRes = await createUserHandler(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({
          name: "Alex Author",
          email: "author@omniflow.example",
          role: "AUTHOR",
          password: "Author_StrongPass_2026!",
        }),
      })
    );
    expect(createAuthorRes.status).toBe(201);
    const authorData = (await createAuthorRes.json()) as { user: { id: string } };
    authorId = authorData.user.id;

    // Prevent Super Admin from deactivating their own account
    const selfDeactivateRes = await patchUserHandler(
      new Request(`http://localhost:3000/api/admin/users/${superAdminId}`, {
        method: "PATCH",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({ isActive: false }),
      }),
      { params: Promise.resolve({ id: superAdminId }) }
    );
    expect(selfDeactivateRes.status).toBe(400);

    // Login as Editor & Author
    const editorLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "editor@omniflow.example",
          password: "Editor_StrongPass_2026!",
        }),
      })
    );
    editorToken = extractCookieToken(editorLogin.headers.get("set-cookie"));

    const authorLogin = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "author@omniflow.example",
          password: "Author_StrongPass_2026!",
        }),
      })
    );
    authorToken = extractCookieToken(authorLogin.headers.get("set-cookie"));

    // Editor cannot access /api/admin/users (403)
    const editorUsersAttempt = await getUsersHandler(
      new Request("http://localhost:3000/api/admin/users", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${editorToken}` },
      })
    );
    expect(editorUsersAttempt.status).toBe(403);
  });

  it("3. revokes active session immediately when a staff account is suspended", async () => {
    const suspendRes = await patchUserHandler(
      new Request(`http://localhost:3000/api/admin/users/${authorId}`, {
        method: "PATCH",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({ isActive: false }),
      }),
      { params: Promise.resolve({ id: authorId }) }
    );
    expect(suspendRes.status).toBe(200);

    // Previously issued authorToken must now fail with 401 on live DB lookup
    const meSuspended = await meHandler(
      new Request("http://localhost:3000/api/admin/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${authorToken}` },
      })
    );
    expect(meSuspended.status).toBe(401);

    // Reactivate Author and sign in freshly (suspension permanently revokes pre-suspension session tokens)
    await patchUserHandler(
      new Request(`http://localhost:3000/api/admin/users/${authorId}`, {
        method: "PATCH",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({ isActive: true }),
      }),
      { params: Promise.resolve({ id: authorId }) }
    );

    const reloginAuthor = await loginHandler(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
        body: JSON.stringify({
          email: "author@omniflow.example",
          password: "Author_StrongPass_2026!",
        }),
      })
    );
    authorToken = extractCookieToken(reloginAuthor.headers.get("set-cookie"));
  });

  it("4. updates Lead CRM pipeline, notes, follow-up dates, enforces Author 403, and exports formula-safe CSV", async () => {
    const createdLead = await db.createLead({
      name: "=cmd|' /C calc'!A0", // malicious spreadsheet formula test
      email: "prospect@advisory.co.uk",
      company: "Kensington Advisory Ltd",
      industry: "Consulting / Advisory",
      interestedService: "Lead Management Automation",
      businessProblem: "Manual qualification delays inbound discovery calls by 36 hours.",
      privacyConsent: true,
      source: "website_contact",
      emailNotificationStatus: "skipped_unconfigured",
    });

    // Author cannot update leads (403)
    const authorLeadAttempt = await patchLeadHandler(
      new Request(`http://localhost:3000/api/admin/leads/${createdLead.id}`, {
        method: "PATCH",
        headers: makeAuthHeaders(authorToken),
        body: JSON.stringify({ status: "Qualified" }),
      }),
      { params: Promise.resolve({ id: createdLead.id }) }
    );
    expect(authorLeadAttempt.status).toBe(403);

    // Editor CAN update lead status, add note, and set follow-up date
    const editorPatchRes = await patchLeadHandler(
      new Request(`http://localhost:3000/api/admin/leads/${createdLead.id}`, {
        method: "PATCH",
        headers: makeAuthHeaders(editorToken),
        body: JSON.stringify({
          status: "Qualified",
          statusNote: "High-fit UK advisory practice.",
          noteText: "Confirmed HubSpot + Slack stack.",
          followUpDate: "2026-11-25",
        }),
      }),
      { params: Promise.resolve({ id: createdLead.id }) }
    );
    expect(editorPatchRes.status).toBe(200);
    const updatedPayload = (await editorPatchRes.json()) as {
      lead: {
        status: string;
        followUpDate: string;
        notes: { text: string }[];
        statusHistory: { to: string }[];
      };
    };
    expect(updatedPayload.lead.status).toBe("Qualified");
    expect(updatedPayload.lead.followUpDate).toBe("2026-11-25");
    expect(updatedPayload.lead.notes[0]?.text).toContain("HubSpot");
    expect(updatedPayload.lead.statusHistory[0]?.to).toBe("Qualified");

    // Export CSV neutralizes formula injection
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("\"'=SUM(A1:A2)\"");
    const csvRes = await exportLeadsHandler(
      new Request("http://localhost:3000/api/admin/leads/export?status=Qualified", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${editorToken}` },
      })
    );
    expect(csvRes.status).toBe(200);
    const csvText = await csvRes.text();
    expect(csvText).toContain("\"'=cmd|' /C calc'!A0\"");
    expect(csvText).toContain("Kensington Advisory Ltd");
  });

  it("5. updates RolePolicyConfig and records audit logs across operations", async () => {
    const policyRes = await patchPoliciesHandler(
      new Request("http://localhost:3000/api/admin/role-policies", {
        method: "PATCH",
        headers: makeAuthHeaders(superAdminToken),
        body: JSON.stringify({
          editorCanPublish: false,
          editorCanManageTheme: false,
        }),
      })
    );
    expect(policyRes.status).toBe(200);

    const logoutRes = await logoutHandler(
      new Request("http://localhost:3000/api/admin/auth/logout", {
        method: "POST",
        headers: makeAuthHeaders(editorToken),
      })
    );
    // Local JSON cannot guarantee secure revocation; PostgreSQL is required.
    expect(logoutRes.status).toBe(503);

    const logs = await db.listAuditLogs(25);
    const actions = logs.map((l) => l.action);
    expect(actions).toContain("auth.login_failed");
    expect(actions).toContain("auth.login_success");
    expect(actions).toContain("user.created");
    expect(actions).toContain("lead.updated");
    expect(actions).toContain("leads.export_csv");
    expect(actions).toContain("role_policy.updated");
    expect(actions).not.toContain("auth.logout");
  });
});
