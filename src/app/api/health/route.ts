import { NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function GET() {
  const settings = await db.getSiteSettings();

  return NextResponse.json(
    {
      status: "ok",
      service: settings.companyName,
      phase: 7,
      databaseMode: db.getMode(),
      storageMode:
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "supabase_storage"
          : "local_uploads_fallback",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
