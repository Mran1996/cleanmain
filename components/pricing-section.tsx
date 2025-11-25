"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";
import { PRODUCTS } from "@/lib/stripe-config";
import { useTranslation } from "@/utils/translations"

export function PricingSection({ isHomePage = false }: { isHomePage?: boolean }) {
  const { t } = useTranslation()
  return (
    <section className="bg-gray-50 py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            {t("pricing_headline")}
          </h1>
          {!isHomePage && (
            <div className="mt-4 sm:mt-6">
              <p className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t("pricing_subtitle")}</p>
              <p className="text-base sm:text-lg text-gray-600">{t("pricing_ai_label")}</p>
            </div>
          )}
        </div>
        
        <div className={`grid ${isHomePage ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6 sm:gap-8 max-w-5xl mx-auto ${!isHomePage ? 'items-stretch' : ''}`}>
          {/* Full Service Card - Only show on pricing page */}
          {!isHomePage && (
            <Card className="w-full border-emerald-500 border-2 shadow-lg relative flex flex-col ml-auto">
              <div className="absolute -top-4 sm:-top-5 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-emerald-500 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xl border-2 border-white">
                  {t("pricing_most_popular_badge")}
                </span>
              </div>
              <CardHeader className="text-center space-y-2 sm:space-y-3 pt-8 sm:pt-12 px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">🏆 {t("pricing_fullservice_title")}</div>
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600">$499</div>
                <p className="text-gray-600 text-xs sm:text-sm">{t("pricing_fullservice_desc")}</p>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6 flex flex-col flex-grow">
                <ul className="space-y-2 text-sm text-left text-gray-700">
                  <li>✅ {t("pricing_fullservice_b1")}</li>
                  <li>✅ {t("pricing_fullservice_b2")}</li>
                  <li>✅ {t("pricing_fullservice_b3")}</li>
                  <li>✅ {t("pricing_fullservice_b4")}</li>
                  <li>✅ {t("pricing_fullservice_b5")}</li>
                  <li>✅ {t("pricing_fullservice_b6")}</li>
                  <li>✅ {t("pricing_fullservice_b7")}</li>
                  <li>✅ {t("pricing_fullservice_b8")}</li>
                  <li>✅ {t("pricing_fullservice_b9")}</li>
                  <li>✅ {t("pricing_fullservice_b10")}</li>
                </ul>

                <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                  <p className="mb-2">🎯 <strong>{t("pricing_fullservice_p1_strong")}</strong> — {t("pricing_fullservice_p1_rest")}</p>
                  <p className="mb-2">⚖️ <strong>{t("pricing_fullservice_p2_strong")}</strong> {t("pricing_fullservice_p2_rest")}</p>
                  <p className="text-emerald-600 font-semibold pt-2">🟢 {t("pricing_fullservice_best_for")}</p>
                </div>

                <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                  <p className="text-center font-semibold">🧠 {t("pricing_not_law_firm")}</p>
                </div>

                <div className="flex-grow"></div>

                <StripeCheckoutButton 
                  plan={PRODUCTS.FULL_SERVICE}
                  className="w-full mt-4 text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  {t("cta_purchase_now")}
                </StripeCheckoutButton>
              </CardContent>
            </Card>
          )}

          {/* AI Legal Premium Card */}
          <Card className="w-full border-green-500 border shadow-lg flex flex-col">
            <CardHeader className="text-center space-y-2 sm:space-y-3 pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">📚 {t("pricing_pro_title")}</div>
              <div className="text-3xl sm:text-4xl font-bold text-green-600">$199</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">{t("pricing_pro_price_note")}</div>
              <p className="text-gray-600 text-xs sm:text-sm">{t("pricing_pro_desc")}</p>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 flex flex-col flex-grow">
              <ul className="space-y-2 text-sm text-left text-gray-700">
                <li>✅ {t("pricing_pro_b1")}</li>
                <li>✅ {t("pricing_pro_b2")}</li>
                <li>✅ {t("pricing_pro_b3")}</li>
                <li>✅ {t("pricing_pro_b4")}</li>
                <li>✅ {t("pricing_pro_b5")}</li>
                <li>✅ {t("pricing_pro_b6")}</li>
                <li>✅ {t("pricing_pro_b7")}</li>
              </ul>

              <div className="text-sm text-gray-700 pt-4 border-t border-gray-200">
                <p className="mb-2">🧠 <strong>{t("pricing_not_law_firm_strong")}</strong> — {t("pricing_not_law_firm_rest")}</p>
                <p className="mb-2">📄 {t("pricing_pro_p2")}</p>
                <p className="text-green-600 font-semibold pt-2">🟢 {t("pricing_pro_best_for")}</p>
              </div>

              <div className="flex-grow"></div>

              <StripeCheckoutButton 
                plan={PRODUCTS.COURT_READY}
                className="w-full mt-4 text-white bg-green-600 hover:bg-green-700"
              >
                {t("cta_purchase_now")}
              </StripeCheckoutButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
