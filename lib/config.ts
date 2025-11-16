/**
 * Environment Configuration
 * Centralizes environment-specific settings and helpers
 */

/**
 * Environment types for the application
 */
export type Environment = 'development' | 'test' | 'production';

/**
 * Get the current environment
 * @returns The current environment: development, test, or production
 */
export function getEnvironment(): Environment {
  // Check for TEST environment
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  
  // Check for PRODUCTION environment
  if (process.env.NODE_ENV === 'production' && !isVercelPreview()) {
    return 'production';
  }
  
  // Default to development
  return 'development';
}

/**
 * Check if we're running on localhost
 * @returns boolean indicating if running on localhost
 */
export function isLocalhost(): boolean {
  return typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));
}

/**
 * Check if we're in Vercel build time
 * @returns boolean indicating if we're in build time
 */
export function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;
}

/**
 * Check if we're in a Vercel build process
 * @returns boolean indicating if we're in a Vercel build
 */
export function isVercelBuild(): boolean {
  return process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in a Vercel preview deployment (not production)
 * @returns boolean indicating if we're in a preview deployment
 */
export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

/**
 * Config object with environment-specific values
 */
export const config = {
  stripe: {
    apiVersion: '2024-11-20.acacia' as const,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') || false,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  api: {
    cacheTime: getEnvironment() === 'production' ? 300 : 0, // 5 minutes in production, none in dev
  },
  timeouts: {
    defaultApiTimeout: 30000, // 30 seconds
    authCheck: 5000, // 5 seconds
  },
  features: {
    enableAnalytics: getEnvironment() === 'production',
    debugMode: getEnvironment() !== 'production',
    stripeTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
  }
};