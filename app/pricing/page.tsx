'use client';

import { PricingSection } from '@/components/pricing-section';
import Footer from '@/components/footer';
import { Navigation } from '@/components/navigation';

export default function PricingPage() {


  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {/* Pricing cards only; remove extra top actions/info */}

        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}