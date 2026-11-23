import type { LeadSubmissionInput } from "./schema";

/**
 * Optional free-tier transactional email notification via Resend REST API (Section 14).
 * Never blocks or fails enquiry capture: if RESEND_API_KEY is not configured or quota is reached,
 * returns "skipped_unconfigured" or "failed" while the lead stays safely stored in the database.
 */
export async function sendOptionalLeadNotification(
  lead: LeadSubmissionInput
): Promise<"sent" | "skipped_unconfigured" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.NOTIFICATION_TO_EMAIL?.trim();
  const fromEmail =
    process.env.NOTIFICATION_FROM_EMAIL?.trim() || "OmniFlow <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
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
        to: [toEmail],
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
