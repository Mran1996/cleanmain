export default function Sitemap() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Sitemap</h1>
      <p className="text-gray-600 mb-10">
        This sitemap outlines the publicly accessible pages and legal assistance services provided by Ask AI Legal™. Use
        it to navigate the platform easily.
      </p>

      <section className="space-y-8 text-sm text-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Main Pages</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a href="/" className="text-emerald-600 hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="/ai-assistant" className="text-emerald-600 hover:underline">
                AI Legal Assistant
              </a>
            </li>
            <li>
              <a href="/features" className="text-emerald-600 hover:underline">
                Features
              </a>
            </li>
            <li>
              <a href="/pricing" className="text-emerald-600 hover:underline">
                Pricing
              </a>
            </li>
            <li>
              <a href="/account" className="text-emerald-600 hover:underline">
                My Account
              </a>
            </li>
            <li>
              <a href="/dashboard" className="text-emerald-600 hover:underline">
                Dashboard
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Legal Document Categories</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Landlord-Tenant Disputes</li>
            <li>Wage & Employment Claims</li>
            <li>Consumer Complaints</li>
            <li>Small Claims Responses</li>
            <li>Criminal Case Support (Incarcerated Access)</li>
            <li>Immigration and Family Law Forms</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Legal Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a href="/privacy" className="text-emerald-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="text-emerald-600 hover:underline">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="/legal-disclaimer" className="text-emerald-600 hover:underline">
                Legal Disclaimer
              </a>
            </li>
            <li>
              <a href="/sitemap" className="text-emerald-600 hover:underline">
                Sitemap
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Support</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a href="/contact" className="text-emerald-600 hover:underline">
                Contact Us
              </a>
            </li>
            <li>
              <a href="/faq" className="text-emerald-600 hover:underline">
                FAQs
              </a>
            </li>
            <li>
              <a href="/account/documents" className="text-emerald-600 hover:underline">
                Uploaded Documents
              </a>
            </li>
            <li>
              <a href="/account/settings" className="text-emerald-600 hover:underline">
                Account Settings
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Your Documents & Analyses</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a href="/account/documents" className="text-emerald-600 hover:underline">
                My Documents
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Settings & Preferences</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a href="/account/settings" className="text-emerald-600 hover:underline">
                Settings
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
