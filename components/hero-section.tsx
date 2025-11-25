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

"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LanguageSelector } from "@/components/language-selector"
import { Logo } from "@/components/Logo"
import { useTranslation } from "@/utils/translations"

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
  const { t } = useTranslation()
  return (
    <section className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo - enlarged per request */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <Logo size="xxl" variant="white" className="drop-shadow-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">
            {t("hero_headline")}
          </h1>
          
          {/* Value proposition */}
          <p className="text-base sm:text-lg md:text-xl mb-3 sm:mb-4 max-w-3xl mx-auto px-2 sm:px-4">
            {t("hero_value")}
          </p>
          
          {/* Service coverage */}
          <p className="mt-2 text-xs sm:text-sm text-white font-semibold text-center px-2">
            {t("hero_coverage")}
          </p>
          
          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 mb-2 px-2">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-emerald-500 hover:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg">
                {t("cta_purchase_now")}
              </Button>
            </Link>
            <Link href="/learn-more" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-emerald-500 bg-white border-white hover:text-white hover:bg-emerald-500 px-6 py-2.5 sm:py-2 text-sm sm:text-base">
                {t("cta_learn_more")}
              </Button>
            </Link>
          </div>
          
          {/* Trust indicator */}
          <p className="mt-2 text-xs text-white/80 text-center italic px-2">
            Trusted by families, self-represented defendants, and reform advocates across the U.S.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 md:gap-16 mt-6 sm:mt-8">
            {FEATURE_HIGHLIGHTS.map(({ icon, label, ariaLabel }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <span role="img" aria-label={ariaLabel} className="text-xl sm:text-2xl">
                  {icon}
                </span>
                <span className="text-sm sm:text-base">{
                  label === "Court-Ready Docs" ? t("feature_court_ready_docs") :
                  label === "24/7 Legal Help" ? t("feature_24_7_help") :
                  label === "Attorney-Style AI" ? t("feature_attorney_style_ai") : label
                }</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
