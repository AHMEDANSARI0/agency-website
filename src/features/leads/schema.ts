import { z } from "zod";
import { emailSchema, sanitizePlainText, sanitizeSafeUrl } from "@/lib/validation/common";

export const leadSubmissionSchema = z.object({
  name: z
    .string()
    .transform((v) => sanitizePlainText(v, 120))
    .pipe(z.string().min(2, "Please provide your name (at least 2 characters).")),
  email: emailSchema,
  company: z
    .string()
    .optional()
    .transform((v) => {
      const cleaned = v ? sanitizePlainText(v, 140) : "";
      return cleaned.length >= 2 ? cleaned : "Independent / Not Specified";
    }),
  website: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || !v.trim()) return undefined;
      const trimmed = v.trim();
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return sanitizeSafeUrl(withProto) ?? undefined;
    }),
  industry: z
    .string()
    .optional()
    .transform((v) => {
      const cleaned = v ? sanitizePlainText(v, 100) : "";
      return cleaned.length >= 2 ? cleaned : "Service Business (General)";
    }),
  interestedService: z
    .string()
    .optional()
    .transform((v) => {
      const cleaned = v ? sanitizePlainText(v, 100) : "";
      return cleaned.length >= 2 ? cleaned : "Discovery Call & Workflow Review";
    }),
  businessProblem: z
    .string()
    .transform((v) => sanitizePlainText(v, 2000))
    .pipe(
      z
        .string()
        .min(12, "Please briefly describe what you want to automate (at least 12 characters).")
    ),
  enquiryType: z.enum(["discovery_call", "workflow_enquiry"]).optional(),
  preferredCallWindow: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizePlainText(v, 120) : undefined)),
  timezone: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizePlainText(v, 80) : undefined)),
  budgetRange: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizePlainText(v, 80) : undefined)),
  timeline: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizePlainText(v, 80) : undefined)),
  additionalDetails: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizePlainText(v, 1500) : undefined)),
  privacyConsent: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm privacy consent so we can process and respond to your enquiry.",
    }),
  }),
  source: z
    .string()
    .optional()
    .transform((v) => {
      const cleaned = v ? sanitizePlainText(v, 120) : "";
      return cleaned || "website_contact";
    }),
  honeypot: z.string().optional(),
});

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
