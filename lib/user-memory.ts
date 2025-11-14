/**
 * User Memory and Learning System
 * Allows the app to learn, remember, and understand users over time
 */

import { supabase } from './supabaseClient';
import { generateEmbedding } from './document-chunking';

export interface UserMemory {
  id?: string;
  user_id: string;
  memory_type: 'preference' | 'fact' | 'pattern' | 'case_context' | 'communication_style';
  category?: string;
  key_text: string;
  value_text?: string;
  context?: string;
  confidence_score?: number;
  source?: string;
  frequency?: number;
}

export interface UserContextSummary {
  id?: string;
  user_id: string;
  summary_type: 'case_profile' | 'communication_preferences' | 'legal_expertise' | 'document_patterns';
  summary_text: string;
  source_conversations?: number;
  source_documents?: number;
}

export interface ConversationInsight {
  id?: string;
  user_id: string;
  conversation_id?: string;
  insight_type: 'preference' | 'fact' | 'pattern' | 'concern' | 'goal';
  insight_text: string;
  supporting_evidence?: string;
  confidence?: number;
}

/**
 * Store a new memory about the user
 */
export async function storeUserMemory(memory: UserMemory): Promise<string | null> {
  try {
    // Generate embedding for semantic search
    const textToEmbed = `${memory.key_text} ${memory.value_text || ''} ${memory.context || ''}`;
    const embedding = await generateEmbedding(textToEmbed);

    const { data, error } = await supabase
      .from('user_memories')
      .insert({
        ...memory,
        embedding,
        last_referenced_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing user memory:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in storeUserMemory:', error);
    return null;
  }
}

/**
 * Retrieve relevant memories for a user based on semantic similarity
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5,
  memoryTypes?: string[]
): Promise<UserMemory[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Build the query
    let queryBuilder = supabase
      .rpc('match_user_memories', {
        query_embedding: queryEmbedding,
        match_user_id: userId,
        match_threshold: 0.7,
        match_count: limit,
      });

    // If memory types specified, filter by them
    if (memoryTypes && memoryTypes.length > 0) {
      // Note: RPC function would need to handle this, or we filter after
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error retrieving memories:', error);
      // Fallback to simple text search
      return await retrieveMemoriesByText(userId, query, limit, memoryTypes);
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      memory_type: item.memory_type,
      category: item.category,
      key_text: item.key_text,
      value_text: item.value_text,
      context: item.context,
      confidence_score: item.confidence_score,
      source: item.source,
      frequency: item.frequency,
    }));
  } catch (error) {
    console.error('Error in retrieveRelevantMemories:', error);
    return await retrieveMemoriesByText(userId, query, limit, memoryTypes);
  }
}

/**
 * Fallback: Retrieve memories by text search
 */
async function retrieveMemoriesByText(
  userId: string,
  query: string,
  limit: number = 5,
  memoryTypes?: string[]
): Promise<UserMemory[]> {
  try {
    let queryBuilder = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`key_text.ilike.%${query}%,value_text.ilike.%${query}%,context.ilike.%${query}%`)
      .order('last_referenced_at', { ascending: false })
      .order('frequency', { ascending: false })
      .limit(limit);

    if (memoryTypes && memoryTypes.length > 0) {
      queryBuilder = queryBuilder.in('memory_type', memoryTypes);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error retrieving memories by text:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      memory_type: item.memory_type,
      category: item.category,
      key_text: item.key_text,
      value_text: item.value_text,
      context: item.context,
      confidence_score: item.confidence_score,
      source: item.source,
      frequency: item.frequency,
    }));
  } catch (error) {
    console.error('Error in retrieveMemoriesByText:', error);
    return [];
  }
}

/**
 * Update memory frequency and last referenced time
 */
export async function updateMemoryReference(memoryId: string): Promise<void> {
  try {
    // Get current frequency first
    const { data: current } = await supabase
      .from('user_memories')
      .select('frequency')
      .eq('id', memoryId)
      .single();

    if (current) {
      await supabase
        .from('user_memories')
        .update({
          frequency: (current.frequency || 0) + 1,
          last_referenced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memoryId);
    }
  } catch (error) {
    console.error('Error updating memory reference:', error);
  }
}

/**
 * Store or update a user context summary
 */
export async function storeUserContextSummary(summary: UserContextSummary): Promise<string | null> {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(summary.summary_text);

    // Check if summary of this type already exists
    const { data: existing } = await supabase
      .from('user_context_summaries')
      .select('id')
      .eq('user_id', summary.user_id)
      .eq('summary_type', summary.summary_type)
      .single();

    if (existing) {
      // Update existing summary
      const { data, error } = await supabase
        .from('user_context_summaries')
        .update({
          summary_text: summary.summary_text,
          embedding,
          source_conversations: summary.source_conversations || 0,
          source_documents: summary.source_documents || 0,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) {
        console.error('Error updating context summary:', error);
        return null;
      }

      return data?.id || null;
    } else {
      // Insert new summary
      const { data, error } = await supabase
        .from('user_context_summaries')
        .insert({
          ...summary,
          embedding,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing context summary:', error);
        return null;
      }

      return data?.id || null;
    }
  } catch (error) {
    console.error('Error in storeUserContextSummary:', error);
    return null;
  }
}

/**
 * Get user context summaries
 */
export async function getUserContextSummaries(
  userId: string,
  summaryTypes?: string[]
): Promise<UserContextSummary[]> {
  try {
    let queryBuilder = supabase
      .from('user_context_summaries')
      .select('*')
      .eq('user_id', userId);

    if (summaryTypes && summaryTypes.length > 0) {
      queryBuilder = queryBuilder.in('summary_type', summaryTypes);
    }

    const { data, error } = await queryBuilder.order('last_updated_at', { ascending: false });

    if (error) {
      console.error('Error retrieving context summaries:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      summary_type: item.summary_type,
      summary_text: item.summary_text,
      source_conversations: item.source_conversations,
      source_documents: item.source_documents,
    }));
  } catch (error) {
    console.error('Error in getUserContextSummaries:', error);
    return [];
  }
}

/**
 * Extract and store insights from a conversation
 */
export async function extractConversationInsights(
  userId: string,
  conversationId: string,
  conversationText: string
): Promise<ConversationInsight[]> {
  try {
    // This would typically call an AI to extract insights
    // For now, we'll create a placeholder that can be enhanced
    const insights: ConversationInsight[] = [];

    // TODO: Call AI to extract insights from conversation
    // This would analyze the conversation and identify:
    // - User preferences (communication style, detail level)
    // - Key facts about their case
    // - Patterns in their questions
    // - Concerns or goals mentioned

    // Store insights
    for (const insight of insights) {
      const embedding = await generateEmbedding(insight.insight_text);
      
      await supabase
        .from('conversation_insights')
        .insert({
          ...insight,
          user_id: userId,
          conversation_id: conversationId,
          embedding,
        });
    }

    return insights;
  } catch (error) {
    console.error('Error extracting conversation insights:', error);
    return [];
  }
}

/**
 * Get all relevant context for a user query
 * Combines memories, summaries, and recent insights
 */
export async function getRelevantUserContext(
  userId: string,
  query: string,
  options?: {
    includeMemories?: boolean;
    includeSummaries?: boolean;
    includeInsights?: boolean;
    limit?: number;
  }
): Promise<{
  memories: UserMemory[];
  summaries: UserContextSummary[];
  insights: ConversationInsight[];
}> {
  const {
    includeMemories = true,
    includeSummaries = true,
    includeInsights = true,
    limit = 10,
  } = options || {};

  const [memories, summaries, insights] = await Promise.all([
    includeMemories ? retrieveRelevantMemories(userId, query, limit) : Promise.resolve([]),
    includeSummaries ? getUserContextSummaries(userId) : Promise.resolve([]),
    includeInsights ? Promise.resolve([]) : Promise.resolve([]), // TODO: Implement insight retrieval
  ]);

  return { memories, summaries, insights };
}

