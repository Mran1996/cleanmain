"use client"
import { useTranslation } from "@/utils/translations"

export function HowItWorks() {
  const { t } = useTranslation()
  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{t("how_title")}</h2>
          <p className="text-base sm:text-lg text-gray-600">{t("how_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-5xl mx-auto">
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Document" className="text-3xl sm:text-4xl">
                📄
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t("how_step1_title")}</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">{t("how_step1_desc")}</p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Brain" className="text-3xl sm:text-4xl">
                🧠
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t("how_step2_title")}</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">{t("how_step2_desc")}</p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Pen" className="text-3xl sm:text-4xl">
                ✍️
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t("how_step3_title")}</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">{t("how_step3_desc")}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
