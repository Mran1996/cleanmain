"use client"
import Link from "next/link"
import { useTranslation } from "@/utils/translations"

export function ExamplesContent() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">{t("examples_title")}</h1>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto text-center mb-12">
          {t("examples_subtitle")}
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-emerald-600 mt-1">
              <span className="text-2xl">📄</span>
            </div>
            <h2 className="text-2xl font-semibold text-emerald-600">{t("examples_doc_title")}</h2>
          </div>
          <p className="mb-6 text-gray-700">{t("examples_doc_desc")}</p>
          <ul className="space-y-2 list-disc pl-6 text-gray-700">
            <li>{t("examples_doc_item1")}</li>
            <li>{t("examples_doc_item2")}</li>
            <li>{t("examples_doc_item3")}</li>
            <li>{t("examples_doc_item4")}</li>
            <li>{t("examples_doc_item5")}</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-emerald-600 mt-1">
              <span className="text-2xl">⚖️</span>
            </div>
            <h2 className="text-2xl font-semibold text-emerald-600">{t("examples_motion_title")}</h2>
          </div>
          <p className="mb-6 text-gray-700">{t("examples_motion_desc")}</p>
          <ul className="space-y-2 list-disc pl-6 text-gray-700">
            <li>{t("examples_motion_item1")}</li>
            <li>{t("examples_motion_item2")}</li>
            <li>{t("examples_motion_item3")}</li>
            <li>{t("examples_motion_item4")}</li>
            <li>{t("examples_motion_item5")}</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-emerald-600 mt-1">
              <span className="text-2xl">🧠</span>
            </div>
            <h2 className="text-2xl font-semibold text-emerald-600">{t("examples_strategy_title")}</h2>
          </div>
          <p className="mb-6 text-gray-700">{t("examples_strategy_desc")}</p>
          <ul className="space-y-2 list-disc pl-6 text-gray-700">
            <li>{t("examples_strategy_item1")}</li>
            <li>{t("examples_strategy_item2")}</li>
            <li>{t("examples_strategy_item3")}</li>
            <li>{t("examples_strategy_item4")}</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-600 mb-4 text-left">{t("examples_table_title")}</h3>
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 font-medium border border-gray-200">{t("examples_table_header_feature")}</th>
                <th className="p-3 font-medium text-green-700 border border-gray-200">{t("examples_table_header_ask_ai")}</th>
                <th className="p-3 font-medium text-gray-600 border border-gray-200">{t("examples_table_header_attorney")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              <tr>
                <td className="p-3 border border-gray-200">{t("examples_table_row_full_doc")}</td>
                <td className="p-3 border border-gray-200">✅ {t("examples_table_cell_included")}</td>
                <td className="p-3 border border-gray-200">$500–$1,200+</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border border-gray-200">{t("examples_table_row_case_law")}</td>
                <td className="p-3 border border-gray-200">✅ {t("examples_table_cell_always_included")}</td>
                <td className="p-3 border border-gray-200">⚠️ {t("examples_table_cell_sometimes_extra")}</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-200">{t("examples_table_row_case_success")}</td>
                <td className="p-3 border border-gray-200">✅ {t("examples_table_cell_ai_projection")}</td>
                <td className="p-3 border border-gray-200">❌ {t("examples_table_cell_not_provided")}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border border-gray-200">{t("examples_table_row_flat_rate")}</td>
                <td className="p-3 border border-gray-200">✅ {t("examples_table_cell_one_time_199")}</td>
                <td className="p-3 border border-gray-200">❌ {t("examples_table_cell_hourly_billing")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center pt-8">
          <Link href="/pricing" className="inline-flex items-center text-emerald-600 hover:text-emerald-700">
            <span className="mr-2">←</span>
            {t("examples_back_to_pricing")}
          </Link>
        </div>
      </div>
    </div>
  )
}
