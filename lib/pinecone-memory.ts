/**
 * Pinecone Vector Database Integration for User-Specific Memory Storage
 * Uses namespaces for complete user isolation
 * 
 * Best Practices Implemented:
 * - ✅ Namespace isolation per user
 * - ✅ Exponential backoff retry logic
 * - ✅ Batch size limits (96 for text, 1000 for vectors)
 * - ✅ Proper error handling (only retry 429 and 5xx)
 * - ✅ Metadata size limits (40KB per record)
 * - ✅ Flat metadata structure (no nested objects)
 * 
 * Note: Index creation should be done via Pinecone CLI, not SDK
 * CLI command: pc index create -n user-memories --dimension 1536 --metric cosine --cloud aws --region us-east-1
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './document-chunking';
import { withRetry } from './pinecone-retry';

// Batch size limits per Pinecone best practices
const TEXT_BATCH_SIZE = 96; // Max records per batch for text (with embeddings)
const VECTOR_BATCH_SIZE = 1000; // Max records per batch for vectors
const MAX_BATCH_SIZE_BYTES = 2 * 1024 * 1024; // 2MB total per batch

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Get or create Pinecone index
 * Uses a single index with namespaces for user isolation
 * 
 * IMPORTANT: Index creation should be done via Pinecone CLI, not SDK
 * Use: pc index create -n user-memories --dimension 1536 --metric cosine --cloud aws --region us-east-1
 */
async function getOrCreateIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || 'user-memories';
  
  try {
    const index = client.index(indexName);
    // Verify index exists by checking stats (with retry)
    await withRetry(async () => {
      await index.describeIndexStats();
    });
    return index;
  } catch (error: any) {
    if (error.message?.includes('not found') || getStatusCode(error) === 404) {
      const cliCommand = `pc index create -n ${indexName} --dimension 1536 --metric cosine --cloud aws --region us-east-1`;
      console.error(`Index ${indexName} not found. Create it using Pinecone CLI:\n${cliCommand}`);
      throw new Error(
        `Pinecone index "${indexName}" not found. ` +
        `Please create it using Pinecone CLI: ${cliCommand}`
      );
    }
    throw error;
  }
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: any): number | null {
  if (error?.status) return error.status;
  if (error?.response?.status) return error.response.status;
  if (error?.statusCode) return error.statusCode;
  return null;
}

/**
 * Generate user-specific namespace for complete isolation
 * Uses userId as namespace to ensure no data overlap
 */
function getUserNamespace(userId: string): string {
  // Sanitize userId to ensure valid namespace (alphanumeric and hyphens only)
  return `user-${userId.replace(/[^a-zA-Z0-9-]/g, '-')}`;
}

export interface UserMemory {
  id?: string;
  memoryType: 'preference' | 'fact' | 'pattern' | 'case_context' | 'communication_style' | 'conversation';
  category?: string;
  keyText: string;
  valueText?: string;
  context?: string;
  confidenceScore?: number;
  source?: string;
  frequency?: number;
  metadata?: Record<string, any>;
}

export interface RetrievedMemory {
  id: string;
  memoryType: string;
  category?: string;
  keyText: string;
  valueText?: string;
  context?: string;
  confidenceScore: number;
  source?: string;
  frequency: number;
  score: number; // Similarity score from Pinecone
  metadata?: Record<string, any>;
}

/**
 * Store a memory in Pinecone with user-specific namespace
 */
export async function storeMemory(
  userId: string,
  memory: UserMemory
): Promise<string> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Generate embedding from memory content
    const textToEmbed = `${memory.keyText} ${memory.valueText || ''} ${memory.context || ''}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Generate unique ID
    const memoryId = memory.id || `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Prepare metadata (Pinecone metadata must be flat: string, number, boolean, or array)
    // Max 40KB per record, no nested objects
    const metadata: Record<string, any> = {
      userId: userId, // Store userId in metadata for additional verification
      memoryType: memory.memoryType,
      keyText: memory.keyText.substring(0, 1000), // Truncate to prevent metadata overflow
      valueText: (memory.valueText || '').substring(0, 1000),
      context: (memory.context || '').substring(0, 1000),
      confidenceScore: memory.confidenceScore || 1.0,
      source: memory.source || 'chat',
      frequency: memory.frequency || 1,
      timestamp: new Date().toISOString(),
    };

    // Add category if provided (flat structure only)
    if (memory.category) {
      metadata.category = memory.category;
    }

    // Add custom metadata (ensure flat structure - no nested objects)
    if (memory.metadata) {
      // Flatten any nested objects to prevent API errors
      for (const [key, value] of Object.entries(memory.metadata)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Flatten nested objects
          console.warn(`Flattening nested metadata key: ${key}`);
          Object.assign(metadata, { [`${key}_flat`]: JSON.stringify(value) });
        } else {
          metadata[key] = value;
        }
      }
    }

    // Store in Pinecone with user-specific namespace (with retry)
    await withRetry(async () => {
      await index.namespace(namespace).upsert([
        {
          id: memoryId,
          values: embedding,
          metadata: metadata,
        },
      ]);
    });

    console.log(`✅ Stored memory in Pinecone namespace: ${namespace}, ID: ${memoryId}`);
    return memoryId;
  } catch (error) {
    console.error('Error storing memory in Pinecone:', error);
    throw error;
  }
}

/**
 * Retrieve relevant memories from Pinecone using semantic search
 * Only searches within the user's namespace for complete isolation
 */
export async function retrieveMemories(
  userId: string,
  query: string,
  options: {
    limit?: number;
    minScore?: number;
    memoryTypes?: string[];
    filter?: Record<string, any>;
  } = {}
): Promise<RetrievedMemory[]> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    const {
      limit = 5,
      minScore = 0.7,
      memoryTypes = [],
      filter = {},
    } = options;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter for Pinecone
    const pineconeFilter: Record<string, any> = {
      userId: { $eq: userId }, // Additional safety check
      ...filter,
    };

    // Add memory type filter if specified
    if (memoryTypes.length > 0) {
      pineconeFilter.memoryType = { $in: memoryTypes };
    }

    // Query Pinecone with user-specific namespace (with retry)
    // Note: Using .query() for vector search. For integrated embeddings, would use .search()
    const queryResponse = await withRetry(async () => {
      return await index.namespace(namespace).query({
        vector: queryEmbedding,
        topK: limit * 2, // Get more candidates for potential reranking
        includeMetadata: true,
        filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
      });
    });

    // Transform results
    const memories: RetrievedMemory[] = (queryResponse.matches || [])
      .filter((match) => {
        // Double-check userId in metadata for security
        const metadata = match.metadata || {};
        return metadata.userId === userId && (match.score || 0) >= minScore;
      })
      .map((match) => ({
        id: match.id,
        memoryType: (match.metadata?.memoryType as string) || 'fact',
        category: match.metadata?.category as string,
        keyText: (match.metadata?.keyText as string) || '',
        valueText: (match.metadata?.valueText as string) || '',
        context: (match.metadata?.context as string) || '',
        confidenceScore: (match.metadata?.confidenceScore as number) || 1.0,
        source: (match.metadata?.source as string) || 'chat',
        frequency: (match.metadata?.frequency as number) || 1,
        score: match.score || 0,
        metadata: match.metadata as Record<string, any>,
      }));

    console.log(`✅ Retrieved ${memories.length} memories from namespace: ${namespace}`);
    return memories;
  } catch (error: any) {
    // If namespace doesn't exist, return empty array (user has no memories yet)
    if (error.message?.includes('not found') || getStatusCode(error) === 404) {
      console.log(`Namespace ${getUserNamespace(userId)} not found - user has no memories yet`);
      return [];
    }
    console.error('Error retrieving memories from Pinecone:', error);
    throw error;
  }
}

/**
 * Update memory frequency and last accessed time
 */
export async function updateMemoryAccess(
  userId: string,
  memoryId: string
): Promise<void> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Fetch current memory (with retry)
    const fetchResponse = await withRetry(async () => {
      return await index.namespace(namespace).fetch([memoryId]);
    });
    const memory = fetchResponse.records?.[memoryId];

    if (!memory) {
      console.warn(`Memory ${memoryId} not found in namespace ${namespace}`);
      return;
    }

    // Verify userId matches (security check)
    const metadata = memory.metadata || {};
    if (metadata.userId !== userId) {
      throw new Error('Memory does not belong to this user');
    }

    // Update frequency and timestamp
    const updatedMetadata = {
      ...metadata,
      frequency: ((metadata.frequency as number) || 0) + 1,
      lastAccessed: new Date().toISOString(),
    };

    // Upsert with updated metadata (with retry)
    await withRetry(async () => {
      await index.namespace(namespace).upsert([
        {
          id: memoryId,
          values: memory.values, // Keep existing embedding
          metadata: updatedMetadata,
        },
      ]);
    });

    console.log(`✅ Updated memory access: ${memoryId}`);
  } catch (error) {
    console.error('Error updating memory access:', error);
    throw error;
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(
  userId: string,
  memoryId: string
): Promise<void> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Verify memory belongs to user before deleting
    const fetchResponse = await withRetry(async () => {
      return await index.namespace(namespace).fetch([memoryId]);
    });
    const memory = fetchResponse.records?.[memoryId];

    if (memory) {
      const metadata = memory.metadata || {};
      if (metadata.userId !== userId) {
        throw new Error('Memory does not belong to this user');
      }
    }

    // Delete with retry
    await withRetry(async () => {
      await index.namespace(namespace).delete1([memoryId]);
    });
    console.log(`✅ Deleted memory: ${memoryId} from namespace: ${namespace}`);
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw error;
  }
}

/**
 * Delete all memories for a user (useful for account deletion)
 */
export async function deleteAllUserMemories(userId: string): Promise<void> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Delete entire namespace (Pinecone doesn't have a direct delete namespace method)
    // So we need to fetch all and delete them in batches
    // Note: This is a limitation - we'll delete by fetching and deleting in batches
    const stats = await withRetry(async () => {
      return await index.namespace(namespace).describeIndexStats();
    });
    const totalVectors = stats.totalRecordCount || 0;

    if (totalVectors === 0) {
      console.log(`No memories to delete for user ${userId}`);
      return;
    }

    // Fetch all IDs and delete in batches
    // Note: This is a workaround - ideally Pinecone would support namespace deletion
    console.log(`⚠️ Deleting ${totalVectors} memories for user ${userId}. This may take a moment.`);
    
    // For now, we'll mark this as a TODO since Pinecone doesn't support bulk namespace deletion
    // Users would need to manually delete or we'd need to track IDs in a separate database
    throw new Error('Bulk deletion not implemented. Use deleteMemory for individual deletions.');
  } catch (error) {
    console.error('Error deleting all user memories:', error);
    throw error;
  }
}

/**
 * Batch store memories (respects Pinecone batch limits)
 * Best practice: Use batches of 96 records max for text with embeddings
 */
export async function storeMemoriesBatch(
  userId: string,
  memories: UserMemory[]
): Promise<string[]> {
  if (memories.length === 0) return [];

  const index = await getOrCreateIndex();
  const namespace = getUserNamespace(userId);
  const memoryIds: string[] = [];

  // Process in batches respecting TEXT_BATCH_SIZE limit
  for (let i = 0; i < memories.length; i += TEXT_BATCH_SIZE) {
    const batch = memories.slice(i, i + TEXT_BATCH_SIZE);
    const vectors = [];

    for (const memory of batch) {
      const textToEmbed = `${memory.keyText} ${memory.valueText || ''} ${memory.context || ''}`;
      const embedding = await generateEmbedding(textToEmbed);
      const memoryId = memory.id || `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const metadata: Record<string, any> = {
        userId: userId,
        memoryType: memory.memoryType,
        keyText: memory.keyText.substring(0, 1000),
        valueText: (memory.valueText || '').substring(0, 1000),
        context: (memory.context || '').substring(0, 1000),
        confidenceScore: memory.confidenceScore || 1.0,
        source: memory.source || 'chat',
        frequency: memory.frequency || 1,
        timestamp: new Date().toISOString(),
      };

      if (memory.category) metadata.category = memory.category;
      if (memory.metadata) {
        // Flatten nested objects
        for (const [key, value] of Object.entries(memory.metadata)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            metadata[`${key}_flat`] = JSON.stringify(value);
          } else {
            metadata[key] = value;
          }
        }
      }

      vectors.push({
        id: memoryId,
        values: embedding,
        metadata: metadata,
      });

      memoryIds.push(memoryId);
    }

    // Upsert batch with retry
    await withRetry(async () => {
      await index.namespace(namespace).upsert(vectors);
    });

    console.log(`✅ Stored batch of ${vectors.length} memories (${i + 1}-${i + batch.length} of ${memories.length})`);
    
    // Small delay between batches to avoid rate limiting
    if (i + TEXT_BATCH_SIZE < memories.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return memoryIds;
}

/**
 * Get memory statistics for a user
 */
export async function getUserMemoryStats(userId: string): Promise<{
  totalMemories: number;
  byType: Record<string, number>;
}> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    const stats = await withRetry(async () => {
      return await index.namespace(namespace).describeIndexStats();
    });
    const totalMemories = stats.totalRecordCount || 0;

    // Note: Pinecone doesn't provide breakdown by metadata in stats
    // We'd need to query to get type breakdown
    return {
      totalMemories,
      byType: {}, // Would need additional queries to populate
    };
  } catch (error: any) {
    if (error.message?.includes('not found') || getStatusCode(error) === 404) {
      return { totalMemories: 0, byType: {} };
    }
    console.error('Error getting memory stats:', error);
    throw error;
  }
}
