import type React from 'react';
import type { Metadata } from 'next';
import { generateMetadata, generateStructuredData } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'AI Legal Assistant – Step 1 Consultation',
  description:
    'Begin the comprehensive consultation to gather case facts and generate court-ready documents. Upload files and answer one question at a time.',
  path: '/ai-assistant/step-1',
  image: undefined,
});

export default function Step1Layout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateStructuredData('breadcrumb', {
    items: [
      { name: 'Home', url: '/' },
      { name: 'AI Assistant', url: '/ai-assistant/step-1' },
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