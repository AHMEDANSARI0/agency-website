// Edge-compatible: do not import Node-only cryptography or database code here.
// Production always uses the host-only Secure prefix, even during local `next start`.
const secureSession =
  process.env.NODE_ENV === "production" ||
  process.env.OMNIFLOW_STRICT_PRODUCTION === "true";

export const SESSION_COOKIE_NAME = secureSession
  ? "__Host-omniflow_session"
  : "omniflow_session";

export function getSessionCookieOptions(maxAgeSeconds = 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: secureSession,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
