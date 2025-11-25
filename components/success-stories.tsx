"use client"
import { useTranslation } from "@/utils/translations"

export function SuccessStories() {
  const { t } = useTranslation()
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{t("stories_title")}</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-1 px-2">{t("stories_subtitle")}</p>
        </div>
        <div className="bg-white py-2 text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-medium italic text-muted-foreground px-4">
            {t("stories_disclaimer")}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 max-w-5xl mx-auto">
          {/* Testimonial 1 */}
          <div className="flex-1 border-2 border-blue-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/men/64.jpg"
              alt="Michael T., African American male, smiling in a suit"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-blue-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">{t("stories_michael_quote")}</p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">{t("stories_michael_name")}</div>
              <div className="text-xs sm:text-sm text-gray-500">{t("stories_michael_state")}</div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="flex-1 border-2 border-purple-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="Sarah J. smiling with long hair"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-purple-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">{t("stories_sarah_quote")}</p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">{t("stories_sarah_name")}</div>
              <div className="text-xs sm:text-sm text-gray-500">{t("stories_sarah_state")}</div>
            </div>
          </div>
          {/* Testimonial 3 */}
          <div className="flex-1 border-2 border-green-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/men/54.jpg"
              alt="Marcus L., Black male, friendly and approachable"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-green-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">{t("stories_marcus_quote")}</p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">{t("stories_marcus_name")}</div>
              <div className="text-xs sm:text-sm text-gray-500">{t("stories_marcus_state")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
