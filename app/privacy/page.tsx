import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import type { Metadata } from 'next';

// SEO metadata for privacy page
export const metadata: Metadata = {
  title: 'Privacy Policy - Data Protection & Security | Ask AI Legal™',
  description: 'Learn how Ask AI Legal protects your personal information. We use encryption, secure storage, and never sell your data. Understand our data collection, usage, retention, and your privacy rights.',
  keywords: [
    'privacy policy',
    'data protection',
    'user privacy',
    'data security',
    'GDPR compliance',
    'personal information',
  ],
  openGraph: {
    title: 'Privacy Policy - Ask AI Legal™',
    description: 'Our commitment to protecting your personal information and privacy.',
    type: 'website',
    url: 'https://www.askailegal.com/privacy',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-gray-600 mb-6">Last updated: April 28, 2025</p>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
              <p className="text-base md:text-lg mb-2">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Name and contact information</li>
                <li>Account credentials</li>
                <li>Payment information</li>
                <li>Communications and feedback</li>
                <li>Documents and files you upload</li>
              </ul>

              <p className="text-base md:text-lg mb-2">
                We also automatically collect certain information when you use our service, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0">
                <li>Device and browser information</li>
                <li>Usage data and analytics</li>
                <li>IP address and location data</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
              <p className="text-base md:text-lg mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0">
                <li>Provide and improve our services</li>
                <li>Process your transactions</li>
                <li>Send you updates and communications</li>
                <li>Personalize your experience</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">3. Sharing Your Information</h2>
              <p className="text-base md:text-lg mb-2">We may share your information with:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Service providers and partners who assist in operating our service</li>
                <li>Legal authorities when required by law</li>
                <li>Other parties with your consent</li>
              </ul>
              <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg border border-green-200">
                We do not sell your personal information to third parties.
              </div>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">4. Data Security</h2>
              <p className="text-base md:text-lg mb-2">
                We implement appropriate technical and organizational security measures to protect your information,
                including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage and backup</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">5. Your Rights</h2>
              <p className="text-base md:text-lg mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Withdraw consent</li>
                <li>Data portability</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Data Retention and Deletion</h2>
              <p className="text-base md:text-lg mb-2">
                We retain this information only as long as necessary to provide our services and maintain your access to documents you've created.
              </p>
              <p className="text-base md:text-lg mb-2">
                You can request to have your data deleted at any time. Once we receive your request, we will permanently delete your name and email from our systems within a reasonable timeframe, unless retention is required for legal or operational reasons.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">6. Changes to This Policy</h2>
              <p className="text-base md:text-lg mb-2">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p className="text-base md:text-lg">
                Your continued use of our service after any changes to this Privacy Policy constitutes your acceptance
                of such changes.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">7. Contact Us</h2>
              <p className="text-base md:text-lg mb-2">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-2">
                <p className="font-medium">Ask AI Legal</p>
                <p>
                  Email:{" "}
                  <a href="mailto:support@askailegal.com" className="text-emerald-600 hover:underline">
                    support@askailegal.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
