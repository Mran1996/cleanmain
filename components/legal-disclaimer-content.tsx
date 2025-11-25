"use client"
import { useTranslation } from "@/utils/translations"

export function LegalDisclaimerContent() {
  const { t } = useTranslation()
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("legal_title")}</h1>
      <section className="space-y-6 text-sm text-gray-700 leading-6">
        <p>{t("legal_p1")}</p>
        <p>{t("legal_p2")}</p>
        <p>{t("legal_p3")}</p>
        <p>{t("legal_p4")}</p>
        <p>{t("legal_p5")}</p>
        <p className="text-xs text-gray-500">{t("legal_last_updated")}</p>
      </section>
    </main>
  )
}
