import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  Inbox,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminDashboardPage() {
  const { user, settings } = await requireAdminPageAuth("dashboard:view");

  const canViewLeads = hasPermission(user.role, "leads:view", settings.rolePolicies);
  const canViewAudit = hasPermission(user.role, "audit:view", settings.rolePolicies);
  const canManageUsers = hasPermission(user.role, "users:manage", settings.rolePolicies);

  const [
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

  const publishedServices = services.filter((s) => s.status === "published").length;
  const publishedCaseStudies = caseStudies.filter((c) => c.status === "published").length;
  const publishedPosts = blogPosts.filter((b) => b.status === "published").length;
  const draftPosts = blogPosts.filter((b) => b.status !== "published").length;
  const publishedFaqs = faqs.filter((f) => f.isPublished).length;
  const publicTestimonials = testimonials.filter(
    (t) => t.isPublished && t.isAuthorized && t.isVerified
  ).length;

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const dbMode = db.getMode();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Real-Time Operational Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every metric below reflects live database records — zero synthetic visitor or revenue projections.
          </p>
        </div>
        {canViewLeads && (
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 self-start rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Inbox className="h-4 w-4" />
            <span>Open Lead CRM ({leads.length})</span>
          </Link>
        )}
      </div>

      {/* Lead Pipeline KPI Cards (visible to SUPER_ADMIN & EDITOR) */}
      {canViewLeads && (
        <section aria-label="Lead pipeline metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-card border border-line bg-surface-card p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <span>New Enquiries</span>
              <Inbox className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink-heading">{newLeads}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Awaiting initial triage ({leads.length} total recorded)
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface-card p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <span>Active Pipeline</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink-heading">{activePipelineLeads}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Contacted, Qualified, or Proposal Sent
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface-card p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <span>Won Engagements</span>
              <CheckCircle2 className="h-4 w-4 text-status-success" />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink-heading">{wonLeads}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Confirmed client automation projects
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface-card p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <span>Follow-Ups Due</span>
              <CalendarClock className="h-4 w-4 text-status-warning" />
            </div>
            <p className="mt-3 text-3xl font-bold text-ink-heading">{dueFollowUps}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Scheduled on or before {todayIso}
            </p>
          </div>
        </section>
      )}

      {/* Content Inventory & System Posture */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">
                Live Content Inventory
              </h2>
              <p className="text-xs text-ink-muted">
                Current CMS entities powering the public OmniFlow website
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">Structured Pages</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">{pages.length}</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Section-based page records</p>
            </div>

            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">Services & Pillars</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">
                {publishedServices} <span className="text-sm font-normal text-ink-muted">/ {services.length}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Published service pages</p>
            </div>

            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">Work & Case Studies</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">
                {publishedCaseStudies} <span className="text-sm font-normal text-ink-muted">/ {caseStudies.length}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Truthfully labeled entries</p>
            </div>

            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">Blog Insights</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">
                {publishedPosts} <span className="text-sm font-normal text-ink-muted">published</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">{draftPosts} draft/scheduled</p>
            </div>

            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">FAQ Entries</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">
                {publishedFaqs} <span className="text-sm font-normal text-ink-muted">/ {faqs.length}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Visible on /faq & services</p>
            </div>

            <div className="rounded-control border border-line bg-surface-muted/50 p-3.5">
              <p className="text-xs font-medium text-ink-muted">Public Testimonials</p>
              <p className="mt-1 text-xl font-bold text-ink-heading">
                {publicTestimonials} <span className="text-sm font-normal text-ink-muted">/ {testimonials.length}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {publicTestimonials === 0
                  ? "Auto-hidden publicly until verified"
                  : `${teamMembers.length} team member(s) active`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-heading">System & Security</h2>
              <p className="text-xs text-ink-muted">Runtime & policy status</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <ul className="mt-4 space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  {dbMode === "supabase_postgres"
                    ? "Supabase PostgreSQL Connected"
                    : "Local JSON Persistence Active"}
                </p>
                <p className="text-ink-muted">
                  {dbMode === "supabase_postgres"
                    ? "Using pooled PostgreSQL connection."
                    : "Set DATABASE_URL in production for Supabase Postgres."}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-ink-heading">
                  {resendConfigured
                    ? "Resend Email Alerts Enabled"
                    : "Database-First Enquiry Capture"}
                </p>
                <p className="text-ink-muted">
                  {resendConfigured
                    ? "Instant email notifications + database backup active."
                    : "All enquiries safely stored in CRM without paid email APIs."}
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
                  Editors can publish:{" "}
                  <strong>{settings.rolePolicies.editorCanPublish ? "Yes" : "No"}</strong> · Theme
                  access:{" "}
                  <strong>{settings.rolePolicies.editorCanManageTheme ? "Yes" : "No"}</strong>
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
          <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-heading">Recent Enquiries</h2>
                <p className="text-xs text-ink-muted">Latest submissions from /contact</p>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-semibold text-link hover:text-link-hover"
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
                        <span className="font-normal text-ink-muted">· {lead.company}</span>
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {lead.interestedService} · {lead.createdAt.slice(0, 10)}
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
          <section className="rounded-card border border-line bg-surface-card p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-base font-bold text-ink-heading">Recent Security Audit Events</h2>
                <p className="text-xs text-ink-muted">Immutable administrative activity trail</p>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-semibold text-link hover:text-link-hover"
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
