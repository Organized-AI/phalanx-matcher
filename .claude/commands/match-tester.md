Test and validate the matching algorithm quality.

## Your Task

Create and run tests to validate the hybrid matching algorithm produces sensible results.

## Steps

1. Read `.claude/skills/hybrid-matching.md` for algorithm details
2. Read `scripts/seeds/founders.json` and `scripts/seeds/funders.json` for test data
3. Create test files in `tests/`:
   - `matching.test.ts` - Unit tests for scoring functions
   - `integration.test.ts` - End-to-end matching tests
   - `quality.test.ts` - Match quality validation

## Test Categories

### Unit Tests (matching.test.ts)
- `calculateSemanticScore` returns 0-100
- `calculateRuleScore` breakdown adds up correctly
- `calculateStageScore` handles all stage combinations
- Total score weighted correctly (40/40/20)

### Integration Tests (integration.test.ts)
- API returns matches for valid founder ID
- API handles invalid founder ID
- Matches are sorted by total_score descending
- Response includes reasoning for each match

### Quality Tests (quality.test.ts)
Test that matches make business sense:

```typescript
// Healthcare founder should match healthcare VC
test('healthcare founder matches healthcare investor first')

// Seed founder should rank seed VCs higher  
test('seed founder prefers seed-stage investors')

// $2M raise should match $1-5M check size
test('raise amount matches appropriate check sizes')

// High completeness gets bonus points
test('complete profiles score higher than incomplete')
```

## Quality Metrics to Report

After running tests, output:
- Total matches generated
- Score distribution (excellent/good/fair/poor)
- Average component scores (semantic/rules/stage)
- Edge cases covered vs missing

## Argument Handling

- `run` - Run all tests
- `unit` - Run unit tests only
- `integration` - Run integration tests only  
- `quality` - Run quality validation only
- `benchmark` - Run performance benchmarks
- `analyze` - Analyze match distribution

Create the test files and run them now.
