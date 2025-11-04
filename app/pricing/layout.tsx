import type React from "react"
import type { Metadata } from "next"
import { generateMetadata, generateStructuredData } from "@/lib/seo"

// Route-level SEO metadata
export const metadata: Metadata = generateMetadata({
  title: "Pricing – Plans & Full Service | Ask AI Legal",
  description:
    "Affordable AI-powered legal assistance. Choose self-service or full service options. Transparent pricing and secure checkout.",
  path: "/pricing",
  image: undefined,
})

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumb = generateStructuredData("breadcrumb", {
    items: [
      { name: "Home", url: "/" },
      { name: "Pricing", url: "/pricing" },
    ],
  })

  return (
    <>
      {/* Breadcrumb structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  )
}
