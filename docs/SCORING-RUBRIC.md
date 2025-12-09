# Phalanx Matching Engine: Scoring Rubric

## Overview

The Phalanx matching algorithm uses a **hybrid 40/40/20 approach** combining semantic similarity, rule-based scoring, and stage alignment to match founders with funders.

## Total Score Formula

```
total_score = (semantic_score × 0.40) + (rule_score × 0.40) + (stage_score × 0.20)
```

**Range**: 0.0 to 1.0 (higher is better)

---

## Component A: Semantic Score (40% weight)

### Calculation
- **Source**: pgvector cosine similarity between founder and funder embeddings
- **Formula**: `1 - (embedding_a <=> embedding_b)`
- **Range**: 0.0 to 1.0
  - 1.0 = identical vectors (perfect semantic alignment)
  - 0.5 = orthogonal vectors (unrelated)
  - 0.0 = opposite vectors (contradictory)

### Embedding Composition

**Founder Embedding Text**:
```
{company_description}. Industry: {industry}. Stage: {stage}.
```

**Funder Embedding Text**:
```
{investment_thesis}. {bio}.
```

### Weighted Contribution
```
semantic_contribution = semantic_score × 0.40
```

### Interpretation
- **0.90-1.00**: Near-perfect alignment in business model and investment focus
- **0.75-0.89**: Strong thematic overlap
- **0.50-0.74**: Moderate relevance
- **< 0.50**: Weak semantic connection

---

## Component B: Rule Score (40% weight)

### Formula
```
rule_score = (industry_score × 0.375) +
             (check_size_score × 0.375) +
             (geography_score × 0.125) +
             (completeness_score × 0.125)
```

### Sub-Component Weights
| Sub-Component | Weight within Rule Score | Weight of Total Score |
|---------------|-------------------------|----------------------|
| Industry Match | 37.5% | 15% |
| Check Size Alignment | 37.5% | 15% |
| Geography Match | 12.5% | 5% |
| Profile Completeness | 12.5% | 5% |

---

### B.1 Industry Score (37.5% of rule score)

**Exact Match**: 1.0
- Founder industry exactly matches one of funder's preferred industries

**Related Industry**: 0.5
- Industries are in the same category (see mapping below)

**No Match**: 0.0
- No overlap between founder industry and funder preferences

#### Industry Relationship Mapping

| Primary Industry | Related Industries |
|-----------------|-------------------|
| Fintech | Enterprise SaaS, DeepTech |
| HealthTech | DeepTech, Enterprise SaaS |
| EdTech | Enterprise SaaS, Consumer |
| Enterprise SaaS | Fintech, HealthTech, DeepTech |
| Consumer | EdTech, PropTech |
| DeepTech | Fintech, HealthTech, Cybersecurity |
| CleanTech | Enterprise SaaS, Logistics |
| PropTech | Consumer, Fintech |
| Logistics | CleanTech, Enterprise SaaS |
| Cybersecurity | DeepTech, Enterprise SaaS |

**Example**:
- Founder: Fintech → Funder prefers [Fintech, HealthTech] → Score: **1.0** (exact match)
- Founder: Fintech → Funder prefers [Enterprise SaaS] → Score: **0.5** (related)
- Founder: Fintech → Funder prefers [Consumer, PropTech] → Score: **0.0** (no match)

---

### B.2 Check Size Score (37.5% of rule score)

**Formula**:
```
check_size_score = overlap_amount / founder_range_size
```

Where:
- `overlap_amount` = amount of overlap between founder seeking range and funder check size range
- `founder_range_size` = founder.seeking_amount_max - founder.seeking_amount_min

#### Calculation Steps

1. **Find overlap**:
   ```
   overlap_min = max(founder.seeking_amount_min, funder.check_size_min)
   overlap_max = min(founder.seeking_amount_max, funder.check_size_max)
   overlap_amount = max(0, overlap_max - overlap_min)
   ```

2. **Calculate founder range**:
   ```
   founder_range = founder.seeking_amount_max - founder.seeking_amount_min
   ```

3. **Compute score**:
   ```
   score = overlap_amount / founder_range
   ```

#### Examples

**Example 1: Perfect fit**
- Founder: $500k - $1M
- Funder: $500k - $2M
- Overlap: $500k - $1M = $500k
- Founder range: $500k
- **Score: 1.0** (100% of founder's range covered)

**Example 2: Partial overlap**
- Founder: $500k - $1M
- Funder: $750k - $1.5M
- Overlap: $750k - $1M = $250k
- Founder range: $500k
- **Score: 0.5** (50% of founder's range covered)

**Example 3: No overlap**
- Founder: $500k - $1M
- Funder: $2M - $5M
- Overlap: $0
- **Score: 0.0** (no overlap)

**Example 4: Exceeds range**
- Founder: $1M - $2M
- Funder: $500k - $3M
- Overlap: $1M - $2M = $1M
- Founder range: $1M
- **Score: 1.0** (founder fully within funder range)

---

### B.3 Geography Score (12.5% of rule score)

**Match**: 1.0
- Founder's geography is in funder's geography_focus array

**No Match**: 0.0
- Founder's geography is not in funder's focus

**Missing Data**: 0.5
- Founder doesn't specify geography (benefit of doubt)

**Example**:
- Founder: "North America" → Funder focuses on ["North America", "Europe"] → **Score: 1.0**
- Founder: "Asia" → Funder focuses on ["North America", "Europe"] → **Score: 0.0**
- Founder: null → Funder focuses on ["North America"] → **Score: 0.5**

---

### B.4 Completeness Score (12.5% of rule score)

**Formula**:
```
completeness_score = filled_fields / total_scoreable_fields
```

**Total Scoreable Fields**: 9
- name (required)
- email (required)
- industry (required)
- stage (required)
- company_name
- company_description
- seeking_amount_min
- seeking_amount_max
- geography

**Example**:
- Founder filled 8/9 fields → **Score: 0.889**
- Founder filled 6/9 fields → **Score: 0.667**

---

### Weighted Rule Contribution
```
rule_contribution = rule_score × 0.40
```

---

## Component C: Stage Score (20% weight)

### Scoring Rules

**Exact Match**: 1.0
- Founder's stage is in funder's preferred_stages array

**Adjacent Stage**: 0.5
- Founder's stage is one level away from a preferred stage

**Non-Adjacent**: 0.0
- No match and not adjacent

### Stage Adjacency Matrix

| Founder Stage | Adjacent Stages |
|--------------|----------------|
| Pre-Seed | Seed |
| Seed | Pre-Seed, Series A |
| Series A | Seed, Series B+ |
| Series B+ | Series A |

### Examples

**Example 1: Exact match**
- Founder: Seed → Funder prefers [Seed, Series A] → **Score: 1.0**

**Example 2: Adjacent match**
- Founder: Pre-Seed → Funder prefers [Seed, Series A] → **Score: 0.5** (adjacent to Seed)

**Example 3: No match**
- Founder: Pre-Seed → Funder prefers [Series A, Series B+] → **Score: 0.0** (not adjacent)

### Weighted Contribution
```
stage_contribution = stage_score × 0.20
```

---

## Quality Tiers

Matches are categorized into quality tiers for UX purposes:

| Quality Tier | Total Score Range | Description |
|-------------|------------------|-------------|
| **Excellent** | 0.90 - 1.00 | Exceptional fit across all dimensions |
| **Good** | 0.75 - 0.89 | Strong match with minor gaps |
| **Fair** | 0.50 - 0.74 | Moderate fit, worth exploring |
| **Poor** | 0.00 - 0.49 | Weak match, low priority |

---

## Complete Worked Example

### Scenario: Alice (Founder) ↔ Sarah (Funder)

#### Founder Profile: Alice Chen
- **Company**: FinFlow AI
- **Description**: "AI-powered cash flow forecasting for SMBs"
- **Industry**: Fintech
- **Stage**: Seed
- **Seeking**: $500k - $1M
- **Geography**: North America
- **Completeness**: 9/9 fields filled = 1.0

#### Funder Profile: Sarah Johnson
- **Firm**: Catalyst Ventures
- **Bio**: "Former fintech founder, now investing in early-stage financial infrastructure"
- **Thesis**: "Backing technical founders building picks-and-shovels for the modern financial system"
- **Industries**: [Fintech, Enterprise SaaS]
- **Stages**: [Seed, Series A]
- **Check Size**: $500k - $2M
- **Geography**: [North America, Europe]

---

### Score Calculation

#### 1. Semantic Score
- **Cosine similarity**: 0.85 (strong thematic overlap between descriptions)
- **Contribution**: 0.85 × 0.40 = **0.34**

#### 2. Rule Score

**A. Industry (0.375 weight)**
- Fintech exactly in [Fintech, Enterprise SaaS]
- Score: 1.0
- Weighted: 1.0 × 0.375 = 0.375

**B. Check Size (0.375 weight)**
- Overlap: $500k-$1M fully within $500k-$2M
- Score: $500k / $500k = 1.0
- Weighted: 1.0 × 0.375 = 0.375

**C. Geography (0.125 weight)**
- North America in [North America, Europe]
- Score: 1.0
- Weighted: 1.0 × 0.125 = 0.125

**D. Completeness (0.125 weight)**
- 9/9 fields filled
- Score: 1.0
- Weighted: 1.0 × 0.125 = 0.125

**Rule Score Total**: 0.375 + 0.375 + 0.125 + 0.125 = **1.0**
- **Contribution**: 1.0 × 0.40 = **0.40**

#### 3. Stage Score
- Seed exactly in [Seed, Series A]
- Score: 1.0
- **Contribution**: 1.0 × 0.20 = **0.20**

---

### Final Score

```
Total Score = 0.34 + 0.40 + 0.20 = 0.94
```

**Quality Tier**: Excellent

---

### Score Breakdown JSON

```json
{
  "semantic": {
    "score": 0.85,
    "weight": 0.40,
    "contribution": 0.34,
    "reasoning": "Strong alignment in business model and investment thesis"
  },
  "rule": {
    "score": 1.0,
    "weight": 0.40,
    "contribution": 0.40,
    "breakdown": {
      "industry_match": {
        "score": 1.0,
        "weight": 0.15,
        "reasoning": "Exact match: Fintech"
      },
      "check_size": {
        "score": 1.0,
        "weight": 0.15,
        "reasoning": "Perfect fit: $500k-$1M fully within funder range $500k-$2M"
      },
      "geography": {
        "score": 1.0,
        "weight": 0.05,
        "reasoning": "North America is in funder's focus"
      },
      "completeness": {
        "score": 1.0,
        "weight": 0.05,
        "reasoning": "Profile 100% complete (9/9 fields)"
      }
    }
  },
  "stage": {
    "score": 1.0,
    "weight": 0.20,
    "contribution": 0.20,
    "reasoning": "Exact stage match: Seed"
  },
  "total_score": 0.94,
  "quality_tier": "Excellent"
}
```

---

## Edge Cases

### Missing Embeddings
- If either founder or funder lacks an embedding:
  - **Semantic score = 0.0**
  - Continue with rule and stage scoring
  - Maximum possible score: 0.60 (rule + stage only)

### Missing Amounts
- If founder doesn't specify seeking amounts:
  - **Check size score = 0.5** (neutral/benefit of doubt)
- If funder doesn't specify check size:
  - **Check size score = 1.0** (assume flexibility)

### Missing Geography
- If founder doesn't specify geography:
  - **Geography score = 0.5** (neutral)
- If funder has empty geography_focus array:
  - **Geography score = 1.0** (invest anywhere)

### Multiple Stage Matches
- If founder's stage matches multiple funder preferred stages:
  - Use highest score (exact match = 1.0)
- If founder's stage is adjacent to multiple preferred stages:
  - Still score as 0.5 (adjacent)

---

## Implementation Notes

### Score Persistence
- All scores are persisted in the `matches` table
- `score_breakdown` stored as JSONB for flexibility
- Enables retrospective analysis and A/B testing

### Score Caching
- Matches are computed once and cached
- Re-compute when:
  - Founder profile updates
  - Funder criteria changes
  - Embeddings regenerate
  - Algorithm weights adjust

### Performance Targets
- Semantic search (pgvector): < 100ms
- Rule + stage scoring: < 50ms
- Full match computation (10 funders): < 200ms
- API response (including data fetching): < 500ms

---

## Future Enhancements

1. **Dynamic Weighting**: Allow weights to be adjusted per funder
2. **Boosting**: Add bonus scores for specific criteria (e.g., warm intro, portfolio fit)
3. **Decay**: Reduce scores for stale profiles
4. **Mutual Scores**: Compute bidirectional scores (funder → founder)
5. **Ensemble**: Add ML model predictions as additional signal
6. **Personalization**: Learn from funder feedback to adjust weights

---

## References

- [pgvector Cosine Distance Documentation](https://github.com/pgvector/pgvector#vector-operators)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- Hybrid Search: [Weaviate Blog](https://weaviate.io/blog/hybrid-search-explained)
