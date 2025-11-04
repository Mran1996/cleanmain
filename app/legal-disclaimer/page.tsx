import type { Metadata } from 'next';

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
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Legal Disclaimer</h1>

      <section className="space-y-6 text-sm text-gray-700 leading-6">
        <p>
          The information provided by <strong>Ask AI Legal™</strong> is for general informational purposes only and is
          not intended to be a substitute for legal advice from a licensed attorney. While our platform uses advanced
          artificial intelligence to assist with document generation, legal summaries, and general guidance, we do not
          offer legal representation, nor do we act as your attorney.
        </p>

        <p>
          Use of this website or any materials provided by Ask AI Legal does not create an attorney-client
          relationship. No user of this site should act or refrain from acting based on information provided without
          seeking legal counsel from a licensed attorney in your jurisdiction.
        </p>

        <p>
          All AI-generated responses are based on the information you provide and applicable public legal information.
          The accuracy and applicability of generated documents or legal summaries are not guaranteed. You are solely
          responsible for reviewing, modifying, and ensuring the accuracy and appropriateness of any documents before
          submission or use in a legal context.
        </p>

        <p>
          Ask AI Legal is not responsible for any loss, liability, claim, or damage related to your use of this website
          or reliance on its content. This platform is not a law firm and does not file court documents on your behalf.
        </p>

        <p>
          If you require legal advice, legal representation, or have questions about your specific situation, please
          consult a qualified attorney licensed to practice law in your state.
        </p>

        <p className="text-xs text-gray-500">Last updated: April 29, 2025</p>
      </section>
    </main>
  )
}
