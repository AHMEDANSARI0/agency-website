import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  FileEdit,
  FileText,
  Globe,
  HardDrive,
  Inbox,
  KeyRound,
  Layers,
  Mail,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getSystemHealthReport } from "@/features/system/health";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import type { LeadStatus } from "@/types/content";

const FUNNEL_STAGES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

export default async function AdminDashboardPage() {
  const { user, settings } = await requireAdminPageAuth("dashboard:view");

  const canViewLeads = hasPermission(
    user.role,
    "leads:view",
    settings.rolePolicies
  );
  const canEditPages = hasPermission(
    user.role,
    "content:edit_any",
    settings.rolePolicies
  );
  const canCreateDraft = hasPermission(
    user.role,
    "content:create_draft",
    settings.rolePolicies
  );
  const canManageTheme = hasPermission(
    user.role,
    "theme:manage",
    settings.rolePolicies
  );
  const canViewAudit = hasPermission(
    user.role,
    "audit:view",
    settings.rolePolicies
  );
  const canManageUsers = hasPermission(
    user.role,
    "users:manage",
    settings.rolePolicies
  );

  const [
    health,
    leads,
    services,
    caseStudies,
    blogPosts,
    faqs,
    testimonials,
    teamMembers,
    pages,
    users,
    auditLogs,
  ] = await Promise.all([
    getSystemHealthReport(),
    canViewLeads ? db.listLeads() : Promise.resolve([]),
    db.listServices(false),
    db.listCaseStudies(false),
    db.listBlogPosts(false),
    db.listFaqs(false),
    db.listTestimonials(false),
    db.listTeamMembers(false),
    db.listPages(),
    canManageUsers ? db.listUsers() : Promise.resolve([]),
    canViewAudit ? db.listAuditLogs(8) : Promise.resolve([]),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const newLeads = leads.filter((l) => l.status === "New").length;
  const activePipelineLeads = leads.filter(
    (l) =>
      l.status === "Contacted" ||
      l.status === "Qualified" ||
      l.status === "Proposal Sent"
  ).length;
  const wonLeads = leads.filter((l) => l.status === "Won").length;
  const dueFollowUps = leads.filter(
    (l) =>
      l.followUpDate &&
      l.followUpDate <= todayIso &&
      l.status !== "Won" &&
      l.status !== "Lost"
  ).length;

  const publishedServices = services.filter(
    (s) => s.status === "published"
  ).length;
  const publishedCaseStudies = caseStudies.filter(
    (c) => c.status === "published"
  ).length;
  const publishedPosts = blogPosts.filter(
    (b) => b.status === "published"
  ).length;
  const draftPosts = blogPosts.filter((b) => b.status !== "published").length;
  const publishedFaqs = faqs.filter((f) => f.isPublished).length;
  const publicTestimonials = testimonials.filter(
    (t) => t.isPublished && t.isAuthorized && t.isVerified
  ).length;

  const usedMb = (health.storage.usedBytes / (1024 * 1024)).toFixed(2);
  const quotaMb = Math.max(1, Math.round(health.storage.totalQuotaBytes / (1024 * 1024)));
  const storagePercent = Math.min(
    100,
    Math.round((health.storage.usedBytes / Math.max(1, health.storage.totalQuotaBytes)) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Executive Header + Quick Action Launcher */}
      <div className="flex flex-col justify-between gap-5 rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:flex-row lg:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Operational Command Center
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every KPI, content counter, and infrastructure probe below reflects live database state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canViewLeads && (
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Lead CRM ({leads.length})</span>
            </Link>
          )}
          {canEditPages && (
            <Link
              href="/admin/pages"
              className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Page Builder</span>
            </Link>
          )}
          {canCreateDraft && (
            <Link
              href="/admin/cms?tab=blog"
              className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
            >
              <FileEdit className="h-3.5 w-3.5 text-primary" />
              <span>New Insight</span>
            </Link>
          )}
          {canManageTheme && (
            <Link
              href="/admin/theme"
              className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-heading hover:bg-surface-muted"
            >
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span>Theme Studio</span>
            </Link>
          )}
          <Link
            href="/admin/account"
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink-heading"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Backups</span>
          </Link>
        </div>
      </div>

      {health.issues.length > 0 && (
        <section
          aria-label="System readiness warnings"
          className="rounded-card border border-status-warning/50 bg-status-warning/10 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
            <div className="space-y-1 text-xs">
              <p className="text-sm font-bold text-ink-heading">
                Production Readiness Attention ({health.status.toUpperCase()})
              </p>
              <ul className="list-disc space-y-1 pl-4 text-ink-body">
                {health.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Lead Pipeline KPI Cards & 6-Stage Funnel Breakdown */}
      {canViewLeads && (
        <section aria-label="Lead pipeline metrics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/leads"
              className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <span>New Enquiries</span>
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-ink-heading">
                {newLeads}
              </p>
              <p className="mt-1 text-xs text-ink-muted group-hover:text-primary">
                Awaiting initial triage ({leads.length} total) →
              </p>
            </Link>

            <Link
              href="/admin/leads"
              className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <span>Active Pipeline</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-ink-heading">
                {activePipelineLeads}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Contacted, Qualified, or Proposal Sent
              </p>
            </Link>

            <Link
              href="/admin/leads"
              className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <span>Won Engagements</span>
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-ink-heading">
                {wonLeads}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Confirmed client automation projects
              </p>
            </Link>

            <Link
              href="/admin/leads"
              className="group rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <span>Follow-Ups Due</span>
                <CalendarClock className="h-4 w-4 text-status-warning" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-ink-heading">
                {dueFollowUps}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Scheduled on or before {todayIso}
              </p>
            </Link>
          </div>

          {/* 6-Stage CRM Funnel Distribution Strip */}
          <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-heading">
                Pipeline Stage Distribution
              </span>
              <Link
                href="/admin/leads"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open Kanban &amp; List CRM →
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {FUNNEL_STAGES.map((stage) => {
                const count = leads.filter((l) => l.status === stage).length;
                const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div
                    key={stage}
                    className="rounded-xl border border-line bg-surface-muted/60 p-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-heading">{stage}</span>
                      <span className="font-mono text-[11px] text-primary">{pct}%</span>
                    </div>
                    <p className="mt-1 text-xl font-bold text-ink-heading">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Content Inventory & Live Verified System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Live Content Inventory
              </h2>
              <p className="text-xs text-ink-muted">
                Click any module below to manage published and draft records
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={canEditPages ? "/admin/pages" : "/admin"}
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">
                Structured Pages
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {pages.length}
              </p>
              <p className="mt-0.5 text-[11px] text-primary">
                16-section homepage active →
              </p>
            </Link>

            <Link
              href={canEditPages ? "/admin/cms?tab=service" : "/admin/cms"}
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">
                Services &amp; Pillars
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {publishedServices}{" "}
                <span className="text-sm font-normal text-ink-muted">
                  / {services.length}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Published service specifications
              </p>
            </Link>

            <Link
              href={canEditPages ? "/admin/cms?tab=case_study" : "/admin/cms"}
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">
                Work &amp; Case Studies
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {publishedCaseStudies}{" "}
                <span className="text-sm font-normal text-ink-muted">
                  / {caseStudies.length}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Truthfully badged blueprints
              </p>
            </Link>

            <Link
              href="/admin/cms?tab=blog"
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">Blog Insights</p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {publishedPosts}{" "}
                <span className="text-sm font-normal text-ink-muted">
                  published
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {draftPosts} draft/scheduled
              </p>
            </Link>

            <Link
              href={canEditPages ? "/admin/cms?tab=faq" : "/admin/cms"}
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">FAQ Entries</p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {publishedFaqs}{" "}
                <span className="text-sm font-normal text-ink-muted">
                  / {faqs.length}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Visible on /faq &amp; homepage
              </p>
            </Link>

            <Link
              href={canEditPages ? "/admin/cms?tab=testimonial" : "/admin/cms"}
              className="rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold text-ink-muted">
                Public Testimonials
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-heading">
                {publicTestimonials}{" "}
                <span className="text-sm font-normal text-ink-muted">
                  / {testimonials.length}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {publicTestimonials === 0
                  ? "Auto-hidden publicly until verified"
                  : `${teamMembers.length} team member(s) active`}
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Verified System Health
              </h2>
              <p className="text-xs text-ink-muted">
                Live probes ({health.application.environment} · v
                {health.application.version})
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <ul className="mt-4 space-y-3.5 text-xs">
            <li className="flex items-start gap-2.5">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  Database:{" "}
                  {health.database.connected && health.database.schemaReady
                    ? health.database.driver === "supabase_postgres"
                      ? `PostgreSQL Healthy (${health.database.latencyMs}ms)`
                      : "Local Dev Store Healthy"
                    : "Attention Required"}
                </p>
                <p className="text-ink-muted">
                  {health.database.message} · {health.database.backupCount}{" "}
                  snapshot(s)
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-heading">
                  Storage:{" "}
                  {health.storage.healthy
                    ? health.storage.provider === "supabase_storage"
                      ? `Supabase Bucket (${health.storage.bucket})`
                      : "Local Dev Uploads"
                    : "Unconfigured / Unreachable"}
                </p>
                <p className="text-ink-muted">
                  {usedMb} MB / {quotaMb} MB ({health.storage.assetCount} asset
                  {health.storage.assetCount === 1 ? "" : "s"})
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(2, storagePercent)}%` }}
                  />
                </div>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  {health.email.configured
                    ? "Resend Email Alerts Configured"
                    : "Database-First Enquiry Capture"}
                </p>
                <p className="text-ink-muted">
                  {health.email.configured
                    ? health.email.customSenderDomain
                      ? "Custom sender domain active."
                      : "Using sandbox sender; attach custom domain for SPF/DKIM."
                    : "Leads save safely to DB; set RESEND_API_KEY for email alerts."}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  Canonical URL: {health.domain.canonicalUrl}
                </p>
                <p className="text-ink-muted">
                  {health.domain.https
                    ? "HTTPS canonical URL active."
                    : "Local HTTP URL active — set HTTPS domain before launch."}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  Role Policy: {user.role.replace("_", " ")}
                </p>
                <p className="text-ink-muted">
                  Editors publish:{" "}
                  <strong>
                    {settings.rolePolicies.editorCanPublish ? "Yes" : "No"}
                  </strong>
                  {canManageUsers ? ` · ${users.length} staff account(s)` : ""}
                </p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      {/* Recent Leads + Recent Audit Logs */}
      <div className="grid gap-6 xl:grid-cols-2">
        {canViewLeads && (
          <section className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-heading">
                  Recent Enquiries
                </h2>
                <p className="text-xs text-ink-muted">
                  Latest submissions from /contact
                </p>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Manage All →
              </Link>
            </div>

            {leads.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No enquiries submitted yet. Submissions from the public Contact form appear here immediately.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-heading">
                        {lead.name}{" "}
                        <span className="font-normal text-ink-muted">
                          · {lead.company}
                        </span>
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {lead.interestedService} ·{" "}
                        {lead.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.isDuplicateFlag && (
                        <span className="rounded bg-status-warning/15 px-2 py-0.5 text-[11px] font-semibold text-status-warning">
                          Repeat Contact
                        </span>
                      )}
                      <span className="rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-heading">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {canViewAudit && (
          <section className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-heading">
                  Recent Security Audit Events
                </h2>
                <p className="text-xs text-ink-muted">
                  Immutable administrative activity trail
                </p>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Full Audit Log →
              </Link>
            </div>

            {auditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No administrative audit events recorded yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {auditLogs.map((entry) => (
                  <div key={entry.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-primary">
                        {entry.action}
                      </span>
                      <span className="text-ink-muted">
                        {entry.createdAt.replace("T", " ").slice(0, 19)} UTC
                      </span>
                    </div>
                    <p className="mt-1 text-ink-body">{entry.summary}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      Actor: {entry.actorEmail} ({entry.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
