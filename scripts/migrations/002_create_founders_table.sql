-- Migration 002: Create founders table
-- Stores founder profiles with vector embeddings for semantic matching

CREATE TABLE founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Profile fields
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  company_description TEXT,
  industry TEXT NOT NULL, -- e.g., "Fintech", "HealthTech"
  stage TEXT NOT NULL, -- "Pre-Seed", "Seed", "Series A", "Series B+"

  -- Fundraising details
  seeking_amount_min INTEGER, -- in thousands (e.g., 500 = $500k)
  seeking_amount_max INTEGER,
  geography TEXT, -- e.g., "North America", "Europe"

  -- Embedding
  embedding vector(1536), -- OpenAI ada-002 dimension
  embedding_text TEXT, -- Source text used for embedding

  -- Metadata
  profile_completeness DECIMAL DEFAULT 0.0, -- 0.0 to 1.0
  is_active BOOLEAN DEFAULT true
);

-- Indexes for efficient querying
CREATE INDEX founders_industry_idx ON founders(industry);
CREATE INDEX founders_stage_idx ON founders(stage);
CREATE INDEX founders_geography_idx ON founders(geography);
CREATE INDEX founders_is_active_idx ON founders(is_active);
CREATE INDEX founders_email_idx ON founders(email);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_founders_updated_at BEFORE UPDATE ON founders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
