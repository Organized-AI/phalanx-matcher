-- ============================================================================
-- PHALANX MATCHING ENGINE - FULL DATABASE MIGRATION
-- Run this entire script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pdaycgrzvltucagmvwzv/sql
-- ============================================================================

-- Migration 001: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Migration 002: Create founders table
CREATE TABLE IF NOT EXISTS founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  company_description TEXT,
  industry TEXT NOT NULL,
  stage TEXT NOT NULL,
  seeking_amount_min INTEGER,
  seeking_amount_max INTEGER,
  geography TEXT,
  embedding vector(1536),
  embedding_text TEXT,
  profile_completeness DECIMAL DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS founders_industry_idx ON founders(industry);
CREATE INDEX IF NOT EXISTS founders_stage_idx ON founders(stage);
CREATE INDEX IF NOT EXISTS founders_geography_idx ON founders(geography);
CREATE INDEX IF NOT EXISTS founders_is_active_idx ON founders(is_active);
CREATE INDEX IF NOT EXISTS founders_email_idx ON founders(email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_founders_updated_at ON founders;
CREATE TRIGGER update_founders_updated_at BEFORE UPDATE ON founders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration 003: Create funders table
CREATE TABLE IF NOT EXISTS funders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  bio TEXT,
  investment_thesis TEXT,
  preferred_industries TEXT[],
  preferred_stages TEXT[],
  check_size_min INTEGER,
  check_size_max INTEGER,
  geography_focus TEXT[],
  embedding vector(1536),
  embedding_text TEXT,
  is_active BOOLEAN DEFAULT true,
  total_matches_generated INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS funders_is_active_idx ON funders(is_active);
CREATE INDEX IF NOT EXISTS funders_firm_name_idx ON funders(firm_name);
CREATE INDEX IF NOT EXISTS funders_preferred_industries_idx ON funders USING GIN(preferred_industries);
CREATE INDEX IF NOT EXISTS funders_preferred_stages_idx ON funders USING GIN(preferred_stages);
CREATE INDEX IF NOT EXISTS funders_geography_focus_idx ON funders USING GIN(geography_focus);

DROP TRIGGER IF EXISTS update_funders_updated_at ON funders;
CREATE TRIGGER update_funders_updated_at BEFORE UPDATE ON funders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration 004: Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  funder_id UUID NOT NULL REFERENCES funders(id) ON DELETE CASCADE,
  semantic_score DECIMAL NOT NULL,
  rule_score DECIMAL NOT NULL,
  stage_score DECIMAL NOT NULL,
  total_score DECIMAL NOT NULL,
  score_breakdown JSONB NOT NULL,
  quality_tier TEXT,
  is_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  UNIQUE(founder_id, funder_id)
);

CREATE INDEX IF NOT EXISTS matches_founder_id_idx ON matches(founder_id);
CREATE INDEX IF NOT EXISTS matches_funder_id_idx ON matches(funder_id);
CREATE INDEX IF NOT EXISTS matches_total_score_idx ON matches(total_score DESC);
CREATE INDEX IF NOT EXISTS matches_quality_tier_idx ON matches(quality_tier);
CREATE INDEX IF NOT EXISTS matches_created_at_idx ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS matches_founder_score_idx ON matches(founder_id, total_score DESC);
CREATE INDEX IF NOT EXISTS matches_score_breakdown_idx ON matches USING GIN(score_breakdown);

-- Migration 005: Create vector similarity indexes (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'founders_embedding_idx') THEN
    CREATE INDEX founders_embedding_idx ON founders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'funders_embedding_idx') THEN
    CREATE INDEX funders_embedding_idx ON funders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
  END IF;
END $$;

-- Migration 006: Create matching utility functions
CREATE OR REPLACE FUNCTION cosine_similarity(a vector(1536), b vector(1536))
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION find_matching_funders(
  founder_uuid UUID,
  match_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  funder_id UUID,
  funder_name TEXT,
  firm_name TEXT,
  semantic_score DECIMAL,
  distance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.firm_name,
    (1 - (fo.embedding <=> f.embedding))::DECIMAL as semantic_score,
    (fo.embedding <=> f.embedding)::DECIMAL as distance
  FROM funders f
  CROSS JOIN founders fo
  WHERE fo.id = founder_uuid
    AND f.is_active = true
    AND f.embedding IS NOT NULL
    AND fo.embedding IS NOT NULL
  ORDER BY fo.embedding <=> f.embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_matching_founders(
  funder_uuid UUID,
  match_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  founder_id UUID,
  founder_name TEXT,
  company_name TEXT,
  semantic_score DECIMAL,
  distance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fo.id,
    fo.name,
    fo.company_name,
    (1 - (f.embedding <=> fo.embedding))::DECIMAL as semantic_score,
    (f.embedding <=> fo.embedding)::DECIMAL as distance
  FROM founders fo
  CROSS JOIN funders f
  WHERE f.id = funder_uuid
    AND fo.is_active = true
    AND fo.embedding IS NOT NULL
    AND f.embedding IS NOT NULL
  ORDER BY f.embedding <=> fo.embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Migration 007: Row Level Security (simplified for demo)
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access to founders" ON founders;
DROP POLICY IF EXISTS "Service role full access to funders" ON funders;
DROP POLICY IF EXISTS "Service role full access to matches" ON matches;
DROP POLICY IF EXISTS "Anon read active founders" ON founders;
DROP POLICY IF EXISTS "Anon read active funders" ON funders;

-- Service role policies
CREATE POLICY "Service role full access to founders" ON founders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to funders" ON funders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to matches" ON matches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon policies (read-only for active profiles)
CREATE POLICY "Anon read active founders" ON founders FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Anon read active funders" ON funders FOR SELECT TO anon USING (is_active = true);

-- ============================================================================
-- MIGRATION COMPLETE!
-- Next: Run the seed script to add test data
-- ============================================================================
SELECT 'Migration complete! Tables created: founders, funders, matches' as status;
