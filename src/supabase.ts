/**
 * Supabase Database Client
 * Handles all database operations for founders, funders, and matches
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Founder, Funder, Match, ScoreBreakdown } from './types';

// ============================================================================
// Client Initialization
// ============================================================================

export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false, // Cloudflare Workers don't need sessions
    },
  });
}

// ============================================================================
// Founder Operations
// ============================================================================

/**
 * Get founder by ID
 */
export async function getFounderById(
  client: SupabaseClient,
  founderId: string
): Promise<Founder | null> {
  const { data, error } = await client
    .from('founders')
    .select('*')
    .eq('id', founderId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch founder: ${error.message}`);
  }

  return data as Founder;
}

/**
 * Create new founder profile
 */
export async function createFounder(
  client: SupabaseClient,
  founder: Omit<Founder, 'id' | 'created_at' | 'updated_at'>
): Promise<Founder> {
  const { data, error } = await client.from('founders').insert(founder).select().single();

  if (error) {
    throw new Error(`Failed to create founder: ${error.message}`);
  }

  return data as Founder;
}

/**
 * Update founder profile
 */
export async function updateFounder(
  client: SupabaseClient,
  founderId: string,
  updates: Partial<Founder>
): Promise<Founder> {
  const { data, error } = await client
    .from('founders')
    .update(updates)
    .eq('id', founderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update founder: ${error.message}`);
  }

  return data as Founder;
}

// ============================================================================
// Funder Operations
// ============================================================================

/**
 * Get all active funders
 */
export async function getAllFunders(client: SupabaseClient): Promise<Funder[]> {
  const { data, error } = await client.from('funders').select('*').eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch funders: ${error.message}`);
  }

  return data as Funder[];
}

/**
 * Get funder by ID
 */
export async function getFunderById(
  client: SupabaseClient,
  funderId: string
): Promise<Funder | null> {
  const { data, error } = await client
    .from('funders')
    .select('*')
    .eq('id', funderId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch funder: ${error.message}`);
  }

  return data as Funder;
}

// ============================================================================
// Vector Similarity Search
// ============================================================================

export interface SimilarFunder {
  funder: Funder;
  semantic_score: number;
  distance: number;
}

/**
 * Find funders most similar to a founder using pgvector
 * Uses the find_matching_funders SQL function
 */
export async function findSimilarFunders(
  client: SupabaseClient,
  founderId: string,
  limit: number = 10
): Promise<SimilarFunder[]> {
  const { data, error } = await client.rpc('find_matching_funders', {
    founder_uuid: founderId,
    match_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to find similar funders: ${error.message}`);
  }

  // Fetch full funder details
  const funderIds = data.map((row: any) => row.funder_id);

  const { data: funders, error: fundersError } = await client
    .from('funders')
    .select('*')
    .in('id', funderIds);

  if (fundersError) {
    throw new Error(`Failed to fetch funder details: ${fundersError.message}`);
  }

  // Combine results
  return data.map((row: any) => {
    const funder = funders.find((f: Funder) => f.id === row.funder_id);
    return {
      funder: funder as Funder,
      semantic_score: parseFloat(row.semantic_score),
      distance: parseFloat(row.distance),
    };
  });
}

/**
 * Manual vector similarity search (if RPC function not available)
 * Uses pgvector's <=> operator directly
 */
export async function findSimilarFundersManual(
  client: SupabaseClient,
  founderEmbedding: number[],
  limit: number = 10
): Promise<SimilarFunder[]> {
  // Note: This requires raw SQL, which Supabase client doesn't support well
  // Prefer using the RPC function instead
  const { data, error } = await client
    .from('funders')
    .select('*')
    .not('embedding', 'is', null)
    .eq('is_active', true)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search funders: ${error.message}`);
  }

  // Calculate similarity in-memory (fallback)
  const results = data.map((funder: Funder) => {
    const distance = calculateCosineDistance(founderEmbedding, funder.embedding || []);
    return {
      funder,
      semantic_score: 1 - distance,
      distance,
    };
  });

  return results.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

function calculateCosineDistance(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 2;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (!normA || !normB) return 2;

  const similarity = dotProduct / (normA * normB);
  return 1 - similarity;
}

// ============================================================================
// Match Operations
// ============================================================================

/**
 * Save match to database
 */
export async function saveMatch(
  client: SupabaseClient,
  founderId: string,
  funderId: string,
  scoreBreakdown: ScoreBreakdown
): Promise<Match> {
  const matchData = {
    founder_id: founderId,
    funder_id: funderId,
    semantic_score: scoreBreakdown.semantic.score,
    rule_score: scoreBreakdown.rule.score,
    stage_score: scoreBreakdown.stage.score,
    total_score: scoreBreakdown.total_score,
    score_breakdown: scoreBreakdown,
    quality_tier: scoreBreakdown.quality_tier,
  };

  const { data, error } = await client
    .from('matches')
    .upsert(matchData, {
      onConflict: 'founder_id,funder_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save match: ${error.message}`);
  }

  return data as Match;
}

/**
 * Get existing matches for a founder
 */
export async function getMatchesForFounder(
  client: SupabaseClient,
  founderId: string,
  minScore: number = 0.5,
  limit: number = 10
): Promise<Match[]> {
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('founder_id', founderId)
    .gte('total_score', minScore)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch matches: ${error.message}`);
  }

  return data as Match[];
}

/**
 * Check if match already exists
 */
export async function matchExists(
  client: SupabaseClient,
  founderId: string,
  funderId: string
): Promise<Match | null> {
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('founder_id', founderId)
    .eq('funder_id', funderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to check match: ${error.message}`);
  }

  return data as Match;
}

/**
 * Mark match as viewed
 */
export async function markMatchViewed(
  client: SupabaseClient,
  matchId: string
): Promise<void> {
  const { error } = await client
    .from('matches')
    .update({
      is_viewed: true,
      viewed_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (error) {
    throw new Error(`Failed to mark match as viewed: ${error.message}`);
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Batch save multiple matches
 */
export async function saveMatchesBatch(
  client: SupabaseClient,
  matches: Array<{
    founderId: string;
    funderId: string;
    scoreBreakdown: ScoreBreakdown;
  }>
): Promise<Match[]> {
  const matchData = matches.map((m) => ({
    founder_id: m.founderId,
    funder_id: m.funderId,
    semantic_score: m.scoreBreakdown.semantic.score,
    rule_score: m.scoreBreakdown.rule.score,
    stage_score: m.scoreBreakdown.stage.score,
    total_score: m.scoreBreakdown.total_score,
    score_breakdown: m.scoreBreakdown,
    quality_tier: m.scoreBreakdown.quality_tier,
  }));

  const { data, error } = await client
    .from('matches')
    .upsert(matchData, {
      onConflict: 'founder_id,funder_id',
    })
    .select();

  if (error) {
    throw new Error(`Failed to save matches batch: ${error.message}`);
  }

  return data as Match[];
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get match statistics for a founder
 */
export async function getFounderMatchStats(
  client: SupabaseClient,
  founderId: string
): Promise<{
  total_matches: number;
  excellent_count: number;
  good_count: number;
  fair_count: number;
  poor_count: number;
  avg_score: number;
}> {
  const { data, error } = await client.rpc('get_founder_match_stats', {
    founder_uuid: founderId,
  });

  if (error) {
    // If function doesn't exist, calculate manually
    const { data: matches, error: matchesError } = await client
      .from('matches')
      .select('total_score, quality_tier')
      .eq('founder_id', founderId);

    if (matchesError) {
      throw new Error(`Failed to get match stats: ${matchesError.message}`);
    }

    const stats = {
      total_matches: matches.length,
      excellent_count: matches.filter((m) => m.quality_tier === 'Excellent').length,
      good_count: matches.filter((m) => m.quality_tier === 'Good').length,
      fair_count: matches.filter((m) => m.quality_tier === 'Fair').length,
      poor_count: matches.filter((m) => m.quality_tier === 'Poor').length,
      avg_score:
        matches.reduce((sum, m) => sum + m.total_score, 0) / (matches.length || 1),
    };

    return stats;
  }

  return data;
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check database connection and basic queries
 */
export async function healthCheck(client: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await client.from('founders').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
