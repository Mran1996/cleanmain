import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import type { Metadata } from 'next';

// SEO metadata for terms page
export const metadata: Metadata = {
  title: 'Terms of Service - Legal Agreement | Ask AI Legal™',
  description: 'Read the Terms of Service for Ask AI Legal. Understand your rights, responsibilities, refund policy, dispute resolution, and our commitment to providing AI-powered legal assistance.',
  keywords: [
    'terms of service',
    'legal agreement',
    'user agreement',
    'service terms',
    'refund policy',
    'dispute resolution',
  ],
  openGraph: {
    title: 'Terms of Service - Ask AI Legal™',
    description: 'Terms of Service and user agreement for Ask AI Legal services.',
    type: 'website',
    url: 'https://www.askailegal.com/terms',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-600 mb-4">Last updated: April 28, 2025</p>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">1. Agreement to Terms</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                By accessing or using Ask AI Legal ("the Service"), you agree to be bound by these Terms
                of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                These Terms of Service constitute a legally binding agreement between you and Ask AI Legal
                Assistant regarding your use of the Service.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">2. Description of Service</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                Ask AI Legal provides AI-powered legal document assistance and information. The Service
                includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Document analysis and generation</li>
                <li>Legal information and guidance</li>
                <li>AI-powered legal assistant interactions</li>
                <li>Document storage and management</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2">
                <p className="text-yellow-800">
                  <strong>Important Notice:</strong> The Service provides legal information and assistance but does not
                  constitute legal advice. We are not a law firm and do not provide legal services. For legal advice,
                  please consult with a licensed attorney.
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">3. User Accounts</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">When creating an account, you agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">4. Payment Terms</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">By selecting a paid service, you agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Pay all applicable fees as they become due</li>
                <li>Provide valid payment information</li>
                <li>Authorize automatic billing for subscription services</li>
                <li>Accept our refund and cancellation policies</li>
              </ul>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                All fees are exclusive of taxes unless stated otherwise. Prices may change with 30 days notice.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Refund Policy</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                All purchases made through Ask AI Legal are final. We do not offer refunds for any digital products, services, or subscriptions once the transaction is completed. By using our services, you agree to this no-refund policy.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Dispute Resolution</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                Before initiating any formal legal action, you agree to first attempt to resolve any dispute, claim, or controversy relating to your use of the Ask AI Legal platform through informal discussion or mediation. If a resolution is not reached within thirty (30) days, the matter must be submitted to binding arbitration administered by the American Arbitration Association (AAA) under its applicable rules. Arbitration will be conducted in the State of Wyoming, unless both parties agree otherwise. Each party shall bear its own legal fees and costs unless the arbitrator decides otherwise.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                Litigation in court is permitted only to enforce an arbitration award or seek emergency injunctive relief.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Governing Law</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                These Terms of Use and any disputes arising from your use of Ask AI Legal shall be governed by and construed in accordance with the laws of the State of Wyoming, without regard to its conflicts of law principles. You agree that any legal proceedings permitted under these Terms shall be brought exclusively in the state or federal courts located in Wyoming.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">5. User Responsibilities</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Upload malicious code or content</li>
                <li>Interfere with the Service's operation</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">6. Intellectual Property</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                The Service and its original content (excluding user-provided content) remain the property of Ask AI Legal. You may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Copy or modify the Service's software</li>
                <li>Use our trademarks without permission</li>
                <li>Reproduce or distribute our content</li>
                <li>Reverse engineer our technology</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">7. Limitation of Liability</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                To the maximum extent permitted by law, Ask AI Legal shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Errors or inaccuracies in the Service</li>
                <li>Loss of data or profits</li>
                <li>Service interruptions or security breaches</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">8. Termination</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-0 mb-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activities</li>
                <li>Non-payment of fees</li>
                <li>Conduct that may harm the Service or other users</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">9. Changes to Terms</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
                new Terms on this page and updating the "Last updated" date.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                Your continued use of the Service after any changes constitutes acceptance of those changes.
              </p>
            </section>

            <div className="border-t border-gray-200 my-3"></div>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">10. Contact Us</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-2">
                If you have any questions about these Terms, please contact us at:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
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
