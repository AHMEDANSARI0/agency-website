import { verifyStorageHealth, type StorageHealthVerification } from "@/features/media/storage";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { db, type DatabaseHealthVerification } from "@/lib/database";
import {
  getDeploymentEnvironment,
  getEnvReadinessSummary,
  isPlaceholderEnvValue,
  isProductionEnvironment,
  type DeploymentEnvironment,
} from "@/lib/env";

export const OMNIFLOW_APP_VERSION = "1.0.0";

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  httpStatus: 200 | 503;
  probe: "liveness" | "readiness";
  timestamp: string;
  application: {
    status: "ok";
    service: string;
    version: string;
    commitSha: string;
    environment: DeploymentEnvironment;
    strictProduction: boolean;
  };
  database: DatabaseHealthVerification;
  storage: StorageHealthVerification & {
    usedBytes: number;
    assetCount: number;
  };
  email: {
    configured: boolean;
    provider: "resend" | "disabled";
    fromConfigured: boolean;
    recipientConfigured: boolean;
    customSenderDomain: boolean;
  };
  domain: {
    canonicalUrl: string;
    configured: boolean;
    https: boolean;
  };
  security: {
    sessionSecretValid: boolean;
    bootstrapSecured: boolean;
    activeSuperAdmins: number;
    pendingPasswordRotations: number;
    strictFrameHeadersEnabled: boolean;
  };
  issues: string[];
}

export async function getSystemHealthReport(options?: {
  probe?: "liveness" | "readiness";
}): Promise<SystemHealthReport> {
  const probe = options?.probe || "readiness";
  const envSummary = getEnvReadinessSummary();
  const strictProd = isProductionEnvironment();
  const canonicalUrl = getCanonicalSiteUrl();
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim().slice(0, 7) || "local";

  const resendKey = process.env.RESEND_API_KEY?.trim() || "";
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL?.trim() || "";
  const toEmail =
    process.env.NOTIFICATION_TO_EMAIL?.trim() ||
    process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
    "";
  const emailConfigured =
    !isPlaceholderEnvValue(resendKey) && Boolean(toEmail);
  const customSenderDomain =
    Boolean(fromEmail) &&
    !fromEmail.includes("@resend.dev") &&
    !fromEmail.includes(".example");

  if (probe === "liveness") {
    return {
      status: "healthy",
      httpStatus: 200,
      probe: "liveness",
      timestamp: new Date().toISOString(),
      application: {
        status: "ok",
        service: "OmniFlow",
        version: OMNIFLOW_APP_VERSION,
        commitSha,
        environment: getDeploymentEnvironment(),
        strictProduction: strictProd,
      },
      database: {
        driver: db.getMode(),
        connected: true,
        schemaReady: true,
        appliedMigrations: [],
        missingTables: [],
        missingColumns: [],
        latencyMs: 0,
        backupCount: 0,
        lastBackupAt: null,
        recentErrorCount: db.getRecentErrors().length,
        message: "Liveness check skips deep dependency probes.",
      },
      storage: {
        provider: envSummary.supabaseStorageConfigured
          ? "supabase_storage"
          : strictProd
            ? "unconfigured_production"
            : "local_dev",
        configured: envSummary.supabaseStorageConfigured || !strictProd,
        healthy: envSummary.supabaseStorageConfigured || !strictProd,
        bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "omniflow-media",
        maxSingleFileBytes: 4 * 1024 * 1024,
        totalQuotaBytes: 500 * 1024 * 1024,
        allowedMimeTypes: [],
        allowedExtensions: [],
        message: "Liveness probe.",
        usedBytes: 0,
        assetCount: 0,
      },
      email: {
        configured: emailConfigured,
        provider: emailConfigured ? "resend" : "disabled",
        fromConfigured: Boolean(fromEmail),
        recipientConfigured: Boolean(toEmail),
        customSenderDomain,
      },
      domain: {
        canonicalUrl,
        configured: envSummary.canonicalSiteUrlConfigured,
        https: envSummary.canonicalSiteUrlHttps,
      },
      security: {
        sessionSecretValid: envSummary.sessionSecretValid,
        bootstrapSecured: !strictProd || envSummary.bootstrapPasswordStrong,
        activeSuperAdmins: 0,
        pendingPasswordRotations: 0,
        strictFrameHeadersEnabled:
          process.env.ENABLE_STRICT_FRAME_HEADERS === "true",
      },
      issues: [],
    };
  }

  const [dbHealth, storageHealth] = await Promise.all([
    db.verifyHealth(),
    verifyStorageHealth(),
  ]);

  let serviceName = "OmniFlow";
  let usedBytes = 0;
  let assetCount = 0;
  let activeSuperAdmins = 0;
  let pendingPasswordRotations = 0;

  if (dbHealth.connected && dbHealth.schemaReady) {
    try {
      const [settings, media, users] = await Promise.all([
        db.getSiteSettings(),
        db.listMediaAssets(),
        db.listUsers(),
      ]);
      serviceName = settings.companyName || "OmniFlow";
      assetCount = media.length;
      usedBytes = media.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
      activeSuperAdmins = users.filter(
        (u) => u.role === "SUPER_ADMIN" && u.isActive
      ).length;
      pendingPasswordRotations = users.filter(
        (u) => u.isActive && u.mustChangePassword
      ).length;
    } catch {
      // Handled via dbHealth flags below
    }
  }

  const bootstrapSecured = strictProd
    ? activeSuperAdmins >= 1 &&
      pendingPasswordRotations === 0 &&
      (!process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ||
        envSummary.bootstrapPasswordStrong)
    : activeSuperAdmins >= 1;

  const issues = [...envSummary.issues];
  if (!dbHealth.connected || !dbHealth.schemaReady) {
    issues.push(dbHealth.message);
  }
  if (!storageHealth.healthy) {
    issues.push(storageHealth.message);
  }
  if (strictProd && activeSuperAdmins === 0 && dbHealth.connected) {
    issues.push(
      "No active Super Admin exists yet. Complete initial administrator setup at /admin/setup."
    );
  }
  if (pendingPasswordRotations > 0) {
    issues.push(
      `${pendingPasswordRotations} staff account(s) still require first-login password replacement.`
    );
  }

  const criticalFailure =
    !dbHealth.connected ||
    !dbHealth.schemaReady ||
    (strictProd && (!storageHealth.healthy || !envSummary.sessionSecretValid));

  const degraded =
    !criticalFailure &&
    (!storageHealth.healthy ||
      pendingPasswordRotations > 0 ||
      (strictProd && (!bootstrapSecured || !envSummary.canonicalSiteUrlHttps)));

  const status: SystemHealthReport["status"] = criticalFailure
    ? "unhealthy"
    : degraded
      ? "degraded"
      : "healthy";

  return {
    status,
    httpStatus: criticalFailure ? 503 : 200,
    probe: "readiness",
    timestamp: new Date().toISOString(),
    application: {
      status: "ok",
      service: serviceName,
      version: OMNIFLOW_APP_VERSION,
      commitSha,
      environment: getDeploymentEnvironment(),
      strictProduction: strictProd,
    },
    database: dbHealth,
    storage: {
      ...storageHealth,
      usedBytes,
      assetCount,
    },
    email: {
      configured: emailConfigured,
      provider: emailConfigured ? "resend" : "disabled",
      fromConfigured: Boolean(fromEmail),
      recipientConfigured: Boolean(toEmail),
      customSenderDomain,
    },
    domain: {
      canonicalUrl,
      configured: envSummary.canonicalSiteUrlConfigured,
      https: envSummary.canonicalSiteUrlHttps,
    },
    security: {
      sessionSecretValid: envSummary.sessionSecretValid,
      bootstrapSecured,
      activeSuperAdmins,
      pendingPasswordRotations,
      strictFrameHeadersEnabled:
        process.env.ENABLE_STRICT_FRAME_HEADERS === "true",
    },
    issues: Array.from(new Set(issues)),
  };
}
