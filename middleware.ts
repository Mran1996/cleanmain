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
  const isProd = process.env.NODE_ENV === 'production';
  
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
  
  // Security headers - set for all environments (with HSTS only in production)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // Content-Security-Policy - allows necessary resources while maintaining security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://*.amazonaws.com https://api.openai.com https://api.anthropic.com https://www.google-analytics.com; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
  );
  
  // Only set strict security/SEO headers in production to avoid interfering with local dev (e.g., HSTS on localhost)
  if (isProd) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    
    // Content Security Policy - adjust based on your external resources
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://*.amazonaws.com https://api.openai.com https://api.anthropic.com https://api.stripe.com https://r.stripe.com https://js.stripe.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
    
    // Performance headers
    response.headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }
  
  // Cache control for static assets
  if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Canonical URL header (helps with SEO) - only in production
  if (isProd) {
    const canonicalUrl = `https://askailegal.com${path}`;
    response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
  }
  
  return response;
}