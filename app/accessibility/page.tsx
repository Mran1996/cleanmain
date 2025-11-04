import type { Metadata } from 'next';

// SEO metadata for accessibility page
export const metadata: Metadata = {
  title: 'Accessibility Statement - Inclusive Legal Services | Ask AI Legal™',
  description: 'Ask AI Legal is committed to making our legal services accessible to everyone. Learn about our WCAG 2.1 Level AA compliance, accessibility features, and how we support users with disabilities.',
  keywords: [
    'accessibility statement',
    'WCAG compliance',
    'accessible legal services',
    'disability support',
    'inclusive design',
    'screen reader compatible',
  ],
  openGraph: {
    title: 'Accessibility Statement - Ask AI Legal™',
    description: 'Our commitment to accessible legal services for everyone.',
    type: 'website',
    url: 'https://www.askailegal.com/accessibility',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/accessibility',
  },
};

export default function AccessibilityPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Accessibility Statement</h1>

      <section className="space-y-6 text-sm text-gray-700 leading-6">
        <p>
          At <strong>Ask AI Legal™</strong>, we are committed to making our web application accessible to everyone,
          including people with disabilities. We strive to ensure that our services are inclusive and user-friendly for
          all individuals, regardless of their abilities or the technology they use.
        </p>

        <h2 className="text-lg font-semibold text-gray-800 mt-8">Our Commitment</h2>
        <p>
          We are actively working to conform with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards
          to improve accessibility across our platform. Our goal is to make sure users can navigate, understand, and
          interact with our legal assistant without barriers.
        </p>

        <h2 className="text-lg font-semibold text-gray-800 mt-8">Features That Support Accessibility</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Keyboard navigation support throughout the platform</li>
          <li>Readable color contrast across buttons and text</li>
          <li>Screen reader compatibility (using semantic HTML and ARIA attributes)</li>
          <li>Scalable text and responsive layout for all screen sizes</li>
          <li>Speech-to-text input option during legal chat interaction</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-800 mt-8">Ongoing Improvements</h2>
        <p>
          We regularly test and audit our site to identify and address accessibility issues. If any part of our website
          is difficult to use, we want to know so we can improve it.
        </p>

        <h2 className="text-lg font-semibold text-gray-800 mt-8">Need Help or Want to Report an Issue?</h2>
        <p>If you encounter any difficulty using our website or have suggestions for improvement, please contact us:</p>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
          <p>
            Email:{" "}
            <a href="mailto:support@askailegal.com" className="text-emerald-600 hover:underline">
              support@askailegal.com
            </a>
          </p>
          <p>Phone (voice/text): (888) 555-1212</p>
          <p>Mail: Ask AI Legal, 123 Justice Ave, Suite 4, Seattle, WA 98104</p>
        </div>

        <p className="text-xs text-gray-500">Last updated: April 29, 2025</p>
      </section>
    </main>
  )
}
