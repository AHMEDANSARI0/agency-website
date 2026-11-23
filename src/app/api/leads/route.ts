import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import { checkDistributedRateLimit, extractClientIp } from "@/lib/security/rate-limit";
import { leadSubmissionSchema } from "@/features/leads/schema";
import { sendOptionalLeadNotification } from "@/features/leads/notify";

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const clientIp = extractClientIp(request.headers);
  const limit = await checkDistributedRateLimit(`lead_submit:${clientIp}`, 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many submissions. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  // Silent spam honeypot rejection (returns 200 without storing spam bots)
  if (
    typeof body === "object" &&
    body !== null &&
    "honeypot" in body &&
    typeof (body as { honeypot?: unknown }).honeypot === "string" &&
    (body as { honeypot: string }).honeypot.trim().length > 0
  ) {
    return NextResponse.json({
      ok: true,
      message: "Thank you. Your enquiry has been received.",
    });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message || "Please check the form fields.";
    return NextResponse.json(
      {
        error: firstIssue,
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // 1. Persist lead in database FIRST so email delivery failures never drop enquiries
    const savedLead = await db.createLead({
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      industry: data.industry,
      interestedService: data.interestedService,
      businessProblem: data.businessProblem,
      budgetRange: data.budgetRange,
      timeline: data.timeline,
      additionalDetails: data.additionalDetails,
      privacyConsent: data.privacyConsent,
      source: data.source || "website_contact",
      emailNotificationStatus: "skipped_unconfigured",
    });

    // 2. Dispatch optional email alert and record accurate notification status
    const emailStatus = await sendOptionalLeadNotification(data);
    if (emailStatus !== "skipped_unconfigured") {
      await db.updateLead(savedLead.id, (current) => ({
        ...current,
        emailNotificationStatus: emailStatus,
      }));
    }

    return NextResponse.json(
      {
        ok: true,
        leadId: savedLead.id,
        notificationStatus: emailStatus,
        message:
          "Thank you. Your enquiry has been logged for review and we will respond within one business day.",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Our enquiry service is temporarily unavailable while database maintenance completes. Please try again shortly.",
          code: err.code,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to process your enquiry right now. Please try again." },
      { status: 500 }
    );
  }
}
