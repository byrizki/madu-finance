import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

const protectedRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
  runtime: "nodejs",
};
