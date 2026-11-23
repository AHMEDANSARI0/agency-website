import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-omniflow-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|uploads/|api/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|woff2?|ttf|txt|xml)$).*)",
  ],
};
