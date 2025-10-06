import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";
import { PRODUCTS } from "@/lib/stripe-config";

export function PricingSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 flex justify-center">
        <Card className="max-w-md mx-auto border-green-500 border shadow-md">
          <CardHeader className="text-center space-y-2">
            <div className="text-2xl font-semibold">AI Legal Premium — $179/month</div>
            <div className="text-3xl font-bold text-green-600">$179</div>
            <p className="text-gray-600 text-sm">Unlimited access to legal documents, case strategy, and real legal support — powered by AI trained on millions of real cases.</p>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
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

            <StripeCheckoutButton 
              plan={PRODUCTS.COURT_READY}
              className="w-full mt-4 text-white bg-green-600 hover:bg-green-700"
            >
              Purchase Now
            </StripeCheckoutButton>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
