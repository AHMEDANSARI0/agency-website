import type { LeadPriority, LeadRecord, LeadStatus } from "@/types/content";

const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Neutralizes spreadsheet formula injection (CSV injection) while applying
 * RFC 4180 quote escaping.
 */
export function escapeCsvCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return '""';
  let str = String(raw).replace(/\r\n/g, "\n");
  if (str.length > 0 && FORMULA_TRIGGERS.has(str[0])) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function serializeLeadsToCsv(leads: LeadRecord[]): string {
  const headers = [
    "ID",
    "Created At",
    "Status",
    "Priority",
    "Proposal Value",
    "Expected Closing Date",
    "Lost Reason",
    "Source",
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
    "Notes Count",
  ];

  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const lead of leads) {
    const row = [
      lead.id,
      lead.createdAt,
      lead.status,
      lead.priority ?? "Medium",
      lead.proposalValue ?? "",
      lead.expectedClosingDate ?? "",
      lead.lostReason ?? "",
      lead.source ?? "website_contact_form",
      lead.isDuplicateFlag ? "Yes" : "No",
      lead.followUpDate ?? "",
      lead.name,
      lead.email,
      lead.company,
      lead.website ?? "",
      lead.industry,
      lead.interestedService,
      lead.budgetRange ?? "",
      lead.timeline ?? "",
      lead.businessProblem,
      lead.additionalDetails ?? "",
      lead.notes.length,
    ];
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}

function parseRfc4180Rows(csvText: string): string[][] {
  const clean = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && clean[i + 1] === "\n") {
        i++;
      }
      currentRow.push(currentCell);
      currentCell = "";
      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function stripFormulaPrefix(val: string): string {
  const trimmed = val.trim();
  if (
    trimmed.length > 1 &&
    trimmed[0] === "'" &&
    FORMULA_TRIGGERS.has(trimmed[1])
  ) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

const VALID_STATUSES = new Set<LeadStatus>([
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
]);

const VALID_PRIORITIES = new Set<LeadPriority>([
  "Low",
  "Medium",
  "High",
  "Urgent",
]);

export interface ParsedLeadImportRow {
  name: string;
  email: string;
  company: string;
  website?: string;
  industry: string;
  interestedService: string;
  businessProblem: string;
  budgetRange?: string;
  timeline?: string;
  additionalDetails?: string;
  status: LeadStatus;
  priority: LeadPriority;
  proposalValue: number | null;
  expectedClosingDate: string | null;
  lostReason: string | null;
  followUpDate: string | null;
  source: string;
}

export interface CsvLeadParseResult {
  validRows: ParsedLeadImportRow[];
  skippedRows: Array<{ rowNumber: number; reason: string }>;
}

/**
 * Quote-aware RFC 4180 CSV parser for CRM lead imports.
 * Accepts exported OmniFlow CSV files as well as standard Name/Email/Company spreadsheets.
 */
export function parseLeadsCsv(csvText: string): CsvLeadParseResult {
  const rows = parseRfc4180Rows(csvText);
  if (rows.length < 2) {
    return {
      validRows: [],
      skippedRows: [{ rowNumber: 1, reason: "CSV must include a header row and at least one data row." }],
    };
  }

  const headerMap = new Map<string, number>();
  rows[0].forEach((rawHeader, idx) => {
    const key = rawHeader
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    headerMap.set(key, idx);
  });

  const getCell = (row: string[], aliases: string[]): string => {
    for (const alias of aliases) {
      const colIdx = headerMap.get(alias);
      if (colIdx !== undefined && row[colIdx] !== undefined) {
        return stripFormulaPrefix(row[colIdx]);
      }
    }
    return "";
  };

  const validRows: ParsedLeadImportRow[] = [];
  const skippedRows: Array<{ rowNumber: number; reason: string }> = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    const name = getCell(row, ["name", "full_name", "contact_name"]);
    const email = getCell(row, ["email", "email_address", "work_email"]).toLowerCase();
    const company = getCell(row, ["company", "organization", "company_name"]) || "Unspecified";

    if (!name || name.length < 2) {
      skippedRows.push({ rowNumber, reason: "Missing contact name" });
      continue;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skippedRows.push({ rowNumber, reason: `Invalid email address (${email || "empty"})` });
      continue;
    }

    const rawStatus = getCell(row, ["status", "stage"]) as LeadStatus;
    const status: LeadStatus = VALID_STATUSES.has(rawStatus) ? rawStatus : "New";

    const rawPriority = getCell(row, ["priority"]) as LeadPriority;
    const priority: LeadPriority = VALID_PRIORITIES.has(rawPriority)
      ? rawPriority
      : "Medium";

    const rawProposal = getCell(row, ["proposal_value", "deal_value", "value"]).replace(
      /[$,\s]/g,
      ""
    );
    const parsedProposal = rawProposal ? Number(rawProposal) : NaN;
    const proposalValue =
      Number.isFinite(parsedProposal) && parsedProposal >= 0 ? parsedProposal : null;

    const rawCloseDate = getCell(row, ["expected_closing_date", "close_date"]);
    const expectedClosingDate = /^\d{4}-\d{2}-\d{2}/.test(rawCloseDate)
      ? rawCloseDate.slice(0, 10)
      : null;

    const rawFollowUp = getCell(row, ["follow_up_date", "followup_date"]);
    const followUpDate = /^\d{4}-\d{2}-\d{2}/.test(rawFollowUp)
      ? rawFollowUp.slice(0, 10)
      : null;

    const industry = getCell(row, ["industry", "sector"]) || "General Business";
    const interestedService =
      getCell(row, ["interested_service", "service"]) || "AI Workflow Automation";
    const businessProblem =
      getCell(row, ["business_problem", "problem", "notes", "message"]) ||
      "Imported via Admin CRM CSV upload.";

    validRows.push({
      name: name.slice(0, 120),
      email: email.slice(0, 160),
      company: company.slice(0, 140),
      website: getCell(row, ["website", "url"]).slice(0, 240) || undefined,
      industry: industry.slice(0, 120),
      interestedService: interestedService.slice(0, 140),
      businessProblem: businessProblem.slice(0, 2000),
      budgetRange: getCell(row, ["budget_range", "budget"]).slice(0, 100) || undefined,
      timeline: getCell(row, ["timeline"]).slice(0, 100) || undefined,
      additionalDetails:
        getCell(row, ["additional_details", "details"]).slice(0, 1500) || undefined,
      status,
      priority,
      proposalValue,
      expectedClosingDate,
      lostReason: getCell(row, ["lost_reason"]).slice(0, 300) || null,
      followUpDate,
      source: getCell(row, ["source"]).slice(0, 80) || "csv_import",
    });
  }

  return { validRows, skippedRows };
}
