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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Why Ask AI Legal Works So Well</h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Upload documents, ask the AI questions, and get a dated legal document — ready to file.
            </p>
          </div>

          {/* Feature Icons */}
          <div className="flex justify-center gap-8 mb-16 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-gray-600">📤</span>
              </div>
              <span className="text-sm text-gray-600">Upload</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-gray-600">💬</span>
              </div>
              <span className="text-sm text-gray-600">Ask AI</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-gray-600">📄</span>
              </div>
              <span className="text-sm text-gray-600">Get Document</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 mb-16">

            {/* Top 2 rows (4 blocks) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Precision AI Document Drafting</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Instantly create full-length legal documents — formatted, editable, and customized to your facts.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Real-Time Response</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Upload a court form or legal notice and get your first draft in minutes — not hours or days.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Easy Document Delivery</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Download or email your documents — ready to file, print, or mail from anywhere.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Legal Chat That Learns</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Our AI asks smart, strategic questions to fully understand your case and build the right response.
                </p>
              </div>
            </div>

            {/* Bottom 2 blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Built-In Case Law (When Needed)</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Add citations and legal references that match your facts — no extra fees, no fluff.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h4 className="font-bold text-md text-gray-800 mb-2">Safe, Private, and 24/7</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  No waiting rooms. No office visits. Get legal help anytime — confidentially and on your terms.
                </p>
              </div>
            </div>

          </div>

          {/* Trusted By Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-green-500">✅</span>
              <span className="text-gray-600">Trusted by thousands of self-represented users</span>
            </div>
            <Link href="/pricing">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-md">Start Now</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
