'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function SearchParamsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">❌</div>
      <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
      <p className="text-gray-600 mb-6">
        Your payment was cancelled. No charges have been made.
      </p>
      {sessionId && (

        <p className="text-sm text-gray-500 mb-6 break-words overflow-wrap-anywhere">
          Session ID: {sessionId}
        </p>
      )}
      <div className="space-x-4">
        <Link href="/pricing">
          <Button variant="outline">
            Try Again
          </Button>
        </Link>
        <Link href="/">
          <Button>
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    </div>
  );
}

export default function CancelledPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Suspense fallback={<LoadingFallback />}>
          <SearchParamsContent />
        </Suspense>
      </div>
    </main>
  );
}