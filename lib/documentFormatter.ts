/**
 * Utility functions for formatting multiple documents for AI consumption
 */

export interface DocumentData {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  status: string;
  content: string;
  parsedText: string;
  documentNumber: number;
  pageCount?: number;
  documentType?: 'text' | 'image' | 'video' | 'audio' | 'data' | 'archive';
  extractedMetadata?: {
    pages?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    textContent?: string;
    ocrText?: string;
  };
}

/**
 * Formats multiple documents with clear separation for AI processing
 */
export function formatDocumentsForAI(documents: DocumentData[]): string {
  if (!documents || documents.length === 0) {
    return "No documents uploaded.";
  }

  // Calculate total pages across all documents
  const totalPages = documents.reduce((sum, doc) => sum + (doc.pageCount || 1), 0);
  const hasLargeDocuments = documents.some(doc => (doc.pageCount || 1) >= 10);
  
  let formattedContent = `📄 UPLOADED DOCUMENTS (${documents.length} total, ${totalPages} total pages):\n\n`;
  
  // Add size awareness header
  if (hasLargeDocuments) {
    formattedContent += `⚠️ LARGE DOCUMENT DETECTED: This document set contains substantial legal content requiring comprehensive analysis.\n`;
    formattedContent += `📊 Document Scope: ${totalPages} total pages across ${documents.length} document(s)\n`;
    formattedContent += `🎯 Analysis Requirement: Provide detailed, comprehensive responses that reflect the full scope of these documents.\n\n`;
  }

  documents.forEach((doc, index) => {
    const docNumber = doc.documentNumber || (index + 1);
    const fileSizeKB = Math.round(doc.fileSize / 1024);
    const uploadDate = new Date(doc.uploadTime).toLocaleDateString();
    const pageCount = doc.pageCount || 1;
    const documentType = doc.documentType || 'text';
    
    formattedContent += `=== DOCUMENT ${docNumber}: ${doc.filename} ===\n`;
    formattedContent += `📋 Type: ${doc.fileType.toUpperCase()} (${documentType})\n`;
    formattedContent += `📏 Size: ${fileSizeKB}KB\n`;
    formattedContent += `📄 Pages: ${pageCount} ${pageCount >= 10 ? '(LARGE DOCUMENT - requires comprehensive analysis)' : ''}\n`;
    formattedContent += `📅 Uploaded: ${uploadDate}\n`;
    
    // Add document-specific metadata
    if (doc.extractedMetadata) {
      if (doc.extractedMetadata.pages) {
        formattedContent += `📊 Total Pages: ${doc.extractedMetadata.pages}\n`;
      }
      if (doc.extractedMetadata.duration) {
        formattedContent += `⏱️ Duration: ${Math.round(doc.extractedMetadata.duration)} seconds\n`;
      }
      if (doc.extractedMetadata.dimensions) {
        formattedContent += `📐 Dimensions: ${doc.extractedMetadata.dimensions.width}x${doc.extractedMetadata.dimensions.height}\n`;
      }
    }
    
    formattedContent += `📄 Content:\n${doc.content}\n\n`;
    formattedContent += `--- END DOCUMENT ${docNumber} ---\n\n`;
  });

  return formattedContent;
}

/**
 * Gets document by number (1-based indexing for user-friendly references)
 */
export function getDocumentByNumber(documents: DocumentData[], documentNumber: number): DocumentData | null {
  return documents.find(doc => doc.documentNumber === documentNumber) || null;
}

/**
 * Gets document by filename
 */
export function getDocumentByFilename(documents: DocumentData[], filename: string): DocumentData | null {
  return documents.find(doc => doc.filename.toLowerCase().includes(filename.toLowerCase())) || null;
}

/**
 * Creates a document summary for quick reference
 */
export function createDocumentSummary(documents: DocumentData[]): string {
  if (!documents || documents.length === 0) {
    return "No documents uploaded.";
  }

  let summary = `📚 DOCUMENT SUMMARY (${documents.length} documents):\n\n`;
  
  documents.forEach((doc, index) => {
    const docNumber = doc.documentNumber || (index + 1);
    const fileSizeKB = Math.round(doc.fileSize / 1024);
    const uploadDate = new Date(doc.uploadTime).toLocaleDateString();
    
    summary += `${docNumber}. ${doc.filename} (${doc.fileType.toUpperCase()}, ${fileSizeKB}KB, uploaded ${uploadDate})\n`;
  });

  return summary;
}
