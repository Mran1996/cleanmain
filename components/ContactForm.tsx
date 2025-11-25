"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Send, CheckCircle, ChevronDown } from "lucide-react"
import { useTranslation } from "@/utils/translations"

export default function ContactForm() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const isSubmittingRef = useRef(false)
  const submissionIdRef = useRef<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // CRITICAL: Prevent duplicate submissions - check ref FIRST (works even in React Strict Mode)
    if (isSubmittingRef.current) {
      console.log('❌ Form submission already in progress (ref check), ignoring duplicate submit')
      return
    }
    
    // CRITICAL: Also check state (double protection)
    if (isSubmitting) {
      console.log('❌ Form submission already in progress (state check), ignoring duplicate submit')
      return
    }
    
    // CRITICAL: Prevent if already submitted
    if (isSubmitted) {
      console.log('❌ Form already submitted, ignoring duplicate submit')
      return
    }
    
    // Prevent rapid-fire submissions (within 10 seconds - increased from 3)
    const now = Date.now()
    const lastSubmitTime = (window as any).lastContactSubmitTime
    if (lastSubmitTime && now - lastSubmitTime < 10000) {
      console.log('❌ Rapid-fire submission blocked (too soon after last submit)')
      alert('Please wait a moment before submitting again.')
      return
    }
    (window as any).lastContactSubmitTime = now
    
    // Generate unique submission ID to track this specific submission
    const submissionId = `submit-${Date.now()}-${Math.random().toString(36).substring(7)}`
    submissionIdRef.current = submissionId
    
    // Set flags IMMEDIATELY to prevent any duplicate submissions
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      // Double-check we're still the active submission
      if (submissionIdRef.current !== submissionId) {
        console.log('❌ Submission ID mismatch, ignoring')
        return
      }
      
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('reason', formData.reason)
      submitData.append('message', formData.message)
      
      if (file) {
        submitData.append('file', file)
      }

      console.log(`✅ Submitting form with ID: ${submissionId}`)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: submitData,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      // Double-check we're still the active submission before processing response
      if (submissionIdRef.current !== submissionId) {
        console.log('❌ Submission ID mismatch after fetch, ignoring response')
        return
      }

      if (response.ok) {
        console.log(`✅ Form submitted successfully with ID: ${submissionId}`)
        setIsSubmitted(true)
        setFormData({ name: "", email: "", reason: "", message: "" })
        setFile(null)
        submissionIdRef.current = null
      } else {
        let errorMessage = 'Failed to send message. Please try again.'
        try {
          const errorData = await response.json()
          console.error('❌ Form submission failed:', errorData)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          const text = await response.text().catch(() => '')
          console.error('❌ Form submission failed - non-JSON response:', text, 'Status:', response.status)
          if (text) {
            errorMessage = text
          }
        }
        alert(errorMessage)
        // Reset flags on error so user can retry
        isSubmittingRef.current = false
        setIsSubmitting(false)
        submissionIdRef.current = null
      }
    } catch (error: any) {
      console.error('❌ Error submitting form:', error)
      let errorMessage = 'Failed to send message. Please try again.'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
      // Reset flags on error so user can retry
      isSubmittingRef.current = false
      setIsSubmitting(false)
      submissionIdRef.current = null
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("contact_form_success_title")}</h3>
            <p className="text-gray-600 mb-4">{t("contact_form_success_desc")}</p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline"
            >
              {t("contact_form_success_action")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200">
        <CardTitle className="text-2xl font-bold text-center text-gray-900">{t("contact_form_title")}</CardTitle>
        <CardDescription className="text-center text-gray-600">{t("contact_form_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
                {t("contact_form_name_label")}
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("contact_form_name_placeholder")}
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                {t("contact_form_email_label")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("contact_form_email_placeholder")}
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-2 text-gray-700">
              {t("contact_form_reason_label")}
            </label>
            <div className="relative">
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="w-full h-10 px-3 py-2 text-sm border border-emerald-500 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer pr-10"
              >
                <option value="">{t("contact_form_reason_placeholder")}</option>
                <option value="general">{t("contact_form_reason_general")}</option>
                <option value="technical">{t("contact_form_reason_technical")}</option>
                <option value="billing">{t("contact_form_reason_billing")}</option>
                <option value="feature">{t("contact_form_reason_feature")}</option>
                <option value="bug">{t("contact_form_reason_bug")}</option>
                <option value="other">{t("contact_form_reason_other")}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700">
              {t("contact_form_message_label")}
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder={t("contact_form_message_placeholder")}
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2 text-gray-700">
              {t("contact_form_attach_label")}
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="flex-1 border-emerald-500"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("contact_form_supported_formats")}
            </p>
            {file && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t("contact_form_sending")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t("contact_form_send")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
