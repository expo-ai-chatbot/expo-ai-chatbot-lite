import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";
import { verifyToken, extractTokenFromHeader } from "./lib/native-auth/tokens";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = !userAgent.includes('Mozilla/');

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Mobile-specific authentication via Bearer token
  if (isMobile) {
    // Allow public routes for mobile
    if (
      pathname.startsWith('/api/chat-open') ||
      pathname.startsWith('/api/token') ||
      pathname.startsWith('/api/connection-details') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register')
    ) {
      return NextResponse.next();
    }

    const bearerToken = extractTokenFromHeader(request.headers.get('authorization'));
    if (bearerToken) {
      const payload = await verifyToken(bearerToken);
      if (payload) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.id);
        if (payload.email) requestHeaders.set('x-user-email', payload.email);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Web authentication via NextAuth session
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
