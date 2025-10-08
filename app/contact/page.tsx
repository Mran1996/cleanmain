import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { Phone, Mail } from "lucide-react"

export default function ContactPage() {

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-600 mb-8">
              Need help, have a question, or want to give feedback? Reach out to us and we'll get back to you shortly.
            </p>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

              <div className="flex items-center mb-4">
                <Phone className="text-emerald-600 mr-3 flex-shrink-0" />
                <p>425-273-0871</p>
              </div>

              <div className="flex items-center">
                <Mail className="text-emerald-600 mr-3 flex-shrink-0" />
                <a href="mailto:support@askailegal.com" className="text-emerald-600 hover:underline">
                  support@askailegal.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
