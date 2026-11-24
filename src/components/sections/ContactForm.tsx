"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { SoaleArrowButton } from "@/components/ui/soale";
import { Badge } from "@/components/ui/Badge";
import { trackAnalyticsEvent } from "@/components/analytics/AnalyticsConsentManager";

interface ContactFormProps {
  defaultService?: string;
  defaultContext?: string;
  defaultIntent?: "call" | "enquiry";
  defaultSource?: string;
  externalBookingUrl?: string;
  serviceOptions: { slug: string; title: string }[];
}

const INDUSTRIES = [
  "Consulting & Advisory Practice",
  "Digital / Marketing / Creative Agency",
  "Accounting, Legal, or Financial Services",
  "Recruitment & Staffing Firm",
  "Commercial or Home Service Business",
  "Healthcare / Wellness Clinic",
  "Other Service Business",
];

const BUDGET_RANGES = [
  "Not sure yet — need scoping advice",
  "Under $1,500 USD (Focused single workflow)",
  "$1,500 – $3,500 USD (Core system implementation)",
  "$3,500 – $7,500 USD (Multi-workflow architecture)",
  "$7,500+ USD (Custom internal platform / ongoing)",
];

const TIMELINES = [
  "Immediate (Within 2–4 weeks)",
  "Near-term (1–2 months)",
  "Planning ahead (Quarter roadmap)",
  "Exploratory inquiry",
];

const CALL_WINDOWS = [
  "Next 2–3 Business Days · Morning",
  "Next 2–3 Business Days · Afternoon",
  "This Week · Flexible Window",
  "Next Week · Flexible Window",
];

const TIMEZONES = [
  "US & Canada Eastern (EST / EDT)",
  "US & Canada Central / Mountain / Pacific",
  "United Kingdom (GMT / BST)",
  "Europe / International (Flexible Overlap)",
];

export function ContactForm({
  defaultService = "",
  defaultContext = "",
  defaultIntent = "call",
  defaultSource = "",
  externalBookingUrl = "",
  serviceOptions,
}: ContactFormProps) {
  const [enquiryMode, setEnquiryMode] = useState<"discovery_call" | "workflow_enquiry">(
    defaultIntent === "enquiry" ? "workflow_enquiry" : "discovery_call"
  );

  const resolvedDefaultService = React.useMemo(() => {
    const trimmed = defaultService.trim();
    if (!trimmed) return "";
    const bySlugOrTitle = serviceOptions.find(
      (opt) =>
        opt.slug.toLowerCase() === trimmed.toLowerCase() ||
        opt.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (bySlugOrTitle) return bySlugOrTitle.title;
    return "Discovery Call & Workflow Review";
  }, [defaultService, serviceOptions]);

  const safeDefaultContext = React.useMemo(
    () => defaultContext.replace(/[<>]/g, "").trim().slice(0, 500),
    [defaultContext]
  );

  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(
    Boolean(resolvedDefaultService || safeDefaultContext)
  );
  const [attributedSource, setAttributedSource] = useState<string>(
    defaultSource.trim() || "website_contact_page"
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<{
    leadId: string;
    name: string;
    email: string;
    mode: "discovery_call" | "workflow_enquiry";
    callWindow?: string;
    timezone?: string;
    message: string;
  } | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "error"; message?: string }>({
    type: "idle",
  });

  const hasExternalCalendar = /^https?:\/\//i.test(externalBookingUrl.trim());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlSource = params.get("source")?.trim();
    const utmSource = params.get("utm_source")?.trim();
    const utmMedium = params.get("utm_medium")?.trim();
    const utmCampaign = params.get("utm_campaign")?.trim();
    const serviceParam = params.get("service")?.trim();

    const base =
      urlSource ||
      defaultSource.trim() ||
      (serviceParam ? `service:${serviceParam}` : "website_contact_page");

    const utmParts = [utmSource, utmMedium, utmCampaign].filter(Boolean);
    const composed =
      utmParts.length > 0 ? `${base} [utm:${utmParts.join("/")}]` : base;

    setAttributedSource(composed.slice(0, 110));
  }, [defaultSource]);

  const idempotencyKeyRef = React.useRef<string>(
    `idem_of_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const preferredCallWindow =
      enquiryMode === "discovery_call"
        ? String(formData.get("preferredCallWindow") || "")
        : "";
    const timezone =
      enquiryMode === "discovery_call"
        ? String(formData.get("timezone") || "")
        : "";

    const payload = {
      name,
      email,
      company: String(formData.get("company") || ""),
      website: String(formData.get("website") || ""),
      industry: String(formData.get("industry") || ""),
      interestedService:
        String(formData.get("interestedService") || "") ||
        resolvedDefaultService ||
        (enquiryMode === "discovery_call"
          ? "Discovery Call & Workflow Review"
          : "General Automation Assessment"),
      businessProblem: String(formData.get("businessProblem") || ""),
      enquiryType: enquiryMode,
      preferredCallWindow: preferredCallWindow || undefined,
      timezone: timezone || undefined,
      budgetRange: String(formData.get("budgetRange") || ""),
      timeline: String(formData.get("timeline") || ""),
      additionalDetails: String(formData.get("additionalDetails") || ""),
      privacyConsent: formData.get("privacyConsent") === "on",
      honeypot: String(formData.get("company_fax_number") || ""),
      source: `${attributedSource}${enquiryMode === "discovery_call" ? ":call" : ":enquiry"}`.slice(
        0,
        120
      ),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        leadId?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setStatus({
          type: "error",
          message:
            result.error ||
            "Unable to submit your request. Please check the highlighted fields and try again.",
        });
        setSubmitting(false);
        return;
      }

      form.reset();
      idempotencyKeyRef.current = `idem_of_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      trackAnalyticsEvent("lead_enquiry_submitted", {
        mode: enquiryMode,
        service: payload.interestedService || "general",
        source: attributedSource,
      });

      setSubmittedRecord({
        leadId: result.leadId || "CONFIRMED",
        name,
        email,
        mode: enquiryMode,
        callWindow: preferredCallWindow || undefined,
        timezone: timezone || undefined,
        message:
          result.message ||
          "Thank you. Your request has been saved and our team will respond within one business day.",
      });
    } catch {
      setStatus({
        type: "error",
        message:
          "Network error while submitting your request. Please check your connection and retry.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClasses =
    "mt-1.5 block w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]";

  /* =========================================================================
   * DEDICATED THANK-YOU & FOLLOW-UP CONFIRMATION VIEW
   * ========================================================================= */
  if (submittedRecord) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-card border border-status-success/35 bg-surface-card p-6 shadow-elevated sm:p-9"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-status-success/15 text-status-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="accent">
                {submittedRecord.mode === "discovery_call"
                  ? "Discovery Call Request Logged"
                  : "Workflow Enquiry Confirmed"}
              </Badge>
              <h2 className="mt-1 text-xl font-bold text-ink-heading sm:text-2xl">
                Thank you, {submittedRecord.name}. We have your details.
              </h2>
            </div>
          </div>

          <span className="rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs font-semibold text-ink-heading">
            Ref: {submittedRecord.leadId}
          </span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-body sm:text-base">
          {submittedRecord.message} A confirmation and follow-up will be sent to{" "}
          <strong className="text-ink-heading">{submittedRecord.email}</strong>.
        </p>

        {submittedRecord.mode === "discovery_call" &&
          (submittedRecord.callWindow || submittedRecord.timezone) && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-accent-subtle/45 px-4 py-3 text-xs text-ink-heading">
              <strong>Requested Call Preference:</strong>{" "}
              {[submittedRecord.callWindow, submittedRecord.timezone]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}

        {/* Follow-Up Workflow Steps */}
        <div className="mt-6 rounded-xl border border-line bg-surface-muted/65 p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            Your Follow-Up Timeline
          </p>
          <ol className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <li className="rounded-lg border border-line bg-surface p-3.5">
              <p className="font-mono text-[0.68rem] font-semibold text-status-success">
                01 · Complete
              </p>
              <p className="mt-1 text-xs font-bold text-ink-heading">
                Logged to OmniFlow CRM
              </p>
              <p className="mt-1 text-xs text-ink-body">
                Saved directly to our database with zero risk of lost inbox threads.
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface p-3.5">
              <p className="font-mono text-[0.68rem] font-semibold text-primary">
                02 · Within 1 Business Day
              </p>
              <p className="mt-1 text-xs font-bold text-ink-heading">
                Principal Review &amp; Slot Confirmation
              </p>
              <p className="mt-1 text-xs text-ink-body">
                We review your workflow bottleneck and send calendar confirmation or written notes.
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface p-3.5">
              <p className="font-mono text-[0.68rem] font-semibold text-ink-muted">
                03 · Clear Next Step
              </p>
              <p className="mt-1 text-xs font-bold text-ink-heading">
                Actionable Scope &amp; Outcomes
              </p>
              <p className="mt-1 text-xs text-ink-body">
                You receive a clear recommendation on what to automate, timeline, and costs.
              </p>
            </li>
          </ol>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover sm:text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Explore Live Interactive Demos While You Wait</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => setSubmittedRecord(null)}
            className="text-xs font-semibold text-ink-muted underline hover:text-ink-heading"
          >
            Submit another workflow note
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="soale-card p-6 sm:p-9"
    >
      {/* Intent Mode Selector: Book Discovery Call vs. Quick Written Enquiry */}
      <div
        role="tablist"
        aria-label="Choose how you would like to connect"
        className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-surface-muted p-1.5 sm:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={enquiryMode === "discovery_call"}
          onClick={() => setEnquiryMode("discovery_call")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
            enquiryMode === "discovery_call"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-ink-body hover:text-ink-heading"
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          <span>Book a Free Discovery Call</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={enquiryMode === "workflow_enquiry"}
          onClick={() => setEnquiryMode("workflow_enquiry")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
            enquiryMode === "workflow_enquiry"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-ink-body hover:text-ink-heading"
          }`}
        >
          <MessageSquareText className="h-4 w-4" />
          <span>Send a Quick Workflow Enquiry</span>
        </button>
      </div>

      <div className="mt-5">
        <h2 className="text-xl font-bold text-ink-heading">
          {enquiryMode === "discovery_call"
            ? "Book Your Free 25-Minute Discovery Call"
            : "Tell Us What You Want to Automate"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {enquiryMode === "discovery_call"
            ? "Share 4 quick details and your preferred call window. We review your stack beforehand so the call focuses purely on practical outcomes."
            : "Prefer async communication? Share your bottleneck below and receive a practical written review within one business day."}
        </p>
      </div>

      {/* Optional Direct External Calendar Link (Only Shown When Real HTTPS Calendar Is Configured) */}
      {enquiryMode === "discovery_call" && hasExternalCalendar && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent-subtle/50 px-4 py-3 text-xs">
          <span className="text-ink-body">
            <strong className="text-ink-heading">Instant Calendar Available:</strong>{" "}
            Pick a live time slot directly, or request a custom window below.
          </span>
          <a
            href={externalBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <span>Open Live Calendar</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {safeDefaultContext && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-accent-subtle/50 px-4 py-3 text-xs text-ink-body">
          <strong className="text-ink-heading">Interactive Lab Context Attached:</strong>{" "}
          Your simulated scenario summary has been pre-filled below under Optional Project Details (you can edit it freely).
        </div>
      )}

      {/* Anti-spam honeypot field hidden from human and assistive users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_fax_number">Leave this field blank</label>
        <input
          id="company_fax_number"
          name="company_fax_number"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Essential Minimal Fields (Fast 45-Second Completion) */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="block text-xs font-semibold text-ink-heading">
            Full Name *
          </label>
          <input
            id="lead-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="block text-xs font-semibold text-ink-heading">
            Business Email *
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="alex@company.com"
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="lead-company" className="block text-xs font-semibold text-ink-heading">
            Company or Practice Name <span className="font-normal text-ink-muted">(Optional)</span>
          </label>
          <input
            id="lead-company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Northbridge Advisory"
            className={inputClasses}
          />
        </div>

        {/* Functional Discovery Call Window & Timezone Selector */}
        {enquiryMode === "discovery_call" && (
          <>
            <div>
              <label
                htmlFor="lead-call-window"
                className="block text-xs font-semibold text-ink-heading"
              >
                Preferred Call Window
              </label>
              <select
                id="lead-call-window"
                name="preferredCallWindow"
                defaultValue={CALL_WINDOWS[0]}
                className={inputClasses}
              >
                {CALL_WINDOWS.map((win) => (
                  <option key={win} value={win}>
                    {win}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-timezone"
                className="block text-xs font-semibold text-ink-heading"
              >
                Your Timezone
              </label>
              <select
                id="lead-timezone"
                name="timezone"
                defaultValue={TIMEZONES[0]}
                className={inputClasses}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="lead-problem" className="block text-xs font-semibold text-ink-heading">
          What repetitive process or bottleneck would you like to automate? *
        </label>
        <textarea
          id="lead-problem"
          name="businessProblem"
          rows={3}
          required
          placeholder="Example: Inbound enquiries sit in our shared inbox for hours, and we manually copy client details into our CRM and Slack..."
          className={inputClasses}
        />
      </div>

      {/* Progressive Disclosure: Optional Scoping Details */}
      <div className="mt-5 rounded-xl border border-line bg-surface-muted/45">
        <button
          type="button"
          aria-expanded={showOptionalDetails}
          onClick={() => setShowOptionalDetails((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-ink-heading hover:text-primary"
        >
          <span>
            Add optional project details{" "}
            <span className="font-normal text-ink-muted">
              (Service area, Industry, Budget range, Timeline, Website)
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
              showOptionalDetails ? "rotate-180 text-primary" : ""
            }`}
          />
        </button>

        {showOptionalDetails && (
          <div className="border-t border-line px-4 pb-5 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="lead-service"
                  className="block text-xs font-semibold text-ink-heading"
                >
                  Primary Service of Interest
                </label>
                <select
                  id="lead-service"
                  name="interestedService"
                  defaultValue={resolvedDefaultService}
                  className={inputClasses}
                >
                  <option value="">Not sure yet — recommend best fit</option>
                  {serviceOptions.map((srv) => (
                    <option key={srv.slug} value={srv.title}>
                      {srv.title}
                    </option>
                  ))}
                  <option value="Discovery Call & Workflow Review">
                    Discovery Call &amp; Workflow Review
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="lead-industry"
                  className="block text-xs font-semibold text-ink-heading"
                >
                  Business Type / Industry
                </label>
                <select
                  id="lead-industry"
                  name="industry"
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="">Select business type (optional)</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="lead-budget"
                  className="block text-xs font-semibold text-ink-heading"
                >
                  Estimated Budget Range
                </label>
                <select
                  id="lead-budget"
                  name="budgetRange"
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="">Prefer to discuss after scoping</option>
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="lead-timeline"
                  className="block text-xs font-semibold text-ink-heading"
                >
                  Target Timeline
                </label>
                <select
                  id="lead-timeline"
                  name="timeline"
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="">Select target timeline</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="lead-website"
                  className="block text-xs font-semibold text-ink-heading"
                >
                  Company Website
                </label>
                <input
                  id="lead-website"
                  name="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="lead-details"
                className="block text-xs font-semibold text-ink-heading"
              >
                Current Tools or Additional Context
              </label>
              <textarea
                id="lead-details"
                name="additionalDetails"
                rows={safeDefaultContext ? 3 : 2}
                defaultValue={safeDefaultContext}
                placeholder="Tools currently used (e.g. HubSpot, Gmail, WhatsApp, Notion, QuickBooks) or simulation notes..."
                className={inputClasses}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hidden fallback when optional drawer is collapsed while defaultService/defaultContext exist */}
      {!showOptionalDetails && resolvedDefaultService && (
        <input type="hidden" name="interestedService" value={resolvedDefaultService} />
      )}
      {!showOptionalDetails && safeDefaultContext && (
        <input type="hidden" name="additionalDetails" value={safeDefaultContext} />
      )}

      <div className="mt-5 flex items-start gap-2.5">
        <input
          id="lead-consent"
          name="privacyConsent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-[var(--of-ring-focus)]"
        />
        <label htmlFor="lead-consent" className="text-xs leading-relaxed text-ink-body">
          I consent to OmniFlow storing and processing my details to respond to my request in
          accordance with the{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-link underline hover:text-link-hover"
          >
            Privacy Policy
          </Link>
          . *
        </label>
      </div>

      {status.type === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 flex items-start gap-2.5 rounded-control border border-status-error/40 bg-surface-muted p-4 text-sm text-status-error"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
          <span>{status.message}</span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <SoaleArrowButton
          type="submit"
          disabled={submitting}
          variant="primary"
        >
          {submitting
            ? "Saving Your Request…"
            : enquiryMode === "discovery_call"
              ? "Request Free Discovery Call"
              : "Send Workflow Enquiry"}
        </SoaleArrowButton>

        <p className="text-xs text-ink-muted">
          1-business-day response · Private &amp; confidential · Zero obligation
        </p>
      </div>
    </form>
  );
}
