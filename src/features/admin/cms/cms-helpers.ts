import type { PublishStatus, WorkVerificationType } from "@/types/content";

export type CmsTab =
  | "blog"
  | "case_study"
  | "service"
  | "faq"
  | "testimonial"
  | "team";

export const WORK_VERIFICATION_LABELS: Record<WorkVerificationType, string> = {
  verified_client: "Verified Client Case Study",
  internal_experiment: "Internal Workflow Blueprint",
  concept_demo: "Reference Architecture / Concept Demo",
  planned_project: "Planned Engineering Blueprint",
};

export const SERVICE_PILLAR_PRESETS: Array<{ slug: string; name: string }> = [
  { slug: "ai-workflow-automation", name: "AI Workflow Automation" },
  { slug: "ai-customer-support", name: "AI Customer Support & Agents" },
  { slug: "crm-lead-operations", name: "CRM & Lead Operations" },
  { slug: "internal-ai-assistants", name: "Internal Knowledge & Ops Assistants" },
  { slug: "systems-integration", name: "Custom API & Systems Integration" },
];

export function linesToArray(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function slugifyValue(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export interface SeoCheckInput {
  title: string;
  slug?: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyText?: string;
}

export interface SeoCompletenessReport {
  score: number;
  effectiveTitle: string;
  effectiveDescription: string;
  checks: Array<{ label: string; passed: boolean; hint: string }>;
}

export function computeSeoCompleteness(
  input: SeoCheckInput
): SeoCompletenessReport {
  const effectiveTitle = (input.seoTitle || input.title || "").trim();
  const effectiveDescription = (
    input.seoDescription ||
    input.summary ||
    ""
  ).trim();

  const checks: Array<{ label: string; passed: boolean; hint: string }> = [
    {
      label: "Headline length",
      passed:
        input.title.trim().length >= 12 && input.title.trim().length <= 90,
      hint: "Aim for 12–90 characters for clear hierarchy.",
    },
    {
      label: "Clean URL slug",
      passed:
        input.slug === undefined ||
        (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim()) &&
          input.slug.trim().length >= 3),
      hint: "Use lowercase hyphenated words (e.g., ai-lead-routing).",
    },
    {
      label: "Meta title (30–65 chars)",
      passed: effectiveTitle.length >= 30 && effectiveTitle.length <= 65,
      hint: `Currently ${effectiveTitle.length} chars.`,
    },
    {
      label: "Meta description (70–165 chars)",
      passed:
        effectiveDescription.length >= 70 &&
        effectiveDescription.length <= 165,
      hint: `Currently ${effectiveDescription.length} chars.`,
    },
  ];

  if (input.bodyText !== undefined) {
    const wordCount = input.bodyText.trim()
      ? input.bodyText.trim().split(/\s+/).length
      : 0;
    checks.push({
      label: "Substantive body copy (80+ words)",
      passed: wordCount >= 80,
      hint: `Currently ${wordCount} word(s).`,
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    score,
    effectiveTitle: effectiveTitle || "Untitled Page",
    effectiveDescription:
      effectiveDescription ||
      "Provide a concise summary or custom meta description for search engines.",
    checks,
  };
}

export interface BlogFormState {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  tagsText: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  showTableOfContents: boolean;
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
}

export interface CaseStudyFormState {
  id: string;
  slug: string;
  title: string;
  workType: WorkVerificationType;
  clientName: string;
  clientPermissionGranted: boolean;
  industry: string;
  businessType: string;
  problemSummary: string;
  manualProcessBeforeText: string;
  proposedAutomation: string;
  automatedWorkflowAfterText: string;
  technologiesUsedText: string;
  verifiedResultsText: string;
  projectDuration: string;
  relatedServiceSlugsText: string;
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
}

export interface ServiceFormState {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  isFlagshipPriority: boolean;
  badgeLabel: string;
  shortSummary: string;
  problemStatement: string;
  solutionOverview: string;
  benefitsText: string;
  ctaLabel: string;
  ctaHref: string;
  order: number;
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
}
