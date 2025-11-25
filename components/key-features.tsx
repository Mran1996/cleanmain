"use client"
import { useTranslation } from "@/utils/translations"

export function KeyFeatures() {
  const { t } = useTranslation()
  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">{t("features_title")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-x-16 md:gap-y-12 max-w-5xl mx-auto">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Scale" className="text-xl sm:text-2xl">
                ⚖️
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_precision_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_precision_desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Brain" className="text-xl sm:text-2xl">
                🧠
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_intake_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_intake_desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Pen" className="text-xl sm:text-2xl">
                ✍️
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_court_ready_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_court_ready_desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Upload" className="text-xl sm:text-2xl">
                📤
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_doc_upload_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_doc_upload_desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Book" className="text-xl sm:text-2xl">
                📚
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_case_law_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_case_law_desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="Clock" className="text-xl sm:text-2xl">
                🕒
              </span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-emerald-600 mb-1.5 sm:mb-2">{t("features_always_on_title")}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t("features_always_on_desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
