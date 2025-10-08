import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import ContactForm from "@/components/ContactForm"
import { Phone, Mail } from "lucide-react"

export default function ContactPage() {

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
              <p className="text-gray-600 text-lg">
                Need help, have a question, or want to give feedback? Send us a message and we'll get back to you shortly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <ContactForm />
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
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

                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">How We Can Help</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-green-600 mb-2">Technical Support</h3>
                      <p className="text-gray-600 text-sm">
                        Having trouble with the platform? Our technical team is here to help.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-600 mb-2">Account Questions</h3>
                      <p className="text-gray-600 text-sm">
                        Need help with billing, subscriptions, or account settings?
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-600 mb-2">Feature Requests</h3>
                      <p className="text-gray-600 text-sm">
                        Have an idea for a new feature? We'd love to hear from you.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-600 mb-2">General Inquiries</h3>
                      <p className="text-gray-600 text-sm">
                        Questions about our services or need more information?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
