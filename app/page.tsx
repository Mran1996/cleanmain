/**
 * Home Page Component
 * 
 * This is the main landing page of the application that showcases:
 * - Hero section with value proposition
 * - How the service works
 * - Key features and benefits
 * - Pricing information
 * - Success stories and testimonials
 * 
 * The page is designed to be responsive and provide a clear path
 * for users to understand and engage with the legal AI service.
 * 
 * @returns The complete home page with all sections
 */

import { Navigation } from "@/components/navigation"
import { ServiceBanner } from "@/components/service-banner"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { KeyFeatures } from "@/components/key-features"
import { PricingSection } from "@/components/pricing-section"
import { SuccessStories } from "@/components/success-stories"
import Footer from "@/components/footer"
import type { Metadata } from 'next';
import { HomeTopline } from "@/components/home-topline"

// SEO metadata for homepage
export const metadata: Metadata = {
  title: 'Ask AI Legal™ - Where Law Meets Intelligence | AI-Powered Legal Assistant',
  description: 'Get instant legal guidance with Ask AI Legal™. Upload documents, analyze cases, and generate professional legal paperwork. Affordable, fast, and AI-powered legal assistance for housing, family, employment, and more.',
  keywords: [
    'AI legal assistant',
    'legal document generator',
    'affordable legal help',
    'legal AI',
    'self-represented litigant',
    'legal document analysis',
    'case success analysis',
    'legal chatbot',
    'eviction defense',
    'divorce documents',
    'employment law',
  ],
  openGraph: {
    title: 'Ask AI Legal™ - AI-Powered Legal Assistant',
    description: 'Get instant legal guidance and professional document generation with AI. Affordable legal help for everyone.',
    type: 'website',
    url: 'https://www.askailegal.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask AI Legal™ - AI-Powered Legal Assistant',
    description: 'Get instant legal guidance and professional document generation with AI.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com',
  },
};

export default function Home() {
  // Structured data for homepage
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.askailegal.com/#organization',
        name: 'Ask AI Legal™',
        url: 'https://www.askailegal.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.askailegal.com/logo/logo.png',
        },
        description: 'AI-powered legal assistant helping you navigate legal matters with confidence',
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.askailegal.com/#website',
        url: 'https://www.askailegal.com',
        name: 'Ask AI Legal™',
        description: 'Empowering access to justice with AI',
        publisher: {
          '@id': 'https://www.askailegal.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.askailegal.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://www.askailegal.com/#webpage',
        url: 'https://www.askailegal.com',
        name: 'Ask AI Legal™ - Where Law Meets Intelligence',
        isPartOf: {
          '@id': 'https://www.askailegal.com/#website',
        },
        about: {
          '@id': 'https://www.askailegal.com/#organization',
        },
        description: 'Get instant legal guidance with AI-powered legal assistance. Upload documents, analyze cases, and generate professional legal paperwork.',
      },
      {
        '@type': 'Service',
        '@id': 'https://www.askailegal.com/#service',
        serviceType: 'Legal Technology',
        provider: {
          '@id': 'https://www.askailegal.com/#organization',
        },
        areaServed: 'US',
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: 'https://www.askailegal.com',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col bg-white flex-1">
        {/* Main navigation header */}
        <Navigation />
        
        {/* Service banner */}
        <ServiceBanner />
        
        {/* Main content area with responsive padding */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex flex-col gap-y-4 sm:gap-y-6 md:gap-y-8">
          {/* Value proposition banner */}
          <div className="bg-white py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 text-center">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight">
              We don't bill by the hour. We don't cut corners. We help you take back control of your legal case — fast.
            </h1>
          </div>
          
          {/* Main page sections */}
          <HeroSection />
          <HowItWorks />
          <KeyFeatures />
          <PricingSection isHomePage={true} />
          <SuccessStories />
        </main>
        
        {/* Footer with links and legal information - positioned at bottom */}
        <Footer />
      </div>
    </>
  )
}
