import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  PublishStatus,
  ServiceItem,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import { canEditContentEntity, hasPermission } from "@/lib/auth/rbac";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import {
  sanitizePlainText,
  sanitizeSafeUrl,
  sanitizeSlug,
} from "@/lib/validation/common";

const PUBLISH_STATUSES: [PublishStatus, ...PublishStatus[]] = [
  "draft",
  "review",
  "published",
  "scheduled",
  "archived",
];

const seoSchema = z
  .object({
    seoTitle: z.string().max(120).optional(),
    seoDescription: z.string().max(240).optional(),
    noIndex: z.boolean().optional(),
  })
  .optional();

const blogPayloadSchema = z.object({
  entity: z.literal("blog"),
  id: z.string().max(80).optional(),
  slug: z.string().min(2).max(120),
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().min(10).max(400),
  contentMarkdown: z.string().trim().min(20).max(40000),
  category: z.string().trim().min(2).max(60),
  tags: z.array(z.string().max(40)).max(12).default([]),
  featuredImageUrl: z.string().max(400).nullable().optional(),
  featuredImageAlt: z.string().max(160).default(""),
  showTableOfContents: z.boolean().default(true),
  status: z.enum(PUBLISH_STATUSES),
  scheduledFor: z.string().max(64).nullable().optional(),
  seo: seoSchema,
});

const caseStudyPayloadSchema = z.object({
  entity: z.literal("case_study"),
  id: z.string().max(80).optional(),
  slug: z.string().min(2).max(120),
  title: z.string().trim().min(3).max(160),
  workType: z.enum([
    "verified_client",
    "internal_experiment",
    "concept_demo",
    "planned_project",
  ]),
  clientName: z.string().max(120).nullable().optional(),
  clientPermissionGranted: z.boolean(),
  industry: z.string().trim().min(2).max(80),
  businessType: z.string().trim().min(2).max(80),
  problemSummary: z.string().trim().min(10).max(600),
  manualProcessBefore: z.array(z.string().max(240)).min(1).max(10),
  proposedAutomation: z.string().trim().min(10).max(800),
  automatedWorkflowAfter: z.array(z.string().max(240)).min(1).max(10),
  technologiesUsed: z.array(z.string().max(60)).min(1).max(15),
  verifiedResults: z.array(z.string().max(240)).min(1).max(10),
  projectDuration: z.string().max(60).nullable().optional(),
  relatedServiceSlugs: z.array(z.string().max(80)).max(8).default([]),
  status: z.enum(PUBLISH_STATUSES),
  seo: seoSchema,
});

const servicePayloadSchema = z.object({
  entity: z.literal("service"),
  id: z.string().max(80).optional(),
  slug: z.string().min(2).max(120),
  title: z.string().trim().min(3).max(140),
  categorySlug: z.string().trim().min(2).max(80),
  categoryName: z.string().trim().min(2).max(80),
  isFlagshipPriority: z.boolean(),
  badgeLabel: z.string().trim().min(2).max(60),
  shortSummary: z.string().trim().min(10).max(400),
  problemStatement: z.string().trim().min(10).max(800),
  solutionOverview: z.string().trim().min(10).max(800),
  benefits: z.array(z.string().max(240)).min(1).max(10),
  ctaLabel: z.string().trim().min(2).max(60),
  ctaHref: z.string().trim().min(1).max(200),
  order: z.number().int().min(0).max(100),
  status: z.enum(PUBLISH_STATUSES),
  seo: seoSchema,
});

const faqPayloadSchema = z.object({
  entity: z.literal("faq"),
  id: z.string().max(80).optional(),
  question: z.string().trim().min(5).max(240),
  answer: z.string().trim().min(10).max(1500),
  category: z.string().trim().min(2).max(60),
  order: z.number().int().min(0).max(200),
  isPublished: z.boolean(),
});

const testimonialPayloadSchema = z.object({
  entity: z.literal("testimonial"),
  id: z.string().max(80).optional(),
  authorName: z.string().trim().min(2).max(80),
  authorRole: z.string().trim().min(2).max(80),
  companyName: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(60),
  quote: z.string().trim().min(12).max(800),
  isAuthorized: z.boolean(),
  isVerified: z.boolean(),
  isPublished: z.boolean(),
});

const teamPayloadSchema = z.object({
  entity: z.literal("team"),
  id: z.string().max(80).optional(),
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(100),
  isFounder: z.boolean(),
  bio: z.string().trim().min(10).max(1200),
  focusAreas: z.array(z.string().max(80)).min(1).max(10),
  regionsServed: z.array(z.string().max(60)).min(1).max(10),
  avatarUrl: z.string().max(400).nullable().optional(),
  linkedinUrl: z.string().max(400).nullable().optional(),
  order: z.number().int().min(0).max(100),
  isPublished: z.boolean(),
});

const cmsMutationSchema = z.discriminatedUnion("entity", [
  blogPayloadSchema,
  caseStudyPayloadSchema,
  servicePayloadSchema,
  faqPayloadSchema,
  testimonialPayloadSchema,
  teamPayloadSchema,
]);

function cleanAssetRef(raw?: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return /[<>'"\\]/.test(trimmed) ? null : trimmed;
  }
  return sanitizeSafeUrl(trimmed);
}

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "content:create_draft");
  if (!auth.ok) return auth.response;

  const canEditAny = hasPermission(
    auth.user.role,
    "content:edit_any",
    auth.settings.rolePolicies
  );

  const [blogPosts, caseStudies, services, faqs, testimonials, teamMembers] =
    await Promise.all([
      db.listBlogPosts(false),
      canEditAny ? db.listCaseStudies(false) : Promise.resolve([]),
      canEditAny ? db.listServices(false) : Promise.resolve([]),
      canEditAny ? db.listFaqs(false) : Promise.resolve([]),
      canEditAny ? db.listTestimonials(false) : Promise.resolve([]),
      canEditAny ? db.listTeamMembers(false) : Promise.resolve([]),
    ]);

  const visiblePosts = canEditAny
    ? blogPosts
    : blogPosts.filter((p) => p.authorId === auth.user.id);

  return NextResponse.json({
    blogPosts: visiblePosts,
    caseStudies,
    services,
    faqs,
    testimonials,
    teamMembers,
    permissions: {
      canEditAny,
      canPublish: hasPermission(
        auth.user.role,
        "content:publish",
        auth.settings.rolePolicies
      ),
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "content:create_draft");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = cmsMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid CMS payload." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const canEditAny = hasPermission(
    auth.user.role,
    "content:edit_any",
    auth.settings.rolePolicies
  );
  const canPublish = hasPermission(
    auth.user.role,
    "content:publish",
    auth.settings.rolePolicies
  );
  const ip = extractClientIp(request.headers);

  // 1. Blog Post (supports AUTHOR own-drafts + EDITOR/SUPER_ADMIN)
  if (data.entity === "blog") {
    const existing = data.id ? await db.getBlogPostById(data.id) : null;
    if (
      existing &&
      !canEditContentEntity(
        auth.user,
        existing.authorId,
        auth.settings.rolePolicies
      )
    ) {
      return NextResponse.json(
        { error: "Authors may only edit their own draft articles." },
        { status: 403 }
      );
    }

    if (
      (data.status === "published" || data.status === "scheduled") &&
      !canPublish
    ) {
      return NextResponse.json(
        {
          error:
            "Your role cannot publish directly. Save as Draft or Submit for Review.",
        },
        { status: 403 }
      );
    }

    const slug = sanitizeSlug(data.slug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid article slug." }, { status: 400 });
    }

    const words = data.contentMarkdown.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(words / 200));
    const now = new Date().toISOString();

    const revisions = existing?.revisions ? [...existing.revisions] : [];
    if (existing && existing.contentMarkdown !== data.contentMarkdown) {
      revisions.unshift({
        savedAt: now,
        savedBy: auth.user.name,
        title: existing.title,
        contentMarkdown: existing.contentMarkdown,
      });
    }

    const post: BlogPost = {
      id: existing?.id || `post_${randomBytes(6).toString("hex")}`,
      slug,
      title: sanitizePlainText(data.title, 160),
      excerpt: sanitizePlainText(data.excerpt, 400),
      contentMarkdown: data.contentMarkdown,
      category: sanitizePlainText(data.category, 60),
      tags: data.tags
        .map((t) => sanitizePlainText(t, 40))
        .filter(Boolean),
      authorId: existing?.authorId || auth.user.id,
      authorName: existing?.authorName || auth.user.name,
      featuredImageUrl: cleanAssetRef(data.featuredImageUrl),
      featuredImageAlt: sanitizePlainText(data.featuredImageAlt, 160),
      readingTimeMinutes,
      showTableOfContents: data.showTableOfContents,
      status: data.status,
      publishedAt:
        data.status === "published"
          ? existing?.publishedAt || now
          : null,
      scheduledFor: data.scheduledFor ?? null,
      revisions: revisions.slice(0, 15),
      seo: {
        seoTitle: data.seo?.seoTitle
          ? sanitizePlainText(data.seo.seoTitle, 120)
          : undefined,
        seoDescription: data.seo?.seoDescription
          ? sanitizePlainText(data.seo.seoDescription, 240)
          : undefined,
        noIndex: data.seo?.noIndex ?? false,
      },
      updatedAt: now,
    };

    const saved = await db.upsertBlogPost(post);
    revalidateAllPublicContent();
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: `blog.${saved.status}`,
      entityType: "blog",
      entityId: saved.id,
      summary: `Saved blog post "${saved.title}" (${saved.status}).`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true, item: saved });
  }

  // Remaining site-wide collections require content:edit_any
  if (!canEditAny) {
    return NextResponse.json(
      { error: "Insufficient permissions to modify global site collections." },
      { status: 403 }
    );
  }

  if (data.entity === "case_study") {
    if (
      data.workType === "verified_client" &&
      !data.clientPermissionGranted
    ) {
      return NextResponse.json(
        {
          error:
            "Verified Client Work requires explicit Client Permission Granted confirmation. Use Concept Demo or Internal Experiment otherwise.",
        },
        { status: 400 }
      );
    }
    if (data.status === "published" && !canPublish) {
      return NextResponse.json(
        { error: "Publishing case studies requires publish permission." },
        { status: 403 }
      );
    }

    const slug = sanitizeSlug(data.slug);
    const existingAll = await db.listCaseStudies(false);
    const existing = data.id
      ? existingAll.find((c) => c.id === data.id)
      : null;

    const item: CaseStudyItem = {
      id: existing?.id || `cs_${randomBytes(6).toString("hex")}`,
      slug,
      title: sanitizePlainText(data.title, 160),
      workType: data.workType,
      clientName: data.clientName
        ? sanitizePlainText(data.clientName, 120)
        : null,
      clientPermissionGranted: data.clientPermissionGranted,
      industry: sanitizePlainText(data.industry, 80),
      businessType: sanitizePlainText(data.businessType, 80),
      problemSummary: sanitizePlainText(data.problemSummary, 600),
      manualProcessBefore: data.manualProcessBefore
        .map((s) => sanitizePlainText(s, 240))
        .filter(Boolean),
      proposedAutomation: sanitizePlainText(data.proposedAutomation, 800),
      automatedWorkflowAfter: data.automatedWorkflowAfter
        .map((s) => sanitizePlainText(s, 240))
        .filter(Boolean),
      technologiesUsed: data.technologiesUsed
        .map((s) => sanitizePlainText(s, 60))
        .filter(Boolean),
      verifiedResults: data.verifiedResults
        .map((s) => sanitizePlainText(s, 240))
        .filter(Boolean),
      projectDuration: data.projectDuration
        ? sanitizePlainText(data.projectDuration, 60)
        : null,
      relatedServiceSlugs: data.relatedServiceSlugs,
      testimonialId: existing?.testimonialId ?? null,
      status: data.status,
      seo: data.seo ?? {},
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.upsertCaseStudy(item);
    revalidateAllPublicContent();
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "case_study.saved",
      entityType: "case_study",
      entityId: saved.id,
      summary: `Saved case study "${saved.title}" [${saved.workType}, ${saved.status}].`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true, item: saved });
  }

  if (data.entity === "service") {
    if (data.status === "published" && !canPublish) {
      return NextResponse.json(
        { error: "Publishing services requires publish permission." },
        { status: 403 }
      );
    }
    const existingAll = await db.listServices(false);
    const existing = data.id
      ? existingAll.find((s) => s.id === data.id)
      : null;

    const item: ServiceItem = {
      id: existing?.id || `svc_${randomBytes(6).toString("hex")}`,
      slug: sanitizeSlug(data.slug),
      title: sanitizePlainText(data.title, 140),
      categorySlug: sanitizeSlug(data.categorySlug),
      categoryName: sanitizePlainText(data.categoryName, 80),
      isFlagshipPriority: data.isFlagshipPriority,
      badgeLabel: sanitizePlainText(data.badgeLabel, 60),
      shortSummary: sanitizePlainText(data.shortSummary, 400),
      problemStatement: sanitizePlainText(data.problemStatement, 800),
      solutionOverview: sanitizePlainText(data.solutionOverview, 800),
      processSteps: existing?.processSteps ?? [
        {
          title: "Workflow Discovery",
          description: "Audit current bottlenecks and define deterministic rules.",
        },
        {
          title: "Implementation & Verification",
          description: "Deploy guardrailed automation with staging validation.",
        },
      ],
      benefits: data.benefits
        .map((b) => sanitizePlainText(b, 240))
        .filter(Boolean),
      useCases: existing?.useCases ?? [],
      faqs: existing?.faqs ?? [],
      ctaLabel: sanitizePlainText(data.ctaLabel, 60),
      ctaHref: sanitizePlainText(data.ctaHref, 200),
      status: data.status,
      order: data.order,
      seo: data.seo ?? {},
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.upsertService(item);
    revalidateAllPublicContent();
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "service.saved",
      entityType: "service",
      entityId: saved.id,
      summary: `Saved service "${saved.title}" (${saved.status}).`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true, item: saved });
  }

  if (data.entity === "faq") {
    if (data.isPublished && !canPublish) {
      return NextResponse.json(
        { error: "Publishing FAQs requires publish permission." },
        { status: 403 }
      );
    }
    const item: FaqItem = {
      id: data.id || `faq_${randomBytes(6).toString("hex")}`,
      question: sanitizePlainText(data.question, 240),
      answer: sanitizePlainText(data.answer, 1500),
      category: sanitizePlainText(data.category, 60),
      order: data.order,
      isPublished: data.isPublished,
    };
    const saved = await db.upsertFaq(item);
    revalidateAllPublicContent();
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "faq.saved",
      entityType: "faq",
      entityId: saved.id,
      summary: `Saved FAQ "${saved.question}".`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true, item: saved });
  }

  if (data.entity === "testimonial") {
    if (data.isPublished && !canPublish) {
      return NextResponse.json(
        { error: "Publishing testimonials requires publish permission." },
        { status: 403 }
      );
    }
    const item: TestimonialItem = {
      id: data.id || `tst_${randomBytes(6).toString("hex")}`,
      authorName: sanitizePlainText(data.authorName, 80),
      authorRole: sanitizePlainText(data.authorRole, 80),
      companyName: sanitizePlainText(data.companyName, 100),
      country: sanitizePlainText(data.country, 60),
      quote: sanitizePlainText(data.quote, 800),
      isAuthorized: data.isAuthorized,
      isVerified: data.isVerified,
      isPublished: data.isPublished,
      createdAt: new Date().toISOString(),
    };
    const saved = await db.upsertTestimonial(item);
    revalidateAllPublicContent();
    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "testimonial.saved",
      entityType: "testimonial",
      entityId: saved.id,
      summary: `Saved testimonial from ${saved.authorName} (${saved.companyName}) [authorized=${saved.isAuthorized}, verified=${saved.isVerified}, published=${saved.isPublished}].`,
      ipAddress: ip,
    });
    return NextResponse.json({ ok: true, item: saved });
  }

  // team
  if (data.isPublished && !canPublish) {
    return NextResponse.json(
      { error: "Publishing team profiles requires publish permission." },
      { status: 403 }
    );
  }
  const member: TeamMember = {
    id: data.id || `tm_${randomBytes(6).toString("hex")}`,
    name: sanitizePlainText(data.name, 80),
    role: sanitizePlainText(data.role, 100),
    isFounder: data.isFounder,
    bio: sanitizePlainText(data.bio, 1200),
    focusAreas: data.focusAreas
      .map((f) => sanitizePlainText(f, 80))
      .filter(Boolean),
    regionsServed: data.regionsServed
      .map((r) => sanitizePlainText(r, 60))
      .filter(Boolean),
    avatarUrl: cleanAssetRef(data.avatarUrl),
    linkedinUrl: cleanAssetRef(data.linkedinUrl),
    order: data.order,
    isPublished: data.isPublished,
  };
  const saved = await db.upsertTeamMember(member);
  revalidateAllPublicContent();
  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "team.saved",
    entityType: "team",
    entityId: saved.id,
    summary: `Saved team profile "${saved.name}".`,
    ipAddress: ip,
  });
  return NextResponse.json({ ok: true, item: saved });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiAuth(request, "content:edit_any");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id");

  if (!entity || !id) {
    return NextResponse.json(
      { error: "Both entity and id query parameters are required." },
      { status: 400 }
    );
  }

  let deleted = false;
  switch (entity) {
    case "blog":
      deleted = await db.deleteBlogPost(id);
      break;
    case "case_study":
      deleted = await db.deleteCaseStudy(id);
      break;
    case "service":
      deleted = await db.deleteService(id);
      break;
    case "faq":
      deleted = await db.deleteFaq(id);
      break;
    case "testimonial":
      deleted = await db.deleteTestimonial(id);
      break;
    case "team":
      deleted = await db.deleteTeamMember(id);
      break;
    default:
      return NextResponse.json({ error: "Unknown CMS entity." }, { status: 400 });
  }

  if (!deleted) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  revalidateAllPublicContent();

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: `${entity}.deleted`,
    entityType: entity,
    entityId: id,
    summary: `Deleted ${entity} item (${id}).`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
