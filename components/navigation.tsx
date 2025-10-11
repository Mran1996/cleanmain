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
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import AuthButton from "@/components/AuthButton"
import { Logo } from "@/components/Logo"
import { Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Navigation link configuration
const NAVIGATION_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/ai-assistant/step-1", label: "Chat" },
  { href: "/ai-assistant/step-2", label: "Document" },
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
] as const;

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  /**
   * Renders a navigation link with proper styling and active state
   */
  const renderNavLink = (href: string, label: string, isMobile: boolean = false) => {
    const isActive = pathname === href
    const baseClasses = "text-gray-700 hover:text-primary transition-colors"
    const mobileClasses = isMobile ? "text-lg py-2 px-2 rounded" : ""
    const activeClasses = isActive && !isMobile ? "border-b-2 border-primary" : ""
    
    return (
      <Link 
        href={href} 
        className={`${baseClasses} ${mobileClasses} ${activeClasses}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-y-2 md:flex-row md:items-center md:justify-between">
        {/* Logo and mobile menu trigger */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Logo size="lg" variant="soft" />
          
          {/* Mobile menu sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button 
                className="md:hidden p-2 ml-2" 
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                {/* Mobile navigation links */}
                {NAVIGATION_LINKS.map(({ href, label }) => (
                  <div key={href}>
                    {renderNavLink(href, label, true)}
                  </div>
                ))}
                
                {/* Mobile authentication and language controls */}
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/login">
                    <button className="rounded px-4 py-2 transition-colors font-medium bg-green-600 text-white hover:bg-green-700 w-full">
                      Sign In
                    </button>
                  </Link>
                  <LanguageSelector />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-x-8 flex-1 justify-center">
          {NAVIGATION_LINKS.map(({ href, label }) => (
            <div key={href}>
              {renderNavLink(href, label)}
            </div>
          ))}
        </nav>
        
        {/* Desktop authentication and language controls */}
        <div className="hidden md:flex items-center gap-x-4">
          <Link href="/login">
            <button className="rounded px-4 py-2 transition-colors font-medium bg-green-600 text-white hover:bg-green-700">
              Sign In
            </button>
          </Link>
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
