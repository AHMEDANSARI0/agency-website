import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { db } from "@/lib/database";
import { DatabaseUnavailableError, isProductionEnvironment } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";
import { checkDistributedRateLimit, extractClientIp } from "@/lib/security/rate-limit";
import { readBoundedJsonBody } from "@/lib/security/request-guards";
import { sanitizePlainText } from "@/lib/validation/common";

const MAX_AUTH_PAYLOAD_BYTES = 16 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const setupSchema = z
  .object({
    name: z.string().trim().min(2, "Administrator name is required.").max(100),
    email: z.string().trim().email("Valid administrator email is required.").max(160),
    password: z.string().min(10).max(128),
    setupToken: z.string().max(256).optional(),
  })
  .strict();

function verifyProductionSetupAuthorization(providedToken: string | undefined): boolean {
  if (!isProductionEnvironment()) return true;

  const expected =
    process.env.ADMIN_SETUP_TOKEN?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "";

  if (!expected || !providedToken) return false;
  const a = Buffer.from(providedToken.trim(), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET() {
  try {
    const [hasSuperAdmin, count] = await Promise.all([
      db.hasSuperAdmin(),
      db.countUsers(),
    ]);
    if (hasSuperAdmin || count > 0) {
      return NextResponse.json(
        {
          setupRequired: false,
          error: "Initial administrator setup is permanently locked.",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      {
        setupRequired: true,
        requiresSetupToken: isProductionEnvironment(),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      { error: "Unable to check setup state." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const ip = extractClientIp(request.headers);
  const rate = await checkDistributedRateLimit(`admin_initial_setup:${ip}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many setup attempts. Wait ${rate.retryAfterSeconds} seconds before retrying.`,
      },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );
  }

  const bounded = await readBoundedJsonBody(request, MAX_AUTH_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json(
      { error: bounded.error },
      { status: bounded.status, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = setupSchema.safeParse(bounded.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid setup payload." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  if (!verifyProductionSetupAuthorization(parsed.data.setupToken)) {
    return NextResponse.json(
      {
        error:
          "Invalid setup authorization token. Provide ADMIN_SETUP_TOKEN (or AUTH_SECRET if ADMIN_SETUP_TOKEN is unset).",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const strength = validatePasswordStrength(parsed.data.password, {
    rejectKnownDefaults: true,
  });
  if (!strength.valid) {
    return NextResponse.json(
      { error: strength.reason },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const cleanName = sanitizePlainText(parsed.data.name, 100);
  if (cleanName.length < 2) {
    return NextResponse.json(
      { error: "Administrator name is invalid." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const existingCount = await db.countUsers();
    if (existingCount > 0) {
      return NextResponse.json(
        {
          error:
            "Initial administrator setup has already been completed. Sign in at /admin/login.",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const atomicResult = await db.createInitialSuperAdminAtomically({
      name: cleanName,
      email: parsed.data.email.toLowerCase(),
      passwordHash: hashPassword(parsed.data.password),
    });

    if (atomicResult.status === "already_initialized") {
      return NextResponse.json(
        {
          error:
            "Initial administrator setup has already been completed. Sign in at /admin/login.",
        },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const created = atomicResult.user;

    await db.recordAuditLog({
      actorId: created.id,
      actorEmail: created.email,
      actorRole: "SUPER_ADMIN",
      action: "auth.initial_setup_completed",
      entityType: "auth",
      entityId: created.id,
      summary: `Completed initial Super Admin setup for ${created.email}.`,
      ipAddress: ip,
    });

    const token = createSessionToken(created);
    const response = NextResponse.json(
      { ok: true, user: created },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to complete initial setup." },
      { status: 500 }
    );
  }
}
