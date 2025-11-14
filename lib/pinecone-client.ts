/**
 * Pinecone Vector Database Client
 * Handles user-specific memory storage with namespace isolation
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './document-chunking';

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
  }

  return pineconeClient;
}

/**
 * Get or create the index for user memories
 */
export async function getOrCreateIndex(indexName: string = 'user-memories'): Promise<any> {
  try {
    const pinecone = getPineconeClient();
    
    // List existing indexes
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

    if (!indexExists) {
      // Create index if it doesn't exist
      console.log(`Creating Pinecone index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI text-embedding-ada-002 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1', // Adjust to your preferred region
          },
        },
      });

      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    return pinecone.index(indexName);
  } catch (error) {
    console.error('Error getting/creating Pinecone index:', error);
    throw error;
  }
}

/**
 * Get user-specific namespace
 * Each user gets their own namespace to ensure data isolation
 */
export function getUserNamespace(userId: string): string {
  // Use user ID as namespace to ensure complete isolation
  return `user-${userId}`;
}

/**
 * Store a memory in Pinecone with user-specific namespace
 */
export interface MemoryVector {
  id: string;
  userId: string;
  memoryType: 'preference' | 'fact' | 'pattern' | 'case_context' | 'communication_style';
  category?: string;
  keyText: string;
  valueText?: string;
  context?: string;
  confidenceScore?: number;
  source?: string;
  frequency?: number;
  timestamp: string;
}

export async function storeMemoryInPinecone(
  userId: string,
  memory: Omit<MemoryVector, 'id' | 'userId' | 'timestamp'>
): Promise<string> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Generate embedding
    const textToEmbed = `${memory.keyText} ${memory.valueText || ''} ${memory.context || ''}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Generate unique ID
    const memoryId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare metadata
    const metadata = {
      userId,
      memoryType: memory.memoryType,
      category: memory.category || '',
      keyText: memory.keyText,
      valueText: memory.valueText || '',
      context: memory.context || '',
      confidenceScore: memory.confidenceScore || 1.0,
      source: memory.source || 'chat',
      frequency: memory.frequency || 1,
      timestamp: new Date().toISOString(),
    };

    // Store in Pinecone with user-specific namespace
    await index.namespace(namespace).upsert([
      {
        id: memoryId,
        values: embedding,
        metadata: metadata,
      },
    ]);

    console.log(`✅ Stored memory in Pinecone namespace: ${namespace}, ID: ${memoryId}`);
    return memoryId;
  } catch (error) {
    console.error('Error storing memory in Pinecone:', error);
    throw error;
  }
}

/**
 * Retrieve relevant memories from Pinecone using semantic search
 */
export async function retrieveMemoriesFromPinecone(
  userId: string,
  query: string,
  options: {
    limit?: number;
    minScore?: number;
    memoryTypes?: string[];
  } = {}
): Promise<MemoryVector[]> {
  try {
    const { limit = 5, minScore = 0.7, memoryTypes } = options;
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter if memory types specified
    const filter: any = {};
    if (memoryTypes && memoryTypes.length > 0) {
      filter.memoryType = { $in: memoryTypes };
    }

    // Query Pinecone with user-specific namespace
    const queryResponse = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    // Map results to MemoryVector format
    const memories: MemoryVector[] = (queryResponse.matches || [])
      .filter(match => (match.score || 0) >= minScore)
      .map(match => ({
        id: match.id,
        userId: match.metadata?.userId as string,
        memoryType: match.metadata?.memoryType as MemoryVector['memoryType'],
        category: match.metadata?.category as string,
        keyText: match.metadata?.keyText as string,
        valueText: match.metadata?.valueText as string,
        context: match.metadata?.context as string,
        confidenceScore: match.metadata?.confidenceScore as number,
        source: match.metadata?.source as string,
        frequency: match.metadata?.frequency as number,
        timestamp: match.metadata?.timestamp as string,
      }));

    // Update last referenced time for retrieved memories
    for (const memory of memories) {
      await updateMemoryFrequency(memory.id, userId);
    }

    return memories;
  } catch (error) {
    console.error('Error retrieving memories from Pinecone:', error);
    // Return empty array on error rather than throwing
    return [];
  }
}

/**
 * Update memory frequency and last referenced time
 */
async function updateMemoryFrequency(memoryId: string, userId: string): Promise<void> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    // Fetch current memory
    const fetchResponse = await index.namespace(namespace).fetch([memoryId]);
    const memory = fetchResponse.records?.[memoryId];

    if (memory?.metadata) {
      const currentFrequency = (memory.metadata.frequency as number) || 1;
      
      // Update metadata with new frequency and timestamp
      await index.namespace(namespace).update({
        id: memoryId,
        metadata: {
          ...memory.metadata,
          frequency: currentFrequency + 1,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating memory frequency:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Delete a memory from Pinecone
 */
export async function deleteMemoryFromPinecone(memoryId: string, userId: string): Promise<void> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    await index.namespace(namespace).deleteOne(memoryId);
    console.log(`✅ Deleted memory from Pinecone: ${memoryId}`);
  } catch (error) {
    console.error('Error deleting memory from Pinecone:', error);
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

    // Delete all vectors in the namespace
    await index.namespace(namespace).deleteAll();
    console.log(`✅ Deleted all memories for user: ${userId}`);
  } catch (error) {
    console.error('Error deleting all user memories:', error);
    throw error;
  }
}

/**
 * Store conversation context in Pinecone
 */
export interface ConversationContext {
  conversationId: string;
  userId: string;
  messageText: string;
  responseText: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function storeConversationContext(
  context: ConversationContext
): Promise<string> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(context.userId);

    // Combine message and response for embedding
    const textToEmbed = `User: ${context.messageText}\nAssistant: ${context.responseText}`;
    const embedding = await generateEmbedding(textToEmbed);

    const contextId = `conv-${context.conversationId}-${Date.now()}`;

    await index.namespace(namespace).upsert([
      {
        id: contextId,
        values: embedding,
        metadata: {
          userId: context.userId,
          conversationId: context.conversationId,
          messageText: context.messageText,
          responseText: context.responseText,
          timestamp: context.timestamp,
          type: 'conversation',
          ...context.metadata,
        },
      },
    ]);

    return contextId;
  } catch (error) {
    console.error('Error storing conversation context:', error);
    throw error;
  }
}

/**
 * Retrieve relevant conversation context
 */
export async function retrieveConversationContext(
  userId: string,
  query: string,
  limit: number = 3
): Promise<ConversationContext[]> {
  try {
    const index = await getOrCreateIndex();
    const namespace = getUserNamespace(userId);

    const queryEmbedding = await generateEmbedding(query);

    const queryResponse = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: {
        type: { $eq: 'conversation' },
      },
    });

    return (queryResponse.matches || [])
      .map(match => ({
        conversationId: match.metadata?.conversationId as string,
        userId: match.metadata?.userId as string,
        messageText: match.metadata?.messageText as string,
        responseText: match.metadata?.responseText as string,
        timestamp: match.metadata?.timestamp as string,
        metadata: match.metadata as Record<string, any>,
      }));
  } catch (error) {
    console.error('Error retrieving conversation context:', error);
    return [];
  }
}

