"use client"
import { FileText, Users, Briefcase, Scale, Globe, Gavel, HelpCircle, Upload, Brain, FileOutput } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslation } from "@/utils/translations"

export function FAQContent() {
  const { t } = useTranslation()

  return (
    <main className="flex-grow">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-12 text-center">{t("faq_title")}</h1>

          <div className="mb-12 border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="text-emerald-600 mt-1 flex-shrink-0" />
              <h2 className="text-xl font-semibold">{t("faq_q1_title")}</h2>
            </div>
            <div className="ml-9">
              <p className="mb-4">{t("faq_q1_intro")}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_housing_label")}</span> {t("faq_q1_housing_text")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_family_label")}</span> {t("faq_q1_family_text")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_employment_label")}</span> {t("faq_q1_employment_text")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Scale className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_civil_label")}</span> {t("faq_q1_civil_text")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Globe className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_immigration_label")}</span> {t("faq_q1_immigration_text")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Gavel className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <span className="font-medium">{t("faq_q1_criminal_label")}</span> {t("faq_q1_criminal_text")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12 border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <HelpCircle className="text-emerald-600 mt-1 flex-shrink-0" />
              <h2 className="text-xl font-semibold">{t("faq_q2_title")}</h2>
            </div>
            <div className="ml-9">
              <p>{t("faq_q2_text")}</p>
            </div>
          </div>

          <div className="mb-12 border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <Upload className="text-emerald-600 mt-1 flex-shrink-0" />
              <h2 className="text-xl font-semibold">{t("faq_q3_title")}</h2>
            </div>
            <div className="ml-9">
              <p>{t("faq_q3_text")}</p>
            </div>
          </div>

          <div className="mb-12 border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="text-emerald-600 mt-1 flex-shrink-0" />
              <h2 className="text-xl font-semibold">{t("faq_q4_title")}</h2>
            </div>
            <div className="ml-9">
              <p>{t("faq_q4_text")}</p>
            </div>
          </div>

          <div className="mb-12 border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <FileOutput className="text-emerald-600 mt-1 flex-shrink-0" />
              <h2 className="text-xl font-semibold">{t("faq_q5_title")}</h2>
            </div>
            <div className="ml-9">
              <p>{t("faq_q5_text")}</p>
            </div>
          </div>

          <div className="text-center mt-16 mb-12">
            <h2 className="text-2xl font-bold mb-4">{t("faq_more_title")}</h2>
            <p className="mb-6">{t("faq_more_text")}</p>
            <Link href="/contact">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                {t("faq_contact_button")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
