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
import { Button } from "@/components/ui/button"
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
      ? "block px-4 py-3 text-base text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
      : "text-gray-700 hover:text-emerald-600 transition-colors text-sm md:text-base"
    const activeClasses = isActive 
      ? (mobile ? "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600" : "border-b-2 border-emerald-600") 
      : ""
    
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
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="lg" variant="soft" />
            </Link>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8 flex-1 justify-center">
            {NAVIGATION_LINKS.map(({ href, label }) => (
              <div key={href}>
                {renderNavLink(href, label)}
              </div>
            ))}
          </nav>
          
          {/* Desktop Auth Controls - hidden on mobile */}
          <div className="hidden md:flex items-center gap-x-3 lg:gap-x-4 flex-shrink-0">
            <AuthButton />
            <LanguageSelector />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-x-2">
            <AuthButton />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <Logo size="md" variant="soft" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-1 flex-1">
                    {NAVIGATION_LINKS.map(({ href, label }) => (
                      <div key={href}>
                        {renderNavLink(href, label, true)}
                      </div>
                    ))}
                  </nav>
                  
                  {/* Mobile Auth Controls */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="px-4">
                      <LanguageSelector />
                    </div>
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
