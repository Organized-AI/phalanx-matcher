-- Migration 006: Create matching utility functions
-- SQL functions for semantic similarity and finding matches

-- Function to calculate cosine similarity from distance
-- pgvector's <=> operator returns cosine distance (0 = identical, 2 = opposite)
-- This converts to similarity score (1 = identical, 0 = orthogonal, -1 = opposite)
CREATE OR REPLACE FUNCTION cosine_similarity(a vector(1536), b vector(1536))
RETURNS DECIMAL AS $$
BEGIN
  RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find top N similar funders for a founder
-- Returns funders ranked by semantic similarity (cosine distance)
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

-- Function to find top N similar founders for a funder (reverse match)
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

-- Helper function to calculate profile completeness for founders
CREATE OR REPLACE FUNCTION calculate_founder_completeness(founder_row founders)
RETURNS DECIMAL AS $$
DECLARE
  total_fields INTEGER := 9; -- Total scoreable fields
  filled_fields INTEGER := 0;
BEGIN
  -- Count filled required fields
  IF founder_row.name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.email IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.industry IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.stage IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  -- Count filled optional fields
  IF founder_row.company_name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.company_description IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.seeking_amount_min IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.seeking_amount_max IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF founder_row.geography IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  RETURN (filled_fields::DECIMAL / total_fields::DECIMAL);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
