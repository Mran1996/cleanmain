import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TARGET = "/ai-assistant/step-1"; // redirect to new Step 1 route

const REMOVED_PATHS = new Set([
  "/step-1",
  "/step-2",
  "/step-3",
  "/intake",
  "/category",
  "/upload",
  // namespaced variants that might still exist in code:
  "/ai-assistant/step-3",
  "/ai-assistant/upload",
  // Redirect old step-4 and step-5 to new structure
  "/ai-assistant/step-4",
  "/ai-assistant/step-5",
]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;
  
  // Handle specific redirects for old step routes
  if (path === "/ai-assistant/step-4") {
    url.pathname = "/ai-assistant/step-1";
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }
  if (path === "/ai-assistant/step-5") {
    url.pathname = "/ai-assistant/step-2";
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }
  
  if (REMOVED_PATHS.has(path)) {
    url.pathname = TARGET;
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }
  
  // Add security and performance headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // Performance headers
  response.headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  
  // Cache control for static assets
  if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Canonical URL header (helps with SEO)
  const canonicalUrl = `https://askailegal.com${path}`;
  response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
  
  return response;
} 