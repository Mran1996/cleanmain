"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface SavedDocument {
  id: string;
  filename: string;
  content: string;
  case_type?: string;
  court?: string;
  case_number?: string;
  plaintiff?: string;
  defendant?: string;
  metadata?: {
    original_title?: string;
    document_type?: string;
    legal_category?: string;
    case_details?: any;
    generated_by_ai?: boolean;
  };
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch saved documents from the existing documents table
  const fetchDocuments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
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
      const { data: docs, error: queryError, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .or('metadata->>generated_by_ai.eq.true,file_type.eq.text/plain')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (queryError) {
        throw new Error(queryError.message);
      }
      
      setDocuments(docs || []);
      
      // Calculate pagination info with proper bounds checking
      const totalCount = count || 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const currentPage = Math.min(Math.max(1, page), totalPages);
      
      setCurrentPage(currentPage);
      setTotalPages(totalPages);
      setHasNext(currentPage < totalPages && totalCount > currentPage * limit);
      setHasPrev(currentPage > 1);
      
    } catch (err) {
      console.error("Failed to load documents", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
      setDocuments([]);
      // Reset pagination state on error
      setCurrentPage(1);
      setTotalPages(1);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = (doc: SavedDocument) => {
    try {
      if (!doc.content) {
        console.error('Document content is empty');
        return;
      }
      
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create safe filename
      const title = doc.metadata?.original_title || doc.filename || 'Legal_Document';
      const safeFilename = title.replace(/[^a-z0-9\s\-_]/gi, '').replace(/\s+/g, '_');
      a.download = `${safeFilename}.txt`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Document downloaded successfully');
    } catch (err) {
      console.error('❌ Error downloading document:', err);
      // No alert - just log the error
    }
  };

  // Handle document deletion - show modal
  const handleDelete = (documentId: string) => {
    setDocumentToDelete(documentId);
    setShowDeleteModal(true);
  };

  // Confirm document deletion
  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleting(true);
      
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
      await fetchDocuments(currentPage);
      
      console.log('✅ Document deleted successfully');
      
    } catch (error) {
      console.error("❌ Failed to delete document", error);
      setError(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  // Cancel document deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  // Load documents on component mount
  useEffect(() => {
    fetchDocuments(1);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Documents</h1>
      <div className="border rounded-xl p-6 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Saved Legal Documents</h2>
          <Button 
            onClick={() => window.location.href = '/ai-assistant'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Create New Document
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
            <button 
              onClick={() => fetchDocuments(1)}
              className="text-green-600 hover:text-green-700 underline"
            >
              Try Again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Documents you save from the AI assistant will appear here.</p>
            <Button 
              onClick={() => window.location.href = '/ai-assistant'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Your First Document
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 pr-4">Document Title</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium">{doc.metadata?.original_title || doc.filename}</div>
                          {doc.metadata?.case_details?.legal_issue && (
                            <div className="text-xs text-gray-500 mt-1">
                              {doc.metadata.case_details.legal_issue}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {doc.metadata?.document_type || doc.case_type ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {doc.metadata?.document_type || doc.case_type}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {doc.metadata?.legal_category ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {doc.metadata.legal_category}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-green-600 hover:text-green-700 underline text-sm"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-700 underline text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <button
                  onClick={() => fetchDocuments(currentPage - 1)}
                  disabled={!hasPrev || loading}
                  className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => fetchDocuments(currentPage + 1)}
                  disabled={!hasNext || loading}
                  className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Delete Document?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone and the document will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
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