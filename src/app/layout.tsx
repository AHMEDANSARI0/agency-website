import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import {
  getCachedBrandAssets,
  getCachedSiteSettings,
  getCachedThemeConfig,
} from "@/lib/cache/public-cache";
import { ThemeStyleTag } from "@/features/themes/ThemeStyleTag";
import { ThemeProvider } from "@/features/themes/ThemeProvider";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-display",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8FF" },
    { media: "(prefers-color-scheme: dark)", color: "#07030D" },
  ],
  colorScheme: "dark light",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, brand] = await Promise.all([
    getCachedSiteSettings(),
    getCachedBrandAssets(),
  ]);
  const baseUrl = getCanonicalSiteUrl();
  const fullTitle = `${settings.companyName} — ${settings.positioning}`;
  const fullDescription = `${settings.tagline} Practical lead management, AI customer support, and workflow automation for service businesses in the USA, UK, and Canada.`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: fullTitle,
      template: `%s | ${settings.companyName}`,
    },
    description: fullDescription,
    alternates: {
      types: {
        "application/rss+xml": `${baseUrl}/feed.xml`,
      },
    },
    manifest: "/site.webmanifest",
    icons: {
      icon: brand.faviconUrl
        ? [{ url: brand.faviconUrl }]
        : [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
          ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: settings.companyName,
      title: fullTitle,
      description: settings.tagline,
      images: [
        {
          url: brand.ogImageUrl || "/og-image.png",
          width: 1200,
          height: 630,
          alt: brand.altText || settings.companyName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: settings.tagline,
      images: [brand.ogImageUrl || "/og-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeConfig = await getCachedThemeConfig();
  const initialDataTheme =
    themeConfig.defaultMode === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      data-theme={initialDataTheme}
      className={`${inter.variable} ${plusJakarta.variable} ${
        initialDataTheme === "dark" ? "dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head>
        <ThemeStyleTag themeConfig={themeConfig} />
        <script
          id="of-motion-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){delete d.dataset.motion;return;}var s=getComputedStyle(d).getPropertyValue("--of-motion-scale").trim();if(s!==""&&Number(s)<=0){delete d.dataset.motion;return;}d.dataset.motion="ready";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium text-primary-foreground focus:shadow-elevated"
        >
          Skip to main content
        </a>
        <ThemeProvider defaultMode={themeConfig.defaultMode}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
