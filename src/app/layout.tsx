import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import "@/styles/globals.css";
import { db } from "@/lib/database";
import { ThemeStyleTag } from "@/features/themes/ThemeStyleTag";
import { ThemeProvider } from "@/features/themes/ThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#0B0908",
  colorScheme: "dark light",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, brand] = await Promise.all([db.getSiteSettings(), db.getBrandAssets()]);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${settings.companyName} — ${settings.positioning}`,
      template: `%s | ${settings.companyName}`,
    },
    description: `${settings.tagline} Practical lead management, AI customer support, and workflow automation for service businesses in the USA, UK, and Canada.`,
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      siteName: settings.companyName,
      title: `${settings.companyName} — ${settings.positioning}`,
      description: settings.tagline,
      images: brand.ogImageUrl ? [{ url: brand.ogImageUrl, alt: brand.altText }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themeConfig = await db.getThemeConfig();
  const initialDataTheme = themeConfig.defaultMode === "light" ? "light" : "dark";

  // Zero-FOUC inline theme initializer before first paint
  const bootScript = `(function(){try{var s=localStorage.getItem("omniflow-theme-mode");var m=(s==="light"||s==="dark"||s==="system")?s:${JSON.stringify(
    themeConfig.defaultMode
  )};var r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;document.documentElement.setAttribute("data-theme",r);document.documentElement.classList.toggle("dark",r==="dark");}catch(e){}})();`;

  return (
    <html
      lang="en"
      data-theme={initialDataTheme}
      className={`${poppins.variable} ${jetbrainsMono.variable} ${
        initialDataTheme === "dark" ? "dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <ThemeStyleTag themeConfig={themeConfig} />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-[#F2EADB] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#0B0908]"
        >
          Skip to main content
        </a>
        <ThemeProvider defaultMode={themeConfig.defaultMode}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
