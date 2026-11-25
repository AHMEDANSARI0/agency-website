import { db } from "@/lib/database";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { STATIC_ROUTE_SEO_DEFAULTS } from "@/lib/seo/static-route-metadata";
import { buildHomeAbsoluteTitle, stripTrailingBrand } from "@/lib/seo/title";
import type { SeoMetadataFields } from "@/types/content";

export type SeoAuditEntityKind = "page" | "service" | "case_study" | "blog_post";
export type SeoIssueSeverity = "critical" | "warning" | "pass";

export interface SeoPageIssue {
  id: string;
  severity: "critical" | "warning";
  field:
    | "title"
    | "description"
    | "h1"
    | "canonical"
    | "openGraph"
    | "schema"
    | "robots"
    | "placeholder"
    | "imageAlt";
  message: string;
  recommendation: string;
}

export interface AuditedRouteSeoRecord {
  key: string;
  entityKind: SeoAuditEntityKind;
  entitySlug: string;
  entityId?: string;
  routePath: string;
  groupLabel: "Core Pages" | "Services" | "Case Studies" | "Blog & Guides" | "Legal";
  pageLabel: string;
  score: number;
  status: SeoIssueSeverity;
  resolvedTitle: string;
  titleLength: number;
  resolvedDescription: string;
  descriptionLength: number;
  primaryH1: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterCard: string;
  noIndex: boolean;
  inSitemap: boolean;
  jsonLdTypes: string[];
  hasCustomOverride: boolean;
  rawSeo: SeoMetadataFields;
  suggestedSeoTitle: string;
  suggestedSeoDescription: string;
  issues: SeoPageIssue[];
}

export interface SiteSeoAuditSummary {
  generatedAt: string;
  canonicalBaseUrl: string;
  isLocalhostBaseUrl: boolean;
  overallScore: number;
  totalRoutes: number;
  healthyRoutes: number;
  warningRoutes: number;
  criticalRoutes: number;
  noIndexRoutes: number;
  duplicateTitleGroups: { title: string; paths: string[] }[];
  duplicateDescriptionGroups: { description: string; paths: string[] }[];
  topAlerts: {
    severity: "critical" | "warning";
    routePath: string;
    pageLabel: string;
    message: string;
  }[];
  routes: AuditedRouteSeoRecord[];
}

const RAW_TOKEN_PATTERN = /\{\{[A-Z0-9_]+\}\}/;

function smartTrim(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 45 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:\-–—]+$/, "")}.`;
}

function hasDuplicateBrand(fullTitle: string, brand: string): boolean {
  const safe = brand.trim() || "OmniFlow";
  const matches =
    fullTitle.match(
      new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    ) ?? [];
  return matches.length > 1;
}

export async function runFullSiteSeoInspection(): Promise<SiteSeoAuditSummary> {
  const [settings, pages, services, caseStudies, blogPosts] = await Promise.all([
    db.getSiteSettings(),
    db.listPages(),
    db.listServices(true),
    db.listCaseStudies(true),
    db.listBlogPosts(true),
  ]);

  const baseUrl = getCanonicalSiteUrl();
  const isLocalhostBaseUrl = /localhost|127\.0\.0\.1/i.test(baseUrl);
  const brand = settings.companyName || "OmniFlow";
  const pageBySlug = new Map(
    pages.map((p) => [p.slug.toLowerCase(), p] as const)
  );

  const records: AuditedRouteSeoRecord[] = [];

  // 1. HOME PAGE (/)
  {
    const homeDoc = pageBySlug.get("home");
    const heroSection = (homeDoc?.sections ?? []).find((s) => s.type === "hero");
    const resolvedTitle = buildHomeAbsoluteTitle(
      homeDoc?.seo?.seoTitle,
      brand,
      settings.positioning
    );
    const resolvedDescription =
      homeDoc?.seo?.seoDescription?.trim() ||
      "AI workflows that answer every lead, update your CRM, and support US, UK, and Canadian service teams with human approval gates.";
    const canonicalUrl = homeDoc?.seo?.canonicalUrl?.trim() || baseUrl;
    const ogTitle = homeDoc?.seo?.ogTitle?.trim() || resolvedTitle;
    const ogDescription =
      homeDoc?.seo?.ogDescription?.trim() || resolvedDescription;
    const ogImageUrl =
      homeDoc?.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;
    const noIndex = Boolean(homeDoc?.seo?.noIndex);

    records.push({
      key: "page:home",
      entityKind: "page",
      entitySlug: "home",
      entityId: homeDoc?.id,
      routePath: "/",
      groupLabel: "Core Pages",
      pageLabel: "Home Page",
      score: 100,
      status: "pass",
      resolvedTitle,
      titleLength: resolvedTitle.length,
      resolvedDescription,
      descriptionLength: resolvedDescription.length,
      primaryH1:
        heroSection?.title?.trim() ||
        "Automate the work. Accelerate the business.",
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      twitterCard: "summary_large_image",
      noIndex,
      inSitemap: !noIndex,
      jsonLdTypes: ["Organization", "WebSite"],
      hasCustomOverride: Boolean(
        homeDoc?.seo?.seoTitle || homeDoc?.seo?.seoDescription
      ),
      rawSeo: homeDoc?.seo ?? {},
      suggestedSeoTitle: stripTrailingBrand(resolvedTitle, brand),
      suggestedSeoDescription: smartTrim(resolvedDescription, 155),
      issues: [],
    });
  }

  // 2. ALL 15 STATIC INNER ROUTES
  for (const [slug, def] of Object.entries(STATIC_ROUTE_SEO_DEFAULTS)) {
    const doc = pageBySlug.get(slug.toLowerCase());
    const rawTitle = doc?.seo?.seoTitle?.trim() || def.defaultTitle;
    const cleanChild = stripTrailingBrand(rawTitle, brand);
    const resolvedTitle = `${cleanChild} | ${brand}`;
    const resolvedDescription =
      doc?.seo?.seoDescription?.trim() || def.defaultDescription;
    const rawCanon = doc?.seo?.canonicalUrl?.trim();
    const canonicalUrl = rawCanon
      ? rawCanon.startsWith("http")
        ? rawCanon
        : `${baseUrl}${rawCanon.startsWith("/") ? "" : "/"}${rawCanon}`
      : `${baseUrl}${def.path}`;
    const ogTitle = doc?.seo?.ogTitle?.trim() || resolvedTitle;
    const ogDescription =
      doc?.seo?.ogDescription?.trim() || resolvedDescription;
    const ogImageUrl =
      doc?.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;
    const noIndex = Boolean(doc?.seo?.noIndex);
    const isLegal =
      slug === "privacy-policy" ||
      slug === "terms-of-service" ||
      slug === "cookie-policy";

    records.push({
      key: `page:${slug}`,
      entityKind: "page",
      entitySlug: slug,
      entityId: doc?.id,
      routePath: def.path,
      groupLabel: isLegal ? "Legal" : "Core Pages",
      pageLabel: def.label,
      score: 100,
      status: "pass",
      resolvedTitle,
      titleLength: resolvedTitle.length,
      resolvedDescription,
      descriptionLength: resolvedDescription.length,
      primaryH1: def.primaryH1,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      twitterCard: "summary_large_image",
      noIndex,
      inSitemap: !noIndex,
      jsonLdTypes: def.jsonLdTypes,
      hasCustomOverride: Boolean(
        doc?.seo?.seoTitle || doc?.seo?.seoDescription
      ),
      rawSeo: doc?.seo ?? {},
      suggestedSeoTitle: smartTrim(cleanChild, 46),
      suggestedSeoDescription: smartTrim(resolvedDescription, 155),
      issues: [],
    });
  }

  // 3. ALL PUBLISHED SERVICE DETAIL PAGES (/services/[slug])
  for (const svc of services) {
    const cleanChild = stripTrailingBrand(
      svc.seo?.seoTitle?.trim() || svc.title,
      brand
    );
    const resolvedTitle = `${cleanChild} | ${brand}`;
    const resolvedDescription =
      svc.seo?.seoDescription?.trim() || svc.shortSummary;
    const routePath = `/services/${svc.slug}`;
    const canonicalUrl =
      svc.seo?.canonicalUrl?.trim() || `${baseUrl}${routePath}`;
    const ogTitle = svc.seo?.ogTitle?.trim() || resolvedTitle;
    const ogDescription =
      svc.seo?.ogDescription?.trim() || resolvedDescription;
    const ogImageUrl =
      svc.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;
    const noIndex = Boolean(svc.seo?.noIndex);

    records.push({
      key: `service:${svc.slug}`,
      entityKind: "service",
      entitySlug: svc.slug,
      entityId: svc.id,
      routePath,
      groupLabel: "Services",
      pageLabel: svc.title,
      score: 100,
      status: "pass",
      resolvedTitle,
      titleLength: resolvedTitle.length,
      resolvedDescription,
      descriptionLength: resolvedDescription.length,
      primaryH1: svc.title,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      twitterCard: "summary_large_image",
      noIndex,
      inSitemap: !noIndex,
      jsonLdTypes: [
        "Organization",
        "Service",
        "BreadcrumbList",
        ...(svc.faqs?.length ? ["FAQPage"] : []),
      ],
      hasCustomOverride: Boolean(
        svc.seo?.seoTitle || svc.seo?.seoDescription
      ),
      rawSeo: svc.seo ?? {},
      suggestedSeoTitle: smartTrim(cleanChild, 46),
      suggestedSeoDescription: smartTrim(svc.shortSummary, 155),
      issues: [],
    });
  }

  // 4. ALL PUBLISHED CASE STUDIES (/case-studies/[slug])
  for (const cs of caseStudies) {
    const cleanChild = stripTrailingBrand(
      cs.seo?.seoTitle?.trim() || cs.title,
      brand
    );
    const resolvedTitle = `${cleanChild} | ${brand}`;
    const resolvedDescription =
      cs.seo?.seoDescription?.trim() || cs.problemSummary;
    const routePath = `/case-studies/${cs.slug}`;
    const canonicalUrl =
      cs.seo?.canonicalUrl?.trim() || `${baseUrl}${routePath}`;
    const ogTitle = cs.seo?.ogTitle?.trim() || resolvedTitle;
    const ogDescription =
      cs.seo?.ogDescription?.trim() || resolvedDescription;
    const ogImageUrl =
      cs.seo?.ogImageUrl?.trim() || `${baseUrl}/opengraph-image`;
    const noIndex = Boolean(cs.seo?.noIndex);

    records.push({
      key: `case_study:${cs.slug}`,
      entityKind: "case_study",
      entitySlug: cs.slug,
      entityId: cs.id,
      routePath,
      groupLabel: "Case Studies",
      pageLabel: cs.title,
      score: 100,
      status: "pass",
      resolvedTitle,
      titleLength: resolvedTitle.length,
      resolvedDescription,
      descriptionLength: resolvedDescription.length,
      primaryH1: cs.title,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      twitterCard: "summary_large_image",
      noIndex,
      inSitemap: !noIndex,
      jsonLdTypes: ["Organization", "Article", "BreadcrumbList"],
      hasCustomOverride: Boolean(cs.seo?.seoTitle || cs.seo?.seoDescription),
      rawSeo: cs.seo ?? {},
      suggestedSeoTitle: smartTrim(cleanChild, 46),
      suggestedSeoDescription: smartTrim(cs.problemSummary, 155),
      issues: [],
    });
  }

  // 5. ALL PUBLISHED BLOG POSTS (/blog/[slug])
  for (const post of blogPosts) {
    const cleanChild = stripTrailingBrand(
      post.seo?.seoTitle?.trim() || post.title,
      brand
    );
    const resolvedTitle = `${cleanChild} | ${brand}`;
    const resolvedDescription =
      post.seo?.seoDescription?.trim() || post.excerpt;
    const routePath = `/blog/${post.slug}`;
    const canonicalUrl =
      post.seo?.canonicalUrl?.trim() || `${baseUrl}${routePath}`;
    const ogTitle = post.seo?.ogTitle?.trim() || resolvedTitle;
    const ogDescription =
      post.seo?.ogDescription?.trim() || resolvedDescription;
    const ogImageUrl =
      post.seo?.ogImageUrl?.trim() ||
      post.featuredImageUrl ||
      `${baseUrl}/opengraph-image`;
    const noIndex = Boolean(post.seo?.noIndex);

    const initialIssues: SeoPageIssue[] = [];
    if (post.featuredImageUrl && !post.featuredImageAlt?.trim()) {
      initialIssues.push({
        id: "missing_featured_alt",
        severity: "warning",
        field: "imageAlt",
        message: "Featured article image is missing descriptive alt text.",
        recommendation:
          "Add descriptive featuredImageAlt in Content CMS -> Blog for image search & screen-reader accessibility.",
      });
    }

    records.push({
      key: `blog_post:${post.slug}`,
      entityKind: "blog_post",
      entitySlug: post.slug,
      entityId: post.id,
      routePath,
      groupLabel: "Blog & Guides",
      pageLabel: post.title,
      score: 100,
      status: "pass",
      resolvedTitle,
      titleLength: resolvedTitle.length,
      resolvedDescription,
      descriptionLength: resolvedDescription.length,
      primaryH1: post.title,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      twitterCard: "summary_large_image",
      noIndex,
      inSitemap: !noIndex,
      jsonLdTypes: ["Organization", "Article", "BreadcrumbList"],
      hasCustomOverride: Boolean(
        post.seo?.seoTitle || post.seo?.seoDescription
      ),
      rawSeo: post.seo ?? {},
      suggestedSeoTitle: smartTrim(cleanChild, 46),
      suggestedSeoDescription: smartTrim(post.excerpt, 155),
      issues: initialIssues,
    });
  }

  // CROSS-SITE DUPLICATE TITLE & DESCRIPTION DETECTION
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();

  for (const rec of records) {
    const normTitle = rec.resolvedTitle.trim().toLowerCase();
    if (normTitle) {
      const list = titleMap.get(normTitle) ?? [];
      list.push(rec.routePath);
      titleMap.set(normTitle, list);
    }
    const normDesc = rec.resolvedDescription.trim().toLowerCase();
    if (normDesc) {
      const list = descMap.get(normDesc) ?? [];
      list.push(rec.routePath);
      descMap.set(normDesc, list);
    }
  }

  const duplicateTitleGroups = Array.from(titleMap.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([title, paths]) => ({ title, paths }));

  const duplicateDescriptionGroups = Array.from(descMap.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([description, paths]) => ({ description, paths }));

  // EVALUATE PER-PAGE RULES & SCORE (0 - 100)
  for (const rec of records) {
    const issues = [...rec.issues];

    // 1. Title rules
    if (!rec.resolvedTitle.trim()) {
      issues.push({
        id: "missing_title",
        severity: "critical",
        field: "title",
        message: "Missing <title> tag.",
        recommendation: "Set a clear 35–60 character SEO title.",
      });
    } else {
      if (rec.titleLength < 24) {
        issues.push({
          id: "short_title",
          severity: "warning",
          field: "title",
          message: `Title is very short (${rec.titleLength} chars).`,
          recommendation:
            "Expand title to 35–60 characters with primary service keywords.",
        });
      } else if (rec.titleLength > 68) {
        issues.push({
          id: "long_title",
          severity: "warning",
          field: "title",
          message: `Title exceeds Google SERP width (${rec.titleLength} chars > 68).`,
          recommendation:
            "Shorten SEO Title to ~45–58 characters so Google does not truncate it.",
        });
      }

      if (hasDuplicateBrand(rec.resolvedTitle, brand)) {
        issues.push({
          id: "duplicate_brand_in_title",
          severity: "warning",
          field: "title",
          message: `Brand name "${brand}" appears more than once in title.`,
          recommendation:
            "Omit trailing '| OmniFlow' inside the child SEO Title; Next.js appends it automatically.",
        });
      }

      const dupPaths =
        titleMap.get(rec.resolvedTitle.trim().toLowerCase()) ?? [];
      if (dupPaths.length > 1) {
        issues.push({
          id: "duplicate_title_across_pages",
          severity: "critical",
          field: "title",
          message: `Duplicate <title> shared with ${dupPaths.filter((p) => p !== rec.routePath).join(", ")}.`,
          recommendation:
            "Give each indexable URL a unique <title> targeting distinct search intent.",
        });
      }
    }

    // 2. Meta description rules
    if (!rec.resolvedDescription.trim()) {
      issues.push({
        id: "missing_description",
        severity: "critical",
        field: "description",
        message: "Missing meta description.",
        recommendation:
          "Write a clear 110–160 character summary explaining the buyer outcome.",
      });
    } else {
      if (rec.descriptionLength < 70) {
        issues.push({
          id: "short_description",
          severity: "warning",
          field: "description",
          message: `Meta description is thin (${rec.descriptionLength} chars < 70).`,
          recommendation:
            "Aim for 110–160 characters to maximize Google SERP click-through rate.",
        });
      } else if (rec.descriptionLength > 170) {
        issues.push({
          id: "long_description",
          severity: "warning",
          field: "description",
          message: `Meta description may truncate on SERPs (${rec.descriptionLength} chars > 170).`,
          recommendation:
            "Trim meta description to 120–160 characters (or click 'Apply Suggested Trim').",
        });
      }

      const dupDescPaths =
        descMap.get(rec.resolvedDescription.trim().toLowerCase()) ?? [];
      if (dupDescPaths.length > 1) {
        issues.push({
          id: "duplicate_description_across_pages",
          severity: "critical",
          field: "description",
          message: `Duplicate meta description shared with ${dupDescPaths.filter((p) => p !== rec.routePath).join(", ")}.`,
          recommendation:
            "Customize meta description so every page presents distinct snippet copy.",
        });
      }
    }

    // 3. H1 check
    if (!rec.primaryH1.trim()) {
      issues.push({
        id: "missing_h1",
        severity: "critical",
        field: "h1",
        message: "Page has no primary H1 heading.",
        recommendation: "Ensure exactly one descriptive H1 headline is present.",
      });
    }

    // 4. Accidental noindex on non-legal routes
    if (rec.noIndex && rec.groupLabel !== "Legal") {
      issues.push({
        id: "commercial_page_noindex",
        severity: "critical",
        field: "robots",
        message: "Page is marked noindex and excluded from Google & sitemap.xml.",
        recommendation:
          "Disable noindex unless you intentionally want to hide this page from search engines.",
      });
    }

    // 5. Unfilled {{PLACEHOLDER}} token leak check
    if (
      RAW_TOKEN_PATTERN.test(rec.resolvedTitle) ||
      RAW_TOKEN_PATTERN.test(rec.resolvedDescription) ||
      RAW_TOKEN_PATTERN.test(rec.primaryH1)
    ) {
      issues.push({
        id: "raw_placeholder_in_metadata",
        severity: "critical",
        field: "placeholder",
        message:
          "Unfilled {{PLACEHOLDER}} token detected inside SEO title, description, or H1.",
        recommendation:
          "Replace placeholder token in inline SEO editor or Admin Settings before launch.",
      });
    }

    // 6. OpenGraph completeness
    if (!rec.ogImageUrl.trim()) {
      issues.push({
        id: "missing_og_image",
        severity: "warning",
        field: "openGraph",
        message: "Missing Open Graph social share image.",
        recommendation:
          "Set ogImageUrl or keep default /opengraph-image active.",
      });
    }

    // Compute score
    let penalty = 0;
    for (const iss of issues) {
      penalty += iss.severity === "critical" ? 28 : 10;
    }
    rec.issues = issues;
    rec.score = Math.max(0, 100 - penalty);
    rec.status = issues.some((i) => i.severity === "critical")
      ? "critical"
      : issues.length > 0
        ? "warning"
        : "pass";
  }

  const criticalRoutes = records.filter((r) => r.status === "critical").length;
  const warningRoutes = records.filter((r) => r.status === "warning").length;
  const healthyRoutes = records.filter((r) => r.status === "pass").length;
  const noIndexRoutes = records.filter((r) => r.noIndex).length;
  const overallScore =
    records.length > 0
      ? Math.round(
          records.reduce((acc, r) => acc + r.score, 0) / records.length
        )
      : 100;

  const topAlerts: SiteSeoAuditSummary["topAlerts"] = [];
  for (const rec of records) {
    for (const iss of rec.issues) {
      if (iss.severity === "critical" || topAlerts.length < 10) {
        topAlerts.push({
          severity: iss.severity,
          routePath: rec.routePath,
          pageLabel: rec.pageLabel,
          message: iss.message,
        });
      }
    }
  }
  topAlerts.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1
  );

  return {
    generatedAt: new Date().toISOString(),
    canonicalBaseUrl: baseUrl,
    isLocalhostBaseUrl,
    overallScore,
    totalRoutes: records.length,
    healthyRoutes,
    warningRoutes,
    criticalRoutes,
    noIndexRoutes,
    duplicateTitleGroups,
    duplicateDescriptionGroups,
    topAlerts: topAlerts.slice(0, 12),
    routes: records,
  };
}
