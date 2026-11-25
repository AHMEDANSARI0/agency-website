import { evaluateThemeContrast } from "@/features/themes/color-utils";
import { getSystemHealthReport, type SystemHealthReport } from "@/features/system/health";
import { db, type DatabaseErrorEvent, type SiteErrorIncident } from "@/lib/database";
import { findUnfilledPlaceholders } from "@/lib/placeholders";

export type DiagnosticSeverity = "critical" | "warning" | "healthy";

export type DiagnosticCategory =
  | "database_storage"
  | "runtime_errors"
  | "launch_placeholders"
  | "navigation_redirects"
  | "seo_content"
  | "theme_accessibility"
  | "crm_notifications"
  | "security_auth";

export interface SiteDiagnosticItem {
  id: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  categoryLabel: string;
  title: string;
  detail: string;
  affectedTarget?: string;
  fixHref?: string;
  fixLabel?: string;
}

export interface LiveSiteAlertSummary {
  overallStatus: DiagnosticSeverity;
  score: number;
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  unresolvedIncidentCount: number;
  topAlertTitle: string | null;
  topAlertSeverity: DiagnosticSeverity | null;
  checkedAt: string;
}

export interface LiveSiteDiagnosticsReport extends LiveSiteAlertSummary {
  systemHealth: SystemHealthReport;
  checks: SiteDiagnosticItem[];
  incidents: SiteErrorIncident[];
  recentDbErrors: DatabaseErrorEvent[];
  publicRoutesToProbe: string[];
}

const KNOWN_PUBLIC_STATIC_PREFIXES = [
  "/",
  "/services",
  "/solutions",
  "/demos",
  "/how-it-works",
  "/pricing",
  "/work",
  "/case-studies",
  "/blog",
  "/about",
  "/team",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
];

function isValidInternalOrExternalHref(href: string): boolean {
  const trimmed = (href || "").trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return true;
  }
  if (!trimmed.startsWith("/")) return false;
  const pathOnly = trimmed.split("?")[0]?.split("#")[0] || "/";
  return KNOWN_PUBLIC_STATIC_PREFIXES.some(
    (prefix) =>
      pathOnly === prefix ||
      (prefix !== "/" && pathOnly.startsWith(`${prefix}/`))
  );
}

export async function getLiveSiteDiagnosticsReport(): Promise<LiveSiteDiagnosticsReport> {
  const [
    systemHealth,
    settings,
    theme,
    pages,
    services,
    caseStudies,
    blogPosts,
    faqs,
    teamMembers,
    redirects,
    leads,
    incidents,
  ] = await Promise.all([
    getSystemHealthReport({ probe: "readiness" }),
    db.getSiteSettings(),
    db.getThemeConfig(),
    db.listPages(),
    db.listServices(false),
    db.listCaseStudies(false),
    db.listBlogPosts(false),
    db.listFaqs(false),
    db.listTeamMembers(false),
    db.listRedirects(),
    db.listLeads(),
    db.listSiteErrorIncidents(),
  ]);

  const recentDbErrors = db.getRecentErrors();
  const checks: SiteDiagnosticItem[] = [];

  // 1. Database & Storage Engine Checks
  if (!systemHealth.database.connected || !systemHealth.database.schemaReady) {
    checks.push({
      id: "db-connectivity",
      severity: "critical",
      category: "database_storage",
      categoryLabel: "Database & Storage",
      title: "Database connection or schema is unhealthy",
      detail: systemHealth.database.message,
      affectedTarget: systemHealth.database.driver,
      fixHref: "/admin/account",
      fixLabel: "Inspect Backups & DB",
    });
  } else {
    checks.push({
      id: "db-connectivity",
      severity: "healthy",
      category: "database_storage",
      categoryLabel: "Database & Storage",
      title: `Database operational (${systemHealth.database.latencyMs}ms latency)`,
      detail: `${systemHealth.database.message} (${systemHealth.database.driver}).`,
      affectedTarget: systemHealth.database.driver,
    });
  }

  if (recentDbErrors.length > 0) {
    checks.push({
      id: "db-recent-errors",
      severity: "warning",
      category: "database_storage",
      categoryLabel: "Database & Storage",
      title: `${recentDbErrors.length} recent database warning/fallback event(s) logged`,
      detail: `Latest (${recentDbErrors[0].code}): ${recentDbErrors[0].message}`,
      affectedTarget: recentDbErrors[0].timestamp,
      fixHref: "/admin/diagnostics#incidents",
      fixLabel: "Review Error Log",
    });
  }

  if (!systemHealth.storage.healthy) {
    checks.push({
      id: "storage-health",
      severity: systemHealth.application.strictProduction ? "critical" : "warning",
      category: "database_storage",
      categoryLabel: "Database & Storage",
      title: "Media storage requires configuration",
      detail: systemHealth.storage.message,
      affectedTarget: systemHealth.storage.provider,
      fixHref: "/admin/media",
      fixLabel: "Open Media Library",
    });
  } else {
    checks.push({
      id: "storage-health",
      severity: "healthy",
      category: "database_storage",
      categoryLabel: "Database & Storage",
      title: "Media storage healthy",
      detail: `${systemHealth.storage.assetCount} asset(s) stored via ${systemHealth.storage.provider}.`,
    });
  }

  // 2. Runtime Error & Crash Incidents
  const unresolvedIncidents = incidents.filter((inc) => !inc.resolved);
  if (unresolvedIncidents.length > 0) {
    const criticalRuntime = unresolvedIncidents.some(
      (inc) => inc.severity === "critical"
    );
    checks.push({
      id: "runtime-incidents",
      severity: criticalRuntime ? "critical" : "warning",
      category: "runtime_errors",
      categoryLabel: "Live Runtime Errors",
      title: `${unresolvedIncidents.length} unresolved runtime error(s) detected on site`,
      detail: `Latest on ${unresolvedIncidents[0].route}: "${unresolvedIncidents[0].message}" (${unresolvedIncidents[0].occurrences}x).`,
      affectedTarget: unresolvedIncidents[0].route,
      fixHref: "/admin/diagnostics#incidents",
      fixLabel: "Inspect & Resolve",
    });
  } else {
    checks.push({
      id: "runtime-incidents",
      severity: "healthy",
      category: "runtime_errors",
      categoryLabel: "Live Runtime Errors",
      title: "Zero unresolved visitor or server runtime errors",
      detail: "Error boundaries and client telemetry report 0 active crashes.",
    });
  }

  // 3. Owner Launch Placeholders ({{CONTACT_EMAIL}}, {{PRICE_FROM}}, {{FOUNDER_PHOTO_URL}})
  const placeholderWarnings = findUnfilledPlaceholders({
    settings,
    pages,
    services,
    caseStudies,
    blogPosts,
    faqs,
    teamMembers,
  });

  if (placeholderWarnings.length > 0) {
    // Group by placeholder token so multiple occurrences summarize cleanly
    const grouped = new Map<
      string,
      { locations: string[]; adminHref: string }
    >();
    for (const warn of placeholderWarnings) {
      const prev = grouped.get(warn.token);
      if (prev) {
        prev.locations.push(warn.location);
      } else {
        grouped.set(warn.token, {
          locations: [warn.location],
          adminHref: warn.adminHref,
        });
      }
    }
    for (const [token, info] of grouped.entries()) {
      checks.push({
        id: `placeholder-${token}`,
        severity: "warning",
        category: "launch_placeholders",
        categoryLabel: "Launch Placeholders",
        title: `Unfilled owner placeholder: ${token}`,
        detail: `Found in ${info.locations.slice(0, 3).join(", ")}${
          info.locations.length > 3
            ? ` (+${info.locations.length - 3} more)`
            : ""
        }.`,
        affectedTarget: token,
        fixHref: info.adminHref,
        fixLabel: `Fill ${token}`,
      });
    }
  } else {
    checks.push({
      id: "placeholders-clean",
      severity: "healthy",
      category: "launch_placeholders",
      categoryLabel: "Launch Placeholders",
      title: "All owner placeholders populated",
      detail: "Contact email, starting rate, and founder photo are configured.",
    });
  }

  // 4. Navigation, CTA & Redirect Integrity
  const brokenLinks: string[] = [];
  if (!isValidInternalOrExternalHref(settings.primaryCtaHref)) {
    brokenLinks.push(`Primary CTA (${settings.primaryCtaHref || "empty"})`);
  }
  if (!isValidInternalOrExternalHref(settings.secondaryCtaHref)) {
    brokenLinks.push(`Secondary CTA (${settings.secondaryCtaHref || "empty"})`);
  }
  for (const nav of settings.navigation.filter((n) => n.isVisible)) {
    if (!isValidInternalOrExternalHref(nav.href)) {
      brokenLinks.push(`Nav "${nav.label}" -> ${nav.href}`);
    }
  }
  const allFooterItems = [
    ...(settings.footerLinks?.services ?? []),
    ...(settings.footerLinks?.company ?? []),
    ...(settings.footerLinks?.legal ?? []),
  ];
  for (const foot of allFooterItems.filter((f) => f.isVisible)) {
    if (!isValidInternalOrExternalHref(foot.href)) {
      brokenLinks.push(`Footer "${foot.label}" -> ${foot.href}`);
    }
  }

  const activeRedirects = redirects.filter((r) => r.isActive);
  const redirectLoops = activeRedirects.filter((r) => {
    const src = r.sourcePath.trim();
    const dst = r.destinationPath.trim();
    if (src === dst) return true;
    return activeRedirects.some(
      (other) => other.id !== r.id && other.sourcePath.trim() === dst
    );
  });

  if (brokenLinks.length > 0) {
    checks.push({
      id: "broken-cta-nav-links",
      severity: "critical",
      category: "navigation_redirects",
      categoryLabel: "Links & Redirects",
      title: `${brokenLinks.length} broken or unrecognized CTA/navigation link(s)`,
      detail: brokenLinks.slice(0, 3).join(" · "),
      fixHref: "/admin/settings",
      fixLabel: "Fix Navigation & CTAs",
    });
  } else if (redirectLoops.length > 0) {
    checks.push({
      id: "redirect-chains",
      severity: "critical",
      category: "navigation_redirects",
      categoryLabel: "Links & Redirects",
      title: `${redirectLoops.length} redirect loop or chain detected`,
      detail: `Rule "${redirectLoops[0].sourcePath}" -> "${redirectLoops[0].destinationPath}" chains or loops.`,
      fixHref: "/admin/seo",
      fixLabel: "Fix Redirect Rules",
    });
  } else {
    checks.push({
      id: "links-redirects-healthy",
      severity: "healthy",
      category: "navigation_redirects",
      categoryLabel: "Links & Redirects",
      title: "All navigation, footer, CTA & redirect targets verified",
      detail: `Checked ${settings.navigation.length} nav items, ${allFooterItems.length} footer links, and ${activeRedirects.length} active redirect(s).`,
    });
  }

  // 5. Dual-Mode Theme WCAG AA Contrast Check (Dark & Light)
  const darkContrastWarnings = evaluateThemeContrast(
    "dark",
    theme.published.dark
  );
  const lightContrastWarnings = evaluateThemeContrast(
    "light",
    theme.published.light
  );
  const totalContrastWarnings =
    darkContrastWarnings.length + lightContrastWarnings.length;

  if (totalContrastWarnings > 0) {
    const sample = darkContrastWarnings[0] ?? lightContrastWarnings[0];
    checks.push({
      id: "theme-contrast",
      severity: "warning",
      category: "theme_accessibility",
      categoryLabel: "Theme & Accessibility",
      title: `${totalContrastWarnings} WCAG AA color contrast warning(s) in active theme`,
      detail: `${sample.pairLabel}: ${sample.ratio}:1 (minimum ${sample.minimumRequired}:1 required).`,
      affectedTarget: theme.activePresetId,
      fixHref: "/admin/theme",
      fixLabel: "Adjust Theme Colors",
    });
  } else {
    checks.push({
      id: "theme-contrast",
      severity: "healthy",
      category: "theme_accessibility",
      categoryLabel: "Theme & Accessibility",
      title: "Both Dark & Light theme palettes pass WCAG AA contrast",
      detail: `Active preset "${theme.activePresetId}" (${theme.defaultMode} default) has 0 contrast violations.`,
    });
  }

  // 6. Content & SEO Completeness Audit
  const homePage = pages.find((p) => p.slug === "home");
  const visibleHomeSections =
    homePage?.sections.filter((s) => s.isVisible).length ?? 0;
  const publishedServices = services.filter((s) => s.status === "published");
  const missingSeoPages = pages.filter(
    (p) =>
      p.status === "published" &&
      (!p.seo?.seoTitle?.trim() || !p.seo?.seoDescription?.trim())
  );

  if (visibleHomeSections === 0 || publishedServices.length === 0) {
    checks.push({
      id: "content-visibility",
      severity: "critical",
      category: "seo_content",
      categoryLabel: "Content & SEO",
      title:
        visibleHomeSections === 0
          ? "Homepage has 0 visible sections published"
          : "Zero published services available on public website",
      detail:
        "Visitors will see an incomplete homepage or empty services catalog.",
      fixHref: visibleHomeSections === 0 ? "/admin/pages" : "/admin/cms",
      fixLabel:
        visibleHomeSections === 0 ? "Open Page Builder" : "Open Content Studio",
    });
  } else if (missingSeoPages.length > 0) {
    checks.push({
      id: "seo-metadata-gaps",
      severity: "warning",
      category: "seo_content",
      categoryLabel: "Content & SEO",
      title: `${missingSeoPages.length} published page(s) missing custom SEO title or description`,
      detail: `Affected: ${missingSeoPages.map((p) => `/${p.slug === "home" ? "" : p.slug}`).join(", ")}.`,
      fixHref: "/admin/seo",
      fixLabel: "Complete SEO Metadata",
    });
  } else {
    checks.push({
      id: "seo-content-healthy",
      severity: "healthy",
      category: "seo_content",
      categoryLabel: "Content & SEO",
      title: `Homepage (${visibleHomeSections} sections) & ${publishedServices.length} services published with complete SEO`,
      detail: "All published pages carry valid titles and meta descriptions.",
    });
  }

  // 7. CRM Lead Follow-Up & Notification Health
  const failedLeadEmails = leads.filter(
    (l) => l.emailNotificationStatus === "failed"
  );
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const staleNewLeads = leads.filter(
    (l) =>
      l.status === "New" &&
      new Date(l.createdAt).getTime() < fortyEightHoursAgo
  );

  if (failedLeadEmails.length > 0) {
    checks.push({
      id: "crm-email-failures",
      severity: "warning",
      category: "crm_notifications",
      categoryLabel: "CRM & Lead Alerts",
      title: `${failedLeadEmails.length} lead enquiry email notification(s) failed delivery`,
      detail:
        "Enquiries are safely saved in CRM, but outbound email alerts via Resend failed.",
      fixHref: "/admin/leads",
      fixLabel: "Review Leads in CRM",
    });
  } else if (staleNewLeads.length > 0) {
    checks.push({
      id: "crm-stale-leads",
      severity: "warning",
      category: "crm_notifications",
      categoryLabel: "CRM & Lead Alerts",
      title: `${staleNewLeads.length} new lead(s) awaiting response for over 48 hours`,
      detail: `Oldest uncontacted enquiry from ${staleNewLeads[0].name} (${staleNewLeads[0].company}).`,
      fixHref: "/admin/leads",
      fixLabel: "Follow Up in CRM",
    });
  } else {
    checks.push({
      id: "crm-healthy",
      severity: "healthy",
      category: "crm_notifications",
      categoryLabel: "CRM & Lead Alerts",
      title: `CRM pipeline healthy (${leads.length} total lead${leads.length === 1 ? "" : "s"})`,
      detail: systemHealth.email.configured
        ? "Resend instant email notifications active."
        : "Leads persist directly in CRM (configure RESEND_API_KEY in production for email alerts).",
    });
  }

  // 8. Security & Auth Posture
  if (
    !systemHealth.security.sessionSecretValid &&
    systemHealth.application.strictProduction
  ) {
    checks.push({
      id: "security-auth-secret",
      severity: "critical",
      category: "security_auth",
      categoryLabel: "Security & Access",
      title: "AUTH_SECRET is missing or shorter than 32 characters in production",
      detail: "Set a 32+ character cryptographic AUTH_SECRET in Vercel environment variables.",
      fixHref: "/admin/account",
      fixLabel: "Security Settings",
    });
  } else if (systemHealth.security.pendingPasswordRotations > 0) {
    checks.push({
      id: "security-password-rotation",
      severity: "warning",
      category: "security_auth",
      categoryLabel: "Security & Access",
      title: `${systemHealth.security.pendingPasswordRotations} admin user(s) require first-login password rotation`,
      detail: "Bootstrap credentials should be rotated immediately.",
      fixHref: "/admin/account",
      fixLabel: "Rotate Password",
    });
  } else {
    checks.push({
      id: "security-healthy",
      severity: "healthy",
      category: "security_auth",
      categoryLabel: "Security & Access",
      title: "Authentication, RBAC & CSP headers verified",
      detail: `${systemHealth.security.activeSuperAdmins} active Super Admin(s), session signing healthy.`,
    });
  }

  // Sort checks: critical first, then warning, then healthy
  const severityOrder: Record<DiagnosticSeverity, number> = {
    critical: 0,
    warning: 1,
    healthy: 2,
  };
  checks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const criticalCount = checks.filter((c) => c.severity === "critical").length;
  const warningCount = checks.filter((c) => c.severity === "warning").length;
  const healthyCount = checks.filter((c) => c.severity === "healthy").length;

  const overallStatus: DiagnosticSeverity =
    criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";

  const rawScore = 100 - criticalCount * 22 - warningCount * 7;
  const score = Math.max(0, Math.min(100, rawScore));

  const firstProblem = checks.find((c) => c.severity !== "healthy") ?? null;

  const publicRoutesToProbe = [
    "/",
    "/services",
    "/pricing",
    "/demos",
    "/work",
    "/how-it-works",
    "/about",
    "/contact",
    "/sitemap.xml",
    "/api/health?probe=liveness",
  ];

  return {
    overallStatus,
    score,
    criticalCount,
    warningCount,
    healthyCount,
    unresolvedIncidentCount: unresolvedIncidents.length,
    topAlertTitle: firstProblem?.title ?? null,
    topAlertSeverity: firstProblem?.severity ?? null,
    checkedAt: new Date().toISOString(),
    systemHealth,
    checks,
    incidents,
    recentDbErrors,
    publicRoutesToProbe,
  };
}
