/**
 * Phalanx Matching Engine - Type Definitions
 * Aligned with OpenAPI specification and database schema
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type Industry =
  | 'Fintech'
  | 'HealthTech'
  | 'EdTech'
  | 'CleanTech'
  | 'Enterprise SaaS'
  | 'Consumer'
  | 'DeepTech'
  | 'PropTech'
  | 'Logistics'
  | 'Cybersecurity';

export type Stage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B+';

export type Geography =
  | 'North America'
  | 'Europe'
  | 'Asia'
  | 'Latin America'
  | 'Middle East'
  | 'Africa'
  | 'Oceania'
  | 'Global';

export type QualityTier = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export const QUALITY_TIER_THRESHOLDS = {
  EXCELLENT: 0.90,
  GOOD: 0.75,
  FAIR: 0.50,
} as const;

export const SCORE_WEIGHTS = {
  SEMANTIC: 0.40,
  RULE: 0.40,
  STAGE: 0.20,
} as const;

export const RULE_SUB_WEIGHTS = {
  INDUSTRY: 0.375, // 15% of total
  CHECK_SIZE: 0.375, // 15% of total
  GEOGRAPHY: 0.125, // 5% of total
  COMPLETENESS: 0.125, // 5% of total
} as const;

// ============================================================================
// Database Models
// ============================================================================

export interface Founder {
  id: string;
  created_at: string;
  updated_at: string;

  // Profile fields
  name: string;
  email: string;
  company_name?: string;
  company_description?: string;
  industry: Industry;
  stage: Stage;

  // Fundraising details
  seeking_amount_min?: number; // in thousands
  seeking_amount_max?: number; // in thousands
  geography?: Geography;

  // Embedding
  embedding?: number[]; // 1536-dim vector
  embedding_text?: string;

  // Metadata
  profile_completeness: number; // 0.0 to 1.0
  is_active: boolean;
}

export interface Funder {
  id: string;
  created_at: string;
  updated_at: string;

  // Profile fields
  name: string;
  firm_name: string;
  bio?: string;
  investment_thesis?: string;

  // Investment criteria
  preferred_industries: Industry[];
  preferred_stages: Stage[];
  check_size_min?: number; // in thousands
  check_size_max?: number; // in thousands
  geography_focus: Geography[];

  // Embedding
  embedding?: number[]; // 1536-dim vector
  embedding_text?: string;

  // Metadata
  is_active: boolean;
  total_matches_generated: number;
}

export interface Match {
  id: string;
  created_at: string;

  // Relationships
  founder_id: string;
  funder_id: string;

  // Scores
  semantic_score: number; // 0.0 to 1.0
  rule_score: number; // 0.0 to 1.0
  stage_score: number; // 0.0 to 1.0
  total_score: number; // 0.0 to 1.0

  // Score breakdown (stored as JSONB)
  score_breakdown: ScoreBreakdown;

  // Match metadata
  quality_tier: QualityTier;
  is_viewed: boolean;
  viewed_at?: string;
}

// ============================================================================
// Scoring Types
// ============================================================================

export interface SubScore {
  score: number;
  weight: number;
  reasoning: string;
}

export interface RuleScoreBreakdown {
  industry_match: SubScore;
  check_size: SubScore;
  geography: SubScore;
  completeness: SubScore;
}

export interface ScoreBreakdown {
  semantic: {
    score: number;
    weight: number;
    contribution: number;
    reasoning: string;
  };
  rule: {
    score: number;
    weight: number;
    contribution: number;
    breakdown: RuleScoreBreakdown;
  };
  stage: {
    score: number;
    weight: number;
    contribution: number;
    reasoning: string;
  };
  total_score: number;
  quality_tier: QualityTier;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface FounderProfileInput {
  name: string;
  email: string;
  company_name?: string;
  company_description?: string;
  industry: Industry;
  stage: Stage;
  seeking_amount_min?: number;
  seeking_amount_max?: number;
  geography?: Geography;
}

export interface IngestFounderResponse {
  id: string;
  embedding_generated: boolean;
  profile_completeness: number;
  created_at: string;
}

export interface MatchResult {
  funder: {
    id: string;
    name: string;
    firm_name: string;
    bio?: string;
  };
  scores: {
    total_score: number;
    semantic_score: number;
    rule_score: number;
    stage_score: number;
    quality_tier: QualityTier;
  };
  reasoning: ScoreBreakdown;
}

export interface MatchResponse {
  founder: {
    id: string;
    name: string;
    company_name?: string;
  };
  matches: MatchResult[];
  total_results: number;
  generated_at: string;
  note?: string;
}

export interface MatchQueryParams {
  limit?: number; // default: 10, max: 50
  minScore?: number; // default: 0.5, range: 0.0-1.0
  qualityTier?: QualityTier;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  environment: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Matching Algorithm Types
// ============================================================================

export interface MatchingContext {
  founder: Founder;
  funder: Funder;
}

export interface SemanticScoreResult {
  score: number;
  distance: number;
  reasoning: string;
}

export interface IndustryScoreResult {
  score: number; // 0.0, 0.5, or 1.0
  reasoning: string;
}

export interface CheckSizeScoreResult {
  score: number; // 0.0 to 1.0
  overlap_amount: number;
  founder_range: number;
  reasoning: string;
}

export interface GeographyScoreResult {
  score: number; // 0.0, 0.5, or 1.0
  reasoning: string;
}

export interface CompletenessScoreResult {
  score: number; // 0.0 to 1.0
  filled_fields: number;
  total_fields: number;
  reasoning: string;
}

export interface StageScoreResult {
  score: number; // 0.0, 0.5, or 1.0
  reasoning: string;
}

export interface RuleScoreResult {
  score: number;
  breakdown: RuleScoreBreakdown;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  OPENAI_API_KEY: string;
  ENVIRONMENT: string;
}

export interface EmbeddingRequest {
  text: string;
  model?: string; // default: 'text-embedding-ada-002'
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens_used: number;
}

// ============================================================================
// Industry Relationships (for scoring)
// ============================================================================

export const INDUSTRY_RELATIONSHIPS: Record<Industry, Industry[]> = {
  Fintech: ['Enterprise SaaS', 'DeepTech'],
  HealthTech: ['DeepTech', 'Enterprise SaaS'],
  EdTech: ['Enterprise SaaS', 'Consumer'],
  'Enterprise SaaS': ['Fintech', 'HealthTech', 'DeepTech'],
  Consumer: ['EdTech', 'PropTech'],
  DeepTech: ['Fintech', 'HealthTech', 'Cybersecurity'],
  CleanTech: ['Enterprise SaaS', 'Logistics'],
  PropTech: ['Consumer', 'Fintech'],
  Logistics: ['CleanTech', 'Enterprise SaaS'],
  Cybersecurity: ['DeepTech', 'Enterprise SaaS'],
};

// ============================================================================
// Stage Adjacency (for scoring)
// ============================================================================

export const ADJACENT_STAGES: Record<Stage, Stage[]> = {
  'Pre-Seed': ['Seed'],
  Seed: ['Pre-Seed', 'Series A'],
  'Series A': ['Seed', 'Series B+'],
  'Series B+': ['Series A'],
};

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isValidIndustry(value: string): value is Industry {
  const industries: Industry[] = [
    'Fintech',
    'HealthTech',
    'EdTech',
    'CleanTech',
    'Enterprise SaaS',
    'Consumer',
    'DeepTech',
    'PropTech',
    'Logistics',
    'Cybersecurity',
  ];
  return industries.includes(value as Industry);
}

export function isValidStage(value: string): value is Stage {
  const stages: Stage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B+'];
  return stages.includes(value as Stage);
}

export function isValidGeography(value: string): value is Geography {
  const geographies: Geography[] = [
    'North America',
    'Europe',
    'Asia',
    'Latin America',
    'Middle East',
    'Africa',
    'Oceania',
    'Global',
  ];
  return geographies.includes(value as Geography);
}

export function isValidQualityTier(value: string): value is QualityTier {
  const tiers: QualityTier[] = ['Excellent', 'Good', 'Fair', 'Poor'];
  return tiers.includes(value as QualityTier);
}

// ============================================================================
// Quality Tier Calculator
// ============================================================================

export function calculateQualityTier(totalScore: number): QualityTier {
  if (totalScore >= QUALITY_TIER_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (totalScore >= QUALITY_TIER_THRESHOLDS.GOOD) return 'Good';
  if (totalScore >= QUALITY_TIER_THRESHOLDS.FAIR) return 'Fair';
  return 'Poor';
}

// ============================================================================
// Profile Completeness Calculator
// ============================================================================

export function calculateProfileCompleteness(founder: Partial<Founder>): number {
  const fields = [
    'name',
    'email',
    'industry',
    'stage',
    'company_name',
    'company_description',
    'seeking_amount_min',
    'seeking_amount_max',
    'geography',
  ];

  const filledFields = fields.filter((field) => {
    const value = founder[field as keyof Founder];
    return value !== null && value !== undefined && value !== '';
  }).length;

  return Number((filledFields / fields.length).toFixed(2));
}
