"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/utils/translations"

export function FeaturesContent() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("features_header_title")}</h1>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">{t("features_header_desc")}</p>
      </div>

      <div className="flex justify-center gap-12 mb-16 flex-wrap">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
            <span className="text-5xl md:text-6xl">📤</span>
          </div>
          <span className="text-base md:text-lg text-gray-600 font-medium">{t("features_icon_upload")}</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
            <span className="text-5xl md:text-6xl">💬</span>
          </div>
          <span className="text-base md:text-lg text-gray-600 font-medium">{t("features_icon_ask_ai")}</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
            <span className="text-5xl md:text-6xl">📄</span>
          </div>
          <span className="text-base md:text-lg text-gray-600 font-medium">{t("features_icon_get_document")}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_court_ready_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_court_ready_desc")}</p>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_instant_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_instant_desc")}</p>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_export_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_export_desc")}</p>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_ai_chat_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_ai_chat_desc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_case_law_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_case_law_desc")}</p>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-6 bg-white shadow-sm">
            <h4 className="font-bold text-md text-gray-800 mb-2">{t("features_card_secure_title")}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{t("features_card_secure_desc")}</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-green-500">✅</span>
          <span className="text-gray-600 font-semibold">{t("features_trusted_title")}</span>
        </div>
        <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">{t("features_trusted_desc")}</p>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-md text-lg font-semibold">
          <Link href="/pricing">{t("features_cta_generate")}</Link>
        </Button>
      </div>
    </div>
  )
}
