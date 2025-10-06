"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingData, StripeSubscription, Purchase } from "@/types/billing";
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const itemsPerPage = 5;
  
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

  // Fetch purchase history with Stripe cursor-based pagination
  const fetchPurchaseHistory = async (page: number = 1, cursor?: string) => {
    try {
      setLoadingPurchases(true);
      setPurchaseError(null);
      
      console.log('🔄 Fetching purchase history:', { page, cursor, itemsPerPage });
      
      const data = await BillingService.retryWithBackoff(
        () => BillingService.getPurchaseHistory(page, itemsPerPage, cursor)
      );
      
      console.log('✅ Purchase history response:', data);
      
      // Set purchases from server response
      setPurchases(data.purchases || []);
      
      // Update pagination state from server response
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
        setHasNext(data.pagination.hasNext);
        setHasPrev(data.pagination.hasPrev);
        setNextCursor(data.pagination.nextCursor);
        setCurrentCursor(data.pagination.currentCursor);
      }
      
    } catch (error) {
      console.error("❌ Failed to load purchase history", error);
      setPurchaseError("Failed to load purchase history. Please try again later.");
      // Set empty state on error
      setPurchases([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Load purchase history when billing tab is opened
  useEffect(() => {
    // Only run in browser, not during build
    if (typeof window === 'undefined') return;
    
    if (activeTab === 'billing' && purchases.length === 0 && !loadingPurchases) {
      fetchPurchaseHistory(1);
    }
  }, [activeTab]);

  // Handle load more purchases (not needed for server-side pagination)
  // Removed as we're using page-based navigation instead

  // Handle page navigation with cursor support
  const handlePageChange = (page: number) => {
    if (page !== currentPage && !loadingPurchases) {
      if (page > currentPage && nextCursor) {
        // Going forward - use next cursor
        fetchPurchaseHistory(page, nextCursor);
      } else if (page < currentPage) {
        // Going backward - reset to page 1 and navigate
        // Note: Stripe doesn't support backward cursors, so we reset
        if (page === 1) {
          fetchPurchaseHistory(1);
        } else {
          // For now, just fetch the requested page without cursor
          fetchPurchaseHistory(page);
        }
      } else {
        // Same page or other cases
        fetchPurchaseHistory(page);
      }
    }
  };

  // Handle next page specifically
  const handleNextPage = () => {
    if (hasNext && !loadingPurchases && nextCursor) {
      fetchPurchaseHistory(currentPage + 1, nextCursor);
    }
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (hasPrev && !loadingPurchases) {
      fetchPurchaseHistory(currentPage - 1);
    }
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
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading billing information...</p>
                    <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
                  </div>
                ) : (
                  <>
                    {/* Subscription Status */}
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
                      <span className="text-lg md:text-xl mr-2">💼</span>
                      <div className="flex-1">
                        <div className="text-sm md:text-base font-medium">
                          {billingData?.subscription ? (
                            <>
                              You're on the <span className="font-extrabold">{billingData.subscription.items?.data?.[0]?.plan?.nickname || "Premium"}</span> Plan
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                billingData.subscription.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {billingData.subscription.status?.toUpperCase()}
                              </span>
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
                            {billingData.subscription.cancel_at_period_end && (
                              <span className="ml-2 text-red-600">(Cancels at period end)</span>
                            )}
                          </div>
                        )}
                        {billingData?.subscription?.items?.data?.[0]?.plan?.amount && (
                          <div className="text-xs md:text-sm mt-1 text-gray-600">
                            ${(billingData.subscription.items.data[0].plan.amount / 100).toFixed(2)} / {billingData.subscription.items.data[0].plan.interval}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    {billingData.paymentMethods && billingData.paymentMethods.length > 0 && (
                      <div className="bg-gray-50 rounded-md p-3 md:p-4 mb-4">
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          💳 Payment Methods
                        </h3>
                        {billingData.paymentMethods.map((pm, index) => (
                          <div key={pm.id} className="flex items-center gap-2 text-sm">
                            <span className="capitalize">{pm.card?.brand}</span>
                            <span>•••• {pm.card?.last4}</span>
                            <span className="text-gray-500">
                              {pm.card?.exp_month}/{pm.card?.exp_year}
                            </span>
                            {index === 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">Default</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Purchase History with Pagination */}
                    <div className="bg-gray-50 rounded-md p-3 md:p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          🛒 Purchase History
                        </h3>
                        {(totalPages > 1 || totalCount > 0) && (
                          <div className="text-xs text-gray-500">
                            {totalCount > 0 ? (
                              <>Page {currentPage} of ~{totalPages} ({totalCount} total)</>
                            ) : (
                              <>Page {currentPage}</>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {loadingPurchases ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-xs">Loading purchases...</p>
                        </div>
                      ) : purchaseError ? (
                        <div className="text-center py-4">
                          <p className="text-red-500 text-xs">{purchaseError}</p>
                          <button 
                            onClick={() => fetchPurchaseHistory(1)}
                            className="mt-2 text-green-600 hover:text-green-700 text-xs underline"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : purchases.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-xs">No purchases found</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-3">
                            {purchases.map((purchase) => (
                              <div key={purchase.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                                <div>
                                  <div className="font-medium">
                                    {purchase.document_name || 'Subscription Payment'}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'Unknown date'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    ${purchase.price?.toFixed(2) || '0.00'}
                                  </div>
                                  <div className="text-green-600 text-xs">
                                    PAID
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <button
                                onClick={handlePrevPage}
                                disabled={!hasPrev || loadingPurchases}
                                className="text-xs px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                              >
                                Previous
                              </button>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  Page {currentPage}
                                  {totalCount > 0 && ` of ~${totalPages}`}
                                </span>
                                {totalCount > 0 && (
                                  <span className="text-xs text-gray-400">
                                    ({totalCount} total)
                                  </span>
                                )}
                              </div>
                              
                              <button
                                onClick={handleNextPage}
                                disabled={!hasNext || loadingPurchases}
                                className="text-xs px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )}
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
                      {billingData?.subscription ? (
                        <button 
                          className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto"
                          onClick={() => window.location.href = '/pricing'}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                          Manage Subscription
                        </button>
                      ) : (
                        <button 
                          className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto"
                          onClick={() => window.location.href = '/pricing'}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' /></svg>
                          Subscribe Now
                        </button>
                      )}
                      
                      <button 
                        className="flex items-center justify-center gap-2 border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold text-black bg-white hover:bg-gray-100 hover:ring-1 hover:ring-gray-300 transition w-full sm:w-auto"
                        onClick={handleDownloadReceipt}
                        disabled={!billingData?.invoices?.[0]?.invoice_pdf}
                      >
                        <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                        Download Receipt
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