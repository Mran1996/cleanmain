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
      
      {/* Hero Section with Headline and Subheadline */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-6">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Let us fight for you
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              We prepare your motion, response, appeal, or post-conviction filing in the correct court format, backed by real case law and delivered within 7 business days — so you can fight your case with confidence.
            </p>

            {/* Price Box */}
            <div className="mt-8 max-w-2xl mx-auto bg-green-50 border-2 border-green-200 rounded-lg p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-bold text-green-700">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span>$499 Flat Fee — No hidden costs</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-gray-700">
                <Clock className="w-6 h-6 text-green-600" />
                <span>Delivered in 7 business days or less</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-gray-700">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span>Free revisions & support included</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 space-y-2">
              <Link href="/pricing">
                <Button className="text-lg md:text-xl px-8 py-6 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                  Get Help Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm md:text-base text-gray-600 italic">
                Begin your case today with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Everything you need to win
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {WHATS_INCLUDED.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            From Intake to Court-Ready — Here's How It Works
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center gap-4 flex-1">
                <div className="w-24 h-24 rounded-full bg-green-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg">
                  {step.number}
                </div>
                <div className="text-center max-w-[200px]">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limits & Guarantee Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8">
            Limits & Guarantee
          </h2>
          
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div className="space-y-4 text-gray-700">
              <p className="text-lg">
                Covers one case or legal issue (up to <strong className="text-gray-900">150 pages</strong>, including exhibits).
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Additional cases or filings: <strong className="text-green-600">$499 each</strong>.</li>
                <li>Revisions beyond 3: <strong className="text-green-600">$99 each</strong>.</li>
              </ul>
            </div>

            {/* Confidence Guarantee Box */}
            <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-start gap-3 mb-3">
                <Lightbulb className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <h3 className="text-xl font-bold text-gray-900">Confidence Guarantee</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our legal-document platform is powered by advanced AI that <strong>scored in the top 10% on the Uniform Bar Exam</strong> — demonstrating professional-level legal reasoning and writing quality.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                You'll receive a court-ready, properly formatted document tailored to your case, along with a plain-language summary of your next steps. <strong>You deserve access to this level of legal strength — not just those who can afford an attorney.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Win Your Case?
          </h2>
          <p className="text-xl md:text-2xl text-green-50 max-w-2xl mx-auto">
            Get a professionally drafted, court-ready document for $499 — delivered in 7 business days or less.
          </p>
          <Link href="/pricing">
            <Button className="text-lg md:text-xl px-8 py-6 bg-white text-green-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg font-bold">
              Start My Legal Packet <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer Tagline */}
      <section className="py-8 bg-gray-900 text-white text-center">
        <p className="text-lg md:text-xl italic text-gray-300 max-w-2xl mx-auto">
          "When every word matters — let AI help you win your case."
        </p>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
