# Pinecone Best Practices Implementation

This document outlines the Pinecone best practices that have been implemented in this codebase, based on the official Pinecone agent guidelines.

## ✅ Implemented Best Practices

### 1. **Exponential Backoff Retry Logic**
- ✅ Implemented in `lib/pinecone-retry.ts`
- ✅ Only retries 429 (rate limit) and 5xx (server errors)
- ✅ Does NOT retry 4xx client errors (except 429)
- ✅ Exponential backoff with max delay cap (60 seconds)
- ✅ All Pinecone operations wrapped with retry logic

**Usage:**
```typescript
import { withRetry } from './pinecone-retry';

await withRetry(async () => {
  await index.namespace(namespace).upsert(vectors);
});
```

### 2. **Batch Size Limits**
- ✅ Text records: Max 96 per batch (with embeddings)
- ✅ Vector records: Max 1000 per batch
- ✅ Total batch size: Max 2MB per batch
- ✅ Batch processing function: `storeMemoriesBatch()`

**Implementation:**
```typescript
// Automatically batches large arrays
await storeMemoriesBatch(userId, memories);
```

### 3. **Namespace Isolation**
- ✅ Each user gets unique namespace: `user-{userId}`
- ✅ All queries scoped to user namespace
- ✅ Metadata includes userId for verification
- ✅ No cross-user data access possible

### 4. **Metadata Best Practices**
- ✅ Flat structure only (no nested objects)
- ✅ Max 40KB per record
- ✅ Automatic flattening of nested objects
- ✅ String truncation to prevent overflow

### 5. **Error Handling**
- ✅ Proper status code extraction
- ✅ Client errors (4xx) not retried
- ✅ Server errors (5xx) and rate limits (429) retried
- ✅ Graceful handling of missing namespaces

### 6. **Index Creation**
- ✅ Documentation emphasizes CLI usage
- ✅ SDK only used for existence checks
- ✅ Clear error messages with CLI commands

## 📋 Best Practices Checklist

### Data Operations
- [x] Use namespaces for all operations
- [x] Respect batch size limits (96 for text, 1000 for vectors)
- [x] Flatten metadata (no nested objects)
- [x] Truncate metadata to prevent 40KB limit
- [x] Use retry logic for all operations

### Error Handling
- [x] Exponential backoff for retries
- [x] Only retry 429 and 5xx errors
- [x] Don't retry 4xx client errors
- [x] Proper error logging

### Index Management
- [x] Use CLI for index creation
- [x] SDK only for existence checks
- [x] Clear error messages

## 🔄 Future Improvements

### Reranking (Pending)
Reranking requires integrated embeddings, which may not be fully supported in Node.js SDK yet. When available:

```typescript
// Future implementation
const results = await index.namespace(namespace).search({
  query: {
    top_k: 10,
    inputs: { text: queryText }
  },
  rerank: {
    model: "bge-reranker-v2-m3",
    top_n: 5,
    rank_fields: ["content"]
  }
});
```

### Integrated Embeddings (Future)
When Node.js SDK supports integrated embeddings:

```typescript
// Future: Use integrated embeddings instead of manual generation
const index = pc.Index("user-memories", {
  embed: {
    model: "llama-text-embed-v2",
    field_map: { text: "content" }
  }
});

// Then use .search() instead of .query()
await index.namespace(namespace).search({
  query: {
    top_k: 10,
    inputs: { text: queryText }
  }
});
```

## 📚 Reference

- **Pinecone Best Practices**: See `AGENTS.md`
- **Official Docs**: https://docs.pinecone.io/
- **CLI Reference**: https://docs.pinecone.io/reference/cli/command-reference

## 🎯 Key Takeaways

1. **Always use namespaces** for multi-tenant isolation
2. **Respect batch limits** to avoid API errors
3. **Retry only transient errors** (429, 5xx)
4. **Flatten metadata** to prevent API errors
5. **Use CLI for index management** (not SDK)
6. **Implement exponential backoff** for production reliability


