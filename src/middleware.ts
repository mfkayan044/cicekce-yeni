import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. If accessing login page while having valid session, redirect to /yonetim
  if (pathname === "/yonetim/giris") {
    const token = request.cookies.get("admin_session")?.value;
    if (token) {
      const { valid } = await verifyAdminToken(token);
      if (valid) {
        return NextResponse.redirect(new URL("/yonetim", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. If accessing any /yonetim route, verify admin token
  if (pathname.startsWith("/yonetim")) {
    const token = request.cookies.get("admin_session")?.value;

    if (!token) {
      const loginUrl = new URL("/yonetim/giris", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { valid } = await verifyAdminToken(token);

    if (!valid) {
      const loginUrl = new URL("/yonetim/giris", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      // Clear invalid cookie
      res.cookies.delete("admin_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/yonetim/:path*",
  ],
};
