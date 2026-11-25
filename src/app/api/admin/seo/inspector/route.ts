import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { CACHE_TAGS, revalidatePublicContent } from "@/lib/cache/public-cache";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { sanitizePlainText, sanitizeSlug } from "@/lib/validation/common";
import { STATIC_ROUTE_SEO_DEFAULTS } from "@/lib/seo/static-route-metadata";
import { runFullSiteSeoInspection } from "@/features/seo/site-seo-inspector";
import type { PageDocument, SeoMetadataFields } from "@/types/content";

export const dynamic = "force-dynamic";

const patchSeoSchema = z.object({
  entityKind: z.enum(["page", "service", "case_study", "blog_post"]),
  entitySlug: z.string().trim().min(1).max(120),
  seo: z.object({
    seoTitle: z.string().max(120).optional(),
    seoDescription: z.string().max(240).optional(),
    canonicalUrl: z.string().max(240).optional(),
    ogTitle: z.string().max(120).optional(),
    ogDescription: z.string().max(240).optional(),
    ogImageUrl: z.string().max(300).optional(),
    noIndex: z.boolean().optional(),
  }),
});

function sanitizeSeoInput(raw: z.infer<typeof patchSeoSchema>["seo"]): SeoMetadataFields {
  return {
    seoTitle:
      typeof raw.seoTitle === "string"
        ? sanitizePlainText(raw.seoTitle, 120)
        : undefined,
    seoDescription:
      typeof raw.seoDescription === "string"
        ? sanitizePlainText(raw.seoDescription, 240)
        : undefined,
    canonicalUrl:
      typeof raw.canonicalUrl === "string"
        ? sanitizePlainText(raw.canonicalUrl, 240)
        : undefined,
    ogTitle:
      typeof raw.ogTitle === "string"
        ? sanitizePlainText(raw.ogTitle, 120)
        : undefined,
    ogDescription:
      typeof raw.ogDescription === "string"
        ? sanitizePlainText(raw.ogDescription, 240)
        : undefined,
    ogImageUrl:
      typeof raw.ogImageUrl === "string"
        ? sanitizePlainText(raw.ogImageUrl, 300)
        : undefined,
    noIndex: Boolean(raw.noIndex),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  const audit = await runFullSiteSeoInspection();
  return NextResponse.json(audit, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = patchSeoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { entityKind, entitySlug } = parsed.data;
  const cleanSlug =
    entitySlug === "home" ? "home" : sanitizeSlug(entitySlug);
  if (!cleanSlug) {
    return NextResponse.json({ error: "Invalid route slug." }, { status: 400 });
  }

  const nextSeo = sanitizeSeoInput(parsed.data.seo);
  let targetRoutePath = "/";

  if (entityKind === "page") {
    const existing = await db.getPageBySlug(cleanSlug);
    const routeDefault = STATIC_ROUTE_SEO_DEFAULTS[cleanSlug];
    targetRoutePath =
      cleanSlug === "home" ? "/" : routeDefault?.path ?? `/${cleanSlug}`;

    const doc: PageDocument = existing
      ? {
          ...existing,
          seo: nextSeo,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.user.name,
        }
      : {
          id: `page_${randomBytes(6).toString("hex")}`,
          slug: cleanSlug,
          title: routeDefault?.label ?? cleanSlug,
          status: "published",
          scheduledFor: null,
          sections: [
            {
              id: `sec_${cleanSlug}_main`,
              type: "rich_text",
              title: routeDefault?.primaryH1 ?? cleanSlug,
              isVisible: true,
              order: 1,
              config: {},
            },
          ],
          draftSections: [
            {
              id: `sec_${cleanSlug}_main`,
              type: "rich_text",
              title: routeDefault?.primaryH1 ?? cleanSlug,
              isVisible: true,
              order: 1,
              config: {},
            },
          ],
          seo: nextSeo,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.user.name,
        };

    await db.savePage(doc);
    revalidatePublicContent([CACHE_TAGS.pages], [targetRoutePath, "/sitemap.xml"]);
  } else if (entityKind === "service") {
    const existing = await db.getServiceBySlug(cleanSlug);
    if (!existing) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }
    targetRoutePath = `/services/${existing.slug}`;
    await db.upsertService({
      ...existing,
      seo: nextSeo,
      updatedAt: new Date().toISOString(),
    });
    revalidatePublicContent(
      [CACHE_TAGS.services],
      [targetRoutePath, "/services", "/sitemap.xml"]
    );
  } else if (entityKind === "case_study") {
    const existing = await db.getCaseStudyBySlug(cleanSlug, false);
    if (!existing) {
      return NextResponse.json(
        { error: "Case study not found." },
        { status: 404 }
      );
    }
    targetRoutePath = `/case-studies/${existing.slug}`;
    await db.upsertCaseStudy({
      ...existing,
      seo: nextSeo,
      updatedAt: new Date().toISOString(),
    });
    revalidatePublicContent(
      [CACHE_TAGS.caseStudies],
      [targetRoutePath, "/case-studies", "/sitemap.xml"]
    );
  } else if (entityKind === "blog_post") {
    const existing = await db.getBlogPostBySlug(cleanSlug, false);
    if (!existing) {
      return NextResponse.json(
        { error: "Blog post not found." },
        { status: 404 }
      );
    }
    targetRoutePath = `/blog/${existing.slug}`;
    await db.upsertBlogPost({
      ...existing,
      seo: nextSeo,
      updatedAt: new Date().toISOString(),
    });
    revalidatePublicContent(
      [CACHE_TAGS.blog],
      [targetRoutePath, "/blog", "/sitemap.xml"]
    );
  }

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "seo.metadata_updated",
    entityType: entityKind,
    entityId: cleanSlug,
    summary: `Updated live SEO metadata for ${targetRoutePath} (noindex=${Boolean(nextSeo.noIndex)}).`,
    ipAddress: extractClientIp(request.headers),
  });

  const updatedAudit = await runFullSiteSeoInspection();
  return NextResponse.json({
    ok: true,
    routePath: targetRoutePath,
    audit: updatedAudit,
  });
}
