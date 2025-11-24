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
import { LanguageSelector } from "@/components/language-selector"
import AuthButton from "@/components/AuthButton"
import { Logo } from "@/components/Logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"

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

  /**
   * Renders a navigation link with proper styling and active state
   */
  const renderNavLink = (href: string, label: string, mobile: boolean = false) => {
    const isActive = pathname === href
    const baseClasses = mobile 
      ? "text-gray-700 hover:text-primary transition-colors block py-3 px-4 text-base font-medium"
      : "text-gray-700 hover:text-primary transition-colors"
    const activeClasses = isActive ? "border-b-2 border-primary" : ""
    
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
      <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between">
        {/* Logo - responsive sizing */}
        <div className="flex items-center w-auto gap-2 sm:gap-3">
          <Logo size="lg" variant="soft" className="hidden sm:block" />
          <Logo size="md" variant="soft" className="block sm:hidden" />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold text-gray-800">Ask AI Legal™</span>
            <span className="text-xs sm:text-sm font-normal text-gray-600 hidden sm:block">Where Law Meets Intelligence.</span>
          </div>
        </div>
        
        {/* Desktop Navigation - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-x-8 flex-1 justify-center">
          {NAVIGATION_LINKS.map(({ href, label }) => (
            <div key={href}>
              {renderNavLink(href, label)}
            </div>
          ))}
        </nav>
        
        {/* Desktop Authentication and language controls - hidden on mobile */}
        <div className="hidden md:flex items-center gap-x-4">
          <AuthButton />
          <LanguageSelector />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <AuthButton />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 text-gray-700 hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                  <div className="flex items-center gap-3">
                    <Logo size="md" variant="soft" />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-800">Ask AI Legal™</span>
                      <span className="text-xs font-normal text-gray-600">Where Law Meets Intelligence.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-700 hover:text-primary"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col flex-1">
                  {NAVIGATION_LINKS.map(({ href, label }) => (
                    <div key={href} className="border-b border-gray-100 last:border-b-0">
                      {renderNavLink(href, label, true)}
                    </div>
                  ))}
                </nav>

                {/* Mobile Footer Actions */}
                <div className="pt-4 border-t border-gray-200 mt-auto">
                  <div className="px-4 pb-4">
                    <LanguageSelector />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
