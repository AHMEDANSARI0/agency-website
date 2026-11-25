import { NextResponse } from "next/server";
import { getCachedActiveRedirects } from "@/lib/cache/public-cache";

export const revalidate = 300;

export async function GET() {
  const active = await getCachedActiveRedirects();
  const rules = active.map((r) => ({
    sourcePath: r.sourcePath,
    destinationPath: r.destinationPath,
    permanent: r.permanent,
  }));

  return NextResponse.json(
    { rules },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
