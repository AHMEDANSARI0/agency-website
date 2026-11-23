import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { db } from "@/lib/database";
import { ThemeStyleTag } from "@/features/themes/ThemeStyleTag";
import { ThemeProvider } from "@/features/themes/ThemeProvider";
import { getCanonicalSiteUrl } from "@/features/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, brand] = await Promise.all([
    db.getSiteSettings(),
    db.getBrandAssets(),
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
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: settings.companyName,
      title: fullTitle,
      description: settings.tagline,
      ...(brand.ogImageUrl
        ? { images: [{ url: brand.ogImageUrl, alt: brand.altText }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: settings.tagline,
      ...(brand.ogImageUrl ? { images: [brand.ogImageUrl] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeConfig = await db.getThemeConfig();
  const initialDataTheme =
    themeConfig.defaultMode === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      data-theme={initialDataTheme}
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${
        initialDataTheme === "dark" ? "dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head>
        <ThemeStyleTag themeConfig={themeConfig} />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-elevated"
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
