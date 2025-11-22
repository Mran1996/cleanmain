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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}
      />
      <Navigation />
      <main className="flex-grow relative">
        <div className="bg-gradient-to-r from-[#00A884] to-emerald-600 text-white pt-12 pb-4 px-6 md:pt-16 md:pb-6 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold drop-shadow-sm">{headerTitle || "Your Document is Ready"}</h1>
            <p className="text-xl mt-2 opacity-95">{headerSubtitle || "Chat, review, edit, and download your legal document"}</p>
          </div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
