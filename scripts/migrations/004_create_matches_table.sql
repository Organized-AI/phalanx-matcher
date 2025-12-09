-- Migration 004: Create matches table
-- Stores computed matches between founders and funders with detailed scoring

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  funder_id UUID NOT NULL REFERENCES funders(id) ON DELETE CASCADE,

  -- Scores (all 0.0 to 1.0 range)
  semantic_score DECIMAL NOT NULL,
  rule_score DECIMAL NOT NULL,
  stage_score DECIMAL NOT NULL,
  total_score DECIMAL NOT NULL,

  -- Score breakdown (JSONB for flexibility)
  score_breakdown JSONB NOT NULL,
  -- Example structure:
  -- {
  --   "semantic": {"score": 0.85, "weight": 0.40, "contribution": 0.34, "reasoning": "High similarity in investment thesis"},
  --   "rule": {
  --     "score": 0.9875,
  --     "weight": 0.40,
  --     "contribution": 0.395,
  --     "breakdown": {
  --       "industry_match": {"score": 1.0, "weight": 0.15, "reasoning": "Exact industry match"},
  --       "check_size": {"score": 0.8, "weight": 0.15, "reasoning": "Within range"},
  --       "geography": {"score": 1.0, "weight": 0.05, "reasoning": "Perfect geo match"},
  --       "completeness": {"score": 0.9, "weight": 0.05, "reasoning": "Profile 90% complete"}
  --     }
  --   },
  --   "stage": {"score": 1.0, "weight": 0.20, "contribution": 0.20, "reasoning": "Exact stage match"},
  --   "total_score": 0.935,
  --   "quality_tier": "Excellent"
  -- }

  -- Match metadata
  quality_tier TEXT, -- "Excellent", "Good", "Fair", "Poor"
  is_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,

  -- Ensure unique founder-funder pairs
  UNIQUE(founder_id, funder_id)
);

-- Indexes for efficient querying
CREATE INDEX matches_founder_id_idx ON matches(founder_id);
CREATE INDEX matches_funder_id_idx ON matches(funder_id);
CREATE INDEX matches_total_score_idx ON matches(total_score DESC);
CREATE INDEX matches_quality_tier_idx ON matches(quality_tier);
CREATE INDEX matches_created_at_idx ON matches(created_at DESC);

-- Composite index for common query pattern: get top matches for a founder
CREATE INDEX matches_founder_score_idx ON matches(founder_id, total_score DESC);

-- JSONB GIN index for flexible querying of score breakdowns
CREATE INDEX matches_score_breakdown_idx ON matches USING GIN(score_breakdown);
