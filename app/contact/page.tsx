import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { ContactContent } from "@/components/contact-content"
import type { Metadata } from 'next';

// SEO metadata for contact page
export const metadata: Metadata = {
  title: 'Contact Us - Get Legal Help & Support | Ask AI Legal™',
  description: 'Contact Ask AI Legal for support, questions, or legal assistance. Reach us at support@askailegal.com or call 425-273-0871. We\'re here to help with your legal needs 24/7.',
  keywords: [
    'contact legal support',
    'legal help contact',
    'AI legal assistance',
    'customer support',
    'legal questions',
    'get legal help',
  ],
  openGraph: {
    title: 'Contact Us - Ask AI Legal™',
    description: 'Get in touch with our team for legal support and assistance.',
    type: 'website',
    url: 'https://www.askailegal.com/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Ask AI Legal™',
    description: 'Reach out for legal help and support.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow">
        <ContactContent />
      </main>
      <Footer />
    </div>
  )
}
