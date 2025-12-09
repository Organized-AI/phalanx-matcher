-- Migration 003: Create funders table
-- Stores investor profiles with investment criteria and vector embeddings

CREATE TABLE funders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Profile fields
  name TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  bio TEXT,
  investment_thesis TEXT,

  -- Investment criteria
  preferred_industries TEXT[], -- Array of industries
  preferred_stages TEXT[], -- Array of stages
  check_size_min INTEGER, -- in thousands
  check_size_max INTEGER,
  geography_focus TEXT[], -- Array of geographies

  -- Embedding
  embedding vector(1536), -- OpenAI ada-002 dimension
  embedding_text TEXT, -- Source text used for embedding

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  total_matches_generated INTEGER DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX funders_is_active_idx ON funders(is_active);
CREATE INDEX funders_firm_name_idx ON funders(firm_name);
CREATE INDEX funders_preferred_industries_idx ON funders USING GIN(preferred_industries);
CREATE INDEX funders_preferred_stages_idx ON funders USING GIN(preferred_stages);
CREATE INDEX funders_geography_focus_idx ON funders USING GIN(geography_focus);

-- Update timestamp trigger
CREATE TRIGGER update_funders_updated_at BEFORE UPDATE ON funders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
