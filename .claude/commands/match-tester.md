# /match-tester

Test and validate match quality.

## Usage

```
/match-tester [action]
```

## Actions

### run
Run all match quality tests.

```
/match-tester run
```

### benchmark
Benchmark matching performance.

```
/match-tester benchmark
```

### analyze
Analyze match distribution.

```
/match-tester analyze
```

### coverage
Check test coverage of edge cases.

```
/match-tester coverage
```

## Test Cases

### Exact Match Tests
Verify perfect matches score highest.

```typescript
test('healthcare founder matches healthcare VC', async () => {
  const founder = getFounder('medisync_ai'); // healthcare, seed
  const matches = await findMatches(founder.id);
  
  // Horizon Ventures: healthcare + seed investor
  expect(matches[0].firm_name).toBe('Horizon Ventures');
  expect(matches[0].total_score).toBeGreaterThan(85);
});
```

### Stage Alignment Tests

```typescript
test('seed founder ranks seed VCs higher than series_b VCs', async () => {
  const founder = getFounder('seed_stage_founder');
  const matches = await findMatches(founder.id);
  
  const seedVCRank = matches.findIndex(m => m.stage_prefs.includes('seed'));
  const seriesBRank = matches.findIndex(m => m.stage_prefs.includes('series_b'));
  
  expect(seedVCRank).toBeLessThan(seriesBRank);
});
```

### Check Size Tests

```typescript
test('$2M raise matches $1-5M check size, not $10-20M', async () => {
  const founder = getFounder('two_million_raise');
  const matches = await findMatches(founder.id);
  
  const topMatch = matches[0];
  expect(topMatch.check_size_min).toBeLessThanOrEqual(2000000);
  expect(topMatch.check_size_max).toBeGreaterThanOrEqual(2000000);
});
```

### Edge Cases

```typescript
test('low completeness founder still gets matches but lower scores', async () => {
  const founder = getFounder('incomplete_profile'); // 50% complete
  const matches = await findMatches(founder.id);
  
  expect(matches.length).toBeGreaterThan(0);
  expect(matches[0].reasoning.rules.completenessBonus).toBe(0);
});

test('no geographic restriction matches all locations', async () => {
  const funder = getFunder('global_investor'); // empty geographic_focus
  // Should match founders from any location
});
```

## Benchmark Metrics

```typescript
interface BenchmarkResult {
  totalFounders: number;
  totalFunders: number;
  avgMatchTime: number;  // ms
  p95MatchTime: number;  // ms
  avgMatchesPerFounder: number;
  scoreDistribution: {
    excellent: number;  // 90+
    good: number;       // 75-89
    fair: number;       // 50-74
    poor: number;       // <50
  };
}
```

## Analysis Output

```
Match Quality Report
====================

Total Matches Generated: 50
Average Score: 72.3

Score Distribution:
  Excellent (90+): 8 (16%)
  Good (75-89): 22 (44%)
  Fair (50-74): 15 (30%)
  Poor (<50): 5 (10%)

Component Contributions:
  Semantic avg: 68.5
  Rules avg: 75.2
  Stage avg: 82.0

Edge Cases Covered:
  ✓ Exact stage match
  ✓ Adjacent stage match
  ✓ Check size boundaries
  ✓ Multi-sector overlap
  ✗ No sector overlap (need more test data)
```

## Run Tests

```bash
# Unit tests
npm test

# Match quality tests
npm run test:matches

# Benchmark
npm run benchmark
```
