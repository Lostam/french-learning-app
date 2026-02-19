import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If trying to access protected route without token, redirect to login
  if (!isPublicRoute && pathname !== '/' && !token) {
    // Check localStorage token via client-side redirect
    // Since middleware runs on server, we can't access localStorage
    // We'll handle this in the page components instead
    return NextResponse.next();
  }

  // If logged in and trying to access login/signup, redirect to stories
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/stories', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
