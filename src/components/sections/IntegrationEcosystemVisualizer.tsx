"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CreditCard,
  Database,
  FolderKanban,
  Layers,
  MessageSquareText,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface EcosystemNode {
  id: string;
  category: string;
  protocol: string;
  syncLabel: string;
  summary: string;
  platforms: string[];
  automatedFlow: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: "crm",
    category: "CRM & Sales Pipeline",
    protocol: "REST API + Webhooks",
    syncLabel: "Bi-Directional Sync",
    summary:
      "Automatically create contacts, check for duplicate records, update deal stages, and attach pre-call discovery briefs.",
    platforms: ["HubSpot CRM", "Pipedrive", "Salesforce", "Close", "OmniFlow CRM"],
    automatedFlow:
      "Verified Enquiry -> Duplicate Check -> Deal Stage Updated + Pre-Call Note Attached",
    icon: Layers,
  },
  {
    id: "messaging",
    category: "Messaging & Team Alerts",
    protocol: "Event Webhooks",
    syncLabel: "Sub-Second Dispatch",
    summary:
      "Notify the right account owner on WhatsApp, Slack, or Teams with structured context and 1-click escalation links.",
    platforms: ["WhatsApp Business API", "Slack", "Microsoft Teams", "Transactional SMS"],
    automatedFlow:
      "High-Fit Lead or Escalation -> Formatted Owner Brief Sent -> Response SLA Tracked",
    icon: BellRing,
  },
  {
    id: "calendar-email",
    category: "Email & Call Scheduling",
    protocol: "OAuth 2.0 + SMTP/API",
    syncLabel: "Timezone-Aware",
    summary:
      "Coordinate discovery bookings, send brand-safe confirmations, and align reminders across US, UK, and Canadian schedules.",
    platforms: ["Google Workspace", "Microsoft 365", "Cal.com", "Calendly", "Resend"],
    automatedFlow:
      "Discovery Request -> Timezone Matched -> Calendar Invite & Preparation Brief Sent",
    icon: CalendarClock,
  },
  {
    id: "support-docs",
    category: "Helpdesk & Knowledge",
    protocol: "Grounded Retrieval",
    syncLabel: "Approved SOPs Only",
    summary:
      "Answer routine client questions strictly from your approved Notion/FAQ docs while routing complex cases to staff.",
    platforms: ["Intercom", "Zendesk", "Help Scout", "Notion SOPs", "Internal Docs"],
    automatedFlow:
      "Client Question -> Approved Policy Match -> Grounded Draft or Human Escalation",
    icon: MessageSquareText,
  },
  {
    id: "project-ops",
    category: "Project & Client Delivery",
    protocol: "Idempotent Triggers",
    syncLabel: "Zero Dropped Steps",
    summary:
      "Provision client folders, kickoff task boards, and status digests automatically the moment an agreement is signed.",
    platforms: ["Notion", "Linear", "Asana", "ClickUp", "Airtable", "Google Drive"],
    automatedFlow:
      "Proposal Marked Won -> Folders + Kickoff Tasks Created -> Welcome Checklist Sent",
    icon: FolderKanban,
  },
  {
    id: "data-finance",
    category: "Billing, SQL & Custom APIs",
    protocol: "Atomic SQL + Signed Hooks",
    syncLabel: "Audit-Logged",
    summary:
      "Connect invoicing events, relational databases, and custom internal tools with dead-letter fallback protection.",
    platforms: ["PostgreSQL / Supabase", "Stripe", "QuickBooks", "Xero", "Custom REST APIs"],
    automatedFlow:
      "Payment / Webhook Event -> Signature Verified -> SQL Audit Log & Ops Board Updated",
    icon: CreditCard,
  },
];

export function IntegrationEcosystemVisualizer() {
  const [selectedId, setSelectedId] = useState<string>(ECOSYSTEM_NODES[0].id);
  const activeNode =
    ECOSYSTEM_NODES.find((n) => n.id === selectedId) ?? ECOSYSTEM_NODES[0];

  return (
    <div className="surface-3d relative overflow-hidden rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 sm:p-8">
      {/* Subtle Perspective Architectural Grid */}
      <div
        aria-hidden="true"
        className="architectural-grid-perspective pointer-events-none absolute inset-0 opacity-75"
      />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left 7 Cols: Interactive Connected Hub Grid */}
        <div className="lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Workflow className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-heading">
                OmniFlow Connected Orchestration Core
              </span>
            </div>
            <span className="font-mono text-[0.68rem] text-electric-cyan">
              Click any system layer to inspect live data flow
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Connected integration categories"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
          >
            {ECOSYSTEM_NODES.map((node) => {
              const Icon = node.icon;
              const isSelected = node.id === activeNode.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  className={`card-3d group flex flex-col justify-between rounded-xl border p-4 text-left ${
                    isSelected
                      ? "border-primary bg-accent-subtle/70"
                      : "border-line bg-surface/90 hover:border-primary/35"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-muted text-primary group-hover:bg-accent-subtle"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? "bg-electric-cyan" : "bg-line-strong"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-3 text-xs font-bold text-ink-heading sm:text-sm">
                      {node.category}
                    </p>
                  </div>

                  <p className="mt-2 font-mono text-[0.65rem] text-ink-muted">
                    {node.syncLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Live Orchestration Inspector */}
        <div
          role="tabpanel"
          aria-live="polite"
          className="rounded-2xl border border-line bg-surface/95 p-5 shadow-card backdrop-blur lg:col-span-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
            <Badge variant="accent">{activeNode.protocol}</Badge>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] font-semibold text-status-success">
              <Database className="h-3.5 w-3.5" />
              <span>{activeNode.syncLabel}</span>
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-ink-heading">
            {activeNode.category}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-body sm:text-sm">
            {activeNode.summary}
          </p>

          {/* Supported Platforms */}
          <div className="mt-4">
            <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-ink-muted">
              Common Connected Systems
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeNode.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-md border border-line bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-heading"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          {/* Animated Signal Conduit Trace */}
          <div className="mt-5 rounded-xl border border-primary/20 bg-accent-subtle/40 p-3.5">
            <div className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-wider text-primary">
              <span>Automated Data Conduit</span>
              <span>Idempotent</span>
            </div>
            <div
              aria-hidden="true"
              className="my-2 h-1 w-full overflow-hidden rounded-full bg-surface"
            >
              <div className="animate-signal-flow h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-electric-cyan" />
            </div>
            <p className="font-mono text-[0.7rem] leading-relaxed text-ink-heading">
              {activeNode.automatedFlow}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between pt-1 text-xs">
            <Link
              href={`/contact?service=workflow-automation&intent=call&source=ecosystem_${encodeURIComponent(activeNode.id)}`}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover"
            >
              <span>Connect your current stack</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/services/workflow-automation"
              className="font-mono text-[0.68rem] text-ink-muted hover:text-ink-heading"
            >
              Integration specs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
