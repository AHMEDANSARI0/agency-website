import type { LeadSubmissionInput } from "./schema";
import { isPlaceholderEnvValue } from "@/lib/env";

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
 * Never blocks or fails enquiry capture: lead persistence happens first in the database.
 */
export async function sendOptionalLeadNotification(
  lead: LeadSubmissionInput
): Promise<"sent" | "skipped_unconfigured" | "failed"> {
  const cfg = getResendConfig();
  if (!cfg) {
    return "skipped_unconfigured";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromEmail,
        to: [cfg.toEmail],
        reply_to: lead.email,
        subject: `[OmniFlow Enquiry] ${lead.company} — ${lead.interestedService}`,
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.toEmail],
        subject: "OmniFlow Staff Password Recovery Request",
        text: [
          `Hello ${input.recipientName},`,
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
