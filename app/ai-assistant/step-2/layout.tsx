import type React from 'react';
import type { Metadata } from 'next';
import { generateMetadata, generateStructuredData } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'AI Legal Document – Step 2 Drafting & Review',
  description:
    'Review, refine, and download your AI-generated, court-ready legal document. Export to PDF or Word and prepare for filing.',
  path: '/ai-assistant/step-2',
  image: undefined,
});

export default function Step2Layout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateStructuredData('breadcrumb', {
    items: [
      { name: 'Home', url: '/' },
      { name: 'AI Assistant', url: '/ai-assistant/step-2' },
    ],
  });

  return (
    <>
      {/* Breadcrumb structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}