"use client";

import React, { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import type { AuditLogEntry } from "@/types/auth";

interface AuditLogsClientProps {
  entries: AuditLogEntry[];
}

export function AuditLogsClient({ entries }: AuditLogsClientProps) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const entityTypes = useMemo(() => {
    const unique = Array.from(new Set(entries.map((e) => e.entityType)));
    return ["ALL", ...unique];
  }, [entries]);

  const roleTypes = useMemo(() => {
    const unique = Array.from(new Set(entries.map((e) => e.actorRole)));
    return ["ALL", ...unique];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((item) => {
      if (entityFilter !== "ALL" && item.entityType !== entityFilter) {
        return false;
      }
      if (roleFilter !== "ALL" && item.actorRole !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.action.toLowerCase().includes(q) ||
        item.actorEmail.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.entityId && item.entityId.toLowerCase().includes(q))
      );
    });
  }, [entries, query, entityFilter, roleFilter]);

  function handleExportJson() {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        recordCount: filtered.length,
        entries: filtered,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omniflow-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by actor email, action code, entity ID, or summary..."
            aria-label="Filter audit logs"
            className="w-full rounded-control border border-line bg-surface-input py-2 pl-9 pr-3.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by actor role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading"
          >
            {roleTypes.map((r) => (
              <option key={r} value={r}>
                {r === "ALL" ? "All Roles" : r}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export JSON ({filtered.length})</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {entityTypes.map((type) => {
          const active = entityFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setEntityFilter(type)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-surface-card text-ink-body hover:bg-surface-muted"
              }`}
            >
              {type === "ALL" ? "All Categories" : type}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-card border border-[var(--of-border-card)] bg-surface-card shadow-card">
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">
            No audit events match your current filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-muted">
                      {entry.createdAt.replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded bg-accent-subtle px-2 py-0.5 font-mono font-semibold text-primary">
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold text-ink-heading">
                        {entry.actorEmail}
                      </p>
                      <p className="text-[11px] text-ink-muted">{entry.actorRole}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-body">{entry.summary}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-muted">
                      {entry.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
