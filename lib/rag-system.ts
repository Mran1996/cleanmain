/**
 * Retrieval-Augmented Generation (RAG) System
 * Integrates Pinecone memory retrieval with AI response generation
 */

import { retrieveMemories, RetrievedMemory, storeMemory, UserMemory } from './pinecone-memory';
import { generateEmbedding } from './document-chunking';

export interface RAGContext {
  memories: RetrievedMemory[];
  contextText: string;
  hasRelevantContext: boolean;
}

/**
 * Retrieve relevant context for a user query using RAG
 */
export async function retrieveContextForRAG(
  userId: string,
  userQuery: string,
  options: {
    limit?: number;
    minScore?: number;
    memoryTypes?: string[];
    includeConversationHistory?: boolean;
  } = {}
): Promise<RAGContext> {
  try {
    const {
      limit = 5,
      minScore = 0.7,
      memoryTypes = [],
      includeConversationHistory = true,
    } = options;

    // Retrieve relevant memories from Pinecone
    const memories = await retrieveMemories(userId, userQuery, {
      limit,
      minScore,
      memoryTypes: includeConversationHistory 
        ? memoryTypes 
        : memoryTypes.filter(t => t !== 'conversation'),
    });

    // Build context text from retrieved memories
    const contextText = buildContextText(memories);

    return {
      memories,
      contextText,
      hasRelevantContext: memories.length > 0,
    };
  } catch (error) {
    console.error('Error retrieving context for RAG:', error);
    return {
      memories: [],
      contextText: '',
      hasRelevantContext: false,
    };
  }
}

/**
 * Build formatted context text from retrieved memories
 */
function buildContextText(memories: RetrievedMemory[]): string {
  if (memories.length === 0) {
    return '';
  }

  const sections: string[] = [];

  // Group by memory type
  const byType: Record<string, RetrievedMemory[]> = {};
  memories.forEach((memory) => {
    if (!byType[memory.memoryType]) {
      byType[memory.memoryType] = [];
    }
    byType[memory.memoryType].push(memory);
  });

  // Build sections
  if (byType['preference']) {
    sections.push('USER PREFERENCES:');
    byType['preference'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  if (byType['fact']) {
    sections.push('\nCASE FACTS:');
    byType['fact'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  if (byType['case_context']) {
    sections.push('\nCASE CONTEXT:');
    byType['case_context'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  if (byType['pattern']) {
    sections.push('\nOBSERVED PATTERNS:');
    byType['pattern'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  if (byType['communication_style']) {
    sections.push('\nCOMMUNICATION PREFERENCES:');
    byType['communication_style'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  if (byType['conversation']) {
    sections.push('\nRELEVANT PAST CONVERSATIONS:');
    byType['conversation'].forEach((m) => {
      sections.push(`- ${m.keyText}${m.valueText ? `: ${m.valueText}` : ''}`);
    });
  }

  return sections.join('\n');
}

/**
 * Extract and store learnings from a conversation
 */
export async function extractAndStoreLearnings(
  userId: string,
  conversationText: string,
  conversationMetadata?: {
    conversationId?: string;
    legalCategory?: string;
    caseNumber?: string;
    state?: string;
  }
): Promise<string[]> {
  try {
    // This would typically use AI to extract insights
    // For now, we'll create a simple extraction
    // TODO: Integrate with AI to extract meaningful insights

    const learnings: UserMemory[] = [];

    // Extract basic patterns (this is a simplified version)
    // In production, you'd use an AI model to extract insights

    // Example: Store conversation summary
    if (conversationText.length > 100) {
      learnings.push({
        memoryType: 'conversation',
        keyText: 'Recent conversation',
        valueText: conversationText.substring(0, 500),
        context: `Conversation about ${conversationMetadata?.legalCategory || 'legal matter'}`,
        source: 'conversation',
        confidenceScore: 0.8,
        metadata: conversationMetadata,
      });
    }

    // Store all learnings
    const storedIds: string[] = [];
    for (const learning of learnings) {
      try {
        const id = await storeMemory(userId, learning);
        storedIds.push(id);
      } catch (error) {
        console.error('Error storing learning:', error);
      }
    }

    return storedIds;
  } catch (error) {
    console.error('Error extracting learnings:', error);
    return [];
  }
}

/**
 * Enhanced prompt builder with RAG context
 */
export function buildRAGEnhancedPrompt(
  basePrompt: string,
  userQuery: string,
  ragContext: RAGContext
): string {
  if (!ragContext.hasRelevantContext) {
    return basePrompt;
  }

  const enhancedPrompt = `${basePrompt}

---
USER CONTEXT (What I remember about this user):
${ragContext.contextText}
---

IMPORTANT: Use the context above to provide personalized responses. Reference specific facts or preferences when relevant. If the user's question relates to something in the context, acknowledge it and build upon that knowledge.

User's current question: ${userQuery}`;

  return enhancedPrompt;
}

/**
 * Store a memory from conversation interaction
 */
export async function storeConversationMemory(
  userId: string,
  interaction: {
    userMessage: string;
    assistantResponse: string;
    extractedFacts?: string[];
    preferences?: string[];
  }
): Promise<void> {
  try {
    const memories: UserMemory[] = [];

    // Store extracted facts
    if (interaction.extractedFacts && interaction.extractedFacts.length > 0) {
      interaction.extractedFacts.forEach((fact) => {
        memories.push({
          memoryType: 'fact',
          keyText: fact,
          source: 'conversation',
          confidenceScore: 0.7,
        });
      });
    }

    // Store preferences
    if (interaction.preferences && interaction.preferences.length > 0) {
      interaction.preferences.forEach((pref) => {
        memories.push({
          memoryType: 'preference',
          keyText: pref,
          source: 'conversation',
          confidenceScore: 0.8,
        });
      });
    }

    // Store conversation context
    memories.push({
      memoryType: 'conversation',
      keyText: interaction.userMessage.substring(0, 200),
      valueText: interaction.assistantResponse.substring(0, 500),
      context: 'Recent conversation exchange',
      source: 'conversation',
      confidenceScore: 0.6,
    });

    // Store all memories
    for (const memory of memories) {
      try {
        await storeMemory(userId, memory);
      } catch (error) {
        console.error('Error storing conversation memory:', error);
      }
    }
  } catch (error) {
    console.error('Error in storeConversationMemory:', error);
  }
}


