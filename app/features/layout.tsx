import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Legal Document Generator Features | Ask AI Legal™",
  description: "Discover powerful AI legal document generation features: court-ready documents, state-specific formatting, instant case law research, intelligent legal chat, and 24/7 secure access. Generate filing-ready legal documents in minutes.",
  keywords: [
    "AI legal document generator",
    "legal document generator",
    "court-ready documents",
    "AI legal assistant",
    "legal form generator",
    "state-specific legal documents",
    "self-represented litigant tools",
    "affordable legal document preparation",
    "legal document analysis",
    "case law research",
    "filing-ready legal documents"
  ],
  openGraph: {
    title: "AI-Powered Legal Document Generator Features | Ask AI Legal",
    description: "Generate court-ready legal documents in minutes with AI. State-specific formatting, case law research, and intelligent legal assistance included.",
    type: "website",
  }
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
