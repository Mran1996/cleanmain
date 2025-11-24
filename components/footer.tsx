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
    <footer className="border-t bg-white mt-12 text-gray-700 mb-0 pb-0 flex flex-col">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
        {/* Company information */}
        <div>
          <div className="mb-4">
            <Logo size="sm" />
          </div>
          <p>
            Your AI-powered legal assistant, helping you navigate 
            legal matters with confidence.
          </p>
        </div>
        
        {/* Quick navigation links */}
        <div>
          <h3 className="font-bold mb-2">QUICK LINKS</h3>
          <ul className="space-y-1">
            {QUICK_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Support contact information */}
        <div>
          <h3 className="font-bold mb-2">SUPPORT</h3>
          <a 
            href={`mailto:${SUPPORT_EMAIL}`} 
            className="flex items-center gap-2 hover:underline mb-2"
            aria-label={`Send email to ${SUPPORT_EMAIL}`}
          >
            <Mail className="w-4 h-4" /> 
            {SUPPORT_EMAIL}
          </a>
          <a 
            href="https://g.page/r/CZFB3qxa_b-gEBM/review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:underline"
            aria-label="Leave us a review on Google"
          >
            <Star className="w-4 h-4 text-yellow-500" /> 
            Leave a Review
          </a>
        </div>
        
        {/* Social media links */}
        <div>
          <h3 className="font-bold mb-2">SOCIAL MEDIA</h3>
          <ul className="space-y-1">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:underline"
                  aria-label={`Visit our ${label} page`}
                >
                  <Icon className="w-4 h-4" /> 
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Footer bottom with copyright and legal links - positioned at bottom */}
      <div className="border-t text-center text-xs text-gray-500 py-4 bg-gray-50 mt-4 mb-0 pb-0">
        {/* Copyright notice */}
        <div className="mb-1">
          © {currentYear} Ask AI Legal. All rights reserved.
        </div>
        
        {/* Legal and accessibility links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
          {/* Accessibility statement */}
          <span className="flex items-center gap-1">
            <span className="text-green-600 text-lg" aria-hidden="true">●</span>
            This site aims to meet WCAG 2.1 Level AA accessibility standards.
          </span>
          
          <span className="hidden md:inline" aria-hidden="true">|</span>
          
          {/* Legal links */}
          {LEGAL_LINKS.map(({ href, label }, index) => (
            <div key={href} className="flex items-center">
              <Link href={href} className="hover:underline">
                {label}
              </Link>
              {index < LEGAL_LINKS.length - 1 && (
                <span className="hidden md:inline ml-4" aria-hidden="true">|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
