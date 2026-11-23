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
    .transform((v) => sanitizePlainText(v, 140))
    .pipe(z.string().min(2, "Please provide your company or practice name.")),
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
    .transform((v) => sanitizePlainText(v, 100))
    .pipe(z.string().min(2, "Please select or enter your industry.")),
  interestedService: z
    .string()
    .transform((v) => sanitizePlainText(v, 100))
    .pipe(z.string().min(2, "Please select the primary service of interest.")),
  businessProblem: z
    .string()
    .transform((v) => sanitizePlainText(v, 2000))
    .pipe(
      z
        .string()
        .min(20, "Please describe the operational bottleneck briefly (at least 20 characters).")
    ),
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
    .transform((v) => (v ? sanitizePlainText(v, 80) : "website_contact")),
  honeypot: z.string().optional(),
});

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
