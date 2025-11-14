-- User Memory and Learning System
-- This migration creates tables for the app to learn, remember, and understand users over time

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user_memories table to store learned information about users
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Memory content and context
    memory_type VARCHAR(50) NOT NULL, -- 'preference', 'fact', 'pattern', 'preference', 'case_context'
    category VARCHAR(100), -- 'legal_category', 'communication_style', 'case_details', etc.
    key_text TEXT NOT NULL, -- The key information (e.g., "prefers detailed explanations")
    value_text TEXT, -- The value or details
    context TEXT, -- Additional context about when/why this was learned
    
    -- Embedding for semantic search
    embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
    
    -- Metadata
    confidence_score FLOAT DEFAULT 1.0, -- How confident we are in this memory (0-1)
    source VARCHAR(100), -- Where this memory came from ('chat', 'document', 'explicit', 'inferred')
    frequency INTEGER DEFAULT 1, -- How many times this has been mentioned/confirmed
    
    -- Timestamps
    first_learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    is_active BOOLEAN DEFAULT true
);

-- Create user_context_summaries table for high-level user understanding
CREATE TABLE IF NOT EXISTS user_context_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Summary information
    summary_type VARCHAR(50) NOT NULL, -- 'case_profile', 'communication_preferences', 'legal_expertise', 'document_patterns'
    summary_text TEXT NOT NULL, -- AI-generated summary of user's situation/preferences
    
    -- Embedding for semantic search
    embedding VECTOR(1536),
    
    -- Metadata
    source_conversations INTEGER DEFAULT 0, -- Number of conversations used to generate this
    source_documents INTEGER DEFAULT 0, -- Number of documents analyzed
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_insights table to extract learnings from conversations
CREATE TABLE IF NOT EXISTS conversation_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    
    -- Insight content
    insight_type VARCHAR(50) NOT NULL, -- 'preference', 'fact', 'pattern', 'concern', 'goal'
    insight_text TEXT NOT NULL, -- The extracted insight
    supporting_evidence TEXT, -- Quotes or evidence from conversation
    
    -- Embedding for semantic search
    embedding VECTOR(1536),
    
    -- Metadata
    confidence FLOAT DEFAULT 0.5,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_category ON user_memories(category);
CREATE INDEX IF NOT EXISTS idx_user_memories_active ON user_memories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_memories_last_referenced ON user_memories(last_referenced_at DESC);

-- Vector similarity search index for memories
CREATE INDEX IF NOT EXISTS idx_user_memories_embedding ON user_memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_user_context_summaries_user_id ON user_context_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_summaries_type ON user_context_summaries(summary_type);

-- Vector similarity search index for summaries
CREATE INDEX IF NOT EXISTS idx_user_context_summaries_embedding ON user_context_summaries 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_conversation_insights_user_id ON conversation_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_conversation_id ON conversation_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_type ON conversation_insights(insight_type);

-- Vector similarity search index for insights
CREATE INDEX IF NOT EXISTS idx_conversation_insights_embedding ON conversation_insights 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_memories
DROP POLICY IF EXISTS "Users can view their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON user_memories;

CREATE POLICY "Users can view their own memories" ON user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON user_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON user_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON user_memories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_context_summaries
DROP POLICY IF EXISTS "Users can view their own summaries" ON user_context_summaries;
DROP POLICY IF EXISTS "Users can insert their own summaries" ON user_context_summaries;
DROP POLICY IF EXISTS "Users can update their own summaries" ON user_context_summaries;
DROP POLICY IF EXISTS "Users can delete their own summaries" ON user_context_summaries;

CREATE POLICY "Users can view their own summaries" ON user_context_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries" ON user_context_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" ON user_context_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" ON user_context_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for conversation_insights
DROP POLICY IF EXISTS "Users can view their own insights" ON conversation_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON conversation_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON conversation_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON conversation_insights;

CREATE POLICY "Users can view their own insights" ON conversation_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" ON conversation_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON conversation_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" ON conversation_insights
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE user_memories IS 'Stores learned information about users - preferences, facts, patterns, and context that the AI can remember and use';
COMMENT ON TABLE user_context_summaries IS 'High-level summaries of user situations, preferences, and patterns generated from multiple interactions';
COMMENT ON TABLE conversation_insights IS 'Extracted insights and learnings from individual conversations';


