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
}

/**
 * Formats multiple documents with clear separation for AI processing
 */
export function formatDocumentsForAI(documents: DocumentData[]): string {
  if (!documents || documents.length === 0) {
    return "No documents uploaded.";
  }

  let formattedContent = `📄 UPLOADED DOCUMENTS (${documents.length} total):\n\n`;

  documents.forEach((doc, index) => {
    const docNumber = doc.documentNumber || (index + 1);
    const fileSizeKB = Math.round(doc.fileSize / 1024);
    const uploadDate = new Date(doc.uploadTime).toLocaleDateString();
    
    formattedContent += `=== DOCUMENT ${docNumber}: ${doc.filename} ===\n`;
    formattedContent += `📋 Type: ${doc.fileType.toUpperCase()}\n`;
    formattedContent += `📏 Size: ${fileSizeKB}KB\n`;
    formattedContent += `📅 Uploaded: ${uploadDate}\n`;
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
