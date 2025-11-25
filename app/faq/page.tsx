import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQContent } from "@/components/faq-content"

// SEO metadata for FAQ page
export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Ask AI Legal™',
  description: 'Get answers to common questions about Ask AI Legal™. Learn how our AI-powered legal assistant works, what types of cases we support, pricing, document generation, and more.',
  keywords: [
    'legal AI FAQ',
    'legal assistant questions',
    'how does AI legal work',
    'legal document help',
    'legal AI pricing',
  ],
  openGraph: {
    title: 'FAQ - Ask AI Legal™',
    description: 'Common questions about our AI-powered legal assistant',
    url: 'https://www.askailegal.com/faq',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/faq',
  },
};

export default function FAQPage() {
  // FAQ structured data for rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What types of legal issues can Ask AI Legal help me with?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support a wide range of legal matters including Housing (eviction notices, repair demands, security deposits, lease disputes), Family (divorce filings, custody agreements, child support), Employment (wage disputes, discrimination, wrongful termination), Civil (lawsuits, small claims, settlements), Immigration (visa requests, green card issues), and Criminal defense responses.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a lawyer to use Ask AI Legal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Ask AI Legal is designed for self-represented individuals who need help drafting documents or understanding their legal options. We do not offer legal representation, but we make it easy to prepare professional legal paperwork.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upload evidence or documents to get better results?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can upload leases, contracts, pay stubs, or other legal paperwork. Our assistant will use that information to generate more accurate letters or motions.',
        },
      },
      {
        '@type': 'Question',
        name: 'What makes Ask AI Legal different from a lawyer or other apps?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Unlike traditional legal software, we use AI trained in legal logic and state-specific formatting. You don\'t have to fill in templates — Ask AI Legal creates your documents based on your answers, tone, and goals.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens after I generate my legal document?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can edit, save, download, or pay $25 to have us mail it to the opposing party. We guide you through your next legal step with confidence messaging and suggestions.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <FAQContent />
      </div>
      <Footer />
    </>
  )
}
