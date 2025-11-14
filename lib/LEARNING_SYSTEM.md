# User Learning and Memory System

This system allows the app to learn, remember, and better understand users over time.

## Overview

The learning system consists of three main components:

1. **User Memories** - Stores specific facts, preferences, and patterns learned about users
2. **User Context Summaries** - High-level summaries of user situations and preferences
3. **Conversation Insights** - Extracted learnings from individual conversations

## How It Works

### 1. Memory Storage

The system stores memories in the `user_memories` table with:
- **Memory Type**: preference, fact, pattern, case_context, communication_style
- **Category**: Groups related memories (e.g., 'legal_category', 'communication_style')
- **Key/Value**: The actual information learned
- **Embedding**: Vector embedding for semantic search
- **Confidence**: How confident we are in this memory
- **Frequency**: How many times this has been confirmed

### 2. Context Retrieval

When a user asks a question, the system:
1. Generates an embedding for the query
2. Searches for semantically similar memories
3. Retrieves relevant context summaries
4. Includes recent insights
5. Provides all this context to the AI for better responses

### 3. Learning Process

The system learns from:
- **Chat conversations**: Extracts preferences, facts, and patterns
- **Document uploads**: Learns about case details and legal issues
- **User interactions**: Tracks patterns in how users interact
- **Explicit feedback**: When users confirm or correct information

## Integration Points

### In Chat System

Add to `app/api/step1-chat/route.ts`:

```typescript
// Before generating response, retrieve user context
const userContext = await getRelevantUserContext(userId, userMessage, {
  includeMemories: true,
  includeSummaries: true,
  limit: 5
});

// Add context to system prompt
const enhancedSystemPrompt = `${baseSystemPrompt}

USER CONTEXT (Remember this about the user):
${userContext.memories.map(m => `- ${m.key_text}: ${m.value_text}`).join('\n')}

${userContext.summaries.map(s => `${s.summary_type}: ${s.summary_text}`).join('\n\n')}
`;
```

### After Conversation

Add to conversation end:

```typescript
// Extract insights after conversation
await fetch('/api/user-memory/extract-insights', {
  method: 'POST',
  body: JSON.stringify({
    conversationId,
    conversationText: fullConversationText
  })
});
```

## API Endpoints

### GET /api/user-memory/retrieve
Retrieve relevant memories for a query
- Query params: `query`, `limit`, `includeMemories`, `includeSummaries`, `includeInsights`

### POST /api/user-memory/extract-insights
Extract and store insights from a conversation
- Body: `{ conversationId, conversationText }`

## Database Functions

### match_user_memories()
Semantic search function for finding similar memories using pgvector.

## Usage Example

```typescript
import { getRelevantUserContext, storeUserMemory } from '@/lib/user-memory';

// Store a memory
await storeUserMemory({
  user_id: userId,
  memory_type: 'preference',
  category: 'communication_style',
  key_text: 'prefers detailed explanations',
  value_text: 'User likes comprehensive answers with examples',
  source: 'chat',
  confidence_score: 0.9
});

// Retrieve relevant context
const context = await getRelevantUserContext(userId, "What should I do about my case?", {
  limit: 5
});

// Use context in AI prompt
const prompt = `Based on what I know about this user:
${context.memories.map(m => `- ${m.key_text}`).join('\n')}

Answer their question: ${userQuestion}`;
```

## Next Steps

1. **Run the migration**: Execute `migrations/20250120_create_user_memory_system.sql`
2. **Create the database function**: Run `supabase/functions/match_user_memories.sql`
3. **Integrate into chat**: Add context retrieval to chat API routes
4. **Add insight extraction**: Call insight extraction after conversations
5. **Build UI**: Add a "What I Know About You" section for users to see/edit memories

## Benefits

- **Personalization**: Responses tailored to user's communication style and preferences
- **Context Awareness**: AI remembers past conversations and case details
- **Efficiency**: Users don't need to repeat information
- **Better Understanding**: System learns patterns and can anticipate needs
- **Continuous Improvement**: Gets smarter with each interaction


