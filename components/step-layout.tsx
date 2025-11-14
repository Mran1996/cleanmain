"use client"
import { Navigation } from "@/components/navigation"
import type { ReactNode } from "react"

interface StepLayoutProps {
  children: ReactNode
  headerTitle?: string
  headerSubtitle?: string
}

export function StepLayout({ children, headerTitle, headerSubtitle }: StepLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-grow">
        <div className="bg-[#00A884] text-white pt-12 pb-4 px-6 md:pt-16 md:pb-6">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold">{headerTitle || "Your Document is Ready"}</h1>
            <p className="text-xl mt-2">{headerSubtitle || "Chat, review, edit, and download your legal document"}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
