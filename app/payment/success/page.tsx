// 'use client';

// import { useEffect, useState, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
// import { PRODUCTS } from '@/lib/stripe-config';

// interface PaymentInfo {
//   status: string;
//   transactionId: string;
//   amount?: number;
//   currency?: string;
//   customerEmail?: string;
//   customerName?: string;
//   paymentIntent?: string;
//   subscription?: string;
//   lineItems?: Array<{
//     description: string;
//     amount_total: number;
//     currency: string;
//     quantity: number;
//     price?: {
//       nickname?: string;
//       unit_amount?: number;
//       recurring?: any;
//     };
//   }>;
// }

// function SuccessPageContent() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchSessionData = async () => {
//       if (!searchParams) {
//         setLoading(false);
//         return;
//       }

//       const sessionId = searchParams.get('session_id');
      
//       if (!sessionId) {
//         // Fallback to URL parameters if no session ID
//         const status = searchParams.get('payment_status') || searchParams.get('status') || 'success';
//         const transactionId = searchParams.get('payment_intent') || 
//                              searchParams.get('transaction_id') || 
//                              'N/A';
        
//         setPaymentInfo({
//           status,
//           transactionId,
//           currency: 'USD'
//         });
//         setLoading(false);
//         return;
//       }

//       try {
//         // Fetch session details from Stripe
//         const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        
//         if (!response.ok) {
//           throw new Error('Failed to fetch session data');
//         }

//         const sessionData = await response.json();
        
//         setPaymentInfo({
//           status: sessionData.payment_status || 'success',
//           transactionId: sessionId,
//           amount: sessionData.amount_total,
//           currency: sessionData.currency?.toUpperCase() || 'USD',
//           customerEmail: sessionData.customer_email,
//           customerName: sessionData.customer_name,
//           paymentIntent: sessionData.payment_intent,
//           subscription: sessionData.subscription,
//           lineItems: sessionData.line_items
//         });
//       } catch (error) {
//         console.error('Error fetching session data:', error);
//         // Fallback to basic info
//         setPaymentInfo({
//           status: 'success',
//           transactionId: sessionId,
//           currency: 'USD'
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSessionData();
//   }, [searchParams]);

//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'succeeded':
//       case 'success':
//       case 'paid':
//         return <CheckCircle className="w-16 h-16 text-green-500" />;
//       case 'failed':
//       case 'error':
//         return <XCircle className="w-16 h-16 text-red-500" />;
//       case 'pending':
//       case 'processing':
//         return <Clock className="w-16 h-16 text-yellow-500" />;
//       default:
//         return <CheckCircle className="w-16 h-16 text-green-500" />;
//     }
//   };

//   const getStatusMessage = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'succeeded':
//       case 'success':
//       case 'paid':
//         return {
//           title: 'Payment Successful!',
//           message: 'Your payment has been processed successfully.',
//           color: 'text-green-600'
//         };
//       case 'failed':
//       case 'error':
//         return {
//           title: 'Payment Failed',
//           message: 'There was an issue processing your payment. Please try again.',
//           color: 'text-red-600'
//         };
//       case 'pending':
//       case 'processing':
//         return {
//           title: 'Payment Processing',
//           message: 'Your payment is being processed. You will receive a confirmation shortly.',
//           color: 'text-yellow-600'
//         };
//       default:
//         return {
//           title: 'Payment Complete',
//           message: 'Your transaction has been completed.',
//           color: 'text-green-600'
//         };
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!paymentInfo) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-gray-900 mb-4">No Payment Information</h1>
//           <Link href="/" className="text-blue-600 hover:text-blue-800">
//             Return to Home
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const statusInfo = getStatusMessage(paymentInfo.status);

//   // Detect if the purchase includes Full Service to show Intake link
//   const isFullServicePurchase = (() => {
//     const items = paymentInfo.lineItems || [];
//     const target = PRODUCTS.FULL_SERVICE.toLowerCase();
//     return items.some((item) => {
//       const name = (item.price?.nickname || item.description || '').toLowerCase();
//       return name.includes(target) || name.includes('full service');
//     });
//   })();

//   // Auto-redirect to intake success page for Full Service purchases
//   useEffect(() => {
//     if (!paymentInfo) return;
//     const status = paymentInfo.status?.toLowerCase();
//     const hasSucceeded = status === 'succeeded' || status === 'success' || status === 'paid';
//     if (hasSucceeded && isFullServicePurchase && paymentInfo.transactionId && paymentInfo.transactionId !== 'N/A') {
//       router.replace(`/success?session_id=${paymentInfo.transactionId}`);
//     }
//   }, [paymentInfo, isFullServicePurchase, router]);

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
//       <div className="max-w-md w-full">
//         {/* Success Card */}
//         <div className="bg-white rounded-lg shadow-lg p-8 text-center">
//           {/* Status Icon */}
//           <div className="flex justify-center mb-6">
//             {getStatusIcon(paymentInfo.status)}
//           </div>

//           {/* Status Title */}
//           <h1 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
//             {statusInfo.title}
//           </h1>

//           {/* Status Message */}
//           <p className="text-gray-600 mb-6">
//             {statusInfo.message}
//           </p>

//           {/* Payment Details */}
//           <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
//             <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Status:</span>
//                 <span className={`font-medium capitalize ${statusInfo.color}`}>
//                   {paymentInfo.status}
//                 </span>
//               </div>
              
//               <div className="flex justify-between gap-2">
//                 <span className="text-gray-600">ID:</span>
//                 <span className="font-mono text-sm text-gray-900 break-all">
//                   {paymentInfo.transactionId}
//                 </span>
//               </div>

//               {paymentInfo.amount && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Amount:</span>
//                   <span className="font-medium text-gray-900">
//                     {paymentInfo.currency} {(paymentInfo.amount / 100).toFixed(2)}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="space-y-3">
//             {paymentInfo.status.toLowerCase() === 'succeeded' || 
//              paymentInfo.status.toLowerCase() === 'success' || 
//              paymentInfo.status.toLowerCase() === 'paid' ? (
//               <>
//                 {isFullServicePurchase && paymentInfo.transactionId && paymentInfo.transactionId !== 'N/A' && (
//                   <Link 
//                     href={`/success?session_id=${paymentInfo.transactionId}`}
//                     className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
//                   >
//                     Begin Intake
//                     <ArrowRight className="w-4 h-4" />
//                   </Link>
//                 )}
//                 <Link 
//                   href="/account"
//                   className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
//                 >
//                   Go to Account
//                   <ArrowRight className="w-4 h-4" />
//                 </Link>


//               </>
//             ) : paymentInfo.status.toLowerCase() === 'failed' || 
//                      paymentInfo.status.toLowerCase() === 'error' ? (
//               <>
//                 <Link 
//                   href="/pricing"
//                   className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
//                 >
//                   Try Again
//                 </Link>
//                 <Link 
//                   href="/contact"
//                   className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors mt-3"
//                 >
//                   Contact Support
//                 </Link>
//               </>
//             ) : (
//               <Link 
//                 href="/account"
//                 className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
//               >
//                 Continue
//               </Link>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="mt-6 pt-4 border-t border-gray-200">
//             <p className="text-sm text-gray-500">
//               Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Support</Link>
//             </p>
//           </div>
//         </div>

//         {/* Additional Info */}
//         <div className="mt-4 text-center">
//           <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
//             ← Return to Home
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// function LoadingFallback() {
//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//     </div>
//   );
// }

// export default function SuccessPage() {
//   return (
//     <Suspense fallback={<LoadingFallback />}>
//       <SuccessPageContent />
//     </Suspense>
//   );
// }



"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, CheckCircle, XCircle, Clock } from 'lucide-react';

// Generic payment success page for subscriptions and one-time payments.
// For Full Service one-time purchases, it redirects to the intake success page.
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    payment_status?: string | null;
    subscription?: string | null;
    amount_total?: number | null;
    currency?: string | null;
    customer_email?: string | null;
    customer_name?: string | null;
    line_items?: any[] | null;
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch session');
        setSessionData(json);
      } catch (e: any) {
        setError(e?.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const isSubscription = !!sessionData?.subscription;
  const paymentStatus = (sessionData?.payment_status || 'paid').toLowerCase();
  const hasSucceeded = paymentStatus === 'paid' || paymentStatus === 'succeeded' || paymentStatus === 'success';

  // If it's a one-time Full Service purchase, redirect to intake success
  useEffect(() => {
    if (!loading && sessionData && !isSubscription && hasSucceeded) {
      const hasFullService = (sessionData.line_items || []).some((item: any) => {
        const nickname = item?.price?.nickname || item?.description || '';
        return typeof nickname === 'string' && nickname.toLowerCase().includes('full service');
      });
      if (hasFullService && sessionId) {
        router.replace(`/success?session_id=${encodeURIComponent(sessionId)}`);
      }
    }
  }, [loading, sessionData, isSubscription, hasSucceeded, router, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Couldn’t verify session
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = isSubscription ? 'Subscription Activated' : 'Payment Successful';
  const description = isSubscription
    ? 'Your subscription is now active. You can manage it from your account.'
    : 'Your payment has been processed successfully.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionData?.amount_total ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">
                {(sessionData.currency || 'USD').toUpperCase()} {(sessionData.amount_total / 100).toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/account">Go to Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuccessIntakePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') || null;
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!sessionId) {
        setError('Missing session parameter.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/full-service-intake/verify?session_id=${encodeURIComponent(sessionId)}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json();
        if (!res.ok || !data.allowed) {
          setError(data.error || data.reason || 'Verification failed.');
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      } catch (e: any) {
        setError(e.message || 'Verification error.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('stripe_session_id', sessionId || '');

      const res = await fetch('/api/full-service-intake/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed.');
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700">Verifying your payment...</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>{error || 'This intake form is only available after a successful Full Service purchase.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/account">Go to Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Thank you for your purchase!</CardTitle>
            <CardDescription>
              Your intake has been submitted successfully. Our team will review your case details and follow up via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/account">Return to Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 py-10">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-white text-2xl font-bold">Payment Confirmed</h1>
            <p className="text-emerald-100 text-sm">Please complete the intake form below to begin your Full Service support.</p>
          </div>
        </div>
      </div>

      {/* Intake Form Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Client Intake</CardTitle>
            <CardDescription>Provide your contact information, case details, and any supporting files.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required placeholder="john.doe@example.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" />
                </div>
              </div>

              {/* Jurisdiction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State (2-letter) *</Label>
                  <select
                    id="state"
                    name="state"
                    required
                    className="h-10 w-full rounded-md border border-emerald-500 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a state</option>
                    <option value="AL">AL - Alabama</option>
                    <option value="AK">AK - Alaska</option>
                    <option value="AZ">AZ - Arizona</option>
                    <option value="AR">AR - Arkansas</option>
                    <option value="CA">CA - California</option>
                    <option value="CO">CO - Colorado</option>
                    <option value="CT">CT - Connecticut</option>
                    <option value="DE">DE - Delaware</option>
                    <option value="DC">DC - District of Columbia</option>
                    <option value="FL">FL - Florida</option>
                    <option value="GA">GA - Georgia</option>
                    <option value="HI">HI - Hawaii</option>
                    <option value="ID">ID - Idaho</option>
                    <option value="IL">IL - Illinois</option>
                    <option value="IN">IN - Indiana</option>
                    <option value="IA">IA - Iowa</option>
                    <option value="KS">KS - Kansas</option>
                    <option value="KY">KY - Kentucky</option>
                    <option value="LA">LA - Louisiana</option>
                    <option value="ME">ME - Maine</option>
                    <option value="MD">MD - Maryland</option>
                    <option value="MA">MA - Massachusetts</option>
                    <option value="MI">MI - Michigan</option>
                    <option value="MN">MN - Minnesota</option>
                    <option value="MS">MS - Mississippi</option>
                    <option value="MO">MO - Missouri</option>
                    <option value="MT">MT - Montana</option>
                    <option value="NE">NE - Nebraska</option>
                    <option value="NV">NV - Nevada</option>
                    <option value="NH">NH - New Hampshire</option>
                    <option value="NJ">NJ - New Jersey</option>
                    <option value="NM">NM - New Mexico</option>
                    <option value="NY">NY - New York</option>
                    <option value="NC">NC - North Carolina</option>
                    <option value="ND">ND - North Dakota</option>
                    <option value="OH">OH - Ohio</option>
                    <option value="OK">OK - Oklahoma</option>
                    <option value="OR">OR - Oregon</option>
                    <option value="PA">PA - Pennsylvania</option>
                    <option value="RI">RI - Rhode Island</option>
                    <option value="SC">SC - South Carolina</option>
                    <option value="SD">SD - South Dakota</option>
                    <option value="TN">TN - Tennessee</option>
                    <option value="TX">TX - Texas</option>
                    <option value="UT">UT - Utah</option>
                    <option value="VT">VT - Vermont</option>
                    <option value="VA">VA - Virginia</option>
                    <option value="WA">WA - Washington</option>
                    <option value="WV">WV - West Virginia</option>
                    <option value="WI">WI - Wisconsin</option>
                    <option value="WY">WY - Wyoming</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Input id="county" name="county" required placeholder="Los Angeles" />
                </div>
              </div>

              {/* Case Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case_number">Case Number *</Label>
                  <Input id="case_number" name="case_number" required placeholder="ABC-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opposing_party">Opposing Party *</Label>
                  <Input id="opposing_party" name="opposing_party" required placeholder="County of LA" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description of the Issue *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="Describe your situation, deadlines, and what you need help with."
                  className="border-emerald-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="file">File Upload (PDF, DOCX, JPG - max 5MB)</Label>
                <Input id="file" name="file" type="file" accept=".pdf,.docx,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg" />
                <p className="text-xs text-gray-500">Optional. Files are scanned for safety and stored securely.</p>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button type="submit" disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Intake'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}