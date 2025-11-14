# Pinecone RAG System Setup Guide

This guide explains how to set up and use the Pinecone vector database for user-specific memory storage with Retrieval-Augmented Generation (RAG).

## Overview

The system uses **Pinecone namespaces** to ensure complete user data isolation. Each user gets their own namespace, so no user data can overlap.

## Features

✅ **User Isolation**: Each user has a dedicated namespace  
✅ **Semantic Search**: Find relevant memories using embeddings  
✅ **RAG Integration**: AI uses stored context to generate better responses  
✅ **Automatic Learning**: Extracts and stores insights from conversations  
✅ **Secure**: User ID verification in metadata prevents data leakage  

## Setup Steps

### 1. Install Pinecone Package

```bash
npm install @pinecone-database/pinecone
# or
pnpm add @pinecone-database/pinecone
```

### 2. Create Pinecone Index

1. Go to [Pinecone Dashboard](https://app.pinecone.io/)
2. Create a new index with:
   - **Name**: `user-memories` (or your custom name)
   - **Dimensions**: `1536` (OpenAI text-embedding-ada-002)
   - **Metric**: `cosine`
   - **Environment**: Choose your preferred region

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=user-memories
```

Get your API key from: https://app.pinecone.io/

### 4. How It Works

#### User Isolation
- Each user gets namespace: `user-{userId}`
- All queries are scoped to the user's namespace
- Metadata includes userId for additional verification
- No cross-user data access possible

#### Memory Storage
Memories are stored with:
- **Embedding**: Vector representation for semantic search
- **Metadata**: Memory type, content, confidence, source, etc.
- **User ID**: Stored in metadata for verification

#### RAG Integration
1. User asks a question
2. System generates embedding for the query
3. Searches user's namespace in Pinecone
4. Retrieves top-k similar memories
5. Builds context from retrieved memories
6. AI uses context to generate personalized response

## API Endpoints

### Store Memory
```typescript
POST /api/user-memory/store
Body: {
  memoryType: 'preference' | 'fact' | 'pattern' | 'case_context' | 'communication_style',
  keyText: string,
  valueText?: string,
  context?: string,
  confidenceScore?: number,
  source?: string
}
```

### Retrieve Memories
```typescript
GET /api/user-memory/retrieve-pinecone?query=...&limit=5&minScore=0.7
```

### Get RAG Context
```typescript
POST /api/rag/context
Body: {
  query: string,
  limit?: number,
  minScore?: number,
  memoryTypes?: string[],
  includeConversationHistory?: boolean
}
```

### Store Conversation
```typescript
POST /api/rag/store-conversation
Body: {
  userMessage: string,
  assistantResponse: string,
  conversationId?: string,
  extractedFacts?: string[],
  preferences?: string[],
  conversationText?: string
}
```

## Integration in Chat

The RAG system is already integrated into `app/api/step1-chat/route.ts`:

1. **Before generating response**: Retrieves relevant user context
2. **Adds context to system prompt**: AI sees what it remembers about the user
3. **After conversation**: Stores conversation and extracts learnings

## Memory Types

- **preference**: User preferences (communication style, detail level, etc.)
- **fact**: Facts about the user's case or situation
- **pattern**: Observed patterns in user behavior
- **case_context**: Legal case context and details
- **communication_style**: How the user prefers to communicate
- **conversation**: Past conversation summaries

## Example Usage

### Store a Memory
```typescript
import { storeMemory } from '@/lib/pinecone-memory';

await storeMemory(userId, {
  memoryType: 'preference',
  category: 'communication_style',
  keyText: 'prefers detailed explanations',
  valueText: 'User likes comprehensive answers with examples',
  source: 'chat',
  confidenceScore: 0.9
});
```

### Retrieve Context for RAG
```typescript
import { retrieveContextForRAG } from '@/lib/rag-system';

const context = await retrieveContextForRAG(userId, userQuery, {
  limit: 5,
  minScore: 0.7
});

if (context.hasRelevantContext) {
  // Use context.contextText in AI prompt
  const enhancedPrompt = buildRAGEnhancedPrompt(basePrompt, userQuery, context);
}
```

## Security Features

1. **Namespace Isolation**: Each user has separate namespace
2. **Metadata Verification**: userId stored in metadata, verified on retrieval
3. **Query Scoping**: All queries automatically scoped to user's namespace
4. **No Cross-User Access**: Impossible to access another user's data

## Monitoring

Check memory stats:
```typescript
import { getUserMemoryStats } from '@/lib/pinecone-memory';

const stats = await getUserMemoryStats(userId);
console.log(`User has ${stats.totalMemories} memories`);
```

## Troubleshooting

### "Index not found"
- Create the index in Pinecone dashboard first
- Check `PINECONE_INDEX_NAME` matches your index name

### "API key not set"
- Add `PINECONE_API_KEY` to `.env.local`
- Restart your dev server

### "Namespace not found"
- This is normal for new users - they have no memories yet
- System will create namespace automatically on first memory storage

### Low similarity scores
- Adjust `minScore` parameter (default: 0.7)
- Ensure embeddings are being generated correctly
- Check that memories are being stored properly

## Best Practices

1. **Store meaningful memories**: Don't store every message, extract key insights
2. **Update frequencies**: Track how often memories are accessed
3. **Clean up old data**: Periodically review and remove outdated memories
4. **Monitor costs**: Pinecone charges based on usage
5. **Test isolation**: Verify users can't access each other's data

## Next Steps

1. Run `npm install @pinecone-database/pinecone`
2. Create Pinecone index
3. Add API key to `.env.local`
4. Test with a conversation
5. Monitor memory storage and retrieval

The system will automatically start learning and remembering user preferences after setup!


