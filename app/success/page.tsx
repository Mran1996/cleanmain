"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessIntakePage() {
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