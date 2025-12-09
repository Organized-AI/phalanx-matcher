-- ============================================================================
-- PHALANX MATCHING ENGINE - DATABASE SCHEMA v1.0
-- ============================================================================
-- Owner: Jordan (PM) | Architect: Paul | AI Engineer: Jake
-- Purpose: Complete database schema for founder-funder matching with pgvector
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

CREATE TYPE company_stage AS ENUM (
    'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth'
);

CREATE TYPE match_status AS ENUM (
    'pending', 'viewed', 'intro_requested', 'intro_sent', 'passed', 'connected', 'funded'
);

CREATE TYPE industry_sector AS ENUM (
    'healthcare', 'fintech', 'edtech', 'climate', 'cybersecurity', 'logistics',
    'creator_economy', 'agtech', 'proptech', 'legaltech', 'saas', 'marketplace',
    'consumer', 'enterprise', 'ai_ml', 'web3', 'other'
);

-- ============================================================================
-- FOUNDERS TABLE
-- ============================================================================

CREATE TABLE founders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    company_name TEXT NOT NULL,
    company_url TEXT,
    company_logo_url TEXT,
    company_founded_year INTEGER,
    industry_sector industry_sector NOT NULL,
    company_stage company_stage NOT NULL,
    geographic_location TEXT NOT NULL,
    country_code TEXT DEFAULT 'US',
    tagline TEXT,
    problem_statement TEXT NOT NULL,
    solution_description TEXT NOT NULL,
    unique_value_prop TEXT,
    target_customer TEXT,
    business_model TEXT,
    competitive_advantage TEXT,
    raise_amount DECIMAL(15,2) NOT NULL,
    raise_amount_min DECIMAL(15,2),
    raise_amount_max DECIMAL(15,2),
    use_of_funds TEXT,
    funding_timeline TEXT DEFAULT 'actively_raising',
    previous_funding DECIMAL(15,2) DEFAULT 0,
    valuation_expectation DECIMAL(15,2),
    team_size INTEGER DEFAULT 1,
    founders_count INTEGER DEFAULT 1,
    team_background JSONB,
    advisors JSONB,
    key_metrics JSONB,
    traction_summary TEXT,
    customer_count INTEGER,
    mrr DECIMAL(15,2),
    arr DECIMAL(15,2),
    growth_rate_percent DECIMAL(5,2),
    pitch_deck_url TEXT,
    exec_summary_url TEXT,
    financial_model_url TEXT,
    demo_video_url TEXT,
    embedding vector(1536),
    ai_summary TEXT,
    ai_tags TEXT[],
    ai_extracted_data JSONB,
    profile_completeness_score INTEGER DEFAULT 0 CHECK (profile_completeness_score >= 0 AND profile_completeness_score <= 100),
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    raise_hand_eligible BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    last_match_at TIMESTAMPTZ,
    CONSTRAINT valid_raise_amount CHECK (raise_amount > 0),
    CONSTRAINT valid_timeline CHECK (funding_timeline IN ('actively_raising', 'starting_soon', 'exploring', 'not_raising'))
);

CREATE INDEX founders_embedding_idx ON founders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX founders_industry_idx ON founders(industry_sector);
CREATE INDEX founders_stage_idx ON founders(company_stage);
CREATE INDEX founders_location_idx ON founders(geographic_location);
CREATE INDEX founders_raise_amount_idx ON founders(raise_amount);
CREATE INDEX founders_active_idx ON founders(is_active) WHERE is_active = TRUE;
CREATE INDEX founders_eligible_idx ON founders(raise_hand_eligible) WHERE raise_hand_eligible = TRUE;
CREATE INDEX founders_created_idx ON founders(created_at DESC);

-- ============================================================================
-- FUNDERS TABLE
-- ============================================================================

CREATE TABLE funders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    title TEXT,
    firm_name TEXT NOT NULL,
    firm_url TEXT,
    firm_logo_url TEXT,
    firm_type TEXT DEFAULT 'vc',
    firm_description TEXT,
    aum DECIMAL(15,2),
    fund_vintage_year INTEGER,
    investment_thesis TEXT NOT NULL,
    sectors_of_interest industry_sector[] NOT NULL,
    stage_preferences company_stage[] NOT NULL,
    check_size_min DECIMAL(15,2) NOT NULL,
    check_size_max DECIMAL(15,2) NOT NULL,
    typical_check_size DECIMAL(15,2),
    follow_on_capacity BOOLEAN DEFAULT TRUE,
    geographic_focus TEXT[],
    geographic_restrictions TEXT[],
    deal_flow_preferences TEXT,
    lead_or_follow TEXT DEFAULT 'either',
    board_seat_requirement BOOLEAN DEFAULT FALSE,
    portfolio_companies JSONB,
    portfolio_count INTEGER DEFAULT 0,
    notable_exits JSONB,
    investments_per_year INTEGER,
    current_year_investments INTEGER DEFAULT 0,
    capacity_remaining BOOLEAN DEFAULT TRUE,
    embedding vector(1536),
    ai_keywords TEXT[],
    avg_response_time_hours INTEGER,
    response_rate DECIMAL(5,2),
    total_matches_received INTEGER DEFAULT 0,
    total_intros_accepted INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    accepting_intros BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_check_range CHECK (check_size_max >= check_size_min)
);

CREATE INDEX funders_embedding_idx ON funders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX funders_sectors_idx ON funders USING GIN(sectors_of_interest);
CREATE INDEX funders_stages_idx ON funders USING GIN(stage_preferences);
CREATE INDEX funders_geo_idx ON funders USING GIN(geographic_focus);
CREATE INDEX funders_check_size_idx ON funders(check_size_min, check_size_max);
CREATE INDEX funders_active_idx ON funders(is_active) WHERE is_active = TRUE;
CREATE INDEX funders_accepting_idx ON funders(accepting_intros) WHERE accepting_intros = TRUE;

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    funder_id UUID NOT NULL REFERENCES funders(id) ON DELETE CASCADE,
    semantic_score DECIMAL(5,2) NOT NULL CHECK (semantic_score >= 0 AND semantic_score <= 100),
    rule_score DECIMAL(5,2) NOT NULL CHECK (rule_score >= 0 AND rule_score <= 100),
    stage_score DECIMAL(5,2) NOT NULL CHECK (stage_score >= 0 AND stage_score <= 100),
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (
        (semantic_score * 0.40) + (rule_score * 0.40) + (stage_score * 0.20)
    ) STORED,
    score_breakdown JSONB,
    match_reasoning TEXT,
    match_status match_status DEFAULT 'pending',
    algorithm_version TEXT DEFAULT '1.0.0',
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    funder_response_at TIMESTAMPTZ,
    founder_notified_at TIMESTAMPTZ,
    funder_feedback TEXT,
    founder_feedback TEXT,
    intro_requested_at TIMESTAMPTZ,
    intro_sent_at TIMESTAMPTZ,
    meeting_scheduled_at TIMESTAMPTZ,
    meeting_held_at TIMESTAMPTZ,
    outcome TEXT,
    outcome_notes TEXT,
    funding_amount DECIMAL(15,2),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT unique_founder_funder UNIQUE(founder_id, funder_id)
);

CREATE INDEX matches_total_score_idx ON matches(total_score DESC);
CREATE INDEX matches_founder_idx ON matches(founder_id);
CREATE INDEX matches_funder_idx ON matches(funder_id);
CREATE INDEX matches_status_idx ON matches(match_status);
CREATE INDEX matches_created_idx ON matches(created_at DESC);
CREATE INDEX matches_pending_idx ON matches(match_status) WHERE match_status = 'pending';

-- ============================================================================
-- SUPPORTING TABLES
-- ============================================================================

CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('founder', 'funder', 'system')),
    sender_id UUID NOT NULL,
    message_type TEXT DEFAULT 'message',
    subject TEXT,
    content TEXT NOT NULL,
    attachments JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX communications_match_idx ON communications(match_id);
CREATE INDEX communications_sender_idx ON communications(sender_id);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    actor_type TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_actor_idx ON audit_log(actor_id);
CREATE INDEX audit_log_created_idx ON audit_log(created_at DESC);

CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    user_id UUID,
    api_key_id UUID,
    request_body JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX api_requests_user_idx ON api_requests(user_id);
CREATE INDEX api_requests_endpoint_idx ON api_requests(endpoint);
CREATE INDEX api_requests_created_idx ON api_requests(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cosine_similarity(vec1 vector, vec2 vector)
RETURNS FLOAT AS $$
    SELECT 1 - (vec1 <=> vec2);
$$ LANGUAGE SQL IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION calculate_profile_completeness(founder_row founders)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    IF founder_row.company_name IS NOT NULL THEN score := score + 5; END IF;
    IF founder_row.problem_statement IS NOT NULL AND LENGTH(founder_row.problem_statement) > 50 THEN score := score + 10; END IF;
    IF founder_row.solution_description IS NOT NULL AND LENGTH(founder_row.solution_description) > 50 THEN score := score + 10; END IF;
    IF founder_row.raise_amount IS NOT NULL AND founder_row.raise_amount > 0 THEN score := score + 5; END IF;
    IF founder_row.company_stage IS NOT NULL THEN score := score + 5; END IF;
    IF founder_row.industry_sector IS NOT NULL THEN score := score + 5; END IF;
    IF founder_row.pitch_deck_url IS NOT NULL THEN score := score + 10; END IF;
    IF founder_row.team_size IS NOT NULL AND founder_row.team_size > 0 THEN score := score + 5; END IF;
    IF founder_row.team_background IS NOT NULL THEN score := score + 3; END IF;
    IF founder_row.company_url IS NOT NULL THEN score := score + 5; END IF;
    IF founder_row.target_customer IS NOT NULL THEN score := score + 4; END IF;
    IF founder_row.business_model IS NOT NULL THEN score := score + 3; END IF;
    IF founder_row.financial_model_url IS NOT NULL THEN score := score + 8; END IF;
    IF founder_row.key_metrics IS NOT NULL THEN score := score + 5; END IF;
    IF founder_row.demo_video_url IS NOT NULL THEN score := score + 4; END IF;
    IF founder_row.exec_summary_url IS NOT NULL THEN score := score + 3; END IF;
    IF founder_row.unique_value_prop IS NOT NULL AND LENGTH(founder_row.unique_value_prop) > 30 THEN score := score + 3; END IF;
    IF founder_row.competitive_advantage IS NOT NULL THEN score := score + 3; END IF;
    IF founder_row.traction_summary IS NOT NULL THEN score := score + 2; END IF;
    IF founder_row.linkedin_url IS NOT NULL THEN score := score + 2; END IF;
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_founder_completeness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completeness_score := calculate_profile_completeness(NEW);
    NEW.updated_at := NOW();
    NEW.raise_hand_eligible := NEW.profile_completeness_score >= 60;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER founder_completeness_trigger
    BEFORE INSERT OR UPDATE ON founders
    FOR EACH ROW EXECUTE FUNCTION update_founder_completeness();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER funders_updated_at BEFORE UPDATE ON funders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY founders_own_profile ON founders FOR ALL USING (user_id = auth.uid());
CREATE POLICY founders_public_view ON founders FOR SELECT USING (is_active = TRUE AND raise_hand_eligible = TRUE);
CREATE POLICY funders_own_profile ON funders FOR ALL USING (user_id = auth.uid());
CREATE POLICY funders_public_view ON funders FOR SELECT USING (is_active = TRUE);
CREATE POLICY matches_founder_view ON matches FOR SELECT USING (founder_id IN (SELECT id FROM founders WHERE user_id = auth.uid()));
CREATE POLICY matches_funder_view ON matches FOR SELECT USING (funder_id IN (SELECT id FROM funders WHERE user_id = auth.uid()));

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW active_founders_view AS
SELECT f.*, calculate_profile_completeness(f) as calculated_completeness
FROM founders f WHERE f.is_active = TRUE ORDER BY f.created_at DESC;

CREATE OR REPLACE VIEW active_funders_view AS
SELECT f.*, (f.total_intros_accepted::FLOAT / NULLIF(f.total_matches_received, 0)) as acceptance_rate
FROM funders f WHERE f.is_active = TRUE AND f.accepting_intros = TRUE ORDER BY f.last_active_at DESC;

CREATE OR REPLACE VIEW match_analytics_view AS
SELECT m.id, m.total_score, m.match_status, m.semantic_score, m.rule_score, m.stage_score,
    f.company_name as founder_company, f.industry_sector as founder_industry, f.company_stage as founder_stage, f.raise_amount,
    fn.firm_name as funder_firm, fn.check_size_min, fn.check_size_max,
    m.created_at, m.matched_at, m.funder_response_at,
    EXTRACT(EPOCH FROM (m.funder_response_at - m.matched_at))/3600 as response_time_hours
FROM matches m JOIN founders f ON m.founder_id = f.id JOIN funders fn ON m.funder_id = fn.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE founders IS 'Startup founders seeking funding through the platform';
COMMENT ON TABLE funders IS 'Investors and VCs providing funding through the platform';
COMMENT ON TABLE matches IS 'Founder-funder match pairs with scores and status tracking';
COMMENT ON COLUMN founders.embedding IS 'OpenAI ada-002 1536-dimensional vector for semantic similarity';
COMMENT ON COLUMN founders.profile_completeness_score IS 'Auto-calculated score 0-100 based on profile fields';
COMMENT ON COLUMN matches.total_score IS 'Auto-calculated weighted score: 40% semantic + 40% rules + 20% stage';
