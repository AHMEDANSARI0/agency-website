/**
 * Centralized Runtime Environment & Production Readiness Validation
 * Never exposes secret values in returned status objects or error messages.
 */

export type DeploymentEnvironment = "production" | "preview" | "development" | "test";

export function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.cwd().startsWith("/var/task")
  );
}

/**
 * Strict production mode:
 * - Enabled automatically when NODE_ENV === "production" (outside `next build`) unless
 *   OMNIFLOW_ALLOW_LOCAL_DEV_DB === "true" is explicitly set on a local machine.
 * - Can also be forced in automated tests via OMNIFLOW_STRICT_PRODUCTION === "true".
 * In strict production mode, silent fallback to local JSON or temporary media storage is forbidden.
 */
export function isProductionEnvironment(): boolean {
  if (process.env.OMNIFLOW_STRICT_PRODUCTION === "true") {
    return true;
  }
  if (isNextBuildPhase()) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    if (
      !isServerlessRuntime() &&
      process.env.OMNIFLOW_ALLOW_LOCAL_DEV_DB === "true"
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function getDeploymentEnvironment(): DeploymentEnvironment {
  if (process.env.NODE_ENV === "test") return "test";
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "production" || process.env.NODE_ENV === "production") {
    return "production";
  }
  return "development";
}

const KNOWN_DEFAULT_OR_WEAK_PASSWORDS = new Set([
  "changeme_strongpass_2026!",
  "replace_with_strong_unique_password_2026!",
  "replace-with-strong-password",
  "password",
  "password123",
  "password123!",
  "admin",
  "admin123",
  "admin123!",
  "admin12345",
  "omniflow123",
  "omniflow2026!",
  "12345678",
  "1234567890",
]);

export function isKnownDefaultOrWeakPassword(password: string | undefined | null): boolean {
  if (!password) return true;
  const normalized = password.trim().toLowerCase();
  if (normalized.length < 10) return true;
  return KNOWN_DEFAULT_OR_WEAK_PASSWORDS.has(normalized);
}

export function isPlaceholderEnvValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return (
    trimmed.includes("[ref]") ||
    trimmed.includes("[project-ref]") ||
    trimmed.includes("[password]") ||
    trimmed.includes("YOUR_PASSWORD") ||
    trimmed.includes("<password>") ||
    trimmed.startsWith("replace-with-") ||
    trimmed.startsWith("replace_with_")
  );
}

export type DatabaseFailureCode =
  | "DB_MISSING_URL"
  | "DB_AUTH_FAILED"
  | "DB_SCHEMA_MISSING"
  | "DB_POOL_SATURATED"
  | "DB_CONNECTION_FAILED"
  | "DB_QUERY_FAILED";

export class DatabaseUnavailableError extends Error {
  public readonly code: DatabaseFailureCode;
  public readonly statusCode: number;
  public readonly publicMessage: string;

  constructor(code: DatabaseFailureCode, publicMessage: string, internalMessage?: string) {
    super(internalMessage || publicMessage);
    this.name = "DatabaseUnavailableError";
    this.code = code;
    this.statusCode = 503;
    this.publicMessage = publicMessage;
  }
}

export type StorageFailureCode =
  | "STORAGE_UNCONFIGURED"
  | "STORAGE_BUCKET_UNAVAILABLE"
  | "STORAGE_UPLOAD_FAILED"
  | "STORAGE_DELETE_FAILED";

export class StorageUnavailableError extends Error {
  public readonly code: StorageFailureCode;
  public readonly statusCode: number;
  public readonly publicMessage: string;

  constructor(code: StorageFailureCode, publicMessage: string, internalMessage?: string) {
    super(internalMessage || publicMessage);
    this.name = "StorageUnavailableError";
    this.code = code;
    this.statusCode = 503;
    this.publicMessage = publicMessage;
  }
}

export interface EnvReadinessSummary {
  environment: DeploymentEnvironment;
  strictProduction: boolean;
  databaseUrlConfigured: boolean;
  sessionSecretValid: boolean;
  bootstrapCredentialsConfigured: boolean;
  bootstrapPasswordStrong: boolean;
  supabaseStorageConfigured: boolean;
  emailProviderConfigured: boolean;
  canonicalSiteUrlConfigured: boolean;
  canonicalSiteUrlHttps: boolean;
  issues: string[];
}

export function getEnvReadinessSummary(): EnvReadinessSummary {
  const strictProduction = isProductionEnvironment();
  const environment = getDeploymentEnvironment();

  const dbUrl = process.env.DATABASE_URL?.trim() || "";
  const databaseUrlConfigured =
    !isPlaceholderEnvValue(dbUrl) && /^postgres(ql)?:\/\//i.test(dbUrl);

  const authSecret =
    process.env.AUTH_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || "";
  const sessionSecretValid =
    authSecret.length >= 32 && !isPlaceholderEnvValue(authSecret);

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim() || "";
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || "";
  const bootstrapCredentialsConfigured = Boolean(
    bootstrapEmail &&
      bootstrapEmail !== "admin@omniflow.example" &&
      bootstrapPassword
  );
  const bootstrapPasswordStrong =
    Boolean(bootstrapPassword) &&
    !isKnownDefaultOrWeakPassword(bootstrapPassword) &&
    /[A-Z]/.test(bootstrapPassword) &&
    /[a-z]/.test(bootstrapPassword) &&
    /\d/.test(bootstrapPassword);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const supabaseStorageConfigured =
    !isPlaceholderEnvValue(supabaseUrl) &&
    /^https:\/\//i.test(supabaseUrl) &&
    !isPlaceholderEnvValue(supabaseKey);

  const resendKey = process.env.RESEND_API_KEY?.trim() || "";
  const toEmail =
    process.env.NOTIFICATION_TO_EMAIL?.trim() ||
    process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
    "";
  const emailProviderConfigured =
    !isPlaceholderEnvValue(resendKey) && Boolean(toEmail);

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  let canonicalSiteUrlConfigured = false;
  let canonicalSiteUrlHttps = false;
  if (rawSiteUrl) {
    try {
      const parsed = new URL(
        /^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
      );
      canonicalSiteUrlConfigured =
        parsed.hostname !== "localhost" &&
        !parsed.hostname.endsWith(".example") &&
        parsed.hostname !== "127.0.0.1";
      canonicalSiteUrlHttps = parsed.protocol === "https:";
    } catch {
      canonicalSiteUrlConfigured = false;
    }
  }

  const issues: string[] = [];
  if (strictProduction) {
    if (!databaseUrlConfigured) {
      issues.push("DATABASE_URL is missing or contains placeholder credentials.");
    }
    if (!sessionSecretValid) {
      issues.push("AUTH_SECRET (or SESSION_SECRET) must be at least 32 random characters.");
    }
    if (!supabaseStorageConfigured) {
      issues.push(
        "Persistent object storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    if (bootstrapPassword && !bootstrapPasswordStrong) {
      issues.push(
        "ADMIN_BOOTSTRAP_PASSWORD uses a known default or weak value and is rejected in production."
      );
    }
    if (!canonicalSiteUrlConfigured || !canonicalSiteUrlHttps) {
      issues.push(
        "NEXT_PUBLIC_SITE_URL should be set to your verified HTTPS production domain."
      );
    }
  }

  return {
    environment,
    strictProduction,
    databaseUrlConfigured,
    sessionSecretValid,
    bootstrapCredentialsConfigured,
    bootstrapPasswordStrong,
    supabaseStorageConfigured,
    emailProviderConfigured,
    canonicalSiteUrlConfigured,
    canonicalSiteUrlHttps,
    issues,
  };
}
