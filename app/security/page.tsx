import SecurityPage from "@/components/security-page"
import type { Metadata } from 'next';

// SEO metadata for security page
export const metadata: Metadata = {
  title: 'Security & Data Protection - Secure Legal Platform | Ask AI Legal™',
  description: 'Learn about Ask AI Legal\'s security measures: encryption, secure storage, access controls, and GDPR compliance. Your legal documents and personal data are protected with enterprise-level security.',
  keywords: [
    'data security',
    'encryption',
    'secure legal platform',
    'GDPR compliance',
    'data protection',
    'secure document storage',
  ],
  openGraph: {
    title: 'Security & Data Protection - Ask AI Legal™',
    description: 'Enterprise-level security for your legal documents and personal data.',
    type: 'website',
    url: 'https://www.askailegal.com/security',
  },
  alternates: {
    canonical: 'https://www.askailegal.com/security',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <SecurityPage />
}
