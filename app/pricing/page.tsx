import { PricingSection } from '@/components/pricing-section';
import Footer from '@/components/footer';
import { Navigation } from '@/components/navigation';
import type { Metadata } from 'next';

// SEO metadata for pricing page
export const metadata: Metadata = {
  title: 'Pricing Plans - Affordable Legal AI Assistance',
  description: 'Choose the perfect plan for your legal needs. Flexible pricing starting at $9.99/month. Get AI-powered legal document generation, case analysis, and professional legal assistance without expensive lawyer fees.',
  keywords: [
    'legal pricing',
    'affordable legal help',
    'legal AI pricing',
    'legal subscription',
    'legal document pricing',
    'cheap legal assistance',
  ],
  openGraph: {
    title: 'Pricing Plans - Ask AI Legal™',
    description: 'Affordable AI-powered legal assistance. Plans starting at $9.99/month.',
    type: 'website',
    url: 'https://www.askailegal.com/pricing',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/pricing',
  },
};

export default function PricingPage() {
  // Structured data for pricing
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Pricing Plans',
    description: 'Affordable AI-powered legal assistance plans',
    url: 'https://www.askailegal.com/pricing',
    mainEntity: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      price: '9.99',
    },
  };


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow">
          {/* Pricing cards only; remove extra top actions/info */}
          <PricingSection />
        </main>
        <Footer />
      </div>
    </>
  );
}