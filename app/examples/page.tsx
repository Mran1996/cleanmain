import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { ExamplesContent } from "@/components/examples-content"
import type { Metadata } from 'next';

// SEO metadata for examples page
export const metadata: Metadata = {
  title: 'Examples & Pricing - Legal Document Samples | Ask AI Legal™',
  description: 'See what you get: court-ready legal documents, motions, and legal strategy. Compare our $199 flat rate vs traditional attorney fees ($500-$1,200+). Real case law, AI-powered analysis included.',
  keywords: [
    'legal document examples',
    'motion samples',
    'legal document pricing',
    'attorney fee comparison',
    'court-ready documents',
    'legal letter examples',
    'AI legal strategy',
  ],
  openGraph: {
    title: 'Legal Document Examples & Pricing - Ask AI Legal™',
    description: 'See exactly what your plan includes - court-ready documents, legal arguments, and optional research strategy.',
    type: 'website',
    url: 'https://www.askailegal.com/examples',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Document Examples - Ask AI Legal™',
    description: 'Court-ready legal documents starting at $199.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/examples',
  },
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <ExamplesContent />
      </main>
      <Footer />
    </div>
  )
}
