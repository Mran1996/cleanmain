import Link from "next/link"
import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import type { Metadata } from 'next';

// SEO metadata for features page
export const metadata: Metadata = {
  title: 'Features - AI-Powered Legal Document Generation | Ask AI Legal™',
  description: 'Discover how Ask AI Legal works: Upload documents, ask AI questions, and get court-ready legal documents instantly. Precision AI drafting, real-time responses, built-in case law, and 24/7 access.',
  keywords: [
    'AI legal document generation',
    'legal document software',
    'AI lawyer features',
    'legal document creation',
    'court-ready documents',
    'legal AI technology',
    'document automation',
    'legal assistance features',
  ],
  openGraph: {
    title: 'Features - AI-Powered Legal Document Generation',
    description: 'Upload documents, ask AI questions, and get court-ready legal documents instantly.',
    type: 'website',
    url: 'https://www.askailegal.com/features',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features - Ask AI Legal™',
    description: 'AI-powered legal document generation with real-time responses and built-in case law.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/features',
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AI-Powered Legal Document Generator That Saves Time and Money</h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Transform your legal case into a professionally drafted, court-ready document in minutes — not days. Our AI legal assistant analyzes your facts, applies state-specific legal standards, and generates filing-ready documents tailored to your jurisdiction. No legal background required.
            </p>
          </div>

          {/* Feature Icons */}
          <div className="flex justify-center gap-12 mb-16 flex-wrap">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">📤</span>
              </div>
              <span className="text-base md:text-lg text-gray-600 font-medium">Upload</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">💬</span>
              </div>
              <span className="text-base md:text-lg text-gray-600 font-medium">Ask AI</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">📄</span>
              </div>
              <span className="text-base md:text-lg text-gray-600 font-medium">Get Document</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 mb-16">

            {/* Top 2 rows (4 blocks) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Court-Ready Legal Document Generation</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Generate comprehensive legal documents formatted to your state's official court standards. Our AI legal document generator produces motions, responses, petitions, and filings that meet judicial requirements — complete with proper citations, formatting, and legal language tailored to your specific case facts and jurisdiction.
                </p>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Instant Legal Document Generation — Minutes, Not Days</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Get your first professionally drafted legal document in minutes instead of waiting days or weeks for attorney responses. Upload your court notice, legal forms, or case documents — our AI legal assistant instantly analyzes your situation and generates a complete, filing-ready response. Perfect for urgent deadlines and time-sensitive legal matters.
                </p>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Professional Document Export & Delivery</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Download your court-ready legal documents in multiple formats (PDF, Word, DOCX) — instantly formatted for filing, printing, or email submission. Export complete legal packets with all exhibits, supporting documents, and filing instructions. Access your documents 24/7 from any device, anywhere you need them.
                </p>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Intelligent Legal AI Chat Assistant</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Our AI legal assistant conducts intelligent case analysis by asking strategic, jurisdiction-aware questions tailored to your legal issue. The system learns your case details, identifies key legal arguments, and builds the strongest possible response — leveraging insights from millions of successful legal filings to guide your strategy.
                </p>
              </div>
            </div>

            {/* Bottom 2 blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">State-Specific Case Law Research & Citations</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Strengthen your legal documents with verified case law citations, statutory references, and precedents relevant to your state and legal issue. Our AI automatically includes authoritative legal research that matches your facts — all included at no extra cost. Get law-firm quality citations without the attorney fees.
                </p>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Secure, Confidential & Available 24/7</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Access professional legal document preparation anytime, anywhere — with enterprise-grade security and complete confidentiality. No waiting rooms, no office visits, no scheduling delays. Get instant legal help for eviction defense, family law matters, employment disputes, and more — all from the privacy of your home, on your timeline.
                </p>
              </div>
            </div>

          </div>

          {/* Trusted By Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-green-500">✅</span>
              <span className="text-gray-600 font-semibold">Trusted by thousands of self-represented litigants nationwide</span>
            </div>
            <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of Americans who've successfully defended their rights, filed winning motions, and navigated the legal system confidently with AI-powered legal document preparation.
            </p>
            <Link href="/pricing">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-md text-lg font-semibold">Generate My Legal Document Now</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
