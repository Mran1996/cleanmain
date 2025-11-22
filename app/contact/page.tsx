import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import ContactForm from "@/components/ContactForm"
import { Phone, Mail, Clock, MapPin } from "lucide-react"
import type { Metadata } from 'next';

// SEO metadata for contact page
export const metadata: Metadata = {
  title: 'Contact Us - Get Legal Help & Support | Ask AI Legal™',
  description: 'Contact Ask AI Legal for support, questions, or legal assistance. Reach us at support@askailegal.com or call 425-273-0871. We\'re here to help with your legal needs 24/7.',
  keywords: [
    'contact legal support',
    'legal help contact',
    'AI legal assistance',
    'customer support',
    'legal questions',
    'get legal help',
  ],
  openGraph: {
    title: 'Contact Us - Ask AI Legal™',
    description: 'Get in touch with our team for legal support and assistance.',
    type: 'website',
    url: 'https://www.askailegal.com/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Ask AI Legal™',
    description: 'Reach out for legal help and support.',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Get In Touch</h1>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                We're here to help with all your legal questions and support needs. 
                Reach out to us and we'll respond as soon as possible.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Contact Form */}
              <div className="order-2 lg:order-1">
                <ContactForm />
              </div>

              {/* Contact Information */}
              <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a href="tel:425-273-0871" className="text-emerald-600 hover:text-emerald-700 font-medium text-lg">
                          425-273-0871
                        </a>
                        <p className="text-sm text-gray-500 mt-1">Available 24/7</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Mail className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a href="mailto:support@askailegal.com" className="text-emerald-600 hover:text-emerald-700 font-medium text-lg break-all">
                        support@askailegal.com
                      </a>
                        <p className="text-sm text-gray-500 mt-1">We respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
                        <p className="text-gray-700">Within 24 hours</p>
                        <p className="text-sm text-gray-500 mt-1">Monday - Friday</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-lg border border-emerald-200 p-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Why Contact Us?</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Get help with technical issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Ask questions about our services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Request new features</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Report bugs or issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Get billing support</span>
                    </li>
                  </ul>
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
