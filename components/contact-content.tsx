"use client"
import { Phone, Mail, Clock } from "lucide-react"
import { useTranslation } from "@/utils/translations"
import ContactForm from "@/components/ContactForm"

export function ContactContent() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">{t("contact_title")}</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            {t("contact_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="order-2 lg:order-1">
            <ContactForm />
          </div>

          <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{t("contact_info_title")}</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("contact_phone_label")}</h3>
                    <a href="tel:425-273-0871" className="text-emerald-600 hover:text-emerald-700 font-medium text-lg">
                      425-273-0871
                    </a>
                    <p className="text-sm text-gray-500 mt-1">{t("contact_phone_available")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("contact_email_label")}</h3>
                    <a href="mailto:support@askailegal.com" className="text-emerald-600 hover:text-emerald-700 font-medium text-lg break-all">
                      support@askailegal.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">{t("contact_email_response")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("contact_response_title")}</h3>
                    <p className="text-gray-700">{t("contact_response_within")}</p>
                    <p className="text-sm text-gray-500 mt-1">{t("contact_response_days")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-lg border border-emerald-200 p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t("contact_why_title")}</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>{t("contact_why_help_technical")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>{t("contact_why_services")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>{t("contact_why_feature")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>{t("contact_why_bug")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">✓</span>
                  <span>{t("contact_why_billing")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
