"use client"

import { Lock, ShieldCheck, KeyRound, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/utils/translations"

export default function SecurityPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("security_settings_title")}</h1>

      {/* Change Password */}
      <div className="mb-8 space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-teal-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-800">{t("security_change_password_title")}</h2>
            <p className="text-sm text-gray-500">{t("security_change_password_desc")}</p>
          </div>
        </div>
        <Button variant="default" className="w-fit">
          {t("security_update_password_button")}
        </Button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="mb-8 space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-800">{t("security_2fa_title")}</h2>
            <p className="text-sm text-gray-500">{t("security_2fa_desc")}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{t("security_2fa_enable_label")}</span>
          <Switch />
        </div>
      </div>

      {/* Session Management */}
      <div className="mb-8 space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <LogOut className="w-6 h-6 text-teal-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-800">{t("security_logout_title")}</h2>
            <p className="text-sm text-gray-500">{t("security_logout_desc")}</p>
          </div>
        </div>
        <Button variant="destructive" className="w-fit">
          {t("security_logout_everywhere")}
        </Button>
      </div>

      {/* Security Alerts */}
      <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-teal-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-800">{t("security_alerts_title")}</h2>
            <p className="text-sm text-gray-500">{t("security_alerts_desc")}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{t("security_alerts_email_label")}</span>
          <Switch />
        </div>
      </div>
    </div>
  )
}
