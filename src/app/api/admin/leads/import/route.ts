import { NextResponse } from "next/server";
import { z } from "zod";
import { parseLeadsCsv } from "@/features/leads/csv";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { readBoundedJsonBody } from "@/lib/security/request-guards";

const importBodySchema = z
  .object({
    csvText: z.string().min(10).max(512_000),
  })
  .strict();

const MAX_IMPORT_ROWS = 250;
const MAX_IMPORT_PAYLOAD_BYTES = 560 * 1024;

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "leads:manage");
  if (!auth.ok) return auth.response;

  const bounded = await readBoundedJsonBody(request, MAX_IMPORT_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json({ error: bounded.error }, { status: bounded.status });
  }

  const parsedBody = importBodySchema.safeParse(bounded.data);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Provide valid CSV text up to 512 KB." },
      { status: 400 }
    );
  }

  const { validRows, skippedRows } = parseLeadsCsv(parsedBody.data.csvText);

  if (validRows.length === 0) {
    return NextResponse.json(
      {
        error:
          skippedRows[0]?.reason ||
          "No valid lead rows detected. Include Name and Email columns.",
        skippedRows,
      },
      { status: 400 }
    );
  }

  if (validRows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json(
      {
        error: `Batch limit exceeded (${validRows.length} rows). Import up to ${MAX_IMPORT_ROWS} rows per upload.`,
      },
      { status: 400 }
    );
  }

  const importedLeads = [];
  for (const row of validRows) {
    const created = await db.createLead({
      name: row.name,
      email: row.email,
      company: row.company,
      website: row.website,
      industry: row.industry,
      interestedService: row.interestedService,
      businessProblem: row.businessProblem,
      budgetRange: row.budgetRange,
      timeline: row.timeline,
      additionalDetails: row.additionalDetails,
      privacyConsent: true,
      status: row.status,
      priority: row.priority,
      proposalValue: row.proposalValue,
      expectedClosingDate: row.expectedClosingDate,
      lostReason: row.lostReason,
      followUpDate: row.followUpDate,
      source: row.source || "csv_import",
      emailNotificationStatus: "skipped_unconfigured",
    });
    importedLeads.push(created);
  }

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "leads.import_csv",
    entityType: "lead",
    summary: `Imported ${importedLeads.length} lead(s) via CSV (${skippedRows.length} skipped).`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json(
    {
      ok: true,
      importedCount: importedLeads.length,
      skippedCount: skippedRows.length,
      skippedRows: skippedRows.slice(0, 15),
      leads: importedLeads,
    },
    { status: 201 }
  );
}
