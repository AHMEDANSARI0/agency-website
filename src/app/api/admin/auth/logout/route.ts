import { NextResponse } from "next/server";
import { extractSessionTokenFromCookieHeader } from "@/lib/auth/server";
import { getSessionCookieOptions, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { verifyAdminWriteOrigin } from "@/lib/security/admin-origin";
import { extractClientIp } from "@/lib/security/rate-limit";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  if (!verifyAdminWriteOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403, headers: NO_STORE });
  }

  let token: string | null = null;
  try {
    token = extractSessionTokenFromCookieHeader(request.headers.get("cookie"));
  } catch {
    // A malformed cookie is invalid; clearing it is safe and does not touch a user.
  }
  const session = verifySessionToken(token);
  let auditRecorded = true;
  if (session) {
    let user: Awaited<ReturnType<typeof db.revokeSessionsForVersion>>;
    try {
      user = await db.revokeSessionsForVersion(session.userId, session.sessionVersion);
    } catch {
      // Do not report success or delete the cookie if server-side revocation failed.
      return NextResponse.json({ error: "Unable to sign out securely. Please retry." }, { status: 503, headers: NO_STORE });
    }
    if (user) {
      try {
        await db.recordAuditLog({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "auth.logout",
          entityType: "auth",
          entityId: user.id,
          summary: `Staff user ${user.name} signed out and revoked account sessions.`,
          ipAddress: extractClientIp(request.headers),
        });
      } catch {
        auditRecorded = false;
        console.error("[auth.logout] Session revocation succeeded, but audit logging failed.");
      }
    }
  }

  const response = NextResponse.json({ ok: true, auditRecorded }, { headers: NO_STORE });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  return response;
}
