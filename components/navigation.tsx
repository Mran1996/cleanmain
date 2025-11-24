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
          {/* Logo */}
          <div className="flex items-center w-auto">
            <Logo size="lg" variant="soft" />
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8 flex-1 justify-center">
            {NAVIGATION_LINKS.map(({ href, label }) => (
              <div key={href}>
                {renderNavLink(href, label, false)}
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
                    <Logo size="lg" variant="soft" />
                  </div>
                  <nav className="flex flex-col space-y-1 flex-1">
                    {NAVIGATION_LINKS.map(({ href, label }) => (
                      <div key={href}>
                        {renderNavLink(href, label, true)}
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
