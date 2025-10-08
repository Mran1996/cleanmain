"use client"

import type React from "react"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Mail } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReasonChange = (value: string) => {
    setFormData((prev) => ({ ...prev, reason: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('reason', formData.reason)
      formDataToSend.append('message', formData.message)
      
      if (file) {
        formDataToSend.append('file', file)
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok) {
        // Reset form
        setFormData({
          name: "",
          email: "",
          reason: "",
          message: "",
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        alert("Message sent successfully! We'll get back to you shortly.")
      } else {
        alert(result.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

            <form onSubmit={handleSubmit} className="space-y-6 mb-12">
              <div>
                <Input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3"
                />
              </div>

              <div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3"
                />
              </div>

              <div>
                <Select value={formData.reason} onValueChange={handleReasonChange}>
                  <SelectTrigger className="w-full p-3">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Textarea
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 min-h-[150px]"
                />
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-600">Attach File (optional)</p>
                <Input type="file" id="file" className="hidden" onChange={handleFileChange} />
                <div className="flex items-center border rounded-md p-2">
                  <label
                    htmlFor="file"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded cursor-pointer"
                  >
                    Choose File
                  </label>
                  <span className="ml-3 text-gray-500 text-sm">{file ? file.name : "no file selected"}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>

            <hr className="my-12" />

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
