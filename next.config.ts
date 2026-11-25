import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const strictFrameHeaders = process.env.ENABLE_STRICT_FRAME_HEADERS === "true";
const isProd = process.env.NODE_ENV === "production";

function buildContentSecurityPolicy(): string {
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.supabase.co",
  ];

  if (strictFrameHeaders) {
    directives.push("frame-ancestors 'self'");
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
        value: "max-age=63072000; includeSubDomains; preload",
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
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
