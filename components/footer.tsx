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
import { useTranslation } from "@/utils/translations"

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
  const { t } = useTranslation()
  const quickKeyMap: Record<string, string> = {
    "Privacy Policy": "link_privacy",
    "Terms of Service": "link_terms",
    "FAQ": "link_faq",
    "Contact": "link_contact",
  }
  const legalKeyMap: Record<string, string> = {
    "Accessibility": "link_accessibility",
    "Legal Disclaimer": "link_legal_disclaimer",
    "Sitemap": "link_sitemap",
  }

  return (
    <footer className="border-t bg-white text-gray-700 flex flex-col mt-auto">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
        {/* Company information */}
        <div>
          <div className="mb-1">
            <Logo size="sm" />
          </div>
          <p className="leading-tight">
            {t("footer_desc")}
          </p>
        </div>
        
        {/* Quick navigation links */}
        <div>
          <h3 className="font-bold mb-0.5 text-xs">{t("footer_quick_links")}</h3>
          <ul className="space-y-0.5">
            {QUICK_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:underline text-xs">
                  {t(quickKeyMap[label] ?? label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Support contact information */}
        <div>
          <h3 className="font-bold mb-0.5 text-xs">{t("footer_support_title")}</h3>
          <a 
            href={`mailto:${SUPPORT_EMAIL}`} 
            className="flex items-center gap-1 hover:underline mb-0.5 text-xs"
            aria-label={`Send email to ${SUPPORT_EMAIL}`}
          >
            <Mail className="w-3 h-3" /> 
            {SUPPORT_EMAIL}
          </a>
          <a 
            href="https://g.page/r/CZFB3qxa_b-gEBM/review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline text-xs"
            aria-label="Leave us a review on Google"
          >
            <Star className="w-3 h-3 text-yellow-500" /> 
            {t("footer_leave_review")}
          </a>
        </div>
        
        {/* Social media links */}
        <div>
          <h3 className="font-bold mb-0.5 text-xs">{t("footer_social_media_title")}</h3>
          <ul className="space-y-0.5">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 hover:underline text-xs"
                  aria-label={`Visit our ${label} page`}
                >
                  <Icon className="w-3 h-3" /> 
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Footer bottom with copyright and legal links - positioned at bottom */}
      <div className="border-t text-center text-xs text-gray-500 py-1 bg-gray-50">
        {/* Copyright notice */}
        <div>
          © {currentYear} Ask AI Legal. All rights reserved.
        </div>
        
        {/* Legal and accessibility links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mt-0.5">
          {/* Accessibility statement */}
          <span className="flex items-center gap-1">
            <span className="text-green-600 text-lg" aria-hidden="true">●</span>
            {t("footer_accessibility_text")}
          </span>
          
          <span className="hidden md:inline" aria-hidden="true">|</span>
          
          {/* Legal links */}
          {LEGAL_LINKS.map(({ href, label }, index) => (
            <div key={href} className="flex items-center">
              <Link href={href} className="hover:underline">
                {t(legalKeyMap[label] ?? label)}
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
