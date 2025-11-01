import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";
import { PRODUCTS } from "@/lib/stripe-config";

export function PricingSection({ isHomePage = false }: { isHomePage?: boolean }) {


  console.log(PRODUCTS,"PRODUCTS")
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            "Justice Shouldn't Be Out of Reach<br />
            — Let AI Level the Playing Field."
          </h1>
          {!isHomePage && (
            <div className="mt-6">
              <p className="text-xl font-bold text-gray-900 mb-2">Real Results. Real Justice. No Lawyer Required.</p>
              <p className="text-lg text-gray-600">Artificial Intelligence</p>
            </div>
          )}
        </div>
        
        <div className={`grid grid-cols-1 ${isHomePage ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-8 ${isHomePage ? 'md:gap-8' : 'md:gap-0 md:-space-x-4'} max-w-6xl mx-auto px-4 ${!isHomePage ? 'items-stretch' : ''}`}>
          {/* Full Service Card - Only show on pricing page */}
          {!isHomePage && (
            <Card className="w-full max-w-md mx-auto border-emerald-500 border-2 shadow-lg relative mb-8 md:mb-0 flex flex-col">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-emerald-500 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-xl border-2 border-white">
                  MOST POPULAR
                </span>
              </div>
              <CardHeader className="text-center space-y-3 pt-12">
                <div className="text-2xl font-bold text-gray-900">🏆 Full Service Legal Support</div>
                <div className="text-4xl font-bold text-emerald-600">$499</div>
                <p className="text-gray-600 text-sm">Complete legal document preparation with white-glove service — we handle everything for you.</p>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 flex flex-col flex-grow">
                <ul className="space-y-2 text-sm text-left text-gray-700">
                  <li>✅ Complete legal document drafting (up to 150 pages)</li>
                  <li>✅ AI + human review for accuracy and formatting</li>
                  <li>✅ State-specific case law research included</li>
                  <li>✅ Case Success Analysis — legal strategy + projection</li>
                  <li>✅ Up to 3 free revisions within 14 days</li>
                  <li>✅ Email + Phone Support</li>
                  <li>✅ Email or physical mail delivery</li>
                  <li>✅ 7 business day turnaround</li>
                  <li>✅ Your own hearing prep script — exactly what to say in court for a winning edge</li>
                  <li>✅ Professional legal document support</li>
                </ul>

                <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                  <p className="mb-2">🎯 <strong>Perfect for complex cases</strong> — we gather all documents and handle the entire process.</p>
                  <p className="mb-2">⚖️ <strong>Court-ready documents</strong> with professional formatting and legal citations.</p>
                  <p className="text-emerald-600 font-semibold pt-2">🟢 Best for: Criminal defense, civil litigation, family law, and cases requiring expert preparation.</p>
                </div>

                <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                  <p className="text-center font-semibold">🧠 We're not a law firm — we're faster, always available, and built to get you results.</p>
                </div>

                <div className="flex-grow"></div>

                <StripeCheckoutButton 
                  plan={PRODUCTS.FULL_SERVICE}
                  className="w-full mt-4 text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Purchase Now
                </StripeCheckoutButton>
              </CardContent>
            </Card>
          )}

          {/* AI Legal Premium Card */}
          <Card className="w-full max-w-md mx-auto border-green-500 border shadow-lg flex flex-col">
            <CardHeader className="text-center space-y-3 pt-6">
              <div className="text-2xl font-bold text-gray-900">📚 AI Legal Pro</div>
              <div className="text-4xl font-bold text-green-600">$199</div>
              <div className="text-sm text-gray-500 font-medium">$199 monthly cancel anytime</div>
              <p className="text-gray-600 text-sm">Unlimited access to legal documents, case strategy, and real legal support — powered by AI trained on millions of real cases.</p>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 flex flex-col flex-grow">
              <ul className="space-y-2 text-sm text-left text-gray-700">
                <li>✅ Unlimited legal documents (up to 150 pages each)</li>
                <li>✅ Unlimited AI-powered revisions — update anytime</li>
                <li>✅ Detailed legal response built around your facts</li>
                <li>✅ Real case law embedded to strengthen your draft</li>
                <li>✅ Case Success Analysis — legal strategy + projection</li>
                <li>✅ Delivered in PDF + DOCX formats</li>
                <li>✅ Email + Phone Support for platform and AI help</li>
              </ul>

              <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                <p className="mb-2">🧠 <strong>We're not a law firm</strong> — we're faster, always available, and built to get you results.</p>
                <p className="mb-2">📄 You'll receive a full legal draft with citations, ready to review, edit, and file on your terms.</p>
                <p className="text-green-600 font-semibold pt-2">🟢 Best for post-conviction relief, criminal motions, civil filings, and people fighting without a lawyer.</p>
              </div>

              <div className="flex-grow"></div>

              <StripeCheckoutButton 
                plan={PRODUCTS.COURT_READY}
                className="w-full mt-4 text-white bg-green-600 hover:bg-green-700"
              >
                Purchase Now
              </StripeCheckoutButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
