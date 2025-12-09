# Post-Build Hook

Runs after successful build to validate matching algorithm.

## Validation Steps

1. **Unit Tests** - Run matching algorithm tests
2. **Match Quality Check** - Verify synthetic data matches make sense
3. **API Contract** - Validate response shapes

## Commands

```bash
# Run all tests
npm test

# Run matching tests only
npm test -- --grep "matching"

# Run integration tests
npm run test:integration
```

## Match Quality Validation

After build, run quality check:

```typescript
// Validate top matches are sensible
const testCases = [
  {
    founder: 'healthcare_ai_seed',
    expectedTopFunder: 'horizon_ventures', // Healthcare + seed investor
  },
  {
    founder: 'climate_preseed',
    expectedTopFunder: 'climate_capital', // Climate focused
  }
];

for (const test of testCases) {
  const matches = await findMatches(test.founder);
  assert(matches[0].funder_id === test.expectedTopFunder);
}
```

## Failure Actions

If tests fail:
1. Show failing test details
2. Suggest fixes based on error type
3. Block deployment until fixed
