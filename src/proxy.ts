import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isAdminArea = pathname.startsWith("/admin");
  const isTeacherArea = pathname.startsWith("/teacher");

  if ((isAdminArea || isTeacherArea) && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminArea && user && user.role !== "SUPERADMIN" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/teacher", req.url));
  }

  if (isTeacherArea && user && user.role !== "GURU") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*"],
};
