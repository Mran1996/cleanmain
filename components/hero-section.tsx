/**
 * Hero Section Component
 * 
 * This component displays the main hero section of the landing page.
 * It includes:
 * - Compelling headline and value proposition
 * - Call-to-action buttons
 * - Feature highlights with icons
 * - Trust indicators and social proof
 * 
 * The hero section is designed to immediately communicate
 * the value proposition and guide users toward conversion.
 */

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LanguageSelector } from "@/components/language-selector"
import { Logo } from "@/components/Logo"

// Feature highlights configuration
const FEATURE_HIGHLIGHTS = [
  {
    icon: "📄",
    label: "Court-Ready Docs",
    ariaLabel: "Document"
  },
  {
    icon: "🕒", 
    label: "24/7 Legal Help",
    ariaLabel: "Clock"
  },
  {
    icon: "⚖️",
    label: "Attorney-Style AI", 
    ariaLabel: "Scale"
  }
] as const;

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white py-8 sm:py-12 md:py-16 lg:py-20 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center w-full">
          {/* Logo - responsive sizing */}
          <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
            <div className="relative">
              <Logo size="lg" variant="white" className="drop-shadow-2xl sm:hidden" />
              <Logo size="xl" variant="white" className="drop-shadow-2xl hidden sm:block md:hidden" />
              <Logo size="xxl" variant="white" className="drop-shadow-2xl hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-xl"></div>
            </div>
          </div>
          
          {/* Main headline - responsive text sizing */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight px-2">
            Powerful Legal Help — When You Need It Most
          </h1>
          
          {/* Value proposition - responsive text sizing */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            Get court-ready legal documents, outcome strategy, and expert-level support — 100% AI-powered and always on your side.
          </p>
          
          {/* Service coverage */}
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white font-semibold text-center px-2">
            Covers criminal motions, civil claims, post-conviction filings, and more.
          </p>
          
          {/* Call-to-action buttons - responsive layout */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 md:mt-6 mb-2 px-2">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button className="bg-white text-emerald-500 hover:bg-gray-100 w-full sm:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg font-semibold rounded-lg shadow-lg">
                Purchase Now
              </Button>
            </Link>
            <Link href="/learn-more" className="w-full sm:w-auto">
              <Button variant="outline" className="text-emerald-500 bg-white border-white hover:text-white hover:bg-emerald-500 w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base">
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Trust indicator */}
          <p className="mt-1 sm:mt-2 text-xs text-white/80 text-center italic px-2">
            Trusted by families, self-represented defendants, and reform advocates across the U.S.
          </p>

          {/* Feature highlights - responsive layout */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-16 mt-4 sm:mt-5 md:mt-6">
            {FEATURE_HIGHLIGHTS.map(({ icon, label, ariaLabel }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <span role="img" aria-label={ariaLabel} className="text-lg sm:text-xl md:text-2xl">
                  {icon}
                </span>
                <span className="text-xs sm:text-sm md:text-base">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
