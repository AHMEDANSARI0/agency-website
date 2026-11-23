"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Bot,
  Inbox,
  MessageSquareReply,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  generateGroundedSupportReply,
  getSupportDomainPack,
  SUPPORT_SAMPLE_PROMPTS,
  type SupportDomainId,
} from "@/features/demos/engine";

export function AiConversationSimulator() {
  const [domain, setDomain] = useState<SupportDomainId>(
    SUPPORT_SAMPLE_PROMPTS[0].domain
  );
  const [message, setMessage] = useState<string>(
    SUPPORT_SAMPLE_PROMPTS[0].question
  );
  const [visibleStage, setVisibleStage] = useState<number>(5);

  const pack = getSupportDomainPack(domain);
  const reply = generateGroundedSupportReply(domain, message);
  const isEscalated = reply.mode === "human_escalation_required";

  function triggerSimulation(nextDomain: SupportDomainId, nextQuestion: string) {
    setDomain(nextDomain);
    setMessage(nextQuestion);

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisibleStage(5);
      return;
    }

    setVisibleStage(1);
  }

  useEffect(() => {
    if (visibleStage >= 5) return;
    const timer = window.setTimeout(() => {
      setVisibleStage((prev) => Math.min(5, prev + 1));
    }, 190);
    return () => window.clearTimeout(timer);
  }, [visibleStage]);

  const stages = [
    {
      num: 1,
      label: "Incoming customer message",
      status: "Received",
      detail: `Channel: Client Inbox · Practice: ${pack.name}`,
      icon: Inbox,
      tone: "normal" as const,
    },
    {
      num: 2,
      label: "AI analysis",
      status: isEscalated ? "Boundary Flagged" : "Routine Policy Query",
      detail:
        reply.guardrailTriggered ||
        "Intent classified safely; zero sensitive pricing/legal keywords detected.",
      icon: Bot,
      tone: isEscalated ? ("warn" as const) : ("normal" as const),
    },
    {
      num: 3,
      label: "Knowledge retrieval",
      status: isEscalated ? "Fallback Rule" : "Approved SOP Matched",
      detail: reply.matchedPolicyTitle,
      icon: BookOpenCheck,
      tone: "normal" as const,
    },
    {
      num: 4,
      label: "Generated response",
      status: isEscalated ? "Safe Holding Reply" : "Grounded Draft Ready",
      detail: isEscalated
        ? "Polite holding acknowledgement prepared—zero fabricated promises."
        : "Accurate reply drafted strictly from verified policy text.",
      icon: MessageSquareReply,
      tone: "normal" as const,
    },
    {
      num: 5,
      label: "Human escalation",
      status: isEscalated ? "Escalated to Team" : "Not Needed (Auto-Resolved)",
      detail: isEscalated
        ? "Routed to dedicated human owner with structured conversation summary."
        : "Resolved cleanly within approved boundaries; human team uninterrupted.",
      icon: UserCheck,
      tone: isEscalated ? ("warn" as const) : ("success" as const),
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left 5 Cols: Scenario Presets & Live Customer Prompt Input */}
      <div className="space-y-4 lg:col-span-5">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Select Sample Customer Scenario
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {SUPPORT_SAMPLE_PROMPTS.map((sample) => {
              const active =
                sample.domain === domain && sample.question === message;
              return (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() =>
                    triggerSimulation(sample.domain, sample.question)
                  }
                  className={`rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-primary bg-accent-subtle/65 shadow-sm"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-heading">
                    {sample.label}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-ink-body">
                    “{sample.question}”
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="sim-custom-customer-msg"
            className="block text-xs font-semibold text-ink-heading"
          >
            Or Type Your Own Customer Message
          </label>
          <textarea
            id="sim-custom-customer-msg"
            rows={3}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setVisibleStage(5);
            }}
            placeholder="Try asking about kickoff checklists, or test 'discount' / 'refund' guardrails..."
            className="mt-1.5 block w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3.5 py-2.5 text-xs text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)] sm:text-sm"
          />
          <p className="mt-1.5 font-mono text-[0.68rem] text-ink-muted">
            Tip: Include words like &ldquo;discount&rdquo;, &ldquo;refund&rdquo;, or &ldquo;liability&rdquo; to trigger mandatory human escalation.
          </p>
        </div>
      </div>

      {/* Right 7 Cols: 5-Stage Live Execution Trace & Simulated Conversation */}
      <div
        aria-live="polite"
        className="flex flex-col justify-between rounded-2xl border border-line bg-surface-muted/70 p-5 lg:col-span-7 sm:p-6"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-heading">
              5-Stage Support Triage Trace
            </span>
            <Badge variant={isEscalated ? "outline" : "accent"}>
              {reply.confidenceLabel}
            </Badge>
          </div>

          {/* 5-Stage Pipeline Steps */}
          <ol className="mt-4 space-y-2">
            {stages.map((st) => {
              const Icon = st.icon;
              const isVisible = st.num <= visibleStage;
              return (
                <li
                  key={st.label}
                  className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-35 translate-y-1"
                  } ${
                    st.tone === "warn"
                      ? "border-status-warning/35 bg-surface"
                      : "border-line bg-surface"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ${
                        st.tone === "warn"
                          ? "bg-status-warning/15 text-status-warning"
                          : st.tone === "success"
                            ? "bg-status-success/15 text-status-success"
                            : "bg-accent-subtle text-primary"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-heading">
                        0{st.num} · {st.label}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-body">{st.detail}</p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold text-ink-heading">
                    {st.status}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Generated Customer Reply + Optional Human Escalation Dossier */}
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-primary/25 bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Generated Customer Reply</span>
                </span>
                <span className="font-mono text-[0.65rem] text-ink-muted">
                  {reply.matchedPolicyTitle}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-ink-heading sm:text-sm">
                {reply.customerDraftReply}
              </p>
            </div>

            {reply.internalEscalationNote && (
              <div className="rounded-xl border border-status-warning/35 bg-surface p-3.5">
                <p className="flex items-center gap-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-status-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Human Escalation Brief Sent to Team</span>
                </p>
                <p className="mt-1.5 font-mono text-[0.7rem] leading-relaxed text-ink-body">
                  {reply.internalEscalationNote}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3.5 text-xs">
          <span className="font-mono text-[0.68rem] text-ink-muted">
            Deterministic guardrail simulation · Zero unapproved promises
          </span>
          <Link
            href="/demos?tab=support-generator"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover"
          >
            <span>Inspect full SOP packs in Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
