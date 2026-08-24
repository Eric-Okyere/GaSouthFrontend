import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fast, cheap redirect for signed-out visitors — NOT the real authorization
// boundary. The cookie's presence just avoids flashing the dashboard before
// a client-side redirect; every admin API call is independently checked by
// the backend (see backend/src/middleware/auth.js), which is what actually
// protects the data.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const hasSession = request.cookies.has("gsta_token");
  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
