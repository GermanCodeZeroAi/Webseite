/**
 * Next.js Middleware for German Code Zero AI Frontend
 * 
 * Implements nonce-based Content Security Policy (CSP) enforcement:
 * - Generates unique nonce per request
 * - Sets CSP headers with nonce for script execution
 * - Provides nonce to pages via request headers
 * - Enforces strict security policies for Stripe integration
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CSPManager, generateNonce } from './lib/csp';

/**
 * Middleware function that runs on every request
 */
export function middleware(request: NextRequest) {
  // Generate a unique nonce for this request
  const nonce = generateNonce();
  
  // Create CSP manager with the generated nonce
  const cspManager = new CSPManager(nonce);
  
  // Get the response
  const response = NextResponse.next();
  
  // Set security headers including CSP with nonce
  const securityHeaders = cspManager.getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  
  // Add nonce to request headers so it's available to pages and components
  response.headers.set('x-nonce', nonce);
  
  // Also set the nonce in a custom header that can be read by the app
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  
  // Create a new response with the modified headers
  const modifiedResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Apply security headers to the modified response
  Object.entries(securityHeaders).forEach(([name, value]) => {
    modifiedResponse.headers.set(name, value);
  });
  
  // Set nonce header for client access
  modifiedResponse.headers.set('x-nonce', nonce);
  
  return modifiedResponse;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - Any files with extensions (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};