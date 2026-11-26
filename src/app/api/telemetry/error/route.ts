import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/database";
import { checkDistributedRateLimit, checkRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;
const WINDOW_MS = 60_000;
const LIMIT = 120;
const HEADERS = { "Cache-Control": "no-store, max-age=0" };

const ErrorPayloadSchema = z.object({
  source: z.enum(["client_runtime", "error_boundary", "api"]).default("client_runtime"),
  severity: z.enum(["critical", "warning"]).default("critical"),
  route: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(320),
  digest: z.string().trim().max(64).optional(),
});

async function readBoundedBody(request: Request): Promise<{ text?: string; tooLarge?: boolean }> {
  if (!request.body) return { text: "" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        // Do not wait on cancellation of an untrusted streaming sender.
        void reader.cancel().catch(() => undefined);
        return { tooLarge: true };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json({ ok: false }, { status: 415, headers: HEADERS });
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    return NextResponse.json({ ok: false }, { status: 413, headers: HEADERS });
  }

  // This fixed-key per-instance guard avoids attacker-controlled bucket growth.
  // The shared DB bucket below limits accepted events across server instances.
  const local = checkRateLimit("telemetry_error_global_local_v1", LIMIT, WINDOW_MS);
  if (!local.allowed) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429, headers: { ...HEADERS, "Retry-After": String(local.retryAfterSeconds) } });
  }
  const shared = await checkDistributedRateLimit("telemetry_error_global_v1", LIMIT, WINDOW_MS);
  if (shared.unavailable) {
    return NextResponse.json({ ok: false, error: "Telemetry unavailable" }, { status: 503, headers: { ...HEADERS, "Retry-After": String(shared.retryAfterSeconds || 60) } });
  }
  if (!shared.allowed) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429, headers: { ...HEADERS, "Retry-After": String(shared.retryAfterSeconds) } });
  }

  let body: unknown;
  try {
    const bounded = await readBoundedBody(request);
    if (bounded.tooLarge) return NextResponse.json({ ok: false }, { status: 413, headers: HEADERS });
    body = JSON.parse(bounded.text || "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: HEADERS });
  }

  const parsed = ErrorPayloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400, headers: HEADERS });
  const msg = parsed.data.message;
  if (/ResizeObserver loop|Non-Error promise rejection|extension:\/\//i.test(msg)) {
    return NextResponse.json({ ok: true, ignored: true }, { headers: HEADERS });
  }
  try {
    await db.recordSiteErrorIncident(parsed.data);
  } catch {
    // Optional client telemetry must never break the visited page.
  }
  return NextResponse.json({ ok: true }, { headers: HEADERS });
}
