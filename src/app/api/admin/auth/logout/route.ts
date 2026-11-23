import { NextResponse } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  resolveAdminUserFromToken,
} from "@/lib/auth/server";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/database";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const token = extractSessionTokenFromCookieHeader(request.headers.get("cookie"));
  const user = await resolveAdminUserFromToken(token);

  if (user) {
    await db.recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "auth.logout",
      entityType: "auth",
      entityId: user.id,
      summary: `Staff user ${user.name} signed out.`,
      ipAddress: extractClientIp(request.headers),
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  return response;
}
