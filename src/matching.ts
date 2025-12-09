/**
 * Phase C: Hybrid Matching Algorithm (40/40/20)
 * Combines semantic similarity, rule-based scoring, and stage alignment
 */

import type {
  Founder,
  Funder,
  ScoreBreakdown,
  SubScore,
  RuleScoreBreakdown,
  SemanticScoreResult,
  IndustryScoreResult,
  CheckSizeScoreResult,
  GeographyScoreResult,
  CompletenessScoreResult,
  StageScoreResult,
  RuleScoreResult,
  QualityTier,
  Industry,
  Stage,
} from './types';

import {
  SCORE_WEIGHTS,
  RULE_SUB_WEIGHTS,
  INDUSTRY_RELATIONSHIPS,
  ADJACENT_STAGES,
  calculateQualityTier,
} from './types';

// ============================================================================
// Component A: Semantic Scoring (40% weight)
// ============================================================================

/**
 * Calculate semantic similarity score from pgvector cosine distance
 * Input: cosine distance from pgvector (0 = identical, 2 = opposite)
 * Output: similarity score (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function calculateSemanticScore(
  founderEmbedding: number[],
  funderEmbedding: number[]
): SemanticScoreResult {
  if (!founderEmbedding || !funderEmbedding) {
    return {
      score: 0,
      distance: 2,
      reasoning: 'Missing embeddings - cannot compute semantic similarity',
    };
  }

  // Calculate cosine similarity (dot product of normalized vectors)
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < founderEmbedding.length; i++) {
    dotProduct += founderEmbedding[i] * funderEmbedding[i];
    normA += founderEmbedding[i] * founderEmbedding[i];
    normB += funderEmbedding[i] * funderEmbedding[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  const similarity = normA && normB ? dotProduct / (normA * normB) : 0;
  const distance = 1 - similarity;

  // Generate reasoning based on score
  let reasoning: string;
  if (similarity >= 0.9) {
    reasoning = 'Exceptional semantic alignment in business model and investment focus';
  } else if (similarity >= 0.8) {
    reasoning = 'Strong alignment in investment thesis and company description';
  } else if (similarity >= 0.7) {
    reasoning = 'Good thematic overlap between founder and funder';
  } else if (similarity >= 0.5) {
    reasoning = 'Moderate semantic relevance';
  } else {
    reasoning = 'Limited semantic connection between profiles';
  }

  return {
    score: Math.max(0, Math.min(1, similarity)), // Clamp to [0, 1]
    distance,
    reasoning,
  };
}

// ============================================================================
// Component B: Rule-Based Scoring (40% weight)
// ============================================================================

/**
 * B.1 - Industry Match Score (37.5% of rule score)
 */
export function calculateIndustryScore(
  founderIndustry: Industry,
  funderIndustries: Industry[]
): IndustryScoreResult {
  // Exact match
  if (funderIndustries.includes(founderIndustry)) {
    return {
      score: 1.0,
      reasoning: `Exact match: ${founderIndustry}`,
    };
  }

  // Related industry match
  const relatedIndustries = INDUSTRY_RELATIONSHIPS[founderIndustry] || [];
  for (const funderIndustry of funderIndustries) {
    if (relatedIndustries.includes(funderIndustry)) {
      return {
        score: 0.5,
        reasoning: `Related industry: ${founderIndustry} ↔ ${funderIndustry}`,
      };
    }
  }

  // No match
  return {
    score: 0.0,
    reasoning: `No industry overlap: ${founderIndustry} vs [${funderIndustries.join(', ')}]`,
  };
}

/**
 * B.2 - Check Size Alignment Score (37.5% of rule score)
 */
export function calculateCheckSizeScore(
  founderMin?: number,
  founderMax?: number,
  funderMin?: number,
  funderMax?: number
): CheckSizeScoreResult {
  // Handle missing data
  if (!founderMin || !founderMax) {
    return {
      score: 0.5,
      overlap_amount: 0,
      founder_range: 0,
      reasoning: 'Founder seeking amount not specified - neutral score',
    };
  }

  if (!funderMin || !funderMax) {
    return {
      score: 1.0,
      overlap_amount: founderMax - founderMin,
      founder_range: founderMax - founderMin,
      reasoning: 'Funder check size flexible - assumed match',
    };
  }

  // Calculate overlap
  const overlapMin = Math.max(founderMin, funderMin);
  const overlapMax = Math.min(founderMax, funderMax);
  const overlapAmount = Math.max(0, overlapMax - overlapMin);

  const founderRange = founderMax - founderMin;
  const score = founderRange > 0 ? overlapAmount / founderRange : 0;

  // Generate reasoning
  let reasoning: string;
  if (score === 1.0) {
    reasoning = `Perfect fit: $${founderMin}k-$${founderMax}k fully within funder range $${funderMin}k-$${funderMax}k`;
  } else if (score >= 0.5) {
    reasoning = `Good overlap: ${Math.round(score * 100)}% of founder's range covered`;
  } else if (score > 0) {
    reasoning = `Partial overlap: $${overlapMin}k-$${overlapMax}k (${Math.round(score * 100)}% coverage)`;
  } else {
    reasoning = `No overlap: Founder seeks $${founderMin}k-$${founderMax}k, Funder invests $${funderMin}k-$${funderMax}k`;
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    overlap_amount: overlapAmount,
    founder_range: founderRange,
    reasoning,
  };
}

/**
 * B.3 - Geography Match Score (12.5% of rule score)
 */
export function calculateGeographyScore(
  founderGeography?: string,
  funderGeographies?: string[]
): GeographyScoreResult {
  // Funder invests globally or no geography restriction
  if (!funderGeographies || funderGeographies.length === 0 || funderGeographies.includes('Global')) {
    return {
      score: 1.0,
      reasoning: 'Funder invests globally',
    };
  }

  // Founder didn't specify geography
  if (!founderGeography) {
    return {
      score: 0.5,
      reasoning: 'Founder geography not specified - neutral score',
    };
  }

  // Check for match
  if (funderGeographies.includes(founderGeography)) {
    return {
      score: 1.0,
      reasoning: `Geography match: ${founderGeography}`,
    };
  }

  // No match
  return {
    score: 0.0,
    reasoning: `Geography mismatch: ${founderGeography} not in [${funderGeographies.join(', ')}]`,
  };
}

/**
 * B.4 - Profile Completeness Score (12.5% of rule score)
 */
export function calculateCompletenessScore(founder: Founder): CompletenessScoreResult {
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

  const totalFields = fields.length;
  const score = filledFields / totalFields;

  const percentage = Math.round(score * 100);
  const reasoning = `Profile ${percentage}% complete (${filledFields}/${totalFields} fields)`;

  return {
    score: Number(score.toFixed(2)),
    filled_fields: filledFields,
    total_fields: totalFields,
    reasoning,
  };
}

/**
 * Calculate aggregated rule score with breakdown
 */
export function calculateRuleScore(founder: Founder, funder: Funder): RuleScoreResult {
  // Calculate sub-scores
  const industryResult = calculateIndustryScore(founder.industry, funder.preferred_industries);
  const checkSizeResult = calculateCheckSizeScore(
    founder.seeking_amount_min,
    founder.seeking_amount_max,
    funder.check_size_min,
    funder.check_size_max
  );
  const geographyResult = calculateGeographyScore(founder.geography, funder.geography_focus);
  const completenessResult = calculateCompletenessScore(founder);

  // Build breakdown with weights
  const breakdown: RuleScoreBreakdown = {
    industry_match: {
      score: industryResult.score,
      weight: RULE_SUB_WEIGHTS.INDUSTRY,
      reasoning: industryResult.reasoning,
    },
    check_size: {
      score: checkSizeResult.score,
      weight: RULE_SUB_WEIGHTS.CHECK_SIZE,
      reasoning: checkSizeResult.reasoning,
    },
    geography: {
      score: geographyResult.score,
      weight: RULE_SUB_WEIGHTS.GEOGRAPHY,
      reasoning: geographyResult.reasoning,
    },
    completeness: {
      score: completenessResult.score,
      weight: RULE_SUB_WEIGHTS.COMPLETENESS,
      reasoning: completenessResult.reasoning,
    },
  };

  // Calculate weighted score
  const score =
    industryResult.score * RULE_SUB_WEIGHTS.INDUSTRY +
    checkSizeResult.score * RULE_SUB_WEIGHTS.CHECK_SIZE +
    geographyResult.score * RULE_SUB_WEIGHTS.GEOGRAPHY +
    completenessResult.score * RULE_SUB_WEIGHTS.COMPLETENESS;

  return {
    score: Number(score.toFixed(4)),
    breakdown,
  };
}

// ============================================================================
// Component C: Stage Scoring (20% weight)
// ============================================================================

/**
 * Calculate stage alignment score
 */
export function calculateStageScore(
  founderStage: Stage,
  funderStages: Stage[]
): StageScoreResult {
  // Exact match
  if (funderStages.includes(founderStage)) {
    return {
      score: 1.0,
      reasoning: `Exact stage match: ${founderStage}`,
    };
  }

  // Adjacent stage match
  const adjacentStages = ADJACENT_STAGES[founderStage] || [];
  for (const funderStage of funderStages) {
    if (adjacentStages.includes(funderStage)) {
      return {
        score: 0.5,
        reasoning: `Adjacent stage: ${founderStage} ↔ ${funderStage}`,
      };
    }
  }

  // No match
  return {
    score: 0.0,
    reasoning: `Stage mismatch: ${founderStage} vs [${funderStages.join(', ')}]`,
  };
}

// ============================================================================
// Hybrid Score Calculation (40/40/20)
// ============================================================================

/**
 * Calculate complete match score with full breakdown
 */
export function calculateMatchScore(
  founder: Founder,
  funder: Funder,
  semanticScore?: number
): ScoreBreakdown {
  // Component A: Semantic (40%)
  let semanticResult: SemanticScoreResult;
  if (semanticScore !== undefined) {
    // Use pre-computed score from pgvector
    semanticResult = {
      score: semanticScore,
      distance: 1 - semanticScore,
      reasoning:
        semanticScore >= 0.8
          ? 'Strong semantic alignment'
          : semanticScore >= 0.6
          ? 'Moderate semantic relevance'
          : 'Limited semantic connection',
    };
  } else if (founder.embedding && funder.embedding) {
    // Calculate from embeddings
    semanticResult = calculateSemanticScore(founder.embedding, funder.embedding);
  } else {
    // No embeddings available
    semanticResult = {
      score: 0,
      distance: 2,
      reasoning: 'Embeddings not available',
    };
  }

  // Component B: Rule-based (40%)
  const ruleResult = calculateRuleScore(founder, funder);

  // Component C: Stage (20%)
  const stageResult = calculateStageScore(founder.stage, funder.preferred_stages);

  // Calculate weighted contributions
  const semanticContribution = semanticResult.score * SCORE_WEIGHTS.SEMANTIC;
  const ruleContribution = ruleResult.score * SCORE_WEIGHTS.RULE;
  const stageContribution = stageResult.score * SCORE_WEIGHTS.STAGE;

  // Total score
  const totalScore = semanticContribution + ruleContribution + stageContribution;

  // Quality tier
  const qualityTier = calculateQualityTier(totalScore);

  // Build complete breakdown
  const breakdown: ScoreBreakdown = {
    semantic: {
      score: Number(semanticResult.score.toFixed(4)),
      weight: SCORE_WEIGHTS.SEMANTIC,
      contribution: Number(semanticContribution.toFixed(4)),
      reasoning: semanticResult.reasoning,
    },
    rule: {
      score: Number(ruleResult.score.toFixed(4)),
      weight: SCORE_WEIGHTS.RULE,
      contribution: Number(ruleContribution.toFixed(4)),
      breakdown: ruleResult.breakdown,
    },
    stage: {
      score: Number(stageResult.score.toFixed(4)),
      weight: SCORE_WEIGHTS.STAGE,
      contribution: Number(stageContribution.toFixed(4)),
      reasoning: stageResult.reasoning,
    },
    total_score: Number(totalScore.toFixed(4)),
    quality_tier: qualityTier,
  };

  return breakdown;
}

// ============================================================================
// Batch Matching
// ============================================================================

export interface MatchCandidate {
  funder: Funder;
  semanticScore?: number; // From pgvector query
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Score multiple funders against a single founder
 * Used after pgvector returns candidates
 */
export function scoreMatchCandidates(
  founder: Founder,
  funders: Array<{ funder: Funder; semanticScore?: number }>
): MatchCandidate[] {
  return funders.map(({ funder, semanticScore }) => ({
    funder,
    semanticScore,
    scoreBreakdown: calculateMatchScore(founder, funder, semanticScore),
  }));
}

/**
 * Filter and sort matches by score
 */
export function rankMatches(
  matches: MatchCandidate[],
  minScore: number = 0.5,
  limit: number = 10
): MatchCandidate[] {
  return matches
    .filter((match) => match.scoreBreakdown.total_score >= minScore)
    .sort((a, b) => b.scoreBreakdown.total_score - a.scoreBreakdown.total_score)
    .slice(0, limit);
}

// ============================================================================
// Validation & Helpers
// ============================================================================

/**
 * Validate that a score breakdown is mathematically correct
 */
export function validateScoreBreakdown(breakdown: ScoreBreakdown): boolean {
  const { semantic, rule, stage, total_score } = breakdown;

  // Check contributions sum to total
  const calculatedTotal = semantic.contribution + rule.contribution + stage.contribution;
  const totalDiff = Math.abs(calculatedTotal - total_score);

  if (totalDiff > 0.01) {
    console.warn(
      `Score breakdown validation failed: calculated ${calculatedTotal} vs reported ${total_score}`
    );
    return false;
  }

  // Check weights sum to 1.0
  const weightSum = semantic.weight + rule.weight + stage.weight;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(`Weight sum validation failed: ${weightSum} (expected 1.0)`);
    return false;
  }

  return true;
}

/**
 * Get match quality tier label and color for UI
 */
export function getQualityTierInfo(tier: QualityTier): {
  label: string;
  color: string;
  description: string;
} {
  const tiers = {
    Excellent: {
      label: 'Excellent',
      color: '#10B981', // green
      description: 'Exceptional fit across all dimensions',
    },
    Good: {
      label: 'Good',
      color: '#3B82F6', // blue
      description: 'Strong match with minor gaps',
    },
    Fair: {
      label: 'Fair',
      color: '#F59E0B', // amber
      description: 'Moderate fit, worth exploring',
    },
    Poor: {
      label: 'Poor',
      color: '#EF4444', // red
      description: 'Weak match, low priority',
    },
  };

  return tiers[tier];
}
