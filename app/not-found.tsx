import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';
import Footer from '@/components/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '404 Not Found',
    description: 'The requested page could not be found',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-4 py-16">
            <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
            <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  Go Home
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
