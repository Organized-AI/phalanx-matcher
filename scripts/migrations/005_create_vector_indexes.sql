-- Migration 005: Create vector similarity indexes
-- IVFFlat indexes for fast approximate nearest neighbor search using cosine distance

-- IVFFlat index for founders embeddings
-- Lists parameter: rule of thumb is sqrt(total_rows)
-- For 10 founders + 5 funders = ~4 lists (minimum is 10 for IVFFlat)
-- Starting with 10 lists, increase to 30-50 in production with 1000+ profiles

CREATE INDEX founders_embedding_idx ON founders
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- IVFFlat index for funders embeddings
CREATE INDEX funders_embedding_idx ON funders
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- Note: IVFFlat provides good balance of speed and accuracy
-- Alternative: HNSW for even faster queries but slower inserts
-- In production, consider:
--   - lists = 30-50 for 1000-5000 profiles
--   - lists = 100+ for 10000+ profiles
--   - Rebuild indexes periodically as data grows
