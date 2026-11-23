import type { LeadRecord } from "@/types/content";

const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmedStart = str.trimStart();
  if (trimmedStart.length > 0 && FORMULA_TRIGGERS.has(trimmedStart[0] as string)) {
    // Neutralize CSV/Excel formula execution without corrupting human readability
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function serializeLeadsToCsv(leads: LeadRecord[]): string {
  const headers = [
    "ID",
    "Created At",
    "Status",
    "Duplicate Flag",
    "Follow-Up Date",
    "Name",
    "Email",
    "Company",
    "Website",
    "Industry",
    "Interested Service",
    "Budget Range",
    "Timeline",
    "Business Problem",
    "Additional Details",
    "Email Notification",
    "Notes Count",
    "Latest Note",
  ];

  const rows = leads.map((lead) => {
    const latestNote = lead.notes[0]
      ? `[${lead.notes[0].createdAt.slice(0, 10)} ${lead.notes[0].authorName}] ${lead.notes[0].text}`
      : "";
    return [
      lead.id,
      lead.createdAt,
      lead.status,
      lead.isDuplicateFlag ? "Yes" : "No",
      lead.followUpDate || "",
      lead.name,
      lead.email,
      lead.company,
      lead.website || "",
      lead.industry,
      lead.interestedService,
      lead.budgetRange || "",
      lead.timeline || "",
      lead.businessProblem,
      lead.additionalDetails || "",
      lead.emailNotificationStatus,
      String(lead.notes.length),
      latestNote,
    ]
      .map(escapeCsvCell)
      .join(",");
  });

  return [headers.map(escapeCsvCell).join(","), ...rows].join("\r\n");
}
