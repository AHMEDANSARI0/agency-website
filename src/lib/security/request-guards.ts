import { createHash } from "node:crypto";

export type BoundedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Reads and parses a JSON request body while enforcing a strict maximum byte limit.
 * Uses incremental stream-chunk byte counting so chunked requests without Content-Length
 * are aborted immediately upon exceeding maxBytes without buffering oversized bodies.
 */
export async function readBoundedJsonBody(
  request: Request,
  maxBytes = 24 * 1024
): Promise<BoundedJsonResult> {
  const limitKb = Math.max(1, Math.round(maxBytes / 1024));
  const declaredLen = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLen) && declaredLen > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: `Request payload exceeds the ${limitKb} KB size limit.`,
    };
  }

  let rawText = "";
  try {
    if (request.body && typeof request.body.getReader === "function") {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxBytes) {
            void reader.cancel().catch(() => undefined);
            return {
              ok: false,
              status: 413,
              error: `Request payload exceeds the ${limitKb} KB size limit.`,
            };
          }
          chunks.push(value);
        }
      }

      rawText = Buffer.concat(chunks, totalBytes).toString("utf8");
    } else {
      rawText = await request.text();
    }
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON request body.",
    };
  }

  if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: `Request payload exceeds the ${limitKb} KB size limit.`,
    };
  }

  try {
    return { ok: true, data: JSON.parse(rawText) };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON request body.",
    };
  }
}

interface IdempotencyEntry {
  leadId: string;
  expiresAtMs: number;
}

const recentSubmissionMap = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_KEY_REGEX = /^[a-zA-Z0-9._:-]{8,128}$/;

export function normalizeIdempotencyKey(
  rawHeader: string | null | undefined
): string | null {
  if (!rawHeader) return null;
  const trimmed = rawHeader.trim();
  if (!IDEMPOTENCY_KEY_REGEX.test(trimmed)) return null;
  return trimmed;
}

/**
 * Computes a deterministic SHA-256 scope hash binding the client's Idempotency-Key
 * to the normalized payload identity so network retries never create duplicate CRM rows.
 */
export function computeLeadIdempotencyFingerprint(input: {
  idempotencyKey: string;
  email: string;
  company: string;
}): string {
  const canonical = [
    input.idempotencyKey.trim(),
    input.email.trim().toLowerCase(),
    input.company.trim().toLowerCase(),
  ].join("|");

  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function getRecentIdempotentLeadId(
  fingerprint: string,
  nowMs = Date.now()
): string | null {
  const entry = recentSubmissionMap.get(fingerprint);
  if (!entry) return null;
  if (entry.expiresAtMs <= nowMs) {
    recentSubmissionMap.delete(fingerprint);
    return null;
  }
  return entry.leadId;
}

export function rememberIdempotentLeadId(
  fingerprint: string,
  leadId: string,
  ttlMs = 10 * 60_000,
  nowMs = Date.now()
): void {
  if (recentSubmissionMap.size > 2000) {
    for (const [k, v] of recentSubmissionMap.entries()) {
      if (v.expiresAtMs <= nowMs) recentSubmissionMap.delete(k);
    }
  }
  recentSubmissionMap.set(fingerprint, {
    leadId,
    expiresAtMs: nowMs + ttlMs,
  });
}

export function clearInMemoryIdempotencyCache(): void {
  recentSubmissionMap.clear();
}
