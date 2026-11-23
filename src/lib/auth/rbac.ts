import type { PermissionAction, RolePolicyConfig, UserRole } from "@/types/auth";

const DEFAULT_POLICIES: RolePolicyConfig = {
  editorCanPublish: true,
  editorCanManageTheme: false,
};

const AUTHOR_PERMISSIONS: ReadonlySet<PermissionAction> = new Set([
  "dashboard:view",
  "content:create_draft",
  "content:edit_own",
]);

const EDITOR_BASE_PERMISSIONS: ReadonlySet<PermissionAction> = new Set([
  "dashboard:view",
  "content:create_draft",
  "content:edit_own",
  "content:edit_any",
  "media:manage",
  "leads:view",
  "leads:manage",
  "seo:manage",
]);

export function hasPermission(
  role: UserRole | undefined | null,
  action: PermissionAction,
  policies: RolePolicyConfig = DEFAULT_POLICIES
): boolean {
  if (!role) return false;

  if (role === "SUPER_ADMIN") {
    return true;
  }

  if (role === "EDITOR") {
    if (action === "content:publish") {
      return policies.editorCanPublish;
    }
    if (action === "theme:manage") {
      return policies.editorCanManageTheme;
    }
    return EDITOR_BASE_PERMISSIONS.has(action);
  }

  if (role === "AUTHOR") {
    return AUTHOR_PERMISSIONS.has(action);
  }

  return false;
}

export function canEditContentEntity(
  user: { id: string; role: UserRole } | null | undefined,
  entityAuthorId: string | undefined,
  policies: RolePolicyConfig = DEFAULT_POLICIES
): boolean {
  if (!user) return false;
  if (hasPermission(user.role, "content:edit_any", policies)) return true;
  if (hasPermission(user.role, "content:edit_own", policies) && entityAuthorId === user.id) {
    return true;
  }
  return false;
}
