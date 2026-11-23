import type { LeadSubmissionInput } from "./schema";
import { isPlaceholderEnvValue } from "@/lib/env";

const RESEND_TIMEOUT_MS = 4500;

export function sanitizeEmailHeader(value: string, maxLength = 140): string {
  return value
    .replace(/[\r\n\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getResendConfig(): {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
} | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const toEmail =
    process.env.NOTIFICATION_TO_EMAIL?.trim() ||
    process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
    "";
  const fromEmail =
    process.env.NOTIFICATION_FROM_EMAIL?.trim() ||
    "OmniFlow <onboarding@resend.dev>";

  if (isPlaceholderEnvValue(apiKey) || !toEmail) {
    return null;
  }

  return { apiKey, fromEmail, toEmail };
}

/**
 * Optional free-tier transactional email notification via Resend REST API.
 * Never blocks or fails enquiry capture: lead persistence happens first in the database,
 * and strict 4.5s AbortSignal timeout prevents serverless function hangs.
 */
export async function sendOptionalLeadNotification(
  lead: LeadSubmissionInput
): Promise<"sent" | "skipped_unconfigured" | "failed"> {
  const cfg = getResendConfig();
  if (!cfg) {
    return "skipped_unconfigured";
  }

  const safeCompany = sanitizeEmailHeader(lead.company, 70);
  const safeService = sanitizeEmailHeader(lead.interestedService, 70);
  const safeReplyTo = sanitizeEmailHeader(lead.email, 160);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromEmail,
        to: [cfg.toEmail],
        reply_to: safeReplyTo,
        subject: `[OmniFlow Enquiry] ${safeCompany} — ${safeService}`,
        text: [
          `New OmniFlow Enquiry`,
          `--------------------`,
          `Name: ${lead.name}`,
          `Email: ${lead.email}`,
          `Company: ${lead.company}`,
          `Website: ${lead.website || "Not provided"}`,
          `Industry: ${lead.industry}`,
          `Service: ${lead.interestedService}`,
          `Budget: ${lead.budgetRange || "Not specified"}`,
          `Timeline: ${lead.timeline || "Not specified"}`,
          ``,
          `Business Problem:`,
          lead.businessProblem,
          ``,
          `Additional Details:`,
          lead.additionalDetails || "None",
        ].join("\n"),
      }),
    });

    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendPasswordRecoveryEmail(input: {
  toEmail: string;
  recipientName: string;
  resetUrl: string;
}): Promise<"sent" | "skipped_unconfigured" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const fromEmail =
    process.env.NOTIFICATION_FROM_EMAIL?.trim() ||
    "OmniFlow <onboarding@resend.dev>";

  if (isPlaceholderEnvValue(apiKey)) {
    return "skipped_unconfigured";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [sanitizeEmailHeader(input.toEmail, 160)],
        subject: "OmniFlow Staff Password Recovery Request",
        text: [
          `Hello ${sanitizeEmailHeader(input.recipientName, 80)},`,
          ``,
          `A password reset was requested for your OmniFlow staff administration account.`,
          `Use the single-use link below within 30 minutes to set a new password:`,
          ``,
          input.resetUrl,
          ``,
          `If you did not request this reset, you can safely ignore this message — your existing password remains unchanged.`,
        ].join("\n"),
      }),
    });

    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
