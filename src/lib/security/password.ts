import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { isKnownDefaultOrWeakPassword } from "@/lib/env";

const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(plainPassword: string): string {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH, SCRYPT_PARAMS).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const actualBuf = scryptSync(plainPassword, salt, KEY_LENGTH, SCRYPT_PARAMS);
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (actualBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(
  password: string,
  options?: { rejectKnownDefaults?: boolean }
): { valid: boolean; reason?: string } {
  if (!password || password.length < 10) {
    return { valid: false, reason: "Password must be at least 10 characters long." };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return {
      valid: false,
      reason: "Password must include uppercase, lowercase, and numeric characters.",
    };
  }
  if (options?.rejectKnownDefaults && isKnownDefaultOrWeakPassword(password)) {
    return {
      valid: false,
      reason:
        "This password is a known placeholder or common password. Choose a unique administrator password.",
    };
  }
  return { valid: true };
}

export function generateSecureRecoveryToken(): {
  rawToken: string;
  tokenHash: string;
  expiresAtIso: string;
} {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashRecoveryToken(rawToken);
  const expiresAtIso = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
  return { rawToken, tokenHash, expiresAtIso };
}

export function hashRecoveryToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}

export function verifyRecoveryTokenHash(
  candidateRawToken: string,
  storedHash: string | null | undefined,
  expiresAtIso: string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!candidateRawToken || !storedHash || !expiresAtIso) return false;
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs) || expiresMs <= nowMs) return false;

  try {
    const actualBuf = Buffer.from(hashRecoveryToken(candidateRawToken), "hex");
    const expectedBuf = Buffer.from(storedHash, "hex");
    if (actualBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}
