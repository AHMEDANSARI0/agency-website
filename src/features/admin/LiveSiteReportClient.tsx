"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type {
  DiagnosticSeverity,
  LiveSiteDiagnosticsReport,
} from "@/features/system/live-site-report";

interface RouteProbeResult {
  route: string;
  status: number | null;
  latencyMs: number;
  ok: boolean;
}

type CheckFilter = "problems" | "critical" | "warning" | "all";

export function LiveSiteReportClient({
  initialReport,
}: {
  initialReport: LiveSiteDiagnosticsReport;
}) {
  const [report, setReport] = useState<LiveSiteDiagnosticsReport>(initialReport);
  const [filter, setFilter] = useState<CheckFilter>(
    initialReport.criticalCount + initialReport.warningCount > 0
      ? "problems"
      : "all"
  );
  const [scanning, setScanning] = useState(false);
  const [probingRoutes, setProbingRoutes] = useState(false);
  const [probeResults, setProbeResults] = useState<RouteProbeResult[]>([]);
  const [busyIncidentId, setBusyIncidentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const runPublicRouteProbes = useCallback(async (routes: string[]) => {
    setProbingRoutes(true);
    try {
      const results = await Promise.all(
        routes.map(async (route): Promise<RouteProbeResult> => {
          const t0 = performance.now();
          try {
            const res = await fetch(route, {
              method: "GET",
              cache: "no-store",
            });
            const latencyMs = Math.max(1, Math.round(performance.now() - t0));
            return {
              route,
              status: res.status,
              latencyMs,
              ok: res.status >= 200 && res.status < 400,
            };
          } catch {
            return {
              route,
              status: null,
              latencyMs: Math.max(1, Math.round(performance.now() - t0)),
              ok: false,
            };
          }
        })
      );
      setProbeResults(results);

      // Report any >= 400 broken route to server diagnostics log
      for (const r of results) {
        if (r.status && r.status >= 400) {
          fetch("/api/admin/system/live-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "record_probe_failure",
              route: r.route,
              status: r.status,
            }),
          }).catch(() => undefined);
        }
      }
    } finally {
      setProbingRoutes(false);
    }
  }, []);

  useEffect(() => {
    void runPublicRouteProbes(initialReport.publicRoutesToProbe);
  }, [initialReport.publicRoutesToProbe, runPublicRouteProbes]);

  async function refreshLiveReport() {
    setScanning(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/system/live-report", {
        cache: "no-store",
      });
      if (res.ok) {
        const next = (await res.json()) as LiveSiteDiagnosticsReport;
        setReport(next);
        await runPublicRouteProbes(next.publicRoutesToProbe);
        window.dispatchEvent(new CustomEvent("omniflow:refresh-live-alert"));
        setFeedback("Completed fresh live diagnostics scan across all site modules.");
      }
    } finally {
      setScanning(false);
    }
  }

  async function resolveIncident(incidentId: string) {
    setBusyIncidentId(incidentId);
    try {
      const res = await fetch("/api/admin/system/live-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_incident", incidentId }),
      });
      if (res.ok) {
        const json = (await res.json()) as { report: LiveSiteDiagnosticsReport };
        setReport(json.report);
        window.dispatchEvent(new CustomEvent("omniflow:refresh-live-alert"));
      }
    } finally {
      setBusyIncidentId(null);
    }
  }

  async function clearAllIncidents() {
    setBusyIncidentId("all");
    try {
      const res = await fetch("/api/admin/system/live-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_incidents" }),
      });
      if (res.ok) {
        const json = (await res.json()) as { report: LiveSiteDiagnosticsReport };
        setReport(json.report);
        window.dispatchEvent(new CustomEvent("omniflow:refresh-live-alert"));
        setFeedback("Cleared runtime error incident log.");
      }
    } finally {
      setBusyIncidentId(null);
    }
  }

  const filteredChecks = useMemo(() => {
    if (filter === "problems") {
      return report.checks.filter((c) => c.severity !== "healthy");
    }
    if (filter === "critical") {
      return report.checks.filter((c) => c.severity === "critical");
    }
    if (filter === "warning") {
      return report.checks.filter((c) => c.severity === "warning");
    }
    return report.checks;
  }, [report.checks, filter]);

  const failedRouteProbes = probeResults.filter((p) => !p.ok);

  const statusMeta: Record<
    DiagnosticSeverity,
    { label: string; badgeCls: string; ringCls: string }
  > = {
    critical: {
      label: "Critical Problems Detected",
      badgeCls:
        "border-status-error/40 bg-status-error/12 text-status-error",
      ringCls: "text-status-error",
    },
    warning: {
      label: "Action Recommended",
      badgeCls:
        "border-status-warning/40 bg-status-warning/12 text-status-warning",
      ringCls: "text-status-warning",
    },
    healthy: {
      label: "All Systems Operational",
      badgeCls:
        "border-status-success/40 bg-status-success/12 text-status-success",
      ringCls: "text-status-success",
    },
  };

  const effectiveOverall: DiagnosticSeverity =
    failedRouteProbes.length > 0 && report.overallStatus === "healthy"
      ? "critical"
      : report.overallStatus;

  return (
    <div className="space-y-6">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-line bg-surface-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-line bg-surface-muted font-mono">
            <span
              className={`text-lg font-bold leading-none ${statusMeta[effectiveOverall].ringCls}`}
            >
              {report.score}
            </span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-muted">
              Score
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusMeta[effectiveOverall].badgeCls}`}
              >
                <Activity className="h-3 w-3" />
                {statusMeta[effectiveOverall].label}
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                Checked {report.checkedAt.replace("T", " ").slice(0, 19)} UTC
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-xl font-bold text-ink-heading sm:text-2xl">
              Live Site Health &amp; Error Report
            </h1>
            <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
              Real-time scanner across database health, public routes, broken links, WCAG contrast, owner placeholders, and visitor runtime errors.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={scanning || probingRoutes}
            onClick={refreshLiveReport}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${scanning || probingRoutes ? "animate-spin" : ""}`}
            />
            <span>{scanning ? "Scanning Live Site…" : "Run Full Live Scan"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="rounded-xl border border-status-success/35 bg-status-success/10 px-4 py-3 text-xs font-medium text-ink-heading"
        >
          {feedback}
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-4">
        <div className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Critical Errors</span>
            <AlertCircle className="h-4 w-4 text-status-error" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-heading sm:text-3xl">
            {report.criticalCount + failedRouteProbes.length}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Immediate action required
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Active Warnings</span>
            <AlertTriangle className="h-4 w-4 text-status-warning" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-heading sm:text-3xl">
            {report.warningCount}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Configuration &amp; SEO items
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Passed Checks</span>
            <CheckCircle2 className="h-4 w-4 text-status-success" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-heading sm:text-3xl">
            {report.healthyCount}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Verified subsystems healthy
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Runtime Crashes</span>
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-heading sm:text-3xl">
            {report.unresolvedIncidentCount}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Unresolved visitor/API errors
          </p>
        </div>
      </div>

      {/* Diagnostics & Actionable Fix Queue */}
      <section className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Diagnostic Findings &amp; Action Queue
            </h2>
            <p className="text-xs text-ink-muted">
              Every detected issue includes its affected module and a direct 1-click fix link.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter diagnostic checks"
            className="inline-flex flex-wrap gap-1.5 rounded-xl border border-line bg-surface-muted p-1"
          >
            {[
              {
                id: "problems" as const,
                label: `Problems (${report.criticalCount + report.warningCount})`,
              },
              {
                id: "critical" as const,
                label: `Critical (${report.criticalCount})`,
              },
              {
                id: "warning" as const,
                label: `Warnings (${report.warningCount})`,
              },
              {
                id: "all" as const,
                label: `All Checks (${report.checks.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === tab.id
                    ? "bg-surface text-ink-heading shadow-2xs"
                    : "text-ink-muted hover:text-ink-heading"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredChecks.length === 0 ? (
            <div className="rounded-xl border border-status-success/30 bg-status-success/8 p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-status-success" />
              <p className="mt-2 text-sm font-semibold text-ink-heading">
                Zero problems in this filter!
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Switch to &ldquo;All Checks&rdquo; to inspect all verified subsystems.
              </p>
            </div>
          ) : (
            filteredChecks.map((item) => {
              const badge =
                item.severity === "critical"
                  ? "border-status-error/35 bg-status-error/12 text-status-error"
                  : item.severity === "warning"
                    ? "border-status-warning/35 bg-status-warning/12 text-status-warning"
                    : "border-status-success/35 bg-status-success/12 text-status-success";

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${badge}`}
                      >
                        {item.severity}
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {item.categoryLabel}
                      </span>
                      {item.affectedTarget && (
                        <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
                          {item.affectedTarget}
                        </code>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-ink-heading">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      {item.detail}
                    </p>
                  </div>

                  {item.fixHref && (
                    <Link
                      href={item.fixHref}
                      className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface-card px-3.5 py-1.5 text-xs font-semibold text-ink-heading transition-colors hover:border-primary hover:text-primary"
                    >
                      <span>{item.fixLabel || "Fix Now"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Live Public Endpoint HTTP Probe Grid */}
      <section className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-line pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-heading">
              <Globe className="h-4 w-4 text-primary" />
              <span>Live Public Route HTTP Probes</span>
            </h2>
            <p className="text-xs text-ink-muted">
              Real-time HTTP status codes and response latency across public pages, XML sitemap, and health API.
            </p>
          </div>
          <button
            type="button"
            disabled={probingRoutes}
            onClick={() => runPublicRouteProbes(report.publicRoutesToProbe)}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-3 w-3 ${probingRoutes ? "animate-spin" : ""}`}
            />
            <span>{probingRoutes ? "Probing…" : "Re-Probe Routes"}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {(probeResults.length > 0
            ? probeResults
            : report.publicRoutesToProbe.map((r) => ({
                route: r,
                status: null,
                latencyMs: 0,
                ok: true,
              }))
          ).map((probe) => (
            <div
              key={probe.route}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                probe.status === null
                  ? "border-line bg-surface"
                  : probe.ok
                    ? "border-line bg-surface"
                    : "border-status-error/45 bg-status-error/10"
              }`}
            >
              <span className="truncate font-mono font-medium text-ink-heading">
                {probe.route}
              </span>
              {probe.status === null ? (
                <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                  …
                </span>
              ) : (
                <span
                  className={`shrink-0 font-mono text-[11px] font-semibold ${
                    probe.ok ? "text-status-success" : "text-status-error"
                  }`}
                >
                  {probe.status} · {probe.latencyMs}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Live Visitor & Server Runtime Error Incident Log */}
      <section
        id="incidents"
        className="rounded-card border border-line bg-surface-card p-4 shadow-card sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-ink-heading">
              Runtime Error &amp; Crash Telemetry ({report.incidents.length})
            </h2>
            <p className="text-xs text-ink-muted">
              Captures uncaught client exceptions, Next.js error boundary triggers, and failed route probes automatically.
            </p>
          </div>
          {report.incidents.length > 0 && (
            <button
              type="button"
              disabled={busyIncidentId === "all"}
              onClick={clearAllIncidents}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-heading hover:bg-surface-muted sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5 text-status-error" />
              <span>Clear Incident Log</span>
            </button>
          )}
        </div>

        {report.incidents.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-muted">
            Zero runtime errors recorded. If any visitor or route encounters an unexpected error, it will appear here immediately with an alert in the Admin header.
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {report.incidents.map((inc) => (
              <div
                key={inc.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                  inc.resolved
                    ? "border-line bg-surface/60 opacity-65"
                    : "border-status-error/35 bg-status-error/8"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        inc.resolved
                          ? "bg-surface-muted text-ink-muted"
                          : "bg-status-error text-white"
                      }`}
                    >
                      {inc.resolved ? "Resolved" : inc.severity}
                    </span>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
                      {inc.route}
                    </code>
                    <span className="font-mono text-[11px] text-ink-muted">
                      {inc.source} · {inc.occurrences}x · Last seen{" "}
                      {inc.lastSeenAt.replace("T", " ").slice(0, 19)} UTC
                    </span>
                  </div>
                  <p className="break-words text-xs font-medium text-ink-heading">
                    {inc.message}
                  </p>
                </div>

                {!inc.resolved && (
                  <button
                    type="button"
                    disabled={busyIncidentId === inc.id}
                    onClick={() => resolveIncident(inc.id)}
                    className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-card px-3.5 py-1 text-xs font-semibold text-ink-heading hover:border-status-success hover:text-status-success"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
