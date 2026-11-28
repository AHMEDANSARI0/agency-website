import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SessionPayload, SafeUser } from "@/types/auth";
import { isPlaceholderEnvValue, isProductionEnvironment } from "@/lib/env";

export { SESSION_COOKIE_NAME, getSessionCookieOptions } from "./session-cookie";

export function getSigningSecret(): string {
  const envSecret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "";

  if (envSecret.length >= 32 && !isPlaceholderEnvValue(envSecret)) {
    return envSecret;
  }

  if (isProductionEnvironment()) {
    throw new Error(
      "AUTH_SECRET (or SESSION_SECRET) with at least 32 random characters is mandatory in production."
    );
  }

  return "dev-only-omniflow-ephemeral-secret-key-do-not-use-in-prod-2026";
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function signData(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createSessionToken(
  user: Partial<SafeUser> & Pick<SafeUser, "id" | "email" | "name" | "role">,
  ttlHours?: number,
  nowMs = Date.now()
): string {
  const secret = getSigningSecret();
  const configuredHours = Number(process.env.SESSION_TTL_HOURS || 24);
  const hours =
    ttlHours ??
    (Number.isFinite(configuredHours) && configuredHours > 0 ? configuredHours : 24);

  const payload: SessionPayload = {
    sessionId: randomBytes(16).toString("hex"),
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionVersion: user.sessionVersion ?? 1,
    issuedAt: nowMs,
    expiresAt: nowMs + hours * 60 * 60 * 1000,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signData(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  nowMs = Date.now()
): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSignature] = parts;
  if (!encodedPayload || !providedSignature) return null;

  try {
    const secret = getSigningSecret();
    const expectedSignature = signData(encodedPayload, secret);
    const providedBuf = Buffer.from(providedSignature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");

    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!parsed.userId || !parsed.role || typeof parsed.expiresAt !== "number") {
      return null;
    }
    if (parsed.expiresAt <= nowMs) {
      return null;
    }
    if (typeof parsed.sessionVersion !== "number") {
      parsed.sessionVersion = 1;
    }
    return parsed;
  } catch {
    return null;
  }
}
