'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

interface PaymentInfo {
  status: string;
  transactionId: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  paymentIntent?: string;
  subscription?: string;
}

function CancelledPageContent() {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!searchParams) {
        setLoading(false);
        return;
      }

      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        // Fallback to URL parameters if no session ID
        const status = searchParams.get('payment_status') || searchParams.get('status') || 'cancelled';
        const transactionId = searchParams.get('payment_intent') || 
                             searchParams.get('transaction_id') || 
                             'N/A';
        
        setPaymentInfo({
          status,
          transactionId,
          currency: 'USD'
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch session details from Stripe
        const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }

        const sessionData = await response.json();
        
        setPaymentInfo({
          status: 'cancelled',
          transactionId: sessionId,
          amount: sessionData.amount_total,
          currency: sessionData.currency?.toUpperCase() || 'USD',
          customerEmail: sessionData.customer_email,
          customerName: sessionData.customer_name,
          paymentIntent: sessionData.payment_intent,
          subscription: sessionData.subscription
        });
      } catch (error) {
        console.error('Error fetching session data:', error);
        // Fallback to basic info
        setPaymentInfo({
          status: 'cancelled',
          transactionId: sessionId || 'N/A',
          currency: 'USD'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Payment Information</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Cancelled Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>

          {/* Status Title */}
          <h1 className="text-2xl font-bold mb-2 text-red-600">
            Payment Cancelled
          </h1>

          {/* Status Message */}
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize text-red-600">
                  Cancelled
                </span>
              </div>
              
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Session ID:</span>
                <span className="font-mono text-sm text-gray-900 break-all">
                  {paymentInfo.transactionId}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              href="/pricing"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
            <Link 
              href="/contact"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Contact Support
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Support</Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function CancelledPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CancelledPageContent />
    </Suspense>
  );
}
 