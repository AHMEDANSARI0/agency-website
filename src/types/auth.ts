export type UserRole = "SUPER_ADMIN" | "EDITOR" | "AUTHOR";

export type PermissionAction =
  | "dashboard:view"
  | "content:create_draft"
  | "content:edit_own"
  | "content:edit_any"
  | "content:publish"
  | "media:manage"
  | "leads:view"
  | "leads:manage"
  | "seo:manage"
  | "theme:manage"
  | "brand:manage"
  | "settings:manage"
  | "users:manage"
  | "audit:view";

export interface RolePolicyConfig {
  editorCanPublish: boolean;
  editorCanManageTheme: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  sessionVersion?: number;
  passwordChangedAt?: string | null;
  recoveryTokenHash?: string | null;
  recoveryExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  sessionVersion: number;
  passwordChangedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  sessionVersion: number;
  issuedAt: number;
  expiresAt: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DatabaseBackupSummary {
  id: string;
  label: string;
  createdBy: string;
  schemaVersion: number;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
}
