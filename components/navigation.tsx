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
import Image from "next/image"
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
      ? "block py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors rounded-md"
      : "text-gray-700 hover:text-emerald-600 transition-colors"
    const activeClasses = isActive ? (mobile ? "bg-emerald-50 text-emerald-600 font-semibold" : "text-emerald-600 underline decoration-emerald-600 underline-offset-4") : ""
    
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between h-16 sm:h-20">
          {/* Logo with text and tagline */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center flex-shrink-0">
              <Image src="/logo/logo.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                Ask AI Legal<sup className="text-xs">™</sup>
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 -mt-0.5 leading-tight hidden sm:block">
                Where Law Meets Intelligence.
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8 flex-1 justify-center">
            {NAVIGATION_LINKS.map(({ href, label }) => (
              <div key={href}>
                {renderNavLink(href, label)}
              </div>
            ))}
          </nav>
          
          {/* Desktop Authentication and language controls - hidden on mobile */}
          <div className="hidden md:flex items-center gap-x-4">
            <LanguageSelector />
            <AuthButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-x-2">
            <LanguageSelector />
            <AuthButton />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Logo size="md" variant="soft" showText={false} />
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-emerald-700">
                          Ask AI Legal<sup className="text-xs">™</sup>
                        </span>
                        <span className="text-xs text-emerald-600 -mt-1">
                          Where Law Meets Intelligence
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <nav className="flex-1 space-y-1">
                    {NAVIGATION_LINKS.map(({ href, label }) => (
                      <div key={href}>
                        {renderNavLink(href, label, true)}
                      </div>
                    ))}
                  </nav>
                  
                  <div className="pt-4 border-t mt-auto">
                    <div className="px-4 py-2">
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
