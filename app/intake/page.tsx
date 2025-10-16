"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function IntakePage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-6 max-w-lg w-full">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">{error || 'This intake form is only available after a successful Full Service purchase.'}</p>
          <a href="/account" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Go to Account</a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank you for your purchase!</h1>
          <p className="text-gray-700 mb-4">Your intake has been submitted successfully. Our team will review your case details and follow up via email.</p>
          <a href="/account" className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Return to Account</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Thank you for your purchase</h1>
          <p className="text-gray-600">Please complete the intake form below to begin your Full Service support.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input name="full_name" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input name="email" type="email" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" type="tel" className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <input name="state" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">County *</label>
              <input name="county" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Case Number *</label>
              <input name="case_number" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Opposing Party *</label>
              <input name="opposing_party" required className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Short Description of the Issue *</label>
            <textarea name="description" required rows={5} className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">File Upload (PDF, DOCX, JPG - max 5MB)</label>
            <input name="file" type="file" accept=".pdf,.docx,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg" className="mt-1 w-full" />
            <p className="text-xs text-gray-500 mt-1">Optional. Files are scanned for safety and stored securely.</p>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Intake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}