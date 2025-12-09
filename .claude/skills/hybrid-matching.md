# Hybrid Matching Algorithm (40/40/20)

## Overview

Total Score = (Semantic × 0.4) + (Rules × 0.4) + (Stage × 0.2)

## Component 1: Semantic Similarity (40%)

Uses pgvector cosine similarity between founder and funder embeddings.

```typescript
async function calculateSemanticScore(
  founderEmbedding: number[],
  funderEmbedding: number[]
): Promise<number> {
  // Cosine similarity returns [-1, 1]
  // Normalize to [0, 100]
  const similarity = cosineSimilarity(founderEmbedding, funderEmbedding);
  return ((similarity + 1) / 2) * 100;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

## Component 2: Rule-Based Scoring (40%)

Four rules, 25 points each = 100 max.

```typescript
interface RuleBreakdown {
  industryMatch: number;      // 0 or 25
  checkSizeFit: number;       // 0, 15, or 25
  geographicMatch: number;    // 0 or 25
  completenessBonus: number;  // 0, 15, or 25
}

function calculateRuleScore(
  founder: FounderProfile,
  funder: FunderProfile
): { score: number; breakdown: RuleBreakdown } {
  const breakdown: RuleBreakdown = {
    industryMatch: 0,
    checkSizeFit: 0,
    geographicMatch: 0,
    completenessBonus: 0
  };

  // Industry Match (25 pts)
  if (funder.sectors_of_interest.includes(founder.industry_sector)) {
    breakdown.industryMatch = 25;
  }

  // Check Size Fit (25 pts full, 15 pts partial)
  const raise = founder.raise_amount;
  const min = funder.check_size_min;
  const max = funder.check_size_max;
  
  if (raise >= min && raise <= max) {
    breakdown.checkSizeFit = 25;
  } else if (raise >= min * 0.8 && raise <= max * 1.2) {
    breakdown.checkSizeFit = 15; // Within 20% tolerance
  }

  // Geographic Match (25 pts)
  if (
    funder.geographic_focus.length === 0 || // No restriction
    funder.geographic_focus.includes(founder.geographic_location)
  ) {
    breakdown.geographicMatch = 25;
  }

  // Completeness Bonus (25 pts full, 15 pts partial)
  if (founder.profile_completeness_score >= 80) {
    breakdown.completenessBonus = 25;
  } else if (founder.profile_completeness_score >= 60) {
    breakdown.completenessBonus = 15;
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}
```

## Component 3: Stage Alignment (20%)

```typescript
const STAGE_ORDER = [
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c',
  'growth'
];

function calculateStageScore(
  founderStage: string,
  funderStagePrefs: string[]
): number {
  // Exact match = 100
  if (funderStagePrefs.includes(founderStage)) {
    return 100;
  }

  // Adjacent stage = 75, Two apart = 50
  const founderIdx = STAGE_ORDER.indexOf(founderStage);
  
  for (const pref of funderStagePrefs) {
    const prefIdx = STAGE_ORDER.indexOf(pref);
    const distance = Math.abs(founderIdx - prefIdx);
    
    if (distance === 1) return 75;
    if (distance === 2) return 50;
  }

  return 0;
}
```

## Combined Hybrid Score

```typescript
interface MatchResult {
  funder_id: string;
  funder_name: string;
  firm_name: string;
  total_score: number;
  semantic_score: number;
  rule_score: number;
  stage_score: number;
  reasoning: MatchReasoning;
}

interface MatchReasoning {
  semantic: string;
  rules: RuleBreakdown;
  stage: string;
}

async function findMatches(
  founder: FounderProfile,
  funders: FunderProfile[]
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];

  for (const funder of funders) {
    const semanticScore = await calculateSemanticScore(
      founder.embedding,
      funder.embedding
    );
    
    const ruleResult = calculateRuleScore(founder, funder);
    const stageScore = calculateStageScore(
      founder.company_stage,
      funder.stage_preferences
    );

    const totalScore = 
      (semanticScore * 0.4) + 
      (ruleResult.score * 0.4) + 
      (stageScore * 0.2);

    matches.push({
      funder_id: funder.id,
      funder_name: funder.name,
      firm_name: funder.firm_name,
      total_score: Math.round(totalScore * 100) / 100,
      semantic_score: Math.round(semanticScore * 100) / 100,
      rule_score: ruleResult.score,
      stage_score: stageScore,
      reasoning: {
        semantic: generateSemanticReasoning(semanticScore),
        rules: ruleResult.breakdown,
        stage: generateStageReasoning(stageScore)
      }
    });
  }

  return matches.sort((a, b) => b.total_score - a.total_score);
}

function generateSemanticReasoning(score: number): string {
  if (score >= 80) return 'Strong thesis alignment';
  if (score >= 60) return 'Good thesis alignment';
  if (score >= 40) return 'Moderate thesis alignment';
  return 'Limited thesis alignment';
}

function generateStageReasoning(score: number): string {
  if (score === 100) return 'Exact stage match';
  if (score === 75) return 'Adjacent stage match';
  if (score === 50) return 'Two stages apart';
  return 'Stage mismatch';
}
```

## Match Quality Tiers

| Score Range | Quality | Action |
|-------------|---------|--------|
| 90-100 | Excellent | Auto-surface to funder |
| 75-89 | Good | Include in match feed |
| 50-74 | Fair | Show with lower priority |
| <50 | Poor | Don't show |
