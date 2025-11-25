"use client"
import { useTranslation } from "@/utils/translations"

export function HomeTopline() {
  const { t } = useTranslation()
  return (
    <div className="bg-white py-4 sm:py-6 px-4 sm:px-6 text-center">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
        {t("home_topline")}
      </h1>
    </div>
  )
}
