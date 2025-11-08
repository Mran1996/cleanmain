import { User } from "@/types/user";
import { useState } from "react";

interface SettingsSectionProps {
  user: User;
}

export default function SettingsSection({ user }: SettingsSectionProps) {
  const [language, setLanguage] = useState("en");
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-gray-500">Customize your application preferences.</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Theme</h4>
            <p className="text-sm text-gray-500">Light theme is always enabled.</p>
          </div>
          <span className="text-sm font-medium text-black bg-white border border-gray-200 rounded-md px-3 py-1">Light</span>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Language</h4>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Data & Privacy</h4>
          <div className="space-y-2">
            <button className="text-sm text-blue-600 hover:text-blue-800 block">
              Download My Data
            </button>
            <button className="text-sm text-red-600 hover:text-red-800 block">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}