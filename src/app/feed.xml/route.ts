import { NextResponse } from "next/server";
import { escapeXml, getCanonicalSiteUrl } from "@/features/seo/json-ld";
import { db } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getCanonicalSiteUrl();
  const [settings, posts] = await Promise.all([
    db.getSiteSettings(),
    db.listBlogPosts(true),
  ]);

  const indexablePosts = posts.filter((p) => !p.seo?.noIndex);

  const itemsXml = indexablePosts
    .map((post) => {
      const url = `${baseUrl}/blog/${encodeURIComponent(post.slug)}`;
      const pubDate = new Date(
        post.publishedAt || post.updatedAt
      ).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <category>${escapeXml(post.category)}</category>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const rssXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${settings.companyName} — Automation Insights`)}</title>`,
    `    <link>${escapeXml(`${baseUrl}/blog`)}</link>`,
    `    <description>${escapeXml(`${settings.positioning}. ${settings.tagline}`)}</description>`,
    "    <language>en-us</language>",
    `    <atom:link href="${escapeXml(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    itemsXml,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
