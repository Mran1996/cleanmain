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
import { LanguageSelector } from "@/components/language-selector"
import AuthButton from "@/components/AuthButton"
import { Logo } from "@/components/Logo"

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

  /**
   * Renders a navigation link with proper styling and active state
   */
  const renderNavLink = (href: string, label: string) => {
    const isActive = pathname === href
    const baseClasses = "text-gray-700 hover:text-primary transition-colors"
    const activeClasses = isActive ? "border-b-2 border-primary" : ""
    
    return (
      <Link 
        href={href} 
        className={`${baseClasses} ${activeClasses}`}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50 overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between max-w-full">
        {/* Logo */}
        <div className="flex items-center w-auto flex-shrink-0">
          <Logo size="lg" variant="soft" />
        </div>
        
        {/* Navigation - hidden on mobile, visible on desktop */}
        <nav className="hidden md:flex items-center gap-x-8 flex-1 justify-center">
          {NAVIGATION_LINKS.map(({ href, label }) => (
            <div key={href}>
              {renderNavLink(href, label)}
            </div>
          ))}
        </nav>
        
        {/* Authentication and language controls */}
        <div className="flex items-center gap-x-2 md:gap-x-4 flex-shrink-0">
          <AuthButton />
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
