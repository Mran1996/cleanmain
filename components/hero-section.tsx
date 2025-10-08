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
    <section className="bg-emerald-500 text-white py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" variant="white" className="scale-125" />
          </div>
          
          {/* Main headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Powerful Legal Help — When You Need It Most
          </h1>
          
          {/* Value proposition */}
          <p className="text-base sm:text-lg md:text-xl mb-2 sm:mb-4 max-w-3xl mx-auto px-2">
            Get court-ready legal documents, outcome strategy, and expert-level support — 100% AI-powered and always on your side.
          </p>
          
          {/* Service coverage */}
          <p className="mt-2 text-sm text-white font-semibold text-center">
            Covers criminal motions, civil claims, post-conviction filings, and more.
          </p>
          
          {/* Call-to-action buttons */}
          <div className="flex flex-col justify-center gap-4 mt-6 mb-2">
            <Link href="/pricing">
              <Button className="bg-white text-emerald-500 hover:bg-gray-100 px-8 py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg">
                Purchase Now
              </Button>
            </Link>
            <Link href="/learn-more">
              <Button variant="outline" className="text-emerald-500 bg-white border-white hover:text-white hover:bg-emerald-500 px-6 py-2 text-sm sm:text-base">
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Trust indicator */}
          <p className="mt-2 text-xs text-white/80 text-center italic">
            Trusted by families, self-represented defendants, and reform advocates across the U.S.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 md:gap-16">
            {FEATURE_HIGHLIGHTS.map(({ icon, label, ariaLabel }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <span role="img" aria-label={ariaLabel} className="text-2xl">
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
