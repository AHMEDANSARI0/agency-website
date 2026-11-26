import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { isSafeRedirectRule, safeRedirectDestination } from "@/lib/security/redirect-safety";

// Redirect edits must not be trapped in a route or CDN response cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  try {
    const active = (await db.listRedirects()).filter((rule) => rule.isActive && isSafeRedirectRule(rule.sourcePath, rule.destinationPath));
    const rules = active.flatMap((rule) => {
      const destinationPath = safeRedirectDestination(rule.destinationPath);
      return destinationPath ? [{ sourcePath: rule.sourcePath, destinationPath, permanent: rule.permanent }] : [];
    });
    return NextResponse.json({ rules }, { headers });
  } catch {
    return NextResponse.json({ error: "Redirect rules unavailable." }, { status: 503, headers });
  }
}
