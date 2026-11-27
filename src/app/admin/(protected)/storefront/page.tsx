import React from "react";
import { AccessDeniedCard } from "@/components/admin/AccessDeniedCard";
import { StorefrontStudioClient, type StorefrontStudioTab } from "@/features/admin/StorefrontStudioClient";
import { BUILT_IN_THEME_PRESETS } from "@/features/themes/presets";
import { resolveOwnerValues } from "@/lib/owner-config";
import { hasPermission } from "@/lib/auth/rbac";
import { requireAdminPageAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";

const VALID_TABS = new Set<StorefrontStudioTab>([
  "pages",
  "theme",
  "site",
  "content",
]);

interface StorefrontPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function StorefrontPage({
  searchParams,
}: StorefrontPageProps) {
  const { user, settings } = await requireAdminPageAuth("dashboard:view");
  const canEditPages = hasPermission(
    user.role,
    "content:edit_any",
    settings.rolePolicies
  );
  const canPublishPages = hasPermission(
    user.role,
    "content:publish",
    settings.rolePolicies
  );
  const canManageTheme = hasPermission(
    user.role,
    "theme:manage",
    settings.rolePolicies
  );
  const canManageBrand = hasPermission(
    user.role,
    "brand:manage",
    settings.rolePolicies
  );
  const canManageSettings = hasPermission(
    user.role,
    "settings:manage",
    settings.rolePolicies
  );
  const contentPermissions = [
    "content:create_draft",
    "content:edit_own",
    "content:edit_any",
    "content:publish",
  ] as const;
  const canManageContent = contentPermissions.some((permission) =>
    hasPermission(user.role, permission, settings.rolePolicies)
  );
  const canEditAnyContent = hasPermission(
    user.role,
    "content:edit_any",
    settings.rolePolicies
  );
  const canPublishContent = hasPermission(
    user.role,
    "content:publish",
    settings.rolePolicies
  );

  if (
    !canEditPages &&
    !canManageTheme &&
    !canManageBrand &&
    !canManageSettings &&
    !canManageContent
  ) {
    return (
      <AccessDeniedCard role={user.role} moduleName="Storefront Studio" />
    );
  }

  const requestedTab = (await searchParams)?.tab;
  const initialTab = requestedTab && VALID_TABS.has(requestedTab as StorefrontStudioTab)
    ? requestedTab as StorefrontStudioTab
    : "pages";

  const [
    pages,
    theme,
    cardMotion,
    siteSettingsDraft,
    brand,
    team,
    blogPosts,
    caseStudies,
    services,
    faqs,
    testimonials,
    teamMembers,
  ] = await Promise.all([
    canEditPages ? db.listPages() : Promise.resolve([]),
    canManageTheme ? db.getThemeConfig() : Promise.resolve(null),
    canManageTheme ? db.getCardMotionDraft() : Promise.resolve(null),
    canManageSettings ? db.getSiteSettingsDraft() : Promise.resolve(null),
    canManageBrand ? db.getBrandAssetsDraft() : Promise.resolve(null),
    canManageSettings ? db.listTeamMembers(true) : Promise.resolve([]),
    canManageContent ? db.listBlogPosts(false) : Promise.resolve([]),
    canEditAnyContent ? db.listCaseStudies(false) : Promise.resolve([]),
    canEditAnyContent ? db.listServices(false) : Promise.resolve([]),
    canEditAnyContent ? db.listFaqs(false) : Promise.resolve([]),
    canEditAnyContent ? db.listTestimonials(false) : Promise.resolve([]),
    canEditAnyContent ? db.listTeamMembers(false) : Promise.resolve([]),
  ]);
  const visibleBlogPosts = canEditAnyContent
    ? blogPosts
    : blogPosts.filter((post) => post.authorId === user.id);
  const initialOwnerValues = siteSettingsDraft
    ? resolveOwnerValues(siteSettingsDraft, team).values
    : null;

  return (
    <StorefrontStudioClient
      initialTab={initialTab}
      canEditPages={canEditPages}
      canPublishPages={canPublishPages}
      canManageTheme={canManageTheme}
      canManageBrand={canManageBrand}
      canManageSettings={canManageSettings}
      canManageContent={canManageContent}
      canEditAnyContent={canEditAnyContent}
      canPublishContent={canPublishContent}
      initialPages={pages}
      initialTheme={theme}
      builtInPresets={BUILT_IN_THEME_PRESETS}
      initialCardMotion={cardMotion}
      initialSiteSettings={siteSettingsDraft}
      initialOwnerValues={initialOwnerValues}
      initialBrand={brand}
      initialBlogPosts={visibleBlogPosts}
      initialCaseStudies={caseStudies}
      initialServices={services}
      initialFaqs={faqs}
      initialTestimonials={testimonials}
      initialTeamMembers={teamMembers}
    />
  );
}
