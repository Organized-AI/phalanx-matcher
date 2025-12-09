-- Migration 007: Row Level Security (RLS) policies
-- Secure data access with role-based permissions

-- Enable RLS on all tables
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Service Role Policies (for API backend with service_role key)
-- ============================================================================

-- Service role has full access to founders table
CREATE POLICY "Service role full access to founders" ON founders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role has full access to funders table
CREATE POLICY "Service role full access to funders" ON funders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role has full access to matches table
CREATE POLICY "Service role full access to matches" ON matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Anonymous Role Policies (for public API with anon key)
-- ============================================================================

-- Anon users can only read active founder profiles
CREATE POLICY "Anon read active founders" ON founders
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Anon users can only read active funder profiles
CREATE POLICY "Anon read active funders" ON funders
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Anon users cannot read matches (matches are private)
-- No policy created = implicit deny

-- ============================================================================
-- Authenticated Role Policies (future: for logged-in users)
-- ============================================================================

-- Authenticated users can read their own founder profile
CREATE POLICY "Users read own founder profile" ON founders
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = email); -- Assumes email matches auth user

-- Authenticated users can update their own founder profile
CREATE POLICY "Users update own founder profile" ON founders
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = email)
  WITH CHECK (auth.uid()::text = email);

-- Authenticated users can read active funder profiles
CREATE POLICY "Authenticated read active funders" ON funders
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Authenticated users can read their own matches
CREATE POLICY "Users read own matches" ON matches
  FOR SELECT
  TO authenticated
  USING (
    founder_id IN (
      SELECT id FROM founders WHERE auth.uid()::text = email
    )
  );

-- ============================================================================
-- Notes
-- ============================================================================

-- Current architecture uses service_role key from Cloudflare Workers
-- This bypasses RLS policies for full access
--
-- Future enhancements:
-- - Add authenticated policies when user auth is implemented
-- - Add founder-specific policies when founders can self-manage profiles
-- - Add funder-specific policies for investor dashboards
-- - Consider adding policies for organization-level access
