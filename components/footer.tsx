/**
 * Footer Component
 * 
 * This component provides the main footer for the application with:
 * - Company information and description
 * - Quick links to important pages
 * - Support contact information
 * - Social media links
 * - Copyright and legal links
 * - Accessibility information
 * 
 * The footer is responsive and provides comprehensive site navigation
 * and legal information for users.
 */

"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Star,
} from "lucide-react";

// Footer link configurations
const QUICK_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/askailegal",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://www.facebook.com/askailegal", 
    label: "Facebook", 
    icon: Facebook,
  },
  {
    href: "https://www.youtube.com/watch?v=-W-vXHhkwNg",
    label: "YouTube",
    icon: Youtube,
  },
] as const;

const LEGAL_LINKS = [
  { href: "/accessibility", label: "Accessibility" },
  { href: "/legal-disclaimer", label: "Legal Disclaimer" },
  { href: "/sitemap", label: "Sitemap" },
] as const;

// Support email configuration
const SUPPORT_EMAIL = "support@askailegal.com";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white mt-8 sm:mt-12 text-gray-700 mb-0 pb-0 flex flex-col">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-sm">
        {/* Company information */}
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <div className="mb-3 sm:mb-4">
            <Logo size="sm" />
          </div>
          <p className="text-xs sm:text-sm">
            Your AI-powered legal assistant, helping you navigate 
            legal matters with confidence.
          </p>
        </div>
        
        {/* Quick navigation links */}
        <div className="col-span-1">
          <h3 className="font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm">QUICK LINKS</h3>
          <ul className="space-y-0.5 sm:space-y-1">
            {QUICK_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:underline text-xs sm:text-sm">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Support contact information */}
        <div className="col-span-1">
          <h3 className="font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm">SUPPORT</h3>
          <a 
            href={`mailto:${SUPPORT_EMAIL}`} 
            className="flex items-center gap-1.5 sm:gap-2 hover:underline mb-1.5 sm:mb-2 text-xs sm:text-sm"
            aria-label={`Send email to ${SUPPORT_EMAIL}`}
          >
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> 
            <span className="break-all">{SUPPORT_EMAIL}</span>
          </a>
          <a 
            href="https://g.page/r/CZFB3qxa_b-gEBM/review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 hover:underline text-xs sm:text-sm"
            aria-label="Leave us a review on Google"
          >
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" /> 
            Leave a Review
          </a>
        </div>
        
        {/* Social media links */}
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <h3 className="font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm">SOCIAL MEDIA</h3>
          <ul className="space-y-0.5 sm:space-y-1">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 sm:gap-2 hover:underline text-xs sm:text-sm"
                  aria-label={`Visit our ${label} page`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> 
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Footer bottom with copyright and legal links - positioned at bottom */}
      <div className="border-t text-center text-xs text-gray-500 py-3 sm:py-4 bg-gray-50 mt-2 sm:mt-4 mb-0 pb-0 px-4">
        {/* Copyright notice */}
        <div className="mb-1.5 sm:mb-2">
          © {currentYear} Ask AI Legal. All rights reserved.
        </div>
        
        {/* Legal and accessibility links */}
        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 md:gap-4">
          {/* Accessibility statement */}
          <span className="flex items-center gap-1 text-xs">
            <span className="text-green-600 text-sm sm:text-lg" aria-hidden="true">●</span>
            <span className="leading-tight">This site aims to meet WCAG 2.1 Level AA accessibility standards.</span>
          </span>
          
          {/* Legal links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
            {LEGAL_LINKS.map(({ href, label }, index) => (
              <div key={href} className="flex items-center">
                <Link href={href} className="hover:underline text-xs">
                  {label}
                </Link>
                {index < LEGAL_LINKS.length - 1 && (
                  <span className="hidden md:inline ml-3 md:ml-4" aria-hidden="true">|</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
