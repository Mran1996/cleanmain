# Pinecone Vector Database Integration - Complete Setup Guide

## Overview

This system integrates Pinecone as a vector database for user-specific memory storage with complete data isolation using namespaces. Each user's data is stored in a separate namespace, ensuring no data overlap between users.

## Features

✅ **Complete User Isolation**: Each user has a dedicated Pinecone namespace  
✅ **Semantic Search**: Find relevant memories using vector similarity  
✅ **RAG Integration**: AI uses stored context to generate personalized responses  
✅ **Automatic Learning**: Extracts and stores insights from conversations  
✅ **Secure**: User ID verification prevents data leakage  

## Setup Instructions

### Step 1: Install Pinecone Package

```bash
npm install @pinecone-database/pinecone
# or
pnpm add @pinecone-database/pinecone
```

### Step 2: Create Pinecone Index

**⚠️ IMPORTANT: Use Pinecone CLI for index creation (best practice)**

Install Pinecone CLI:
```bash
# macOS
brew tap pinecone-io/tap
brew install pinecone-io/tap/pinecone

# Other platforms: Download from https://github.com/pinecone-io/cli/releases
```

Authenticate CLI:
```bash
export PINECONE_API_KEY="your-api-key"
# Or: pc auth configure --global-api-key <api-key>
```

Create index using CLI:
```bash
pc index create -n user-memories --dimension 1536 --metric cosine --cloud aws --region us-east-1
```

**Alternative (Dashboard):**
1. Go to [Pinecone Dashboard](https://app.pinecone.io/)
2. Create a new index with these settings:
   - **Name**: `user-memories` (or your custom name)
   - **Dimensions**: `1536` (required for OpenAI text-embedding-ada-002)
   - **Metric**: `cosine`
   - **Environment**: Choose your preferred region (e.g., `us-east-1`)

### Step 3: Get Your API Key

1. In Pinecone dashboard, go to **API Keys**
2. Copy your API key
3. Add it to your `.env.local`:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=user-memories
```

### Step 4: Verify Setup

Test the connection:

```bash
# The system will automatically test on first use
# Or create a test script to verify
```

## How User Isolation Works

### Namespace Strategy

Each user gets a unique namespace: `user-{userId}`

Example:
- User A (ID: `abc-123`) → Namespace: `user-abc-123`
- User B (ID: `xyz-789`) → Namespace: `user-xyz-789`

### Security Layers

1. **Namespace Isolation**: Queries are automatically scoped to user's namespace
2. **Metadata Verification**: userId stored in metadata, verified on retrieval
3. **Query Filtering**: All queries include userId filter
4. **No Cross-Access**: Impossible to access another user's namespace

## Architecture

```
User Query
    ↓
Generate Embedding (OpenAI)
    ↓
Query Pinecone (User's Namespace Only)
    ↓
Retrieve Top-K Similar Memories
    ↓
Build Context Text
    ↓
Enhance AI Prompt with Context
    ↓
Generate Personalized Response
    ↓
Store Conversation for Learning
```

## API Endpoints

### 1. Store Memory
**POST** `/api/user-memory/store`

Store a new memory about the user.

```json
{
  "memoryType": "preference",
  "category": "communication_style",
  "keyText": "prefers detailed explanations",
  "valueText": "User likes comprehensive answers",
  "context": "From conversation about legal documents",
  "confidenceScore": 0.9,
  "source": "chat"
}
```

### 2. Retrieve Memories
**GET** `/api/user-memory/retrieve-pinecone?query=...&limit=5&minScore=0.7`

Retrieve relevant memories for a query.

### 3. Get RAG Context
**POST** `/api/rag/context`

Get formatted context for RAG.

```json
{
  "query": "What should I do about my case?",
  "limit": 5,
  "minScore": 0.7,
  "memoryTypes": ["preference", "fact"],
  "includeConversationHistory": true
}
```

### 4. Store Conversation
**POST** `/api/rag/store-conversation`

Store a conversation and extract learnings.

```json
{
  "userMessage": "I need help with eviction",
  "assistantResponse": "I can help you with that...",
  "conversationId": "conv-123",
  "conversationText": "Full conversation text...",
  "extractedFacts": ["User facing eviction", "Lives in Washington"],
  "preferences": ["Prefers step-by-step guidance"]
}
```

## Integration Points

### Already Integrated

✅ **Chat API** (`app/api/step1-chat/route.ts`):
- Retrieves user context before generating responses
- Stores conversations after completion
- Uses RAG to enhance prompts

### How It Works in Chat

1. **Before Response**: 
   - System retrieves relevant memories from Pinecone
   - Builds context text
   - Adds to system prompt

2. **After Response**:
   - Stores conversation in Pinecone
   - Extracts learnings (preferences, facts, patterns)
   - Updates memory frequencies

## Memory Types

- **preference**: User preferences (communication style, detail level)
- **fact**: Facts about user's case or situation
- **pattern**: Observed patterns in user behavior
- **case_context**: Legal case context and details
- **communication_style**: How user prefers to communicate
- **conversation**: Past conversation summaries

## Example: How RAG Enhances Responses

### Without RAG:
```
User: "What should I do next?"
AI: "Based on your case, you should..."
```

### With RAG:
```
User: "What should I do next?"
AI: "Based on what I remember about your case - you mentioned you're in 
     Washington State and prefer detailed explanations. Here's a step-by-step 
     guide for your eviction case..."
```

## Testing

### Test Memory Storage

```typescript
import { storeMemory } from '@/lib/pinecone-memory';

await storeMemory(userId, {
  memoryType: 'preference',
  keyText: 'prefers detailed explanations',
  valueText: 'User likes comprehensive answers',
  source: 'chat',
  confidenceScore: 0.9
});
```

### Test Memory Retrieval

```typescript
import { retrieveMemories } from '@/lib/pinecone-memory';

const memories = await retrieveMemories(userId, "What does the user prefer?", {
  limit: 5,
  minScore: 0.7
});
```

### Test RAG Context

```typescript
import { retrieveContextForRAG } from '@/lib/rag-system';

const context = await retrieveContextForRAG(userId, userQuery, {
  limit: 5,
  minScore: 0.7
});

console.log(context.contextText); // Formatted context for AI
```

## Monitoring & Debugging

### Check Memory Stats

```typescript
import { getUserMemoryStats } from '@/lib/pinecone-memory';

const stats = await getUserMemoryStats(userId);
console.log(`Total memories: ${stats.totalMemories}`);
```

### View Stored Memories

Use Pinecone dashboard to view:
- Index statistics
- Namespace contents
- Vector counts

## Troubleshooting

### "PINECONE_API_KEY is not set"
- Add `PINECONE_API_KEY` to `.env.local`
- Restart dev server

### "Index not found"
- Create index in Pinecone dashboard
- Set `PINECONE_INDEX_NAME` to match index name
- Index must have dimension 1536

### "Namespace not found"
- Normal for new users (no memories yet)
- Namespace created automatically on first storage

### Low similarity scores
- Adjust `minScore` (default: 0.7)
- Check embedding generation
- Verify memories are being stored

### No memories retrieved
- User may not have any stored memories yet
- Try lowering `minScore` threshold
- Check that conversations are being stored

## Best Practices

1. **Don't store everything**: Extract meaningful insights, not every message
2. **Update frequencies**: Track memory access patterns
3. **Clean up**: Periodically review and remove outdated memories
4. **Monitor costs**: Pinecone charges based on usage
5. **Test isolation**: Verify users can't access each other's data

## Security Checklist

- ✅ Each user has separate namespace
- ✅ userId verified in metadata
- ✅ Queries scoped to user namespace
- ✅ No cross-user data access possible
- ✅ API endpoints require authentication

## Cost Considerations

Pinecone pricing is based on:
- Number of vectors stored
- Query operations
- Index size

Monitor usage in Pinecone dashboard and set up alerts if needed.

## Next Steps

1. ✅ Install Pinecone package: `npm install @pinecone-database/pinecone`
2. ✅ Create Pinecone index (dimension: 1536)
3. ✅ Add API key to `.env.local`
4. ✅ Test with a conversation
5. ✅ Monitor memory storage and retrieval
6. ✅ Adjust `minScore` and `limit` based on results

The system is now ready to learn and remember user preferences!

