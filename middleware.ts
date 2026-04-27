import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Allow these public routes
  const publicRoutes = ["/login", "/signup"];

  const isPublic = publicRoutes.includes(pathname);

  // OPTIONAL: if you are NOT using cookies yet, just allow everything
  // and rely on client-side auth redirect instead

  if (isPublic) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};