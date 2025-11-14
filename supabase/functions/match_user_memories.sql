-- PostgreSQL function for semantic search of user memories
-- This function uses pgvector to find similar memories based on embedding similarity

CREATE OR REPLACE FUNCTION match_user_memories(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  memory_type varchar,
  category varchar,
  key_text text,
  value_text text,
  context text,
  confidence_score float,
  source varchar,
  frequency int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.memory_type,
    m.category,
    m.key_text,
    m.value_text,
    m.context,
    m.confidence_score,
    m.source,
    m.frequency,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM user_memories m
  WHERE m.user_id = match_user_id
    AND m.is_active = true
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


