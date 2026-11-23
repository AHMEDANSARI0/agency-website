import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { DatabaseUnavailableError } from "@/lib/env";
import { verifySameOriginRequest } from "@/lib/security/csrf";
import {
  checkDistributedRateLimit,
  extractClientIp,
} from "@/lib/security/rate-limit";
import {
  computeLeadIdempotencyFingerprint,
  getRecentIdempotentLeadId,
  normalizeIdempotencyKey,
  readBoundedJsonBody,
  rememberIdempotentLeadId,
} from "@/lib/security/request-guards";
import { leadSubmissionSchema } from "@/features/leads/schema";
import { sendOptionalLeadNotification } from "@/features/leads/notify";

const MAX_LEAD_PAYLOAD_BYTES = 24 * 1024;

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const clientIp = extractClientIp(request.headers);
  const limit = await checkDistributedRateLimit(
    `lead_submit:${clientIp}`,
    5,
    10 * 60 * 1000
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many submissions. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const bounded = await readBoundedJsonBody(request, MAX_LEAD_PAYLOAD_BYTES);
  if (!bounded.ok) {
    return NextResponse.json(
      { error: bounded.error },
      { status: bounded.status }
    );
  }
  const body = bounded.data;

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
  const idempotencyKey = normalizeIdempotencyKey(
    request.headers.get("idempotency-key")
  );
  const fingerprint = idempotencyKey
    ? computeLeadIdempotencyFingerprint({
        idempotencyKey,
        email: data.email,
        company: data.company,
      })
    : null;

  if (fingerprint) {
    const existingLeadId =
      getRecentIdempotentLeadId(fingerprint) ??
      (await db.getPersistedIdempotentLeadId(fingerprint));
    if (existingLeadId) {
      rememberIdempotentLeadId(fingerprint, existingLeadId);
      return NextResponse.json(
        {
          ok: true,
          leadId: existingLeadId,
          deduplicated: true,
          message:
            "Thank you. Your enquiry has already been logged and we will respond within one business day.",
        },
        {
          status: 200,
          headers: {
            "X-RateLimit-Remaining": String(limit.remaining),
          },
        }
      );
    }
  }

  try {
    const callSummaryParts: string[] = [];
    if (data.enquiryType === "discovery_call") {
      callSummaryParts.push("Requested: Free 25-Min Discovery Call");
    }
    if (data.preferredCallWindow) {
      callSummaryParts.push(`Preferred Window: ${data.preferredCallWindow}`);
    }
    if (data.timezone) {
      callSummaryParts.push(`Timezone: ${data.timezone}`);
    }
    const mergedAdditionalDetails = [
      callSummaryParts.length > 0 ? `[${callSummaryParts.join(" · ")}]` : "",
      data.additionalDetails || "",
    ]
      .filter(Boolean)
      .join("\n")
      .trim() || undefined;

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
      additionalDetails: mergedAdditionalDetails,
      privacyConsent: data.privacyConsent,
      source: data.source || "website_contact",
      emailNotificationStatus: "skipped_unconfigured",
    });

    if (fingerprint) {
      rememberIdempotentLeadId(fingerprint, savedLead.id);
      await db.savePersistedIdempotentLeadId(fingerprint, savedLead.id);
    }

    // 2. Dispatch optional email alert and record accurate notification status
    const emailStatus = await sendOptionalLeadNotification({
      ...data,
      additionalDetails: mergedAdditionalDetails,
    });
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
        enquiryType: data.enquiryType ?? "workflow_enquiry",
        notificationStatus: emailStatus,
        message:
          data.enquiryType === "discovery_call"
            ? "Thank you. Your Discovery Call request has been saved and we will confirm your time slot within one business day."
            : "Thank you. Your enquiry has been logged for review and we will respond within one business day.",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
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
