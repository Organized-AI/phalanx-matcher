# Supabase + pgvector Patterns

## Enable pgvector Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

## Vector Column Pattern

```sql
-- 1536 dimensions for OpenAI ada-002
embedding vector(1536)

-- Create IVFFlat index for fast similarity search
CREATE INDEX ON table_name 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

## Cosine Similarity Function

```sql
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 vector, vec2 vector)
RETURNS FLOAT AS $$
  SELECT 1 - (vec1 <=> vec2);
$$ LANGUAGE SQL IMMUTABLE;
```

## Find Similar Vectors Query

```sql
-- Find top 10 most similar
SELECT id, name, 1 - (embedding <=> $1) as similarity
FROM funders
WHERE active = true
ORDER BY embedding <=> $1
LIMIT 10;
```

## Supabase Client Pattern (TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// Insert with vector
const { data, error } = await supabase
  .from('founders')
  .insert({
    name: 'Test',
    embedding: JSON.stringify(vectorArray) // pgvector accepts JSON array
  });

// Query similar
const { data, error } = await supabase.rpc('match_funders', {
  query_embedding: vectorArray,
  match_threshold: 0.7,
  match_count: 10
});
```

## RPC Function for Matching

```sql
CREATE OR REPLACE FUNCTION match_funders(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  firm_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    funders.id,
    funders.name,
    funders.firm_name,
    1 - (funders.embedding <=> query_embedding) as similarity
  FROM funders
  WHERE funders.active = true
    AND 1 - (funders.embedding <=> query_embedding) > match_threshold
  ORDER BY funders.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON founders
  FOR ALL USING (auth.role() = 'service_role');

-- Anon can read active funders
CREATE POLICY "Anon read active funders" ON funders
  FOR SELECT USING (active = true);
```
