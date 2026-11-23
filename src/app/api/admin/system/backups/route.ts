import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const backupActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    label: z.string().trim().min(2).max(120).optional(),
  }),
  z.object({
    action: z.literal("restore"),
    backupId: z.string().trim().min(4).max(80),
  }),
]);

export async function GET(request: Request) {
  try {
    const auth = await requireAdminApiAuth(request, "settings:manage");
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    if (url.searchParams.get("download") === "true") {
      const exported = await db.exportSnapshot({ redactPasswordHashes: true });
      await db.recordAuditLog({
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "database.backup_exported",
        entityType: "database",
        summary: `Exported sanitized JSON database backup (${Math.round(
          exported.sizeBytes / 1024
        )} KB, sha256:${exported.checksumSha256.slice(0, 12)}).`,
        ipAddress: extractClientIp(request.headers),
      });

      const dateSlug = new Date().toISOString().slice(0, 10);
      return new NextResponse(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            checksumSha256: exported.checksumSha256,
            data: exported.snapshot,
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="omniflow-backup-${dateSlug}.json"`,
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    const backups = await db.listBackups();
    return NextResponse.json({ backups });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to load database backups." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApiAuth(request, "settings:manage");
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = backupActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid backup request." },
        { status: 400 }
      );
    }

    const ip = extractClientIp(request.headers);

    if (parsed.data.action === "create") {
      const cleanLabel = sanitizePlainText(
        parsed.data.label || "Manual Admin Snapshot",
        120
      );
      const created = await db.createBackup({
        label: cleanLabel,
        createdBy: auth.user.email,
      });

      await db.recordAuditLog({
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "database.backup_created",
        entityType: "database",
        entityId: created.id,
        summary: `Created database backup "${created.label}" (${Math.round(
          created.sizeBytes / 1024
        )} KB, sha256:${created.checksumSha256.slice(0, 12)}).`,
        ipAddress: ip,
      });

      return NextResponse.json({ ok: true, backup: created }, { status: 201 });
    }

    const result = await db.restoreBackup(
      parsed.data.backupId,
      auth.user.email
    );

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "database.backup_restored",
      entityType: "database",
      entityId: result.restoredId,
      summary: `Restored database snapshot ${result.restoredId} (pre-restore safety backup: ${result.safetyBackupId}).`,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: err.publicMessage, code: err.code },
        { status: 503 }
      );
    }
    const msg =
      err instanceof Error ? err.message : "Database backup operation failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
