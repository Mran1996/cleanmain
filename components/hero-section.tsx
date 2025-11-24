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
    <section className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo - responsive sizing */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <Logo size="xxl" variant="white" className="drop-shadow-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-xl"></div>
            </div>
          </div>
          
          {/* Main headline - responsive text sizing */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">
            Powerful Legal Help — When You Need It Most
          </h1>
          
          {/* Value proposition - responsive text sizing */}
          <p className="text-base sm:text-lg md:text-xl mb-4 max-w-3xl mx-auto px-2 sm:px-4">
            Get court-ready legal documents, outcome strategy, and expert-level support — 100% AI-powered and always on your side.
          </p>
          
          {/* Service coverage */}
          <p className="mt-2 text-xs sm:text-sm text-white/90 font-semibold text-center px-2">
            Covers criminal motions, civil claims, post-conviction filings, and more.
          </p>
          
          {/* Call-to-action buttons - stack on mobile */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 mb-4 sm:mb-2 px-4">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-emerald-500 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg">
                Purchase Now
              </Button>
            </Link>
            <Link href="/learn-more" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-white bg-transparent border-2 border-white hover:bg-white hover:text-emerald-500 px-6 py-2.5 text-base">
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Trust indicator */}
          <p className="mt-2 text-xs text-white/80 text-center italic px-4">
            Trusted by families, self-represented defendants, and reform advocates across the U.S.
          </p>

          {/* Feature highlights - responsive layout */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 md:gap-16 mt-6 sm:mt-8">
            {FEATURE_HIGHLIGHTS.map(({ icon, label, ariaLabel }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <span role="img" aria-label={ariaLabel} className="text-xl sm:text-2xl">
                  {icon}
                </span>
                <span className="text-sm sm:text-base">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
