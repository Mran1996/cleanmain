import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { FeaturesContent } from "@/components/features-content"
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
        <FeaturesContent />
      </main>
      <Footer />
    </div>
  )
}
