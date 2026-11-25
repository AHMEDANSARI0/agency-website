import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/database";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const ErrorPayloadSchema = z.object({
  source: z
    .enum(["client_runtime", "error_boundary", "api"])
    .default("client_runtime"),
  severity: z.enum(["critical", "warning"]).default("critical"),
  route: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(320),
  digest: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const ip = extractClientIp(request.headers);
  const rl = checkRateLimit(`telemetry_err:${ip}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = ErrorPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Ignore benign browser extension / ResizeObserver noise
  const msg = parsed.data.message;
  if (
    /ResizeObserver loop|Non-Error promise rejection|extension:\/\//i.test(msg)
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await db.recordSiteErrorIncident(parsed.data);
  } catch {
    // Never fail public client telemetry requests if DB is momentarily unavailable
  }

  return NextResponse.json({ ok: true });
}
