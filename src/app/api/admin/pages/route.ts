import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { PageDocument, PageSectionBlock, PageSectionType } from "@/types/content";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { CACHE_TAGS, revalidatePublicContent } from "@/lib/cache/public-cache";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText, sanitizeSlug } from "@/lib/validation/common";

const ALLOWED_SECTION_TYPES: [PageSectionType, ...PageSectionType[]] = [
  "hero",
  "trust_strip",
  "problems_outcomes",
  "flagship_systems",
  "services_overview",
  "interactive_demos_preview",
  "how_it_works",
  "workflow_demo",
  "industry_use_cases",
  "architecture_governance",
  "roi_framing",
  "case_studies_highlight",
  "founder_intro",
  "insights_preview",
  "testimonials",
  "faq_section",
  "cta_banner",
  "rich_text",
];

const sectionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(ALLOWED_SECTION_TYPES),
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().max(300).optional(),
  isVisible: z.boolean(),
  order: z.number().int().min(0).max(100),
  config: z
    .object({
      markdown: z.string().max(8000).optional(),
      ctaLabel: z.string().max(80).optional(),
      ctaHref: z.string().max(200).optional(),
    })
    .passthrough()
    .optional(),
});

const savePageSchema = z.object({
  id: z.string().max(80).optional(),
  slug: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  sections: z.array(sectionSchema).min(1).max(30),
  publish: z.boolean().optional(),
  scheduledFor: z.string().max(64).nullable().optional(),
  seo: z
    .object({
      seoTitle: z.string().max(120).optional(),
      seoDescription: z.string().max(240).optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "content:edit_any");
  if (!auth.ok) return auth.response;

  const pages = await db.listPages();
  return NextResponse.json({
    pages,
    canPublish: hasPermission(
      auth.user.role,
      "content:publish",
      auth.settings.rolePolicies
    ),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApiAuth(request, "content:edit_any");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = savePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid page layout payload." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const wantsPublish = Boolean(data.publish);
  const canPublish = hasPermission(
    auth.user.role,
    "content:publish",
    auth.settings.rolePolicies
  );

  if (wantsPublish && !canPublish) {
    return NextResponse.json(
      { error: "Your role does not have permission to publish pages directly. Save as draft instead." },
      { status: 403 }
    );
  }

  const cleanSlug = data.slug === "home" ? "home" : sanitizeSlug(data.slug);
  if (!cleanSlug) {
    return NextResponse.json({ error: "Invalid page slug." }, { status: 400 });
  }

  const existing = await db.getPageBySlug(cleanSlug);

  const sanitizedBlocks: PageSectionBlock[] = data.sections.map((sec, idx) => ({
    id: sanitizePlainText(sec.id, 80) || `sec_${randomBytes(4).toString("hex")}`,
    type: sec.type,
    title: sanitizePlainText(sec.title, 160),
    subtitle: sec.subtitle ? sanitizePlainText(sec.subtitle, 300) : undefined,
    isVisible: sec.isVisible,
    order: idx + 1,
    config: {
      markdown:
        typeof sec.config?.markdown === "string"
          ? sec.config.markdown.slice(0, 8000)
          : undefined,
      ctaLabel:
        typeof sec.config?.ctaLabel === "string"
          ? sanitizePlainText(sec.config.ctaLabel, 80)
          : undefined,
      ctaHref:
        typeof sec.config?.ctaHref === "string"
          ? sanitizePlainText(sec.config.ctaHref, 200)
          : undefined,
    },
  }));

  const nextStatus: PageDocument["status"] = wantsPublish
    ? data.scheduledFor
      ? "scheduled"
      : "published"
    : existing?.status === "published"
      ? "published"
      : "draft";

  const pageDoc: PageDocument = {
    id: existing?.id || data.id || `page_${randomBytes(6).toString("hex")}`,
    slug: cleanSlug,
    title: sanitizePlainText(data.title, 140),
    status: nextStatus,
    scheduledFor: data.scheduledFor ?? null,
    draftSections: sanitizedBlocks,
    sections:
      wantsPublish && !data.scheduledFor
        ? structuredClone(sanitizedBlocks)
        : existing?.sections ?? structuredClone(sanitizedBlocks),
    seo: {
      seoTitle: data.seo?.seoTitle
        ? sanitizePlainText(data.seo.seoTitle, 120)
        : existing?.seo?.seoTitle,
      seoDescription: data.seo?.seoDescription
        ? sanitizePlainText(data.seo.seoDescription, 240)
        : existing?.seo?.seoDescription,
      noIndex: data.seo?.noIndex ?? existing?.seo?.noIndex ?? false,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: auth.user.name,
  };

  const saved = await db.savePage(pageDoc);

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: wantsPublish ? "page.published" : "page.draft_saved",
    entityType: "page",
    entityId: saved.slug,
    summary: `${wantsPublish ? "Published" : "Saved draft"} section layout for page "${saved.title}" (${saved.draftSections.length} sections).`,
    ipAddress: extractClientIp(request.headers),
  });

  revalidatePublicContent(
    [CACHE_TAGS.pages],
    [cleanSlug === "home" ? "/" : `/${cleanSlug}`]
  );

  return NextResponse.json({ ok: true, page: saved });
}
