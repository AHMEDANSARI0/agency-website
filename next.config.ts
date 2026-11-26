import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isProd = process.env.NODE_ENV === "production";
const strictFrameHeaders = isProd || process.env.ENABLE_STRICT_FRAME_HEADERS === "true";

// TODO: replace unsafe-inline with a per-request nonce only after moving all
// affected pages to dynamic rendering or adopting hashes compatible with ISR.
// A static nonce would be insecure; removing inline support now breaks Next.
function buildContentSecurityPolicy(admin = false): string {
  // Website analytics lives in the public layout, not the admin workspace.
  // Keep inline support until an ISR-compatible nonce/hash design is implemented.
  const scriptSrc = [
    "script-src 'self' 'unsafe-inline'",
    ...(isProd ? [] : ["'unsafe-eval'"]),
    ...(admin ? [] : ["https://www.googletagmanager.com"]),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    admin
      ? "connect-src 'self'"
      : "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.supabase.co",
  ];

  if (strictFrameHeaders) {
    directives.push(admin ? "frame-ancestors 'none'" : "frame-ancestors 'self'");
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.e2b.app", "*.vercel.app"],
    },
  },
  async headers() {
    const baseHeaders = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy(),
      },
    ];

    if (strictFrameHeaders) {
      baseHeaders.push({ key: "X-Frame-Options", value: "SAMEORIGIN" });
      baseHeaders.push({
        key: "Strict-Transport-Security",
        // Do not preload or cover subdomains until the owner confirms HTTPS on all of them.
        value: "max-age=31536000",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: [
          ...baseHeaders,
          {
            key: "Cache-Control",
            value: isProd
              ? "public, max-age=31536000, immutable"
              : "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          ...baseHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source:
          "/:asset(icon.svg|logo.svg|logo-dark.svg|favicon.svg|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|og-image.png|site.webmanifest)",
        headers: [
          ...baseHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...baseHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
          ...(strictFrameHeaders ? [{ key: "Content-Security-Policy", value: buildContentSecurityPolicy(true) }, { key: "X-Frame-Options", value: "DENY" }] : []),
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          ...baseHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/api/redirects",
        headers: [
          ...baseHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
