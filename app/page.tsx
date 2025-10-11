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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main navigation header */}
      <Navigation />
      
      {/* Service banner */}
      <ServiceBanner />
      
      {/* Main content area with responsive padding and max width */}
      <main className="flex-grow w-full max-w-screen-sm mx-auto p-4 md:p-8 flex flex-col gap-y-8">
        {/* Value proposition banner */}
        <div className="bg-white py-6 px-4 text-center">
          <p className="text-xl font-semibold">
            We don't bill by the hour. We don't cut corners. We help you take back control of your legal case — fast.
          </p>
        </div>
        
        {/* Main page sections */}
        <HeroSection />
        <HowItWorks />
        <KeyFeatures />
        <PricingSection isHomePage={true} />
        <SuccessStories />
      </main>
      
      {/* Footer with links and legal information */}
      <Footer />
    </div>
  )
}
