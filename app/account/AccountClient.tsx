"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingData, StripeSubscription } from "@/types/billing";
import { getPlanFeatures } from "@/lib/plan-features";
import { BillingService } from "@/services/billing";

type AccountClientProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  createdAt?: string | null;
  subscription?: StripeSubscription;
  billingData?: BillingData;
};

export default function AccountClient({
  avatarUrl,
  displayName,
  firstName,
  lastName,
  email,
  createdAt,
  subscription,
  billingData
}: AccountClientProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'billing'>('settings');
  const [avatar, setAvatar] = useState<string | null>(avatarUrl || null);
  const [showImg, setShowImg] = useState(!!avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [first, setFirst] = useState<string>(firstName || "");
  const [last, setLast] = useState<string>(lastName || "");
  
  // Handle download receipt
  const handleDownloadReceipt = () => {
    try {
      const invoicePdf = billingData?.invoices?.[0]?.invoice_pdf;
      BillingService.downloadReceipt(invoicePdf);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('No receipt available');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      setShowImg(true);
    };
    reader.readAsDataURL(file);
  };
  const handleSaveChanges = async () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-4 md:py-10">
      <div className="bg-white rounded-2xl shadow border flex flex-col md:flex-row gap-4 md:gap-8 p-0">
        {/* Sidebar */}
        <div className="w-full md:w-1/4 flex flex-col items-center border-b md:border-b-0 md:border-r md:pr-4 py-4 mb-0">
          <div className="relative group mb-2 flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 mx-auto rounded-full border-2 border-gray-200 bg-white flex items-center justify-center mb-0 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {avatar && showImg ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="object-cover w-full h-full rounded-full"
                  onError={() => setShowImg(false)}
                />
              ) : (
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path stroke="currentColor" strokeWidth="2" d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <span
              className="text-gray-400 text-sm mt-1 cursor-pointer mx-auto"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              Click photo to upload
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              ref={fileInputRef}
              className="hidden"
            />
          </div>
          <div className="text-center mb-3">
            <p className="text-xs md:text-sm text-gray-700 font-semibold leading-tight">Empowering access to justice with Artificial Intelligence</p>
          </div>
          <div className="w-full flex flex-col gap-2 px-2 md:px-0">
            <button
              className={`font-semibold rounded py-2 w-full mb-2 transition-colors text-sm ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button
              className={`font-semibold rounded py-2 w-full transition-colors text-sm ${activeTab === 'billing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setActiveTab('billing')}
            >
              Billing
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex justify-center items-start p-2 md:p-6 w-full">
          {activeTab === 'settings' ? (
            <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 max-w-xl w-full mx-auto">
              <h1 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">👋 Welcome back, {displayName || "User"}!</h1>
              <p className="text-gray-600 mb-2 text-sm md:text-base">Here's your account info. You can update your details or view your subscription below.</p>
              <h2 className="text-base md:text-lg font-semibold mb-2">Account Information</h2>
              <div className="text-gray-700 mb-2 text-sm md:text-base">
                <div>Full Name: <span className="font-medium">{displayName || "N/A"}</span></div>
                <div>Email: <span className="font-medium">{email || "N/A"}</span></div>
                <div>Account Created: <span className="font-medium">{createdAt || "N/A"}</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
                  <Input id="firstName" value={first} onChange={e => setFirst(e.target.value)} placeholder="First Name" className="w-full" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
                  <Input id="lastName" value={last} onChange={e => setLast(e.target.value)} placeholder="Last Name" className="w-full" />
                </div>
              </div>
              <div className="mb-2">
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                <Input id="email" value={email || ""} disabled className="bg-gray-100 w-full" />
              </div>
              <div className="flex justify-end mt-2 mb-1">
                <Button onClick={handleSaveChanges} disabled={saving} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="bg-white border rounded-xl shadow-sm ring-1 ring-gray-100 p-4 md:p-6 max-w-lg w-full mx-auto">
                <h1 className="text-lg md:text-xl font-bold mb-4">Billing & Payments</h1>
                
                {!billingData ? (
                  <div className="text-center py-8">Loading billing information...</div>
                ) : (
                  <>
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
                      <span className="text-lg md:text-xl mr-2">💼</span>
                      <div>
                        <div className="text-sm md:text-base font-medium">
                          {billingData?.subscription?.plan?.nickname ? (
                            <>
                              You're on the <span className="font-extrabold">{billingData.subscription.plan.nickname}</span> Plan
                            </>
                          ) : (
                            "You don't have an active subscription"
                          )}
                        </div>
                        {billingData?.subscription?.current_period_end && (
                          <div className="text-xs md:text-sm mt-1 font-semibold">
                            Next billing: <span className="font-normal">
                              {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Features based on subscription plan using shared utility */}
                    {billingData?.subscription?.plan?.nickname && (
                      <ul className="space-y-2 mb-6">
                        {getPlanFeatures(billingData.subscription.plan.nickname).map((feature, i) => (
                          <li key={i} className="flex items-start text-sm md:text-base font-medium">
                            <span className="mr-2 mt-0.5">✅</span>{feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-6">
                      <button 
                        className="flex items-center justify-center gap-2 border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold text-black bg-white hover:bg-gray-100 hover:ring-1 hover:ring-gray-300 transition w-full sm:w-auto"
                        onClick={handleDownloadReceipt}
                        disabled={!billingData?.invoices?.[0]?.invoice_pdf}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' /></svg>
                        Download Receipt
                      </button>
                      <button 
                        className="flex items-center justify-center gap-2 border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold text-black bg-white hover:bg-gray-100 hover:ring-1 hover:ring-gray-300 transition w-full sm:w-auto"
                        onClick={() => window.location.href = '/account/billing'}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                        View Purchase History
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 