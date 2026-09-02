import { NextRequest, NextResponse } from "next/server";

const sessionCookieNames = ["better-auth.session_token", "__Secure-better-auth.session_token"];
const adminOnlyPaths = ["/team", "/settings"];

export function middleware(request: NextRequest) {
  // The default local mode keeps the mock-first frontend flow accessible.
  if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") {
    const mockRole = request.cookies.get("squad-portal.mock-role")?.value;
    const isAdminOnlyPath = adminOnlyPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
    if (isAdminOnlyPath && mockRole && mockRole !== "admin") return NextResponse.redirect(new URL("/?error=forbidden", request.url));
    return NextResponse.next();
  }

  const hasSession = sessionCookieNames.some((name) => Boolean(request.cookies.get(name)?.value));
  if (hasSession) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/projects/:path*", "/tasks/:path*", "/stories/:path*", "/knowledge/:path*", "/tickets/:path*", "/team/:path*", "/settings/:path*", "/integrations/:path*", "/api/dashboard/:path*", "/api/projects/:path*", "/api/tasks/:path*", "/api/stories/:path*", "/api/knowledge/:path*", "/api/tickets/:path*", "/api/users/:path*", "/api/profile/:path*", "/api/settings/:path*"],
};
