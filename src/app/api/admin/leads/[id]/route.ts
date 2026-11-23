import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { LeadStatus } from "@/types/content";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/validation/common";

const LEAD_STATUSES: [LeadStatus, ...LeadStatus[]] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

const patchLeadSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    statusNote: z.string().max(500).optional(),
    noteText: z.string().max(2000).optional(),
    followUpDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD."),
        z.null(),
      ])
      .optional(),
    isDuplicateFlag: z.boolean().optional(),
  })
  .strict();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth(request, "leads:view");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const lead = await db.getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead enquiry not found." }, { status: 404 });
  }
  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth(request, "leads:manage");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid lead update payload." },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const changesSummary: string[] = [];
  const now = new Date().toISOString();

  const updated = await db.updateLead(id, (current) => {
    const nextNotes = [...current.notes];
    const nextHistory = [...current.statusHistory];
    let nextStatus = current.status;
    let nextFollowUp = current.followUpDate;
    let nextDuplicate = current.isDuplicateFlag;

    if (payload.status && payload.status !== current.status) {
      const cleanTransitionNote = payload.statusNote
        ? sanitizePlainText(payload.statusNote, 500)
        : undefined;
      nextHistory.unshift({
        from: current.status,
        to: payload.status,
        changedAt: now,
        changedBy: auth.user.name,
        note: cleanTransitionNote || undefined,
      });
      changesSummary.push(`status ${current.status} -> ${payload.status}`);
      nextStatus = payload.status;
    }

    if (payload.noteText && payload.noteText.trim().length > 0) {
      const cleanNote = sanitizePlainText(payload.noteText, 2000);
      if (cleanNote) {
        nextNotes.unshift({
          id: `note_${randomBytes(6).toString("hex")}`,
          authorName: auth.user.name,
          text: cleanNote,
          createdAt: now,
        });
        changesSummary.push("added internal note");
      }
    }

    if (payload.followUpDate !== undefined && payload.followUpDate !== current.followUpDate) {
      nextFollowUp = payload.followUpDate;
      changesSummary.push(
        payload.followUpDate
          ? `scheduled follow-up for ${payload.followUpDate}`
          : "cleared follow-up date"
      );
    }

    if (
      payload.isDuplicateFlag !== undefined &&
      payload.isDuplicateFlag !== current.isDuplicateFlag
    ) {
      nextDuplicate = payload.isDuplicateFlag;
      changesSummary.push(
        payload.isDuplicateFlag ? "marked duplicate flag" : "resolved duplicate flag"
      );
    }

    return {
      ...current,
      status: nextStatus,
      followUpDate: nextFollowUp,
      isDuplicateFlag: nextDuplicate,
      notes: nextNotes,
      statusHistory: nextHistory,
    };
  });

  if (!updated) {
    return NextResponse.json({ error: "Lead enquiry not found." }, { status: 404 });
  }

  if (changesSummary.length > 0) {
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "lead.updated",
      entityType: "lead",
      entityId: updated.id,
      summary: `Updated lead ${updated.name} (${updated.company}): ${changesSummary.join(", ")}.`,
      ipAddress: extractClientIp(request.headers),
    });
  }

  return NextResponse.json({ ok: true, lead: updated });
}
