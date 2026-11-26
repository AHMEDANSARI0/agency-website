import { verifyAdminWriteOrigin } from "@/lib/security/admin-origin";

/**
 * Public writes use the same strict Origin/Host gate as browser admin writes.
 * This deliberately does not trust forwarded Host headers or Referer fallback.
 * Deployment edge must validate the Host and prevent direct-origin bypass.
 */
export function verifySameOriginRequest(request: Request): boolean {
  return verifyAdminWriteOrigin(request);
}
