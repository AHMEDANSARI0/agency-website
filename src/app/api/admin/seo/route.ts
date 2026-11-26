import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RedirectRule } from "@/types/content";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { extractClientIp } from "@/lib/security/rate-limit";
import { isSafeRedirectSource, safeRedirectDestination, safeRedirectPathname } from "@/lib/security/redirect-safety";
import { sanitizePlainText, sanitizeSafeUrl } from "@/lib/validation/common";

const redirectPayloadSchema = z.object({
  id: z.string().max(80).optional(),
  sourcePath: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^\/[a-zA-Z0-9\-_/.]+$/, "Source path must start with '/' and contain safe URL characters."),
  destinationPath: z.string().trim().min(1).max(300),
  permanent: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

const analyticsConfigSchema = z.object({
  enabled: z.boolean(),
  ga4MeasurementId: z
    .string()
    .trim()
    .max(24)
    .refine(
      (v) => v === "" || /^G-[A-Z0-9]{4,16}$/i.test(v),
      "GA4 Measurement ID must be empty or match format G-XXXXXXXXXX."
    ),
  requireCookieConsent: z.boolean(),
});

const pageSeoUpdateSchema = z.object({
  pageSlug: z.string().trim().min(1).max(80),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(240).optional(),
  canonicalUrl: z.string().max(300).optional(),
  noIndex: z.boolean().optional(),
});

const putSeoSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("analytics"),
    analytics: analyticsConfigSchema,
  }),
  z.object({
    mode: z.literal("page_seo"),
    pageSeo: pageSeoUpdateSchema,
  }),
]);

export interface SeoAuditRow {
  entityType: "page" | "service" | "case_study" | "blog";
  title: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  noIndex: boolean;
  warnings: string[];
}

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  const [redirects, pages, services, caseStudies, blogPosts] =
    await Promise.all([
      db.listRedirects(),
      db.listPages(),
      db.listServices(true),
      db.listCaseStudies(true),
      db.listBlogPosts(true),
    ]);

  const auditRows: SeoAuditRow[] = [];

  for (const p of pages) {
    const effectiveTitle = p.seo.seoTitle || p.title;
    const effectiveDesc = p.seo.seoDescription || "";
    const warnings: string[] = [];
    if (!effectiveDesc) warnings.push("Missing custom SEO meta description");
    if (effectiveDesc && effectiveDesc.length < 50)
      warnings.push("Meta description is shorter than 50 characters");
    auditRows.push({
      entityType: "page",
      title: p.title,
      path: p.slug === "home" ? "/" : `/${p.slug}`,
      seoTitle: effectiveTitle,
      seoDescription: effectiveDesc,
      noIndex: Boolean(p.seo.noIndex),
      warnings,
    });
  }

  for (const s of services) {
    const effectiveTitle = s.seo.seoTitle || s.title;
    const effectiveDesc = s.seo.seoDescription || s.shortSummary;
    const warnings: string[] = [];
    if (effectiveTitle.length > 70)
      warnings.push("Title exceeds 70 characters");
    if (!effectiveDesc) warnings.push("Missing description");
    auditRows.push({
      entityType: "service",
      title: s.title,
      path: `/services/${s.slug}`,
      seoTitle: effectiveTitle,
      seoDescription: effectiveDesc,
      noIndex: Boolean(s.seo.noIndex),
      warnings,
    });
  }

  for (const c of caseStudies) {
    const effectiveTitle = c.seo.seoTitle || c.title;
    const effectiveDesc = c.seo.seoDescription || c.problemSummary;
    auditRows.push({
      entityType: "case_study",
      title: c.title,
      path: `/case-studies/${c.slug}`,
      seoTitle: effectiveTitle,
      seoDescription: effectiveDesc,
      noIndex: Boolean(c.seo.noIndex),
      warnings: effectiveDesc ? [] : ["Missing description"],
    });
  }

  for (const b of blogPosts) {
    const effectiveTitle = b.seo.seoTitle || b.title;
    const effectiveDesc = b.seo.seoDescription || b.excerpt;
    auditRows.push({
      entityType: "blog",
      title: b.title,
      path: `/blog/${b.slug}`,
      seoTitle: effectiveTitle,
      seoDescription: effectiveDesc,
      noIndex: Boolean(b.seo.noIndex),
      warnings: effectiveDesc ? [] : ["Missing excerpt/description"],
    });
  }

  return NextResponse.json({
    redirects,
    analytics: auth.settings.analytics,
    canManageAnalytics: hasPermission(
      auth.user.role,
      "settings:manage",
      auth.settings.rolePolicies
    ),
    auditRows,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = redirectPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid redirect rule." },
      { status: 400 }
    );
  }

  const sourcePath = parsed.data.sourcePath.replace(/\/+$/, "") || "/";
  if (!isSafeRedirectSource(sourcePath)) {
    return NextResponse.json({ error: "Source must be a safe local path, outside protected admin and API routes." }, { status: 400 });
  }
  const normalizedDest = safeRedirectDestination(parsed.data.destinationPath);
  if (!normalizedDest) {
    return NextResponse.json({ error: "Destination must be a safe local path, for example /services or /contact?from=old." }, { status: 400 });
  }
  const sourceKey = sourcePath.toLowerCase();
  const destKey = safeRedirectPathname(normalizedDest);
  if (destKey === sourceKey) {
    return NextResponse.json({ error: "Source and destination paths cannot be identical (redirect loop)." }, { status: 400 });
  }
  // Catch direct two-rule loops (case and query insensitive). Longer chains remain an operational concern.
  const existingRedirects = await db.listRedirects();
  const reverseLoop = existingRedirects.find((r) => r.isActive && isSafeRedirectSource(r.sourcePath) &&
    r.sourcePath.replace(/\/+$/, "").toLowerCase() === destKey && safeRedirectPathname(r.destinationPath) === sourceKey);
  if (reverseLoop) {
    return NextResponse.json({ error: `Redirect loop detected with existing rule ${reverseLoop.sourcePath} -> ${reverseLoop.destinationPath}.` }, { status: 400 });
  }

  const rule: RedirectRule = {
    id: parsed.data.id || `rdr_${randomBytes(6).toString("hex")}`,
    sourcePath,
    destinationPath: normalizedDest,
    permanent: parsed.data.permanent,
    isActive: parsed.data.isActive,
    createdAt: new Date().toISOString(),
  };

  const saved = await db.upsertRedirect(rule);

  revalidateAllPublicContent();

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "seo.redirect_saved",
    entityType: "redirect",
    entityId: saved.id,
    summary: `Configured ${saved.permanent ? "301/308" : "307"} redirect ${saved.sourcePath} -> ${saved.destinationPath}.`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, redirect: saved });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = putSeoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid SEO/Analytics payload." },
      { status: 400 }
    );
  }

  const ip = extractClientIp(request.headers);

  if (parsed.data.mode === "analytics") {
    if (
      !hasPermission(
        auth.user.role,
        "settings:manage",
        auth.settings.rolePolicies
      )
    ) {
      return NextResponse.json(
        { error: "Only Super Admins may modify global analytics scripts." },
        { status: 403 }
      );
    }

    const nextSettings = await db.saveSiteSettings({
      ...auth.settings,
      analytics: {
        enabled: parsed.data.analytics.enabled,
        ga4MeasurementId: parsed.data.analytics.ga4MeasurementId.toUpperCase(),
        requireCookieConsent: parsed.data.analytics.requireCookieConsent,
      },
    });

    revalidateAllPublicContent();

    await db.recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "seo.analytics_updated",
      entityType: "settings",
      summary: `Updated GA4 analytics (enabled=${nextSettings.analytics.enabled}, consent=${nextSettings.analytics.requireCookieConsent}).`,
      ipAddress: ip,
    });

    return NextResponse.json({
      ok: true,
      analytics: nextSettings.analytics,
    });
  }

  // page_seo update
  const { pageSlug, seoTitle, seoDescription, canonicalUrl, noIndex } =
    parsed.data.pageSeo;
  const page = await db.getPageBySlug(pageSlug);
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const savedPage = await db.savePage({
    ...page,
    seo: {
      ...page.seo,
      seoTitle: seoTitle ? sanitizePlainText(seoTitle, 120) : undefined,
      seoDescription: seoDescription
        ? sanitizePlainText(seoDescription, 240)
        : undefined,
      canonicalUrl: canonicalUrl ? sanitizeSafeUrl(canonicalUrl) ?? undefined : undefined,
      noIndex: noIndex ?? page.seo.noIndex ?? false,
    },
    updatedBy: auth.user.name,
  });

  revalidateAllPublicContent();

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "seo.page_updated",
    entityType: "page",
    entityId: savedPage.slug,
    summary: `Updated SEO metadata for page "${savedPage.title}" (noIndex=${Boolean(
      savedPage.seo.noIndex
    )}).`,
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true, page: savedPage });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiAuth(request, "seo:manage");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing redirect id." }, { status: 400 });
  }

  const deleted = await db.deleteRedirect(id);
  if (!deleted) {
    return NextResponse.json({ error: "Redirect rule not found." }, { status: 404 });
  }

  revalidateAllPublicContent();

  await db.recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "seo.redirect_deleted",
    entityType: "redirect",
    entityId: id,
    summary: `Deleted redirect rule (${id}).`,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
