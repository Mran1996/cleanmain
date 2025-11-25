"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingData, StripeSubscription, Purchase } from "@/types/billing";
import { getPlanFeatures } from "@/lib/plan-features";
import { useTranslation } from "@/utils/translations";
import { BillingService } from "@/services/billing";
import { createClient } from "@/utils/supabase/client";
import UsageStats from "@/components/UsageStats";

type AccountClientProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  createdAt?: string | null;
  subscription?: StripeSubscription;
  billingData?: BillingData;
  loadingBilling?: boolean; // ⭐ Add loading state prop
};

export default function AccountClient({
  avatarUrl,
  displayName,
  firstName,
  lastName,
  email,
  createdAt,
  subscription,
  billingData,
  loadingBilling = false // ⭐ Default to false
}: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  // Get initial tab from URL params, default to 'settings' (account)
  const getInitialTab = (): 'settings' | 'billing' | 'documents' => {
    if (!searchParams) return 'settings';
    const tabParam = searchParams.get('tab');
    if (tabParam === 'billing') return 'billing';
    if (tabParam === 'documents') return 'documents';
    if (tabParam === 'account') return 'settings';
    return 'settings'; // Default to account/settings tab
  };
  
  const [activeTab, setActiveTab] = useState<'settings' | 'billing' | 'documents'>(getInitialTab());
  
  // Function to handle tab changes and update URL
  const handleTabChange = (tab: 'settings' | 'billing' | 'documents') => {
    setActiveTab(tab);
    const tabParam = tab === 'settings' ? 'account' : tab;
    const newUrl = `/account?tab=${tabParam}`;
    router.push(newUrl, { scroll: false });
  };
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
  
  // Subscription management state
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState<'cancel' | 'reactivate' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  // Documents state
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1);
  const [documentsHasNext, setDocumentsHasNext] = useState(false);
  const [documentsHasPrev, setDocumentsHasPrev] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deletingDocument, setDeletingDocument] = useState(false);
  
  // Usage stats state
  const [usageData, setUsageData] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  
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

  // Fetch usage data to check for one-time credits
  const fetchUsageData = async () => {
    try {
      setLoadingUsage(true);
      const res = await fetch('/api/usage', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoadingUsage(false);
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

  // Load saved documents when documents tab is opened
  useEffect(() => {
    // Only run in browser, not during build
    if (typeof window === 'undefined') return;
    
    if (activeTab === 'documents' && savedDocuments.length === 0 && !loadingDocuments) {
      fetchSavedDocuments(1);
    }
  }, [activeTab]);

  // Fetch usage data on initial load (always needed for access control)
  useEffect(() => {
    // Only run in browser, not during build
    if (typeof window === 'undefined') return;
    
    // Fetch immediately on mount - always needed for "Purchase Required" overlay
    if (!usageData && !loadingUsage) {
      console.log('🔄 Fetching usage data for access check...')
      fetchUsageData();
    }
  }, []); // Empty array = run once on mount

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

  // Handle subscription management
  const handleSubscriptionAction = async (action: 'cancel' | 'reactivate') => {
    setSubscriptionAction(action);
    setShowConfirmDialog(true);
  };

  const confirmSubscriptionAction = async () => {
    if (!subscriptionAction) return;
    
    try {
      setManagingSubscription(true);
      setSubscriptionError(null);
      setSubscriptionMessage(null);
      setShowConfirmDialog(false);
      
      console.log(`🔄 ${subscriptionAction} subscription...`);
      
      const result = await BillingService.retryWithBackoff(
        () => subscriptionAction === 'cancel' 
          ? BillingService.cancelSubscription()
          : BillingService.reactivateSubscription()
      );
      
      console.log('✅ Subscription action result:', result);
      setSubscriptionMessage(result.message || `Subscription ${subscriptionAction}ed successfully`);
      
      // Refresh billing data after successful action
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error(`❌ Error ${subscriptionAction}ing subscription:`, error);
      setSubscriptionError(error.message || `Failed to ${subscriptionAction} subscription`);
      
      // Handle specific error cases
      if (error.message?.includes('new subscription')) {
        setTimeout(() => {
          window.location.href = '/pricing';
        }, 3000);
      }
    } finally {
      setManagingSubscription(false);
      setSubscriptionAction(null);
    }
  };

  const cancelSubscriptionAction = () => {
    setShowConfirmDialog(false);
    setSubscriptionAction(null);
  };

  // Get subscription status for UI logic
  const getSubscriptionStatus = () => {
    if (!billingData?.subscription) return 'none';
    
    const sub = billingData.subscription;
    if (sub.status === 'active' && sub.cancel_at_period_end) {
      return 'canceling';
    }
    if (sub.status === 'active') {
      return 'active';
    }
    if (sub.status === 'canceled') {
      return 'canceled';
    }
    return sub.status;
  };

  const subscriptionStatus = getSubscriptionStatus();
  
  // Check if canceled subscription can be reactivated (within 30 days)
  const canReactivateCanceledSubscription = () => {
    if (!billingData?.subscription || subscriptionStatus !== 'canceled') return false;
    
    const canceledAt = billingData.subscription.canceled_at;
    if (!canceledAt) return false;
    
    const canceledDate = new Date(canceledAt * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return canceledDate > thirtyDaysAgo;
  };

  const canReactivate = canReactivateCanceledSubscription();

  // Fetch saved documents from the existing documents table
  const fetchSavedDocuments = async (page: number = 1) => {
    try {
      setLoadingDocuments(true);
      setDocumentsError(null);
      
      console.log('🔄 Fetching saved documents:', { page });
      
      // Create Supabase client
      const supabase = createClient();
      
      // Calculate offset for pagination
      const limit = 10;
      const offset = (page - 1) * limit;
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch documents with pagination, filtering for current user's AI-generated documents
      const { data: documents, error: queryError, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .or('metadata->>generated_by_ai.eq.true,file_type.eq.text/plain')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (queryError) {
        throw new Error(queryError.message);
      }
      
      console.log('✅ Saved documents response:', { documents, count, page, limit });
      
      setSavedDocuments(documents || []);
      
      // Calculate pagination info with proper bounds checking
      const totalCount = count || 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const currentPage = Math.min(Math.max(1, page), totalPages);
      
      setDocumentsPage(currentPage);
      setDocumentsTotalPages(totalPages);
      setDocumentsHasNext(currentPage < totalPages && totalCount > currentPage * limit);
      setDocumentsHasPrev(currentPage > 1);
      
    } catch (error) {
      console.error("❌ Failed to load saved documents", error);
      setDocumentsError(error instanceof Error ? error.message : "Failed to load documents");
      setSavedDocuments([]);
      // Reset pagination state on error
      setDocumentsPage(1);
      setDocumentsTotalPages(1);
      setDocumentsHasNext(false);
      setDocumentsHasPrev(false);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setShowDeleteDialog(true);
  };

  // Confirm document deletion
  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeletingDocument(true);
      
      // Create Supabase client
      const supabase = createClient();
      
      // Delete the document (RLS will ensure user can only delete their own documents)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Refresh the documents list
      await fetchSavedDocuments(documentsPage);
      
      console.log('✅ Document deleted successfully');
      
    } catch (error) {
      console.error("❌ Failed to delete document", error);
    } finally {
      setDeletingDocument(false);
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

  // Cancel document deletion
  const cancelDeleteDocument = () => {
    setShowDeleteDialog(false);
    setDocumentToDelete(null);
  };

  // Handle document download as PDF
  const handleDownloadDocument = async (doc: any) => {
    try {
      // Validate document and content
      if (!doc) {
        console.error('Document is null or undefined');
        return;
      }
      
      if (!doc.content || doc.content.trim() === '') {
        console.error('Document content is empty or invalid');
        return;
      }
      
      // Dynamic import of jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      // Create new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font and styling
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      
      // Document title and metadata
      let title = doc.metadata?.original_title || doc.filename || 'Legal';
      
      // Remove .txt extension if present
      if (title.toLowerCase().endsWith('.txt')) {
        title = title.slice(0, -4);
      }
      
      const createdDate = new Date(doc.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Add title with proper text wrapping
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      
      // Split title if too long for one line
      const titleLines = pdf.splitTextToSize(title, 170);
      let titleYPosition = 25;
      
      for (let i = 0; i < titleLines.length; i++) {
        pdf.text(titleLines[i], 20, titleYPosition);
        titleYPosition += 7;
      }
      
      // Add metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPosition = titleYPosition + 5; // Start after title with some spacing
      
      if (doc.metadata?.document_type) {
        pdf.text(`Document Type: ${doc.metadata.document_type}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (doc.metadata?.legal_category) {
        pdf.text(`Legal Category: ${doc.metadata.legal_category}`, 20, yPosition);
        yPosition += 5;
      }
      
      pdf.text(`Created: ${createdDate}`, 20, yPosition);
      yPosition += 10;
      
      // Add separator line
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Add document content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const content = typeof doc.content === 'string' ? doc.content : String(doc.content);
      const pageWidth = 170; // A4 width minus margins
      const lineHeight = 5;
      
      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(content, pageWidth);
      
      // Add content with page breaks
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > 280) { // Near bottom of page
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }
      
      // Generate safe filename
      let filename = 'Legal_Document';
      if (doc.metadata?.original_title) {
        filename = doc.metadata.original_title;
      } else if (doc.filename) {
        filename = doc.filename;
      } else if (doc.title) {
        filename = doc.title;
      }
      
      // Remove .txt extension if present
      if (filename.toLowerCase().endsWith('.txt')) {
        filename = filename.slice(0, -4);
      }
      
      // Sanitize filename
      const safeFilename = filename
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100)
        .trim();
      
      // Download the PDF
      pdf.save(`${safeFilename || 'Legal_Document'}.pdf`);
      
      console.log('✅ PDF downloaded successfully:', safeFilename);
      
    } catch (err) {
      console.error('❌ Error downloading PDF:', err);
      
      // Fallback to text download
      try {
        const content = typeof doc.content === 'string' ? doc.content : String(doc.content);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.style.display = 'none';
        
        const title = doc.metadata?.original_title || doc.filename || 'Legal_Document';
        const safeFilename = title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, '_');
        downloadLink.download = `${safeFilename}.txt`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
        
        console.log('📄 Fallback: Downloaded as text file');
      } catch (fallbackErr) {
        console.error('❌ Text fallback also failed:', fallbackErr);
        // Final fallback: copy to clipboard
        if (doc?.content) {
          try {
            navigator.clipboard.writeText(doc.content);
            console.log('📋 Final fallback: Content copied to clipboard');
          } catch (clipboardErr) {
            console.error('❌ All download methods failed:', clipboardErr);
          }
        }
      }
    }
  };

  // Sync tab state with URL changes (for browser back/forward)
  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get('tab');
    let newTab: 'settings' | 'billing' | 'documents' = 'settings';
    
    if (tabParam === 'billing') newTab = 'billing';
    else if (tabParam === 'documents') newTab = 'documents';
    else if (tabParam === 'account') newTab = 'settings';
    
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams, activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-4 md:py-10">
      <div className="bg-white rounded-2xl shadow border flex flex-col md:flex-row gap-4 md:gap-8 p-0">
        {/* Sidebar */}
        <div className="w-full md:w-1/4 flex flex-col items-center border-b md:border-b-0 md:border-r md:px-4 py-4 mb-0">
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
            {/* <span
              className="text-gray-400 text-sm mt-1 cursor-pointer mx-auto"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              Click photo to upload
            </span> */}
            {/* <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              ref={fileInputRef}
              className="hidden"
            /> */}
          </div>
          <div className="text-center mb-3">
            <p className="text-xs md:text-sm text-gray-700 font-semibold leading-tight">{t("account_empower_tagline")}</p>
          </div>
          <div className="w-full flex flex-col gap-2 px-2 md:px-2">
            <button
              className={`font-semibold rounded py-2 w-full mb-2 transition-colors text-sm ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => handleTabChange('settings')}
            >
              {t("account_sidebar_account")}
            </button>
            <button
              className={`font-semibold rounded py-2 w-full mb-2 transition-colors text-sm ${activeTab === 'billing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => handleTabChange('billing')}
            >
              {t("account_sidebar_billing")}
            </button>
            <button
              className={`font-semibold rounded py-2 w-full transition-colors text-sm ${activeTab === 'documents' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => handleTabChange('documents')}
            >
              {t("account_sidebar_documents")}
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-2 md:p-6 w-full">
          {activeTab === 'settings' ? (
            <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 max-w-xl w-full mx-auto">
              <h1 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">👋 {t("account_welcome_back")}, {displayName || t("account_user")}!</h1>
              <p className="text-gray-600 mb-2 text-sm md:text-base">{t("account_info_intro")}</p>
              <h2 className="text-base md:text-lg font-semibold mb-2">{t("account_info_title")}</h2>
              <div className="text-gray-700 mb-2 text-sm md:text-base">
                <div>{t("account_full_name_label")}: <span className="font-medium">{displayName || "N/A"}</span></div>
                <div>{t("email_label")}: <span className="font-medium">{email || "N/A"}</span></div>
                <div>{t("account_created_label")}: <span className="font-medium">{createdAt || "N/A"}</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">{t("first_name_label")}</label>
                  <Input id="firstName" value={first} onChange={e => setFirst(e.target.value)} placeholder={t("first_name_placeholder")} className="w-full" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">{t("last_name_label")}</label>
                  <Input id="lastName" value={last} onChange={e => setLast(e.target.value)} placeholder={t("last_name_placeholder")} className="w-full" />
                </div>
              </div>
              <div className="mb-2">
                <label htmlFor="email" className="block text-sm font-medium mb-1">{t("email_address_label")}</label>
                <Input id="email" value={email || ""} disabled className="bg-gray-100 w-full" />
              </div>
              <div className="flex justify-end mt-2 mb-1">
                <Button onClick={handleSaveChanges} disabled={saving} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                  {saving ? t("saving") : t("save_changes")}
                </Button>
              </div>
              <div className="mt-6 relative">
                {/* Usage Stats Container */}
               
                  {/* <UsageStats /> */}
              
                
            
              </div>
            </div>
          ) : activeTab === 'billing' ? (
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
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 md:p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg md:text-xl">💼</span>
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-medium mb-2">
                            {billingData?.subscription ? (
                              <div className="flex items-center flex-wrap gap-2">
                                <span>You're on the <span className="font-extrabold">{billingData.subscription.items?.data?.[0]?.plan?.nickname || "Premium"}</span> Plan</span>
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                  subscriptionStatus === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : subscriptionStatus === 'canceling'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : subscriptionStatus === 'canceled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {subscriptionStatus === 'canceling' ? 'CANCELING' : billingData.subscription.status?.toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>You don't have an active subscription</span>
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-semibold">NO SUBSCRIPTION</span>
                              </div>
                            )}
                          </div>
                          
                          {billingData?.subscription && (
                            <div className="space-y-1 text-xs md:text-sm">
                              {/* Temporary Debug - Remove after fixing */}
                              {/* <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                                <strong>DEBUG:</strong> {JSON.stringify({
                                  current_period_start: billingData.subscription.current_period_start,
                                  current_period_end: billingData.subscription.current_period_end,
                                  created: billingData.subscription.created,
                                  status: billingData.subscription.status
                                })}
                              </div> */}
                              
                              {/* Subscription Amount */}
                              {billingData.subscription.items?.data?.[0]?.plan?.amount && (
                                <div className="font-semibold text-gray-900">
                                  ${(billingData.subscription.items.data[0].plan.amount / 100).toFixed(2)} / {billingData.subscription.items.data[0].plan.interval}
                                </div>
                              )}
                              
                              {/* Subscription Start Date */}
                              {billingData.subscription.created && (
                                <div className="text-gray-600">
                                  <span className="font-medium">📅 Started:</span> {new Date(billingData.subscription.created * 1000).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              )}
                              
                              {/* Current Period */}
                              {billingData.subscription.current_period_start && billingData.subscription.current_period_end && (
                                <div className="text-gray-600">
                                  <span className="font-medium">📊 Current period:</span> {new Date(billingData.subscription.current_period_start * 1000).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })} - {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              )}
                              
                              {/* Next Billing or Cancellation Date - Always show if current_period_end exists */}
                              {billingData.subscription.current_period_end && (
                                <div className="font-medium">
                                  {subscriptionStatus === 'canceling' ? (
                                    <span className="text-yellow-700">
                                      🗓️ Cancels on: {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  ) : subscriptionStatus === 'active' ? (
                                    <span className="text-green-700">
                                      🗓️ Next billing: {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  ) : subscriptionStatus === 'canceled' ? (
                                    <span className="text-red-700">
                                      ❌ Canceled on: {billingData.subscription.canceled_at ? new Date(billingData.subscription.canceled_at * 1000).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      }) : 'Unknown'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-700">
                                      📅 Period ends: {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
                                    ${((purchase.price || 0) / 100)?.toFixed(2) || '0.00'}
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
                    
                    {/* Subscription Management Messages */}
                    {subscriptionMessage && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-green-800 text-sm font-medium">{subscriptionMessage}</p>
                        </div>
                      </div>
                    )}
                    
                    {subscriptionError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-red-800 text-sm font-medium">{subscriptionError}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-6">
                      {billingData?.subscription ? (
                        <>
                          {subscriptionStatus === 'active' && (
                            <button 
                              className="flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-red-700 transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleSubscriptionAction('cancel')}
                              disabled={managingSubscription}
                            >
                              {managingSubscription && subscriptionAction === 'cancel' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                              )}
                              Cancel Subscription
                            </button>
                          )}
                          
                          {subscriptionStatus === 'canceling' && (
                            <button 
                              className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleSubscriptionAction('reactivate')}
                              disabled={managingSubscription}
                            >
                              {managingSubscription && subscriptionAction === 'reactivate' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg>
                              )}
                              Reactivate Subscription
                            </button>
                          )}
                          
                          {subscriptionStatus === 'canceled' && (
                            <>
                              {canReactivate ? (
                                <>
                                  <button 
                                    className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleSubscriptionAction('reactivate')}
                                    disabled={managingSubscription}
                                  >
                                    {managingSubscription && subscriptionAction === 'reactivate' ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg>
                                    )}
                                    Reactivate Subscription
                                  </button>
                                  <button 
                                    className="flex items-center justify-center gap-2 border border-green-600 text-green-600 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-50 transition w-full sm:w-auto"
                                    onClick={() => window.location.href = '/pricing'}
                                  >
                                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' /></svg>
                                    New Subscription
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 w-full">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                      <p className="text-yellow-800 text-sm font-medium">
                                        Your subscription was canceled more than 30 days ago and cannot be reactivated.
                                      </p>
                                    </div>
                                  </div>
                                  <button 
                                    className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto"
                                    onClick={() => window.location.href = '/pricing'}
                                  >
                                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' /></svg>
                                    Subscribe Again
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <button 
                          className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold hover:bg-green-700 transition w-full sm:w-auto"
                          onClick={() => window.location.href = '/pricing'}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' /></svg>
                          Subscribe Now
                        </button>
                      )}
                      
                      {/* Download Receipt Button - Only show when invoice PDF is available */}
                      {billingData?.invoices?.[0]?.invoice_pdf && (
                        <button 
                          className="flex items-center justify-center gap-2 border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base font-bold transition w-full sm:w-auto text-black bg-white hover:bg-gray-100 hover:ring-1 hover:ring-gray-300 cursor-pointer"
                          onClick={handleDownloadReceipt}
                          title="Download your receipt"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                          Download Receipt
                        </button>
                      )}
                      
                    </div>

                  </>
                )}
              </div>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="w-full flex justify-center">
              <div className="bg-white border rounded-xl shadow-sm ring-1 ring-gray-100 p-4 md:p-6 max-w-lg w-full mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-lg md:text-xl font-bold">Your Saved Documents</h1>
                  <button 
                    onClick={() => window.location.href = '/ai-assistant/step-2'}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Create New
                  </button>
                </div>
                
                {loadingDocuments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading your documents...</p>
                  </div>
                ) : documentsError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-600">{documentsError}</p>
                    </div>
                    <button 
                      onClick={() => fetchSavedDocuments(1)}
                      className="text-green-600 hover:text-green-700 underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : savedDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                    <p className="text-gray-500 mb-4">Documents you save from the AI assistant will appear here.</p>
                  
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Document
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {savedDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p 
                                      className="text-sm font-medium text-gray-900 truncate cursor-help" 
                                      title={(doc.metadata?.original_title || doc.filename || '').replace(/\.txt$/i, '')}
                                    >
                                      {(doc.metadata?.original_title || doc.filename || '').replace(/\.txt$/i, '')}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                                      {(doc.metadata?.document_type || doc.metadata?.normalized_document_type || doc.case_type) && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          {doc.metadata?.document_type || doc.metadata?.normalized_document_type || doc.case_type}
                                        </span>
                                      )}
                                      {doc.metadata?.legal_category && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                          {doc.metadata.legal_category}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 sm:hidden">
                                      {doc.content && doc.content.length > 80 
                                        ? `${doc.content.substring(0, 80)}...` 
                                        : doc.content || 'No preview'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 hidden sm:table-cell">
                                <div className="flex flex-col gap-1">
                                  {(doc.metadata?.document_type || doc.metadata?.normalized_document_type || doc.case_type) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {doc.metadata?.document_type || doc.metadata?.normalized_document_type || doc.case_type}
                                    </span>
                                  )}
                                  {doc.metadata?.legal_category && (
                                    <small className="capitalize inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {doc.metadata.legal_category}
                                    </small>
                                  )}
                                  {doc.case_type && !doc.metadata?.document_type && !doc.metadata?.normalized_document_type && (
                                    <span className="capitalize inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {doc.case_type}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {new Date(doc.created_at).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                                    title="Download Document"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="ml-1 hidden sm:inline">Download</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                                    title="Delete Document"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="ml-1 hidden sm:inline">Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {documentsTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <button
                          onClick={() => fetchSavedDocuments(documentsPage - 1)}
                          disabled={!documentsHasPrev || loadingDocuments}
                          className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        
                        <span className="text-sm text-gray-600">
                          Page {documentsPage} of {documentsTotalPages}
                        </span>
                        
                        <button
                          onClick={() => fetchSavedDocuments(documentsPage + 1)}
                          disabled={!documentsHasNext || loadingDocuments}
                          className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && subscriptionAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">
              {subscriptionAction === 'cancel' ? 'Cancel Subscription?' : 'Reactivate Subscription?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {subscriptionAction === 'cancel' 
                ? 'Your subscription will be canceled at the end of your current billing period. You\'ll retain access until then.'
                : subscriptionStatus === 'canceled'
                  ? 'This will reactivate your subscription with a new billing cycle starting immediately.'
                  : 'This will remove the cancellation and your subscription will continue automatically.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelSubscriptionAction}
                disabled={managingSubscription}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  subscriptionAction === 'cancel' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={confirmSubscriptionAction}
                disabled={managingSubscription}
              >
                {managingSubscription ? 'Processing...' : 
                  subscriptionAction === 'cancel' ? 'Yes, Cancel' : 'Yes, Reactivate'
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Document Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Delete Document?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone and the document will be permanently removed from your account.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelDeleteDocument}
                disabled={deletingDocument}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={confirmDeleteDocument}
                disabled={deletingDocument}
              >
                {deletingDocument ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </div>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
