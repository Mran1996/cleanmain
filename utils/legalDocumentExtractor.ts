/**
 * Enhanced document extraction for legal cases
 * Handles all types of evidence documents typically found in criminal cases
 */

export interface LegalDocumentData {
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
  documentType: 'text' | 'image' | 'video' | 'audio' | 'data' | 'archive';
  extractedMetadata?: {
    pages?: number;
    duration?: number; // for video/audio
    dimensions?: { width: number; height: number }; // for images/video
    textContent?: string;
    ocrText?: string; // for scanned documents
  };
}

/**
 * Enhanced text extraction for legal documents
 */
export async function extractLegalDocumentText(file: File): Promise<LegalDocumentData> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileSize = file.size;
  const documentId = crypto.randomUUID();
  
  // Determine document type
  const documentType = getDocumentType(ext);
  
  let documentText = '';
  let pageCount = 0;
  let extractedMetadata: any = {};

  try {
    switch (documentType) {
      case 'text':
        const textResult = await extractTextDocument(file, ext);
        documentText = textResult.content;
        pageCount = textResult.pageCount;
        extractedMetadata = textResult.metadata;
        break;
        
      case 'image':
        const imageResult = await extractImageDocument(file, ext);
        documentText = imageResult.content;
        pageCount = 1; // Images are single "pages"
        extractedMetadata = imageResult.metadata;
        break;
        
      case 'video':
        const videoResult = await extractVideoDocument(file, ext);
        documentText = videoResult.content;
        pageCount = Math.ceil(videoResult.metadata.duration / 60); // Approximate pages by minutes
        extractedMetadata = videoResult.metadata;
        break;
        
      case 'audio':
        const audioResult = await extractAudioDocument(file, ext);
        documentText = audioResult.content;
        pageCount = Math.ceil(audioResult.metadata.duration / 60); // Approximate pages by minutes
        extractedMetadata = audioResult.metadata;
        break;
        
      case 'data':
        const dataResult = await extractDataDocument(file, ext);
        documentText = dataResult.content;
        pageCount = dataResult.pageCount;
        extractedMetadata = dataResult.metadata;
        break;
        
      case 'archive':
        const archiveResult = await extractArchiveDocument(file, ext);
        documentText = archiveResult.content;
        pageCount = archiveResult.pageCount;
        extractedMetadata = archiveResult.metadata;
        break;
        
      default:
        documentText = `File: ${file.name}\n\nThis file type (${ext}) is not yet supported for automatic text extraction. Please provide a description of the document content.`;
        pageCount = 1;
    }
  } catch (error) {
    console.error('Error extracting document:', error);
    documentText = `File: ${file.name}\n\nError extracting text content. File type: ${ext?.toUpperCase()}, Size: ${(fileSize / 1024).toFixed(1)}KB\n\nPlease provide a description of the document content.`;
    pageCount = 1;
  }

  return {
    id: documentId,
    filename: file.name,
    fileType: ext,
    fileSize: fileSize,
    uploadTime: new Date().toISOString(),
    status: 'uploaded',
    content: documentText,
    parsedText: documentText,
    documentNumber: 0, // Will be set when added to array
    pageCount: pageCount,
    documentType: documentType,
    extractedMetadata: extractedMetadata
  };
}

/**
 * Determine document type from file extension
 */
function getDocumentType(ext: string): LegalDocumentData['documentType'] {
  const textTypes = ['pdf', 'docx', 'txt', 'doc', 'rtf', 'odt'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  const audioTypes = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];
  const dataTypes = ['csv', 'xlsx', 'xls', 'ppt', 'pptx'];
  const archiveTypes = ['zip', 'rar', '7z'];

  if (textTypes.includes(ext)) return 'text';
  if (imageTypes.includes(ext)) return 'image';
  if (videoTypes.includes(ext)) return 'video';
  if (audioTypes.includes(ext)) return 'audio';
  if (dataTypes.includes(ext)) return 'data';
  if (archiveTypes.includes(ext)) return 'archive';
  
  return 'text'; // Default fallback
}

/**
 * Extract text from text-based documents
 */
async function extractTextDocument(file: File, ext: string): Promise<{content: string, pageCount: number, metadata: any}> {
  let content = '';
  let pageCount = 0;
  let metadata: any = {};

  try {
    if (ext === 'txt' || ext === 'rtf') {
      content = await file.text();
      pageCount = Math.ceil(content.length / 2000); // Approximate pages
    } else if (ext === 'pdf') {
      const { extractText } = await import('@/utils/extractText');
      content = await extractText(file);
      // More accurate page counting for PDFs
      pageCount = Math.max(1, Math.ceil(content.length / 1500)); // More accurate for legal documents
    } else if (ext === 'docx' || ext === 'doc') {
      const { extractText } = await import('@/utils/extractText');
      content = await extractText(file);
      pageCount = Math.ceil(content.length / 2000); // Approximate pages
    } else {
      content = await file.text();
      pageCount = Math.ceil(content.length / 2000);
    }
    
    metadata = {
      pages: pageCount,
      textContent: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      wordCount: content.split(' ').length,
      characterCount: content.length
    };
  } catch (error) {
    console.error('Error extracting text document:', error);
    content = `Error extracting text from ${file.name}. Please provide a description of the document content.`;
    pageCount = 1;
  }

  return { content, pageCount, metadata };
}

/**
 * Extract content from image documents (including OCR for scanned docs)
 */
async function extractImageDocument(file: File, ext: string): Promise<{content: string, metadata: any}> {
  let content = '';
  let metadata: any = {};

  try {
    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        // Basic image analysis
        const dimensions = { width: img.width, height: img.height };
        
        // For now, provide a structured template for image analysis
        content = `[IMAGE DOCUMENT: ${file.name}]\n\n`;
        content += `📸 Image Analysis:\n`;
        content += `• File: ${file.name}\n`;
        content += `• Type: ${ext.toUpperCase()}\n`;
        content += `• Dimensions: ${dimensions.width}x${dimensions.height} pixels\n`;
        content += `• Size: ${(file.size / 1024).toFixed(1)}KB\n\n`;
        content += `🔍 Content Analysis Required:\n`;
        content += `This appears to be a screenshot or image document. For legal analysis, please describe:\n\n`;
        content += `1. **What the image shows:**\n`;
        content += `   - Is this a screenshot of text messages, emails, documents, or other evidence?\n`;
        content += `   - What application or platform is shown?\n\n`;
        content += `2. **Any text visible in the image:**\n`;
        content += `   - Names, dates, times, locations\n`;
        content += `   - Conversations, messages, or communications\n`;
        content += `   - Any other written content\n\n`;
        content += `3. **Important details or evidence:**\n`;
        content += `   - People, places, or objects shown\n`;
        content += `   - Timestamps or dates visible\n`;
        content += `   - Any legal significance\n\n`;
        content += `4. **Context in your case:**\n`;
        content += `   - How does this relate to your legal matter?\n`;
        content += `   - What evidence does this provide?\n\n`;
        content += `💡 **Note:** OCR (Optical Character Recognition) will be implemented to automatically extract text from images, but for now, please provide a detailed description of the image content.`;
        
        metadata = {
          dimensions: dimensions,
          fileType: ext,
          isScannedDocument: true,
          needsOCR: true,
          hasTextContent: true,
          analysisType: 'screenshot_or_document'
        };
        
        // Clean up
        URL.revokeObjectURL(img.src);
        resolve({ content, metadata });
      };
      
      img.onerror = () => {
        content = `Error loading image ${file.name}. Please describe what the image shows.`;
        metadata = { fileType: ext, error: 'Failed to load image' };
        resolve({ content, metadata });
      };
      
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    console.error('Error processing image:', error);
    content = `Error processing image ${file.name}. Please describe what the image shows.`;
    metadata = { fileType: ext, error: error.message };
    return { content, metadata };
  }
}

/**
 * Extract content from video documents
 */
async function extractVideoDocument(file: File, ext: string): Promise<{content: string, metadata: any}> {
  let content = '';
  let metadata: any = {};

  try {
    content = `[VIDEO DOCUMENT: ${file.name}]\n\nThis is a video file (${ext.toUpperCase()}). For legal analysis, please describe:\n• What the video shows\n• Any audio content\n• Important timestamps or events\n• The context of this video in your case\n• Any people, locations, or objects visible\n\nNote: Video transcription and analysis is not yet implemented, but will be added to automatically extract content from video evidence.`;
    
    metadata = {
      fileType: ext,
      duration: 0, // Would be extracted from video metadata
      needsTranscription: true,
      needsAnalysis: true
    };
  } catch (error) {
    console.error('Error processing video:', error);
    content = `Error processing video ${file.name}. Please describe what the video shows.`;
  }

  return { content, metadata };
}

/**
 * Extract content from audio documents
 */
async function extractAudioDocument(file: File, ext: string): Promise<{content: string, metadata: any}> {
  let content = '';
  let metadata: any = {};

  try {
    content = `[AUDIO DOCUMENT: ${file.name}]\n\nThis is an audio file (${ext.toUpperCase()}). For legal analysis, please describe:\n• What the audio contains\n• Any conversations or speech\n• Important timestamps or events\n• The context of this audio in your case\n• Any background sounds or noise\n\nNote: Audio transcription is not yet implemented, but will be added to automatically extract speech content from audio evidence.`;
    
    metadata = {
      fileType: ext,
      duration: 0, // Would be extracted from audio metadata
      needsTranscription: true,
      needsAnalysis: true
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    content = `Error processing audio ${file.name}. Please describe what the audio contains.`;
  }

  return { content, metadata };
}

/**
 * Extract content from data documents (spreadsheets, presentations)
 */
async function extractDataDocument(file: File, ext: string): Promise<{content: string, pageCount: number, metadata: any}> {
  let content = '';
  let pageCount = 0;
  let metadata: any = {};

  try {
    if (ext === 'csv') {
      content = await file.text();
      pageCount = 1;
    } else if (ext === 'xlsx' || ext === 'xls') {
      content = `[SPREADSHEET: ${file.name}]\n\nThis is a spreadsheet file. For legal analysis, please describe:\n• What data the spreadsheet contains\n• Any important numbers, dates, or calculations\n• The context of this data in your case\n\nNote: Spreadsheet parsing is not yet implemented, but will be added to automatically extract data from Excel files.`;
      pageCount = 1;
    } else if (ext === 'ppt' || ext === 'pptx') {
      content = `[PRESENTATION: ${file.name}]\n\nThis is a presentation file. For legal analysis, please describe:\n• What the presentation contains\n• Any important slides or information\n• The context of this presentation in your case\n\nNote: Presentation parsing is not yet implemented, but will be added to automatically extract content from PowerPoint files.`;
      pageCount = 1;
    } else {
      content = await file.text();
      pageCount = 1;
    }
    
    metadata = {
      fileType: ext,
      needsParsing: true,
      isStructuredData: true
    };
  } catch (error) {
    console.error('Error processing data document:', error);
    content = `Error processing data file ${file.name}. Please describe what the file contains.`;
    pageCount = 1;
  }

  return { content, pageCount, metadata };
}

/**
 * Extract content from archive documents
 */
async function extractArchiveDocument(file: File, ext: string): Promise<{content: string, pageCount: number, metadata: any}> {
  let content = '';
  let pageCount = 0;
  let metadata: any = {};

  try {
    content = `[ARCHIVE: ${file.name}]\n\nThis is an archive file (${ext.toUpperCase()}). For legal analysis, please describe:\n• What files are contained in this archive\n• Any important documents within the archive\n• The context of this archive in your case\n\nNote: Archive extraction is not yet implemented, but will be added to automatically extract and analyze files within archives.`;
    pageCount = 1;
    
    metadata = {
      fileType: ext,
      needsExtraction: true,
      isArchive: true
    };
  } catch (error) {
    console.error('Error processing archive:', error);
    content = `Error processing archive ${file.name}. Please describe what the archive contains.`;
    pageCount = 1;
  }

  return { content, pageCount, metadata };
}
