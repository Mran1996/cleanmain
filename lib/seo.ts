/**
 * SEO Utilities
 * 
 * Common functions and constants for SEO optimization
 */

import { Metadata } from 'next';

const APP_NAME = 'Ask AI Legal™';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://askailegal.com';
const APP_DESCRIPTION = 'Empowering access to justice with AI. Your AI-powered legal assistant, helping you navigate legal matters with confidence.';

/**
 * Generate page metadata with consistent defaults
 */
export function generateMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${APP_URL}${path}`;
  const ogImage = image || `${APP_URL}/logo/logo.png`;

  return {
    title: `${title} | ${APP_NAME}`,
    description: description || APP_DESCRIPTION,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description: description || APP_DESCRIPTION,
      url,
      siteName: APP_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${APP_NAME}`,
      description: description || APP_DESCRIPTION,
      images: [ogImage],
      creator: '@askailegal',
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

/**
 * Generate JSON-LD structured data for a page
 */
export function generateStructuredData(type: 'article' | 'faq' | 'product' | 'breadcrumb', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'article':
      return {
        ...baseData,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Organization',
          name: APP_NAME,
        },
        publisher: {
          '@type': 'Organization',
          name: APP_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${APP_URL}/logo/logo.png`,
          },
        },
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate || data.publishedDate,
        image: data.image || `${APP_URL}/logo/logo.png`,
      };

    case 'faq':
      return {
        ...baseData,
        '@type': 'FAQPage',
        mainEntity: data.questions.map((q: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      };

    case 'product':
      return {
        ...baseData,
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.image,
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${APP_URL}${data.url}`,
        },
        aggregateRating: data.rating && {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value,
          reviewCount: data.rating.count,
        },
      };

    case 'breadcrumb':
      return {
        ...baseData,
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: { name: string; url: string }, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${APP_URL}${item.url}`,
        })),
      };

    default:
      return baseData;
  }
}

/**
 * SEO-friendly URL slug generator
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Truncate text for meta descriptions
 */
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return `${truncated.substring(0, lastSpace)}...`;
}

/**
 * Generate keywords array from content
 */
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const frequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Validate image for Open Graph/Twitter Cards
 */
export function validateOGImage(imageUrl: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;

  // Check if URL is absolute
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    warnings.push('Image URL should be absolute (include https://)');
    valid = false;
  }

  // Check for common image formats
  const validFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const hasValidFormat = validFormats.some(format => imageUrl.toLowerCase().includes(format));
  
  if (!hasValidFormat) {
    warnings.push('Image should be in JPG, PNG, WebP, or GIF format');
  }

  return { valid, warnings };
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove trailing slash and query parameters
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  return `${APP_URL}${cleanPath}`;
}

/**
 * Check if page should be indexed
 */
export function shouldIndexPage(path: string): boolean {
  const noIndexPaths = [
    '/api',
    '/account',
    '/dashboard',
    '/auth',
    '/reset-password',
    '/update-password',
    '/checkout-success',
  ];

  return !noIndexPaths.some(noIndexPath => path.startsWith(noIndexPath));
}

/**
 * Priority calculator for sitemap
 */
export function calculatePriority(path: string): number {
  if (path === '/') return 1.0;
  if (['/pricing', '/features', '/ai-assistant'].includes(path)) return 0.9;
  if (['/faq', '/contact', '/legal-assistant'].includes(path)) return 0.7;
  if (['/sign-in', '/sign-up'].includes(path)) return 0.6;
  if (['/terms', '/privacy', '/legal-disclaimer'].includes(path)) return 0.5;
  return 0.4;
}

/**
 * Change frequency calculator for sitemap
 */
export function getChangeFrequency(path: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (path === '/') return 'daily';
  if (['/pricing', '/features'].includes(path)) return 'weekly';
  if (['/faq', '/contact'].includes(path)) return 'monthly';
  if (['/terms', '/privacy'].includes(path)) return 'yearly';
  return 'monthly';
}

/**
 * Constants for social media sharing
 */
export const SOCIAL_CONFIG = {
  twitter: {
    handle: '@askailegal',
    site: '@askailegal',
  },
  facebook: {
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  },
  linkedin: {
    // Add LinkedIn config if needed
  },
} as const;

/**
 * Default images for SEO
 */
export const SEO_IMAGES = {
  default: `${APP_URL}/logo/logo.png`,
  twitter: `${APP_URL}/twitter-card.png`,
  facebook: `${APP_URL}/og-image.png`,
} as const;

/**
 * Common meta tags for legal/compliance pages
 */
export const LEGAL_PAGE_META = {
  noIndex: true,
  robots: {
    index: false,
    follow: true,
  },
} as const;
