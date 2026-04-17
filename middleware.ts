import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/medications", "/analytics", "/settings"];
const publicRoutes = ["/login", "/reminder"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  // Check for Firebase auth token cookie
  const authToken = request.cookies.get("__session")?.value;

  if (isProtected && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/medications/:path*", "/analytics/:path*", "/settings/:path*"],
};
