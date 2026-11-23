import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/server";

export async function GET(request: Request) {
  const auth = await requireAdminApiAuth(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
    rolePolicies: auth.settings.rolePolicies,
  });
}
