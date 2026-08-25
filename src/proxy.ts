import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fast, cheap redirect for signed-out visitors — NOT the real authorization
// boundary. The cookie's presence just avoids flashing admin-only content
// before a client-side redirect; every admin API call is independently
// checked by the backend (see backend/src/middleware/auth.js), which is
// what actually protects the data.
//
// District-admin-only by default (per explicit instruction): the only pages
// a teacher can reach without an admin session are self-registration and
// their own school's check-in page (both public and unauthenticated,
// reached by scanning the QR code posted at the school — a teacher never
// browses the rest of the site to get there). Everything else, including
// the home/school-directory page, requires a signed-in admin.
const PUBLIC_PATHS = [/^\/register(\/.*)?$/, /^\/checkin\/.+/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return NextResponse.next();

  const hasSession = request.cookies.has("gsta_token");
  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Runs on every page request except: the API proxy (has its own,
  // independent auth per-route on the backend — must never be caught by a
  // redirect meant for HTML pages), Next.js's own static/image assets, and
  // the favicon.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
