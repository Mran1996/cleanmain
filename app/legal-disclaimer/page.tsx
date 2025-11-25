import type { Metadata } from 'next';
import { LegalDisclaimerContent } from "@/components/legal-disclaimer-content"

// SEO metadata for legal disclaimer page
export const metadata: Metadata = {
  title: 'Legal Disclaimer - Important Notice | Ask AI Legal™',
  description: 'Important legal disclaimer: Ask AI Legal provides AI-powered legal information and document generation but does not replace licensed legal advice. Understand the limitations and your responsibilities.',
  keywords: [
    'legal disclaimer',
    'AI legal limitations',
    'not legal advice',
    'attorney disclaimer',
    'legal information',
  ],
  openGraph: {
    title: 'Legal Disclaimer - Ask AI Legal™',
    description: 'Important legal disclaimer about our AI-powered legal services.',
    type: 'website',
    url: 'https://www.askailegal.com/legal-disclaimer',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/legal-disclaimer',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalDisclaimerPage() {
  return (
    <LegalDisclaimerContent />
  )
}
