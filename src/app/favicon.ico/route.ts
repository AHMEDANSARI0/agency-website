import { NextResponse } from "next/server";

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#100E13"/><rect x="6.5" y="6.5" width="19" height="19" rx="5.5" stroke="#F7F5F8" stroke-width="1.8"/><path d="M11.5 16H20.5M16 11.5V20.5" stroke="#B77AD8" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="16" r="2.8" fill="#6D199C"/></svg>`;

export async function GET() {
  return new NextResponse(FAVICON_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
