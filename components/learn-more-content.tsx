"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/utils/translations"

export function LearnMoreContent() {
  const { t } = useTranslation()
  const included = [
    t("learn_included_court_ready"),
    t("learn_included_precision"),
    t("learn_included_case_law"),
    t("learn_included_case_success"),
    t("learn_included_hearing_script"),
    t("learn_included_revisions"),
    t("learn_included_delivery"),
    t("learn_included_support"),
  ]
  const steps = [
    { title: t("learn_step1_title"), desc: t("learn_step1_desc") },
    { title: t("learn_step2_title"), desc: t("learn_step2_desc") },
    { title: t("learn_step3_title"), desc: t("learn_step3_desc") },
    { title: t("learn_step4_title"), desc: t("learn_step4_desc") },
    { title: t("learn_step5_title"), desc: t("learn_step5_desc") },
  ]
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("learn_hero_title")}</h1>
          <p className="text-gray-600 text-lg">{t("learn_hero_subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="font-semibold">{t("learn_price_line")}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="font-semibold">{t("learn_delivery_line")}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="font-semibold">{t("learn_support_line")}</p>
          </div>
        </div>
        <div className="text-center mb-12">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold">
            <Link href="/pricing">{t("learn_cta")}</Link>
          </Button>
          <p className="text-sm text-gray-600 mt-2">{t("learn_cta_note")}</p>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("learn_included_title")}</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {included.map((item) => (
              <li key={item} className="flex items-start">
                <span className="text-emerald-600 mr-2">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("learn_how_title")}</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.title} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-700 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-3">{t("learn_limits_title")}</h2>
          <ul className="list-disc ml-6 text-gray-700">
            <li>{t("learn_limits_case_coverage")}</li>
            <li>{t("learn_limits_additional_cases")}</li>
            <li>{t("learn_limits_revisions")}</li>
          </ul>
          <div className="mt-4">
            <h3 className="font-semibold mb-1">{t("learn_confidence_title")}</h3>
            <p className="text-gray-700 text-sm">{t("learn_confidence_desc1")}</p>
            <p className="text-gray-700 text-sm mt-2">{t("learn_confidence_desc2")}</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">{t("learn_bottom_title")}</h2>
          <p className="text-gray-700 mb-4">{t("learn_bottom_desc")}</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold">
            <Link href="/pricing">{t("learn_cta")}</Link>
          </Button>
          <p className="text-sm text-gray-500 mt-3">{t("learn_footer_quote")}</p>
        </div>
      </div>
    </div>
  )
}
