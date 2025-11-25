/**
 * Navigation Component
 * 
 * This component provides the main navigation header for the application.
 * It includes:
 * - Responsive navigation menu (desktop and mobile)
 * - Logo and brand link
 * - Navigation links with active state indicators
 * - Authentication button
 * - Language selector
 * - Mobile menu with slide-out sheet
 * 
 * The navigation is sticky positioned and provides consistent
 * access to all major sections of the application.
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import AuthButton from "@/components/AuthButton"
import { Logo } from "@/components/Logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTranslation } from "@/utils/translations"

// Navigation link configuration
const NAVIGATION_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/ai-assistant/step-1", label: "Chat" },
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
] as const;

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  const getLocalizedLabel = (href: string, fallback: string) => {
    const map: Record<string, string> = {
      "/": t("nav_home"),
      "/features": t("nav_features"),
      "/ai-assistant/step-1": t("nav_chat"),
      "/pricing": t("nav_pricing"),
      "/account": t("nav_account"),
    }
    return map[href] || fallback
  }

  /**
   * Renders a navigation link with proper styling and active state
   */
  const renderNavLink = (href: string, label: string, mobile: boolean = false) => {
    const isActive = pathname === href
    const baseClasses = mobile 
      ? "block px-4 py-3 text-base text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
      : "text-gray-700 hover:text-primary transition-colors text-sm md:text-base"
    const activeClasses = isActive ? (mobile ? "bg-emerald-50 text-primary font-medium" : "border-b-2 border-primary") : ""
    
    return (
      <Link 
        href={href} 
        className={`${baseClasses} ${activeClasses}`}
        aria-current={isActive ? "page" : undefined}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-row items-center justify-between">
          {/* Logo with Tagline */}
          <div className="flex items-center gap-3 w-auto">
            <Logo size="lg" variant="soft" />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                Ask AI Legal<sup className="text-xs">™</sup>
              </span>
              <span className="text-xs sm:text-sm text-gray-600 font-medium leading-tight -mt-0.5">
                {t("tagline")}
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8 flex-1 justify-center">
            {NAVIGATION_LINKS.map(({ href, label }) => (
              <div key={href}>
                {renderNavLink(href, getLocalizedLabel(href, label), false)}
              </div>
            ))}
          </nav>
          
          {/* Desktop Authentication and language controls - hidden on mobile */}
          <div className="hidden md:flex items-center gap-x-4">
            <AuthButton />
            <LanguageSelector />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-x-2">
            <AuthButton />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 text-gray-700 hover:text-primary transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <Logo size="lg" variant="soft" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 leading-tight">
                          Ask AI Legal<sup className="text-xs">™</sup>
                        </span>
                        <span className="text-xs text-gray-600 font-medium leading-tight -mt-0.5">
                          Where Law Meets Intelligence
                        </span>
                      </div>
                    </div>
                  </div>
                  <nav className="flex flex-col space-y-1 flex-1">
                  {NAVIGATION_LINKS.map(({ href, label }) => (
                    <div key={href}>
                      {renderNavLink(href, getLocalizedLabel(href, label), true)}
                    </div>
                  ))}
                  </nav>
                  <div className="pt-4 border-t border-gray-200">
                    <LanguageSelector />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
