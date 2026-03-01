import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "herd";
const COOKIE = "sage-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API through
  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const auth = req.cookies.get(COOKIE)?.value;
  if (auth === PASSWORD) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
