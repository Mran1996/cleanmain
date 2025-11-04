import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import ContactForm from "@/components/ContactForm"
import { Phone, Mail } from "lucide-react"
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
