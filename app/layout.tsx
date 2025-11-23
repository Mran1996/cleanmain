/**
 * Root Layout Component
 * 
 * This is the main layout wrapper for the entire application. It provides:
 * - HTML document structure with proper meta tags
 * - Global CSS imports
 * - Responsive viewport configuration
 * - Client-side layout wrapper integration
 * 
 * @param children - React components to be rendered within the layout
 * @returns The complete HTML document structure
 */

import "./globals.css";
import { ReactNode } from "react";
import ClientLayout from './ClientLayout';
import type { Metadata, Viewport } from 'next';



// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

// Application metadata for SEO and browser configuration
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.askailegal.com'),
  title: {
    default: 'Ask AI Legal™ - Where Law Meets Intelligence',
    template: '%s | Ask AI Legal™',
  },
  description: 'Empowering access to justice with AI. Your AI-powered legal assistant, helping you navigate legal matters with confidence. Get instant legal guidance, document analysis, and case insights.',
  keywords: [
    'AI legal assistant',
    'legal AI',
    'legal document analysis',
    'case success analysis',
    'legal chatbot',
    'legal research',
    'AI lawyer',
    'legal technology',
    'legal automation',
    'document review',
    'case law research',
    'legal consultation',
  ],
  authors: [{ name: 'Ask AI Legal™' }],
  creator: 'Ask AI Legal™',
  publisher: 'Ask AI Legal™',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.askailegal.com',
    siteName: 'Ask AI Legal™',
    title: 'Ask AI Legal™ - Where Law Meets Intelligence',
    description: 'Empowering access to justice with AI. Your AI-powered legal assistant, helping you navigate legal matters with confidence.',
    images: [
      {
        url: '/logo/logo.png',
        width: 1200,
        height: 630,
        alt: 'Ask AI Legal™ - AI-Powered Legal Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask AI Legal™ - Where Law Meets Intelligence',
    description: 'Empowering access to justice with AI. Your AI-powered legal assistant.',
    images: ['/logo/logo.png'],
    creator: '@askailegal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google9718b1219de35b80',
    yandex: '8e1818f4b7eac228',
    // Bing verification: Use /public/BingSiteAuth.xml file instead
  },
  alternates: {
    canonical: 'https://www.askailegal.com',
  },
  category: 'Legal Technology',
};

interface RootLayoutProps {
  children: ReactNode;
}


export default function RootLayout({ children }: RootLayoutProps) {
  // Structured data for organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ask AI Legal™',
    url: 'https://www.askailegal.com',
    logo: 'https://www.askailegal.com/logo/logo.png',
    description: 'AI-powered legal assistant helping you navigate legal matters with confidence',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@askailegal.com',
    },
    sameAs: [
      // Add your social media profiles
      // 'https://twitter.com/askailegal',
      // 'https://linkedin.com/company/askailegal',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ask AI Legal™',
    url: 'https://www.askailegal.com',
    description: 'Empowering access to justice with AI',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.askailegal.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html 
      lang="en" 
      className="light bg-white text-sm md:text-base overflow-x-hidden"
      style={{ colorScheme: "light", maxWidth: "100vw" }}
      suppressHydrationWarning
    >
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="application-name" content="Ask AI Legal™" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ask AI Legal™" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-white text-sm md:text-base m-0 p-0 overflow-x-hidden max-w-full">
        {/* ClientLayout provides context providers and client-side functionality */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
