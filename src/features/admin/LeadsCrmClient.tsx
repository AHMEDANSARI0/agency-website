"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
  MessageSquarePlus,
  Search,
} from "lucide-react";
import type { LeadRecord, LeadStatus } from "@/types/content";

const PIPELINE_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

interface LeadsCrmClientProps {
  initialLeads: LeadRecord[];
  canManageLeads: boolean;
}

export function LeadsCrmClient({
  initialLeads,
  canManageLeads,
}: LeadsCrmClientProps) {
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeadStatus>("ALL");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [followUpOnly, setFollowUpOnly] = useState(false);

  const [statusDraft, setStatusDraft] = useState<LeadStatus>("New");
  const [statusNote, setStatusNote] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
      if (duplicatesOnly && !lead.isDuplicateFlag) return false;
      if (followUpOnly && !lead.followUpDate) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.industry.toLowerCase().includes(q) ||
        lead.interestedService.toLowerCase().includes(q) ||
        lead.businessProblem.toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery, statusFilter, duplicatesOnly, followUpOnly]);

  const selectedLead = useMemo(() => {
    if (!selectedId) return filteredLeads[0] ?? null;
    return (
      leads.find((l) => l.id === selectedId) ?? filteredLeads[0] ?? null
    );
  }, [leads, selectedId, filteredLeads]);

  function handleSelectLead(lead: LeadRecord) {
    setSelectedId(lead.id);
    setStatusDraft(lead.status);
    setStatusNote("");
    setFollowUpDraft(lead.followUpDate ? lead.followUpDate.slice(0, 10) : "");
    setFeedback(null);
  }

  // Sync draft controls if selectedLead initializes on first render
  React.useEffect(() => {
    if (selectedLead) {
      setStatusDraft(selectedLead.status);
      setFollowUpDraft(
        selectedLead.followUpDate ? selectedLead.followUpDate.slice(0, 10) : ""
      );
    }
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const ok = await patchLead(
      selectedLead.id,
      {
        status: statusDraft,
        statusNote: statusNote.trim() || undefined,
        followUpDate: followUpDraft.trim() ? followUpDraft.trim() : null,
      },
      "Pipeline status & follow-up schedule saved."
    );
    if (ok) setStatusNote("");
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

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { ALL: leads.length };
    for (const s of PIPELINE_STATUSES) {
      map[s] = leads.filter((l) => l.status === s).length;
    }
    return map;
  }, [leads]);

  const exportUrl = `/api/admin/leads/export?status=${encodeURIComponent(
    statusFilter
  )}`;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-line bg-surface-card p-4 shadow-card lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, company, industry, or problem..."
            aria-label="Search leads"
            className="w-full rounded-control border border-line bg-surface-input py-2 pl-9 pr-3.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDuplicatesOnly((v) => !v)}
            aria-pressed={duplicatesOnly}
            className={`rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
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
            className={`rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
              followUpOnly
                ? "border-primary bg-accent-subtle text-primary"
                : "border-line bg-surface text-ink-body hover:bg-surface-muted"
            }`}
          >
            Scheduled Follow-Ups
          </button>

          <a
            href={exportUrl}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV ({filteredLeads.length})</span>
          </a>
        </div>
      </div>

      {/* Status Pipeline Filter Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter leads by status">
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

      {/* Master-Detail Split */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-card border border-line bg-surface-card p-12 text-center shadow-card">
          <p className="text-base font-semibold text-ink-heading">
            No matching enquiries found
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Adjust your filters or submit a test enquiry via the public /contact form.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Lead List */}
          <div className="space-y-2.5 lg:col-span-5">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const isOverdue =
                Boolean(lead.followUpDate) &&
                (lead.followUpDate as string) <= todayIso &&
                lead.status !== "Won" &&
                lead.status !== "Lost";

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
                    <span className="shrink-0 rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-ink-heading">
                      {lead.status}
                    </span>
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

          {/* Detail Inspector */}
          {selectedLead && (
            <div className="space-y-6 rounded-card border border-line bg-surface-card p-6 shadow-card lg:col-span-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-ink-heading">
                      {selectedLead.name}
                    </h2>
                    <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {selectedLead.status}
                    </span>
                    {selectedLead.isDuplicateFlag && (
                      <span className="inline-flex items-center gap-1 rounded bg-status-warning/15 px-2 py-0.5 text-xs font-semibold text-status-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Duplicate Email Flagged
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {selectedLead.company} · Submitted{" "}
                    {selectedLead.createdAt.replace("T", " ").slice(0, 16)} UTC
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(
                      `Re: ${selectedLead.company} — OmniFlow Automation Enquiry`
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
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
                    Business Problem & Workflow Bottleneck
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

              {/* Pipeline Status & Follow-Up Controls */}
              {canManageLeads && (
                <form
                  onSubmit={handleSavePipeline}
                  className="space-y-4 rounded-control border border-line bg-surface-muted/40 p-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
                    Pipeline Stage & Follow-Up Schedule
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
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
                        htmlFor="lead-followup-date"
                        className="mb-1 block text-xs font-medium text-ink-muted"
                      >
                        Follow-Up Date (Optional)
                      </label>
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
                      placeholder="e.g., Discovery call booked for Thursday 10am EST"
                      className="w-full rounded-control border border-line bg-surface-input px-3 py-2 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Update Pipeline & Follow-Up"}
                  </button>
                </form>
              )}

              {/* Internal Notes */}
              <div className="space-y-3 border-t border-line pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-heading">
                  Internal Qualification Notes ({selectedLead.notes.length})
                </h3>

                {canManageLeads && (
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add internal discovery or scoping note..."
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

                {selectedLead.notes.length === 0 ? (
                  <p className="text-xs text-ink-muted">No internal notes added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedLead.notes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-control border border-line bg-surface p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-ink-muted">
                          <span className="font-semibold text-ink-heading">
                            {n.authorName}
                          </span>
                          <span>{n.createdAt.replace("T", " ").slice(0, 16)} UTC</span>
                        </div>
                        <p className="mt-1 text-ink-body">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Status History */}
              <div className="space-y-2 border-t border-line pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Status Audit History
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {selectedLead.statusHistory.map((h, idx) => (
                    <li
                      key={`${h.changedAt}-${idx}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-line/70 bg-surface-muted/30 px-3 py-2"
                    >
                      <div>
                        <span className="font-semibold text-ink-heading">
                          {h.from ? `${h.from} → ${h.to}` : `Created as ${h.to}`}
                        </span>
                        {h.note && (
                          <span className="ml-2 text-ink-body">— {h.note}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted">
                        {h.changedBy} · {h.changedAt.replace("T", " ").slice(0, 16)} UTC
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
