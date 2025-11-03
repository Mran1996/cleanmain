import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Use www subdomain to match Google Search Console property
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.askailegal.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/dashboard/',
          '/checkout-success/',
          '/auth/',
          '/reset-password/',
          '/update-password/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/dashboard/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
