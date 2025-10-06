'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface PaymentInfo {
  status: string;
  transactionId: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  paymentIntent?: string;
  subscription?: string;
  lineItems?: Array<{
    description: string;
    amount_total: number;
    currency: string;
    quantity: number;
    price?: {
      nickname?: string;
      unit_amount?: number;
      recurring?: any;
    };
  }>;
}

function SuccessPageContent() {
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
        const status = searchParams.get('payment_status') || searchParams.get('status') || 'success';
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
          status: sessionData.payment_status || 'success',
          transactionId: sessionId,
          amount: sessionData.amount_total,
          currency: sessionData.currency?.toUpperCase() || 'USD',
          customerEmail: sessionData.customer_email,
          customerName: sessionData.customer_name,
          paymentIntent: sessionData.payment_intent,
          subscription: sessionData.subscription,
          lineItems: sessionData.line_items
        });
      } catch (error) {
        console.error('Error fetching session data:', error);
        // Fallback to basic info
        setPaymentInfo({
          status: 'success',
          transactionId: sessionId,
          currency: 'USD'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [searchParams]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'success':
      case 'paid':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <CheckCircle className="w-16 h-16 text-green-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'success':
      case 'paid':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          color: 'text-green-600'
        };
      case 'failed':
      case 'error':
        return {
          title: 'Payment Failed',
          message: 'There was an issue processing your payment. Please try again.',
          color: 'text-red-600'
        };
      case 'pending':
      case 'processing':
        return {
          title: 'Payment Processing',
          message: 'Your payment is being processed. You will receive a confirmation shortly.',
          color: 'text-yellow-600'
        };
      default:
        return {
          title: 'Payment Complete',
          message: 'Your transaction has been completed.',
          color: 'text-green-600'
        };
    }
  };

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

  const statusInfo = getStatusMessage(paymentInfo.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon(paymentInfo.status)}
          </div>

          {/* Status Title */}
          <h1 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
            {statusInfo.title}
          </h1>

          {/* Status Message */}
          <p className="text-gray-600 mb-6">
            {statusInfo.message}
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${statusInfo.color}`}>
                  {paymentInfo.status}
                </span>
              </div>
              
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-sm text-gray-900 break-all">
                  {paymentInfo.transactionId}
                </span>
              </div>

              {paymentInfo.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">
                    {paymentInfo.currency} {(paymentInfo.amount / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentInfo.status.toLowerCase() === 'succeeded' || 
             paymentInfo.status.toLowerCase() === 'success' || 
             paymentInfo.status.toLowerCase() === 'paid' ? (
              <>
                <Link 
                  href="/account"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Account
                  <ArrowRight className="w-4 h-4" />
                </Link>


              </>
            ) : paymentInfo.status.toLowerCase() === 'failed' || 
                     paymentInfo.status.toLowerCase() === 'error' ? (
              <>
                <Link 
                  href="/pricing"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Try Again
                </Link>
                <Link 
                  href="/contact"
                  className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors mt-3"
                >
                  Contact Support
                </Link>
              </>
            ) : (
              <Link 
                href="/account"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue
              </Link>
            )}
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

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}
