import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-center">What You're Paying For</h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto text-center mb-12">
              See exactly what your plan includes—court-ready documents, legal arguments, and optional research
              strategy.
            </p>

            {/* Legal Document Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-emerald-600 mt-1">
                  <span className="text-2xl">📄</span>
                </div>
                <h2 className="text-2xl font-semibold text-emerald-600">What Is a Legal Document?</h2>
              </div>
              <p className="mb-6 text-gray-700">
                A legal document is a professionally written letter or filing that protects your rights, explains your
                situation, or demands action. Each one is formatted to match legal standards and your state.
              </p>
              <ul className="space-y-2 list-disc pl-6 text-gray-700">
                <li>Eviction Response Letter</li>
                <li>Wage Theft Demand Letter</li>
                <li>Credit Dispute Letter (FCRA)</li>
                <li>Letter to Employer or Landlord</li>
                <li>Notice of Intent to Sue</li>
              </ul>
            </div>

            {/* Motion Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-emerald-600 mt-1">
                  <span className="text-2xl">⚖️</span>
                </div>
                <h2 className="text-2xl font-semibold text-emerald-600">What Is a Motion?</h2>
              </div>
              <p className="mb-6 text-gray-700">
                A motion is a legal request filed in court asking the judge to take specific action—like dismissing a
                case, delaying a hearing, or granting relief. Motions are written in a formal, court-ready format.
              </p>
              <ul className="space-y-2 list-disc pl-6 text-gray-700">
                <li>Motion to Dismiss</li>
                <li>Motion for Extension of Time</li>
                <li>Motion for Default Judgment</li>
                <li>Motion to Compel</li>
                <li>Motion to Vacate</li>
              </ul>
            </div>

            {/* Legal Strategy Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-emerald-600 mt-1">
                  <span className="text-2xl">🧠</span>
                </div>
                <h2 className="text-2xl font-semibold text-emerald-600">What Is Legal Strategy?</h2>
              </div>
              <p className="mb-6 text-gray-700">
                Premium and Expert plans include AI-powered strategy—like summaries, case strengths, and citation
                matching.
              </p>
              <ul className="space-y-2 list-disc pl-6 text-gray-700">
                <li>Case Strength Score (1-100)</li>
                <li>Plain-language legal explanation</li>
                <li>Suggested arguments based on your facts</li>
                <li>Optional citations to state law</li>
              </ul>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-600 mb-4 text-left">💼 Ask AI Legal vs. Traditional Attorney Fees</h3>

              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-3 font-medium border border-gray-200">Feature</th>
                    <th className="p-3 font-medium text-green-700 border border-gray-200">Ask AI Legal ($199)</th>
                    <th className="p-3 font-medium text-gray-600 border border-gray-200">Attorney (Avg)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr>
                    <td className="p-3 border border-gray-200">Full Legal Draft (Letter or Motion)</td>
                    <td className="p-3 border border-gray-200">✅ Included</td>
                    <td className="p-3 border border-gray-200">$500–$1,200+</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Real Case Law & Citations</td>
                    <td className="p-3 border border-gray-200">✅ Always Included</td>
                    <td className="p-3 border border-gray-200">⚠️ Sometimes Extra</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Case Success Analysis</td>
                    <td className="p-3 border border-gray-200">✅ AI-Powered Projection</td>
                    <td className="p-3 border border-gray-200">❌ Not Provided</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Flat Rate — No Surprises</td>
                    <td className="p-3 border border-gray-200">✅ One-Time $199</td>
                    <td className="p-3 border border-gray-200">❌ Hourly Billing ($200–$400/hr)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Back to Pricing Link */}
            <div className="text-center pt-8">
              <Link href="/pricing" className="inline-flex items-center text-emerald-600 hover:text-emerald-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
