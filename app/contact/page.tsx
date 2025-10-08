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

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
