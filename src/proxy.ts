import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessInvoiceReport, canAccessNewApplication, canAccessPortal, canAccessProfile } from "@/lib/rbac";
import { type UserRole } from "@/generated/prisma/client";

const signInPath = "/login";
const registerPath = "/register";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userRole = token?.role as UserRole | undefined;
  const isAuthenticated = Boolean(token);
  const pathname = req.nextUrl.pathname;

  if (!isAuthenticated && pathname !== signInPath && pathname !== registerPath) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`${signInPath}?callbackUrl=${callbackUrl}`, req.url));
  }

  if (!userRole) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal/")) {
    const roleSegment = pathname.split("/")[2] ?? "";
    if (!canAccessPortal(roleSegment, userRole)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/reports/invoice-reference") && !canAccessInvoiceReport(userRole)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/applications/new") && !canAccessNewApplication(userRole)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/profile") && !canAccessProfile(userRole)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname === signInPath || pathname === registerPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/applications/:path*", "/reports/:path*", "/profile", "/login", "/register"],
};
