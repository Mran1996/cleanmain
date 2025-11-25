/**
 * Learn More Page - Full Service Options
 * 
 * This page showcases the comprehensive full service offering that includes:
 * - Professionally drafted legal documents
 * - Court-ready formatting
 * - Case law research
 * - Case success analysis
 * - Hearing prep scripts
 * - Free revisions and support
 * 
 * Designed to convert users from self-service to full service options.
 */

import { Navigation } from "@/components/navigation"
import { ServiceBanner } from "@/components/service-banner"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { FileText, Scale, CheckCircle, Brain, Mic, RefreshCcw, Mail, MessageCircle, Clock, Shield, ArrowRight, FileCheck, TrendingUp, User, Lightbulb, Gavel, DollarSign } from "lucide-react"
import Link from "next/link"
import { LearnMoreContent } from "@/components/learn-more-content"
import type { Metadata } from 'next';

// SEO metadata for learn more page
export const metadata: Metadata = {
  title: 'Full Service Legal Support - AI + Human Expert Legal Team | Ask AI Legal™',
  description: 'Get comprehensive legal support with our Full Service package ($499): AI-powered analysis, court-ready documents, hearing scripts, expert review, and 3 free revisions. Bar-certified AI + human legal expertise.',
  keywords: [
    'full service legal',
    'complete legal support',
    'legal document preparation',
    'court hearing preparation',
    'AI legal team',
    'white glove legal service',
    'legal case analysis',
    'hearing scripts',
  ],
  openGraph: {
    title: 'Full Service Legal Support - Ask AI Legal™',
    description: 'Complete legal support: AI analysis + expert review + court preparation. Starting at $499.',
    type: 'website',
    url: 'https://www.askailegal.com/learn-more',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full Service Legal Support - Ask AI Legal™',
    description: 'AI + human legal team for complete case preparation.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/learn-more',
  },
};

const WHATS_INCLUDED = [
  {
    icon: FileText,
    text: "Court-Ready Drafting — Formatted to your state's official filing standards."
  },
  {
    icon: Scale,
    text: "AI + Human Precision — Reviewed for tone, accuracy, and clarity."
  },
  {
    icon: CheckCircle,
    text: "Real Case Law Research — Strengthen your case with verified citations."
  },
  {
    icon: TrendingUp,
    text: "Case Success Analysis — Predictive insight into your legal position."
  },
  {
    icon: Mic,
    text: "Hearing Prep Script — Know exactly what to say in court."
  },
  {
    icon: RefreshCcw,
    text: "3 Free Revisions — Perfect your filing before submission."
  },
  {
    icon: Mail,
    text: "Email or Mail Delivery — Digital packet or printed copy (add $25)."
  },
  {
    icon: MessageCircle,
    text: "Ongoing Support — Get updates and answers from our team anytime."
  }
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    number: "1",
    title: "Submit Your Info",
    description: "Provide your name and case details."
  },
  {
    number: "2",
    title: "AI + Legal Review",
    description: "We analyze your facts and strategy."
  },
  {
    number: "3",
    title: "Professional Drafting",
    description: "We prepare your filing in your state's legal format."
  },
  {
    number: "4",
    title: "Review & Revisions",
    description: "Up to 3 free edits within 14 days."
  },
  {
    number: "5",
    title: "Delivery",
    description: "Get your final packet in 7 business days or less."
  }
] as const;

export default function LearnMorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <Navigation />
      
      {/* Service Banner */}
      <ServiceBanner />
      <LearnMoreContent />

      {/* Footer */}
      <Footer />
    </div>
  )
}
