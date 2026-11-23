import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordRecoveryEmail } from "@/features/leads/notify";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { db } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { generateSecureRecoveryToken } from "@/lib/security/password";
import { checkDistributedRateLimit, extractClientIp } from "@/lib/security/rate-limit";

const recoverSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid staff email address.").max(160),
  })
  .strict();

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  const ip = extractClientIp(request.headers);
  const rate = await checkDistributedRateLimit(`admin_recover:${ip}`, 3, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many recovery requests. Please wait ${rate.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid email address." },
      { status: 400 }
    );
  }

  const genericMessage =
    "If an active staff account matches this email and transactional email is configured, a 30-minute recovery link has been dispatched.";

  try {
    const emailNormalized = parsed.data.email.toLowerCase();
    const user = await db.findUserByEmail(emailNormalized);

    if (user && user.isActive) {
      const { rawToken, tokenHash, expiresAtIso } = generateSecureRecoveryToken();
      await db.updateUser(user.id, {
        recoveryTokenHash: tokenHash,
        recoveryExpiresAt: expiresAtIso,
      });

      const baseUrl = getCanonicalSiteUrl();
      const resetUrl = `${baseUrl}/admin/recover?token=${encodeURIComponent(rawToken)}`;
      const delivery = await sendPasswordRecoveryEmail({
        toEmail: user.email,
        recipientName: user.name,
        resetUrl,
      });

      await db.recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "auth.recovery_requested",
        entityType: "auth",
        entityId: user.id,
        summary: `Password recovery token issued for ${user.email} (email delivery: ${delivery}).`,
        ipAddress: ip,
      });
    }

    return NextResponse.json({ ok: true, message: genericMessage });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to process recovery request." },
      { status: 500 }
    );
  }
}
