import type React from "react"
import type { Metadata } from "next"
import { generateMetadata, generateStructuredData } from "@/lib/seo"

// Route-level SEO metadata
export const metadata: Metadata = generateMetadata({
  title: "Contact Ask AI Legal – Support & Questions",
  description:
    "Contact Ask AI Legal for support, questions, or legal assistance. Reach us at support@askailegal.com or call 425-273-0871.",
  path: "/contact",
  image: undefined,
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumb = generateStructuredData("breadcrumb", {
    items: [
      { name: "Home", url: "/" },
      { name: "Contact", url: "/contact" },
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
