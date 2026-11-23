"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackAnalyticsEvent } from "@/components/analytics/AnalyticsConsentManager";

interface ContactFormProps {
  defaultService?: string;
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

export function ContactForm({ defaultService = "", serviceOptions }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      website: String(formData.get("website") || ""),
      industry: String(formData.get("industry") || ""),
      interestedService: String(formData.get("interestedService") || ""),
      businessProblem: String(formData.get("businessProblem") || ""),
      budgetRange: String(formData.get("budgetRange") || ""),
      timeline: String(formData.get("timeline") || ""),
      additionalDetails: String(formData.get("additionalDetails") || ""),
      privacyConsent: formData.get("privacyConsent") === "on",
      honeypot: String(formData.get("company_fax_number") || ""),
      source: "website_contact_page",
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !result.ok) {
        setStatus({
          type: "error",
          message: result.error || "Unable to submit your enquiry. Please review the required fields.",
        });
        setSubmitting(false);
        return;
      }

      form.reset();
      trackAnalyticsEvent("lead_enquiry_submitted", {
        service: payload.interestedService || "general",
        industry: payload.industry || "unspecified",
      });
      setStatus({
        type: "success",
        message:
          result.message ||
          "Thank you. Your enquiry has been saved and our team will respond within one business day.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error while submitting your enquiry. Please check your connection and retry.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClasses =
    "mt-1.5 block w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--of-ring-focus)]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-8"
    >
      <h2 className="text-xl font-bold text-ink-heading">Tell Us About Your Workflow</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Fields marked with <span aria-hidden="true">*</span> are required. Submissions are private
        and never shared with third parties.
      </p>

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

        <div>
          <label htmlFor="lead-company" className="block text-xs font-semibold text-ink-heading">
            Company / Practice Name *
          </label>
          <input
            id="lead-company"
            name="company"
            type="text"
            required
            autoComplete="organization"
            placeholder="Northbridge Advisory"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="lead-website" className="block text-xs font-semibold text-ink-heading">
            Website (Optional)
          </label>
          <input
            id="lead-website"
            name="website"
            type="url"
            placeholder="https://example.com"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="lead-industry" className="block text-xs font-semibold text-ink-heading">
            Industry *
          </label>
          <select id="lead-industry" name="industry" required defaultValue="" className={inputClasses}>
            <option value="" disabled>
              Select your business type
            </option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lead-service" className="block text-xs font-semibold text-ink-heading">
            Interested Service *
          </label>
          <select
            id="lead-service"
            name="interestedService"
            required
            defaultValue={defaultService || ""}
            className={inputClasses}
          >
            <option value="" disabled>
              Select primary area of interest
            </option>
            {serviceOptions.map((srv) => (
              <option key={srv.slug} value={srv.title}>
                {srv.title}
              </option>
            ))}
            <option value="General Automation Assessment">General Automation Assessment</option>
          </select>
        </div>

        <div>
          <label htmlFor="lead-budget" className="block text-xs font-semibold text-ink-heading">
            Estimated Budget Range (Optional)
          </label>
          <select id="lead-budget" name="budgetRange" defaultValue="" className={inputClasses}>
            <option value="">Prefer to discuss after scoping</option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lead-timeline" className="block text-xs font-semibold text-ink-heading">
            Target Timeline (Optional)
          </label>
          <select id="lead-timeline" name="timeline" defaultValue="" className={inputClasses}>
            <option value="">Select target timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="lead-problem" className="block text-xs font-semibold text-ink-heading">
          What manual bottleneck or business problem are you looking to solve? *
        </label>
        <textarea
          id="lead-problem"
          name="businessProblem"
          rows={4}
          required
          placeholder="Describe your current process, tools used (e.g. Gmail, HubSpot, Notion, spreadsheets), and where time or leads are being lost..."
          className={inputClasses}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="lead-details" className="block text-xs font-semibold text-ink-heading">
          Additional Context or Questions (Optional)
        </label>
        <textarea
          id="lead-details"
          name="additionalDetails"
          rows={2}
          placeholder="Team size, region (US / UK / Canada), or specific tools you want connected..."
          className={inputClasses}
        />
      </div>

      <div className="mt-5 flex items-start gap-2.5">
        <input
          id="lead-consent"
          name="privacyConsent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-[var(--of-ring-focus)]"
        />
        <label htmlFor="lead-consent" className="text-xs leading-relaxed text-ink-body">
          I consent to OmniFlow storing and processing my enquiry details to respond to my request
          in accordance with the{" "}
          <Link href="/privacy-policy" className="font-medium text-link underline hover:text-link-hover">
            Privacy Policy
          </Link>
          . *
        </label>
      </div>

      {status.type !== "idle" && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 flex items-start gap-2.5 rounded-control border p-4 text-sm ${
            status.type === "success"
              ? "border-status-success/40 bg-surface-muted text-ink-heading"
              : "border-status-error/40 bg-surface-muted text-status-error"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting Enquiry…" : "Submit Automation Enquiry"}
        </Button>
      </div>
    </form>
  );
}
