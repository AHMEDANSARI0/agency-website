"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Columns3,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  List,
  Mail,
  MessageSquarePlus,
  Search,
  Upload,
  X,
} from "lucide-react";
import type { LeadPriority, LeadRecord, LeadStatus } from "@/types/content";

const PIPELINE_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

const LEAD_PRIORITIES: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];

const PRIORITY_BADGE_CLASSES: Record<LeadPriority, string> = {
  Low: "border-line bg-surface-muted text-ink-muted",
  Medium: "border-line bg-surface text-ink-heading",
  High: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  Urgent: "border-status-error/40 bg-status-error/15 text-status-error",
};

const NEXT_STAGE_MAP: Partial<Record<LeadStatus, LeadStatus>> = {
  New: "Contacted",
  Contacted: "Qualified",
  Qualified: "Proposal Sent",
  "Proposal Sent": "Won",
};

function addDaysIso(days: number): string {
  const dt = new Date();
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

interface LeadsCrmClientProps {
  initialLeads: LeadRecord[];
  canManageLeads: boolean;
}

export function LeadsCrmClient({
  initialLeads,
  canManageLeads,
}: LeadsCrmClientProps) {
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [viewMode, setViewMode] = useState<"split" | "kanban">("split");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeadStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | LeadPriority>(
    "ALL"
  );
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null
  );

  // Inspector edit states
  const [statusDraft, setStatusDraft] = useState<LeadStatus>("New");
  const [priorityDraft, setPriorityDraft] = useState<LeadPriority>("Medium");
  const [proposalValueDraft, setProposalValueDraft] = useState<string>("");
  const [expectedCloseDraft, setExpectedCloseDraft] = useState<string>("");
  const [lostReasonDraft, setLostReasonDraft] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // CSV Import Modal states
  const [importOpen, setImportOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      set.add((lead.source || "website_contact_form").trim() || "website_contact_form");
    }
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const leadPriority = lead.priority || "Medium";
      const leadSource =
        (lead.source || "website_contact_form").trim() || "website_contact_form";

      if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && leadPriority !== priorityFilter) {
        return false;
      }
      if (sourceFilter !== "ALL" && leadSource !== sourceFilter) return false;
      if (duplicatesOnly && !lead.isDuplicateFlag) return false;
      if (followUpOnly && !lead.followUpDate) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.industry.toLowerCase().includes(q) ||
        lead.interestedService.toLowerCase().includes(q) ||
        lead.businessProblem.toLowerCase().includes(q) ||
        leadSource.toLowerCase().includes(q)
      );
    });
  }, [
    leads,
    searchQuery,
    statusFilter,
    priorityFilter,
    sourceFilter,
    duplicatesOnly,
    followUpOnly,
  ]);

  const selectedLead = useMemo(() => {
    if (!selectedId) return filteredLeads[0] ?? null;
    return leads.find((l) => l.id === selectedId) ?? filteredLeads[0] ?? null;
  }, [leads, selectedId, filteredLeads]);

  function syncDraftsFromLead(lead: LeadRecord) {
    setStatusDraft(lead.status);
    setPriorityDraft(lead.priority || "Medium");
    setProposalValueDraft(
      lead.proposalValue !== null && lead.proposalValue !== undefined
        ? String(lead.proposalValue)
        : ""
    );
    setExpectedCloseDraft(
      lead.expectedClosingDate ? lead.expectedClosingDate.slice(0, 10) : ""
    );
    setLostReasonDraft(lead.lostReason || "");
    setStatusNote("");
    setFollowUpDraft(lead.followUpDate ? lead.followUpDate.slice(0, 10) : "");
  }

  function handleSelectLead(lead: LeadRecord) {
    setSelectedId(lead.id);
    syncDraftsFromLead(lead);
    setFeedback(null);
  }

  React.useEffect(() => {
    if (selectedLead) {
      syncDraftsFromLead(selectedLead);
    }
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const unifiedTimeline = useMemo(() => {
    if (!selectedLead) return [];
    const items: Array<{
      id: string;
      kind: "note" | "status";
      timestamp: string;
      actor: string;
      title: string;
      body?: string;
    }> = [];

    for (const note of selectedLead.notes) {
      items.push({
        id: note.id,
        kind: "note",
        timestamp: note.createdAt,
        actor: note.authorName,
        title: "Internal Qualification Note",
        body: note.text,
      });
    }

    selectedLead.statusHistory.forEach((hist, idx) => {
      items.push({
        id: `hist-${hist.changedAt}-${idx}`,
        kind: "status",
        timestamp: hist.changedAt,
        actor: hist.changedBy,
        title: hist.from
          ? `Stage moved: ${hist.from} → ${hist.to}`
          : `Created in stage: ${hist.to}`,
        body: hist.note,
      });
    });

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [selectedLead]);

  async function patchLead(
    leadId: string,
    payload: Record<string, unknown>,
    successMsg: string
  ) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        lead?: LeadRecord;
      };
      if (!res.ok || !data.lead) {
        setFeedback({
          type: "error",
          text: data.error || "Unable to update lead record.",
        });
        setSaving(false);
        return false;
      }
      setLeads((prev) =>
        prev.map((item) => (item.id === data.lead!.id ? data.lead! : item))
      );
      setFeedback({ type: "success", text: successMsg });
      setSaving(false);
      return true;
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while saving lead changes.",
      });
      setSaving(false);
      return false;
    }
  }

  async function handleSavePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;

    const cleanProposalStr = proposalValueDraft.replace(/[$,\s]/g, "");
    const parsedProposal = cleanProposalStr ? Number(cleanProposalStr) : null;
    if (
      cleanProposalStr &&
      (parsedProposal === null ||
        !Number.isFinite(parsedProposal) ||
        parsedProposal < 0)
    ) {
      setFeedback({
        type: "error",
        text: "Proposal value must be a valid non-negative number.",
      });
      return;
    }

    const ok = await patchLead(
      selectedLead.id,
      {
        status: statusDraft,
        priority: priorityDraft,
        proposalValue: parsedProposal,
        expectedClosingDate: expectedCloseDraft.trim()
          ? expectedCloseDraft.trim()
          : null,
        lostReason: lostReasonDraft.trim() ? lostReasonDraft.trim() : null,
        statusNote: statusNote.trim() || undefined,
        followUpDate: followUpDraft.trim() ? followUpDraft.trim() : null,
      },
      "Pipeline stage, commercial terms, and follow-up schedule saved."
    );
    if (ok) setStatusNote("");
  }

  async function handleQuickAdvance(lead: LeadRecord, nextStatus: LeadStatus) {
    await patchLead(
      lead.id,
      {
        status: nextStatus,
        statusNote: `Quick-advanced from ${lead.status} to ${nextStatus}`,
      },
      `${lead.name} moved to ${nextStatus}.`
    );
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !noteInput.trim()) return;
    const ok = await patchLead(
      selectedLead.id,
      { noteText: noteInput.trim() },
      "Internal note recorded."
    );
    if (ok) setNoteInput("");
  }

  async function handleToggleDuplicate() {
    if (!selectedLead) return;
    await patchLead(
      selectedLead.id,
      { isDuplicateFlag: !selectedLead.isDuplicateFlag },
      selectedLead.isDuplicateFlag
        ? "Duplicate flag marked resolved."
        : "Lead flagged as repeat contact."
    );
  }

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  }

  async function handleCsvFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportCsvText(text);
    setImportFeedback(null);
  }

  async function handleRunCsvImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importCsvText.trim()) return;
    setImporting(true);
    setImportFeedback(null);
    try {
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: importCsvText }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        importedCount?: number;
        skippedCount?: number;
        leads?: LeadRecord[];
      };
      if (!res.ok || !data.leads) {
        setImportFeedback({
          type: "error",
          text: data.error || "CSV import failed.",
        });
        setImporting(false);
        return;
      }

      setLeads((prev) => [...data.leads!, ...prev]);
      if (data.leads[0]) {
        setSelectedId(data.leads[0].id);
      }
      setImportFeedback({
        type: "success",
        text: `Imported ${data.importedCount} lead(s) (${data.skippedCount || 0} row(s) skipped).`,
      });
      setImportCsvText("");
      setImporting(false);
    } catch {
      setImportFeedback({
        type: "error",
        text: "Network error while uploading CSV batch.",
      });
      setImporting(false);
    }
  }

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { ALL: leads.length };
    for (const s of PIPELINE_STATUSES) {
      map[s] = leads.filter((l) => l.status === s).length;
    }
    return map;
  }, [leads]);

  const overdueCount = useMemo(
    () =>
      leads.filter(
        (l) =>
          Boolean(l.followUpDate) &&
          (l.followUpDate as string) <= todayIso &&
          l.status !== "Won" &&
          l.status !== "Lost"
      ).length,
    [leads, todayIso]
  );

  const activePipelineValue = useMemo(
    () =>
      leads
        .filter((l) => l.status !== "Lost")
        .reduce(
          (sum, l) =>
            sum + (typeof l.proposalValue === "number" ? l.proposalValue : 0),
          0
        ),
    [leads]
  );

  const exportUrl = `/api/admin/leads/export?status=${encodeURIComponent(
    statusFilter
  )}&source=${encodeURIComponent(sourceFilter)}&priority=${encodeURIComponent(
    priorityFilter
  )}`;

  const inspectorPanel = selectedLead && (
    <div className="space-y-6 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink-heading">
              {selectedLead.name}
            </h2>
            <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
              {selectedLead.status}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                PRIORITY_BADGE_CLASSES[selectedLead.priority || "Medium"]
              }`}
            >
              {selectedLead.priority || "Medium"} Priority
            </span>
            {typeof selectedLead.proposalValue === "number" && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-status-success/40 bg-status-success/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-status-success">
                <DollarSign className="h-3 w-3" />
                {selectedLead.proposalValue.toLocaleString()}
              </span>
            )}
            {selectedLead.isDuplicateFlag && (
              <span className="inline-flex items-center gap-1 rounded bg-status-warning/15 px-2 py-0.5 text-xs font-semibold text-status-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                Duplicate Email Flagged
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {selectedLead.company} · Source:{" "}
            <span className="font-mono text-xs text-ink-heading">
              {selectedLead.source || "website_contact_form"}
            </span>{" "}
            · Submitted {selectedLead.createdAt.replace("T", " ").slice(0, 16)} UTC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyEmail(selectedLead.email)}
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
          >
            {copiedEmail ? (
              <Check className="h-3.5 w-3.5 text-status-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
          </button>

          <a
            href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(
              `Re: ${selectedLead.company} — OmniFlow Automation Enquiry`
            )}&body=${encodeURIComponent(
              `Hi ${selectedLead.name.split(" ")[0]},\n\nThank you for reaching out regarding ${selectedLead.interestedService} at ${selectedLead.company}.\n\nWe reviewed your workflow notes and would love to walk through a concrete automation blueprint on a 25-minute discovery call.\n\nBest regards,\nOmniFlow Engineering`
            )}`}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Reply via Email</span>
          </a>

          {canManageLeads && (
            <button
              type="button"
              onClick={handleToggleDuplicate}
              disabled={saving}
              className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-body hover:bg-surface-muted"
            >
              {selectedLead.isDuplicateFlag
                ? "Clear Duplicate Flag"
                : "Flag Repeat Contact"}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-control border p-3 text-xs font-medium ${
            feedback.type === "success"
              ? "border-status-success/40 bg-status-success/10 text-ink-heading"
              : "border-status-error/40 bg-status-error/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid gap-3 rounded-control border border-line bg-surface-muted/40 p-4 text-xs sm:grid-cols-2">
        <div>
          <span className="font-semibold text-ink-muted">Email:</span>{" "}
          <span className="text-ink-heading">{selectedLead.email}</span>
        </div>
        <div>
          <span className="font-semibold text-ink-muted">Industry:</span>{" "}
          <span className="text-ink-heading">{selectedLead.industry}</span>
        </div>
        <div>
          <span className="font-semibold text-ink-muted">Interested Service:</span>{" "}
          <span className="text-ink-heading">{selectedLead.interestedService}</span>
        </div>
        <div>
          <span className="font-semibold text-ink-muted">Website:</span>{" "}
          {selectedLead.website && /^https?:\/\//i.test(selectedLead.website) ? (
            <a
              href={selectedLead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-link hover:text-link-hover"
            >
              <span className="truncate">{selectedLead.website}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-ink-muted">
              {selectedLead.website || "Not provided"}
            </span>
          )}
        </div>
        <div>
          <span className="font-semibold text-ink-muted">Budget Range:</span>{" "}
          <span className="text-ink-heading">
            {selectedLead.budgetRange || "Not specified"}
          </span>
        </div>
        <div>
          <span className="font-semibold text-ink-muted">Timeline:</span>{" "}
          <span className="text-ink-heading">
            {selectedLead.timeline || "Not specified"}
          </span>
        </div>
        {selectedLead.expectedClosingDate && (
          <div>
            <span className="font-semibold text-ink-muted">Expected Close:</span>{" "}
            <span className="font-mono text-ink-heading">
              {selectedLead.expectedClosingDate}
            </span>
          </div>
        )}
        {selectedLead.lostReason && (
          <div className="sm:col-span-2">
            <span className="font-semibold text-status-error">Lost Reason:</span>{" "}
            <span className="text-ink-heading">{selectedLead.lostReason}</span>
          </div>
        )}
        <div className="sm:col-span-2">
          <span className="font-semibold text-ink-muted">Email Alert Delivery:</span>{" "}
          <span className="text-ink-heading">
            {selectedLead.emailNotificationStatus === "sent"
              ? "Sent via Resend"
              : selectedLead.emailNotificationStatus === "failed"
                ? "Email failed (safely preserved in CRM)"
                : "Stored directly in CRM (no external email service configured)"}
          </span>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Business Problem &amp; Workflow Bottleneck
          </h3>
          <p className="mt-1.5 whitespace-pre-line rounded-control border border-line bg-surface p-3.5 text-sm text-ink-body">
            {selectedLead.businessProblem}
          </p>
        </div>

        {selectedLead.additionalDetails && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Additional Context / Current Stack
            </h3>
            <p className="mt-1.5 whitespace-pre-line rounded-control border border-line bg-surface p-3.5 text-sm text-ink-body">
              {selectedLead.additionalDetails}
            </p>
          </div>
        )}
      </div>

      {/* Pipeline Status, Commercials & Follow-Up Controls */}
      {canManageLeads && (
        <form
          onSubmit={handleSavePipeline}
          className="space-y-4 rounded-control border border-line bg-surface-muted/40 p-4"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
            Pipeline Stage, Deal Valuation &amp; Follow-Up Schedule
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="lead-status-select"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Lead Status
              </label>
              <select
                id="lead-status-select"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as LeadStatus)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              >
                {PIPELINE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-priority-select"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Priority
              </label>
              <select
                id="lead-priority-select"
                value={priorityDraft}
                onChange={(e) =>
                  setPriorityDraft(e.target.value as LeadPriority)
                }
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              >
                {LEAD_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-proposal-value"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Proposal Value (USD)
              </label>
              <input
                id="lead-proposal-value"
                type="number"
                min="0"
                step="100"
                value={proposalValueDraft}
                onChange={(e) => setProposalValueDraft(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="lead-expected-close"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Expected Closing Date
              </label>
              <input
                id="lead-expected-close"
                type="date"
                value={expectedCloseDraft}
                onChange={(e) => setExpectedCloseDraft(e.target.value)}
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label
                  htmlFor="lead-followup-date"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Follow-Up Reminder Date
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFollowUpDraft(addDaysIso(1))}
                    className="rounded border border-line bg-surface px-1.5 py-0.5 text-ink-muted hover:text-primary"
                  >
                    +1d
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUpDraft(addDaysIso(3))}
                    className="rounded border border-line bg-surface px-1.5 py-0.5 text-ink-muted hover:text-primary"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUpDraft(addDaysIso(7))}
                    className="rounded border border-line bg-surface px-1.5 py-0.5 text-ink-muted hover:text-primary"
                  >
                    +7d
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  id="lead-followup-date"
                  type="date"
                  value={followUpDraft}
                  onChange={(e) => setFollowUpDraft(e.target.value)}
                  className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading focus:border-primary focus:outline-none"
                />
                {followUpDraft && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDraft("")}
                    className="rounded-control border border-line bg-surface px-2.5 text-xs text-ink-muted hover:text-ink-heading"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="lead-status-note"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Optional Stage Transition Note
              </label>
              <input
                id="lead-status-note"
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g., Discovery call booked for Thursday"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {(statusDraft === "Lost" || lostReasonDraft) && (
            <div>
              <label
                htmlFor="lead-lost-reason"
                className="mb-1 block text-xs font-medium text-ink-muted"
              >
                Lost / Disqualification Reason
              </label>
              <input
                id="lead-lost-reason"
                type="text"
                value={lostReasonDraft}
                onChange={(e) => setLostReasonDraft(e.target.value)}
                placeholder="e.g., Budget deferred to Q3, internal engineering build, out of scope"
                className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Pipeline & Follow-Up"}
          </button>
        </form>
      )}

      {/* Unified Chronological Lead Activity Timeline + Quick Note Entry */}
      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
            Unified Lead Activity Timeline ({unifiedTimeline.length})
          </h3>
          <span className="font-mono text-[11px] text-ink-muted">
            {selectedLead.notes.length} note(s) · {selectedLead.statusHistory.length} stage event(s)
          </span>
        </div>

        {canManageLeads && (
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add internal discovery, budget, or scoping note..."
              aria-label="Add internal note"
              className="flex-1 rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving || !noteInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted disabled:opacity-50"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
              <span>Add Note</span>
            </button>
          </form>
        )}

        {unifiedTimeline.length === 0 ? (
          <p className="text-xs text-ink-muted">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-2">
            {unifiedTimeline.map((item) => (
              <li
                key={item.id}
                className={`rounded-control border p-3 text-xs ${
                  item.kind === "note"
                    ? "border-line bg-surface"
                    : "border-line/70 bg-surface-muted/35"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink-heading">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{item.title}</span>
                  </span>
                  <span className="font-mono text-ink-muted">
                    {item.actor} · {item.timestamp.replace("T", " ").slice(0, 16)} UTC
                  </span>
                </div>
                {item.body && (
                  <p className="mt-1.5 whitespace-pre-line text-ink-body">
                    {item.body}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Executive Pipeline KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Total Enquiries
          </span>
          <p className="mt-1 text-2xl font-bold text-ink-heading">{leads.length}</p>
        </div>
        <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Awaiting Triage
          </span>
          <p className="mt-1 text-2xl font-bold text-primary">
            {countsByStatus["New"] ?? 0}
          </p>
        </div>
        <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Follow-Ups Due
          </span>
          <p className="mt-1 text-2xl font-bold text-ink-heading">{overdueCount}</p>
        </div>
        <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Won Engagements
          </span>
          <p className="mt-1 text-2xl font-bold text-status-success">
            {countsByStatus["Won"] ?? 0}
          </p>
        </div>
        <div className="col-span-2 rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card lg:col-span-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Pipeline Value
          </span>
          <p className="mt-1 text-2xl font-bold text-ink-heading">
            {activePipelineValue > 0
              ? `$${activePipelineValue.toLocaleString()}`
              : "$0"}
          </p>
        </div>
      </div>

      {/* Toolbar + View Mode Switcher + Attribution Filters */}
      <div className="space-y-3 rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, company, source, industry, or problem..."
              aria-label="Search leads"
              className="w-full rounded-control border border-line bg-surface-input py-2 pl-9 pr-3.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Split vs Kanban Switcher */}
            <div
              role="group"
              aria-label="CRM display mode"
              className="inline-flex rounded-control border border-line bg-surface-muted p-0.5"
            >
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === "split"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Split List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === "kanban"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span>Kanban Board</span>
              </button>
            </div>

            {canManageLeads && (
              <button
                type="button"
                onClick={() => {
                  setImportOpen((v) => !v);
                  setImportFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Import CSV</span>
              </button>
            )}

            <a
              href={exportUrl}
              className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV ({filteredLeads.length})</span>
            </a>
          </div>
        </div>

        {/* Attribution Source, Priority & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
          <label className="flex items-center gap-1.5 text-ink-muted">
            <span className="font-semibold">Source:</span>
            <select
              aria-label="Filter by lead source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-heading"
            >
              <option value="ALL">All Sources ({availableSources.length})</option>
              {availableSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-ink-muted">
            <span className="font-semibold">Priority:</span>
            <select
              aria-label="Filter by lead priority"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as "ALL" | LeadPriority)
              }
              className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-heading"
            >
              <option value="ALL">All Priorities</option>
              {LEAD_PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setDuplicatesOnly((v) => !v)}
            aria-pressed={duplicatesOnly}
            className={`rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ${
              duplicatesOnly
                ? "border-primary bg-accent-subtle text-primary"
                : "border-line bg-surface text-ink-body hover:bg-surface-muted"
            }`}
          >
            Repeat Contacts Only
          </button>

          <button
            type="button"
            onClick={() => setFollowUpOnly((v) => !v)}
            aria-pressed={followUpOnly}
            className={`rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ${
              followUpOnly
                ? "border-primary bg-accent-subtle text-primary"
                : "border-line bg-surface text-ink-body hover:bg-surface-muted"
            }`}
          >
            Scheduled Follow-Ups
          </button>
        </div>

        {/* CSV Import Drawer */}
        {importOpen && canManageLeads && (
          <form
            onSubmit={handleRunCsvImport}
            className="space-y-3 rounded-control border border-primary/30 bg-surface-muted/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
                  Import Leads from CSV
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Supports OmniFlow exported CSVs or spreadsheets with `Name`, `Email`, `Company`, `Industry`, `Status`, `Priority`, `Proposal Value`, and `Source` columns (max 250 rows/batch).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close CSV import panel"
                className="rounded p-1 text-ink-muted hover:text-ink-heading"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileSelected}
                className="text-xs text-ink-body file:mr-3 file:rounded-control file:border-0 file:bg-accent-subtle file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
              />
            </div>

            <textarea
              rows={4}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={
                'Name,Email,Company,Industry,Interested Service,Priority,Proposal Value,Business Problem\n"Jane Doe",jane@example.com,"Acme Ops","Logistics","AI Workflow Automation",High,6500,"Automate carrier invoice triage"'
              }
              className="w-full rounded-control border border-line bg-surface p-3 font-mono text-xs text-ink-heading"
            />

            {importFeedback && (
              <p
                role="status"
                className={`text-xs font-medium ${
                  importFeedback.type === "success"
                    ? "text-status-success"
                    : "text-status-error"
                }`}
              >
                {importFeedback.text}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-body"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={importing || !importCsvText.trim()}
                className="rounded-control bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {importing ? "Importing..." : "Validate & Import Rows"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Status Pipeline Filter Tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter leads by status"
      >
        {(["ALL", ...PIPELINE_STATUSES] as const).map((st) => {
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(st)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-surface-card text-ink-body hover:bg-surface-muted"
              }`}
            >
              <span>{st === "ALL" ? "All Enquiries" : st}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {countsByStatus[st] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-card border border-line bg-surface-card p-12 text-center shadow-card">
          <p className="text-base font-semibold text-ink-heading">
            No matching enquiries found
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Adjust your filters, import a CSV batch, or submit a test enquiry via the public /contact form.
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        /* 6-Column Kanban Pipeline Board + Selected Lead Inspector */
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {PIPELINE_STATUSES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const nextStage = NEXT_STAGE_MAP[stage];
              return (
                <div
                  key={stage}
                  className="flex flex-col rounded-card border border-line bg-surface-muted/40 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-ink-heading">
                      {stage}
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageLeads.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-line py-6 text-center text-[11px] text-ink-muted">
                        Empty stage
                      </p>
                    ) : (
                      stageLeads.map((lead) => {
                        const isSelected = selectedLead?.id === lead.id;
                        const pr = lead.priority || "Medium";
                        return (
                          <div
                            key={lead.id}
                            className={`rounded-xl border bg-surface-card p-3 transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-[var(--of-ring-focus)]"
                                : "border-line hover:border-line-strong"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectLead(lead)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <p className="truncate text-xs font-bold text-ink-heading">
                                  {lead.name}
                                </p>
                                <span
                                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE_CLASSES[pr]}`}
                                >
                                  {pr}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-ink-muted">
                                {lead.company}
                                {typeof lead.proposalValue === "number"
                                  ? ` · $${lead.proposalValue.toLocaleString()}`
                                  : ""}
                              </p>
                              <p className="mt-1.5 line-clamp-2 text-[11px] text-ink-body">
                                {lead.businessProblem}
                              </p>
                            </button>
                            {canManageLeads && nextStage && (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleQuickAdvance(lead, nextStage)}
                                className="mt-2.5 inline-flex w-full items-center justify-between rounded-md border border-line bg-surface-muted px-2 py-1 text-[10px] font-semibold text-primary hover:bg-accent-subtle"
                              >
                                <span>Move → {nextStage}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {inspectorPanel}
        </div>
      ) : (
        /* Classic Master-Detail Split View */
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-2.5 lg:col-span-5">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const isOverdue =
                Boolean(lead.followUpDate) &&
                (lead.followUpDate as string) <= todayIso &&
                lead.status !== "Won" &&
                lead.status !== "Lost";
              const pr = lead.priority || "Medium";

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => handleSelectLead(lead)}
                  className={`w-full rounded-card border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-surface-card ring-2 ring-[var(--of-ring-focus)]"
                      : "border-line bg-surface-card hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-heading">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {lead.company} · {lead.industry}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE_CLASSES[pr]}`}
                      >
                        {pr}
                      </span>
                      <span className="rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-ink-heading">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-ink-body">
                    {lead.businessProblem}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <span>{lead.createdAt.slice(0, 10)}</span>
                    <span>·</span>
                    <span className="font-medium text-primary">
                      {lead.interestedService}
                    </span>
                    {typeof lead.proposalValue === "number" && (
                      <span className="rounded bg-status-success/10 px-1.5 py-0.5 font-mono font-semibold text-status-success">
                        ${lead.proposalValue.toLocaleString()}
                      </span>
                    )}
                    {lead.isDuplicateFlag && (
                      <span className="rounded bg-status-warning/15 px-1.5 py-0.5 font-semibold text-status-warning">
                        Repeat Email
                      </span>
                    )}
                    {lead.followUpDate && (
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                          isOverdue
                            ? "bg-status-error/15 text-status-error"
                            : "bg-surface-muted text-ink-heading"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {lead.followUpDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7">{inspectorPanel}</div>
        </div>
      )}
    </div>
  );
}
