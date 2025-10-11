import OpenAI from 'openai';
import { supabase } from './supabaseClient';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token counting function (rough approximation)
function countTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Split text into chunks of approximately targetTokenCount tokens
export function splitIntoChunks(text: string, targetTokenCount: number = 1000): string[] {
  console.log(`🚨 [CHUNK DEBUG] splitIntoChunks called with:`, {
    textLength: text.length,
    targetTokenCount
  });

  if (!text || text.trim().length === 0) {
    console.log(`🚨 [CHUNK DEBUG] splitIntoChunks: Empty text provided`);
    return [];
  }

  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  console.log(`🚨 [CHUNK DEBUG] splitIntoChunks: Split into ${sentences.length} sentences`);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const sentenceWithPeriod = sentence.trim() + '.';
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentenceWithPeriod;
    const tokenCount = countTokens(potentialChunk);

    if (tokenCount > targetTokenCount && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentenceWithPeriod;
    } else {
      currentChunk = potentialChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  console.log(`🚨 [CHUNK DEBUG] splitIntoChunks: Created ${chunks.length} chunks`);
  chunks.forEach((chunk, index) => {
    console.log(`🚨 [CHUNK DEBUG] Chunk ${index + 1}: ${countTokens(chunk)} tokens, ${chunk.length} characters`);
  });

  return chunks;
}

// Generate embeddings for text using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`🚨 [CHUNK DEBUG] generateEmbedding called with text length: ${text.length}`);
  
  // Check if OpenAI client is available
  if (!openai) {
    console.error(`🚨 [CHUNK DEBUG] ERROR: OpenAI client not available`);
    throw new Error('OpenAI client not available');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error(`🚨 [CHUNK DEBUG] ERROR: OpenAI API key not configured for embedding generation`);
    throw new Error('OpenAI API key not configured');
  }

  try {

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embedding = response.data[0]?.embedding;
    console.log(`🚨 [CHUNK DEBUG] generateEmbedding: Successfully generated embedding with ${embedding?.length || 0} dimensions`);
    
    if (!embedding) {
      console.error(`🚨 [CHUNK DEBUG] ERROR: No embedding returned from OpenAI`);
      throw new Error('No embedding returned from OpenAI');
    }

    return embedding;
  } catch (error) {
    console.error(`🚨 [CHUNK DEBUG] ERROR in generateEmbedding:`, error);
    throw new Error(`Embedding generation failed: ${error?.message || error}`);
  }
}

// Store document chunks in Supabase with embeddings
export async function storeDocumentChunks(
  userId: string,
  documentId: string,
  chunks: string[],
  metadata?: { pageNumber?: number; title?: string }
): Promise<void> {
  try {
    console.log(`[storeDocumentChunks] Storing ${chunks.length} chunks for document ${documentId}`);
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        const embedding = await generateEmbedding(chunk);
        return {
          document_id: documentId,
          chunk_index: index,
          content: chunk,
          embedding,
          metadata: {
            page_number: metadata?.pageNumber || null,
            title: metadata?.title || null,
            user_id: userId
          }
        };
      } catch (error) {
        console.error(`[storeDocumentChunks] Error generating embedding for chunk ${index}:`, error);
        throw error;
      }
    });

    const chunkData = await Promise.all(chunkPromises);
    
    // Use different approach for anonymous users vs authenticated users
    let error = null;
    
    if (userId === 'anonymous') {
      // For anonymous users, we need to handle the RLS policy differently
      // Try to insert chunks one by one to avoid bulk insert issues
      for (const chunk of chunkData) {
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert(chunk);
        
        if (chunkError) {
          console.error(`[storeDocumentChunks] Error inserting chunk ${chunk.chunk_index}:`, chunkError);
          error = chunkError;
          break;
        }
      }
    } else {
      // For authenticated users, use bulk insert
      const { error: bulkError } = await supabase
        .from('document_chunks')
        .insert(chunkData);
      error = bulkError;
    }

    if (error) {
      console.error('[storeDocumentChunks] Supabase insert error:', error);
      throw new Error(`[storeDocumentChunks] Supabase insert error: ${error.message}`);
    }

    console.log(`[storeDocumentChunks] Successfully stored ${chunks.length} chunks for document ${documentId}`);
  } catch (error) {
    console.error('[storeDocumentChunks] Error storing document chunks:', error);
    throw new Error(`[storeDocumentChunks] ${error?.message || error}`);
  }
}

// Retrieve relevant chunks based on user query
export async function retrieveRelevantChunks(
  userId: string,
  documentId: string,
  userMessage: string,
  maxChunks: number = 3
): Promise<Array<{ content: string; similarity: number }>> {
  try {
    console.log(`[retrieveRelevantChunks] Starting search for userId=${userId}, documentId=${documentId}, query="${userMessage}"`);
    
    // First check if document exists and has chunks
    console.log(`[retrieveRelevantChunks] Checking if document ${documentId} exists and has chunks`);
    const { data: docCheck, error: docError } = await supabase
      .from('document_chunks')
      .select('id')
      .eq('document_id', documentId)
      .limit(1);

    if (docError) {
      console.error('[retrieveRelevantChunks] Error checking document existence:', docError);
      throw new Error(`Database error: ${docError.message}`);
    }

    if (!docCheck || docCheck.length === 0) {
      console.log(`[retrieveRelevantChunks] Document ${documentId} not found in database`);
      return [];
    }

    // Generate embedding for user query
    console.log(`[retrieveRelevantChunks] Generating embedding for query`);
    const queryEmbedding = await generateEmbedding(userMessage);
    console.log(`[retrieveRelevantChunks] Embedding generated successfully, length: ${queryEmbedding.length}`);

    // Search for similar chunks using the match_document_chunks function
    console.log(`[retrieveRelevantChunks] Searching Supabase for similar chunks`);
    const { data, error } = await supabase
      .rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: maxChunks
      });

    if (error) {
      console.error('[retrieveRelevantChunks] Supabase RPC error:', error);
      throw new Error(`Supabase query failed: ${error.message || error}`);
    }
    
    console.log(`[retrieveRelevantChunks] Supabase query successful, found ${data?.length || 0} chunks`);
    
    // Filter chunks to only include those from the specific document
    const relevantChunks = data?.filter(chunk => chunk.document_id === documentId) || [];
    
    console.log(`[retrieveRelevantChunks] Filtered to ${relevantChunks.length} chunks from document ${documentId}`);
    
    return relevantChunks.map(chunk => ({
      content: chunk.content,
      similarity: chunk.similarity
    }));
  } catch (error) {
    console.error('[retrieveRelevantChunks] Error in retrieveRelevantChunks:', error);
    
    // Provide specific error messages based on the error type
    if (error?.message?.includes('Supabase') || error?.message?.includes('database')) {
      throw new Error(`Database connection error: ${error.message}`);
    } else if (error?.message?.includes('embedding')) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    } else if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      throw new Error(`Request timeout: ${error.message}`);
    } else {
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
}

// Process uploaded document: chunk, embed, and store
export async function processUploadedDocument(
  userId: string,
  documentId: string,
  documentText: string,
  metadata?: { filename?: string; pageNumber?: number }
): Promise<void> {
  try {
    console.log(`🚨 [CHUNK DEBUG] === PROCESS UPLOADED DOCUMENT START ===`);
    console.log(`🚨 [CHUNK DEBUG] Processing document:`, {
      userId,
      documentId,
      textLength: documentText.length,
      filename: metadata?.filename,
      pageNumber: metadata?.pageNumber
    });

    if (!documentText || documentText.trim().length === 0) {
      console.error(`🚨 [CHUNK DEBUG] ERROR: Document text is empty`);
      throw new Error('Document text is empty');
    }

    // Chunk the document
    console.log(`🚨 [CHUNK DEBUG] Starting document chunking`);
    const chunks = splitIntoChunks(documentText);
    console.log(`🚨 [CHUNK DEBUG] Document chunked into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.error(`🚨 [CHUNK DEBUG] ERROR: No chunks generated from document`);
      throw new Error('No chunks generated from document');
    }

    // Log first few chunks for debugging
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`🚨 [CHUNK DEBUG] Chunk ${index + 1} preview:`, chunk.substring(0, 100) + '...');
    });

    // Store chunks in database
    console.log(`🚨 [CHUNK DEBUG] Starting to store ${chunks.length} chunks in database`);
    await storeDocumentChunks(userId, documentId, chunks, metadata);
    console.log(`🚨 [CHUNK DEBUG] Successfully stored all chunks in database`);

    console.log(`🚨 [CHUNK DEBUG] === PROCESS UPLOADED DOCUMENT END ===`);
  } catch (error) {
    console.error(`🚨 [CHUNK DEBUG] ERROR in processUploadedDocument:`, error);
    throw new Error(`[processUploadedDocument] ${error?.message || error}`);
  }
}

// Get context from relevant chunks for chat
export async function getDocumentContext(
  userId: string,
  documentId: string,
  userMessage: string,
  maxChunks: number = 3
): Promise<string> {
  try {
    console.log(`[getDocumentContext] Starting retrieval for userId=${userId}, documentId=${documentId}, query="${userMessage}"`);
    
    const relevantChunks = await retrieveRelevantChunks(
      userId,
      documentId,
      userMessage,
      maxChunks
    );
    
    console.log(`[getDocumentContext] Retrieved ${relevantChunks.length} chunks`);
    
    if (relevantChunks.length === 0) {
      console.log(`[getDocumentContext] No relevant chunks found for document ${documentId} - returning fallback marker`);
      return "__NO_CHUNKS__";
    }
    
    // Combine relevant chunks into context
    const context = relevantChunks
      .sort((a, b) => a.similarity - b.similarity) // Sort by similarity
      .map(chunk => chunk.content)
      .join('\n\n');
    
    console.log(`[getDocumentContext] Successfully created context with ${context.length} characters`);
    return `Relevant document context:\n${context}`;
  } catch (error) {
    console.error('[getDocumentContext] Error getting document context:', error);
    
    // Provide specific error messages based on the error type
    if (error?.message?.includes('Supabase')) {
      console.error('[getDocumentContext] Supabase connection error');
      return "__NO_CHUNKS__";
    } else if (error?.message?.includes('embedding')) {
      console.error('[getDocumentContext] Embedding generation error');
      return "__NO_CHUNKS__";
    } else if (error?.message?.includes('timeout')) {
      console.error('[getDocumentContext] Request timeout error');
      return "__NO_CHUNKS__";
    } else {
      console.error('[getDocumentContext] Unknown error:', error);
      return "__NO_CHUNKS__";
    }
  }
} 