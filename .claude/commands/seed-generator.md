Generate realistic synthetic data for testing the matching algorithm.

## Your Task

Create JSON seed files with realistic founder and funder profiles for testing.

## Steps

1. Read `PLANNING/EXECUTION-PLAN.md` for the data model fields
2. Read `.claude/skills/hybrid-matching.md` for what fields affect matching
3. Generate seed files in `scripts/seeds/`:
   - `founders.json` - Array of founder profiles
   - `funders.json` - Array of funder profiles

## Founder Generation Rules

Generate diverse founders covering:
- **Industries**: healthcare, fintech, climate, edtech, creator_economy, cybersecurity, agtech, legaltech, proptech, logistics
- **Stages**: pre_seed, seed, series_a, series_b
- **Raise amounts** (realistic for stage):
  - pre_seed: $250K - $1M
  - seed: $1M - $5M  
  - series_a: $5M - $15M
  - series_b: $15M - $50M
- **Locations**: San Francisco, New York, Austin, Boston, Seattle, Los Angeles, Denver, Chicago, Miami
- **Completeness scores**: Mix of 50-100%

Each founder needs:
- Coherent problem/solution pair
- Realistic traction metrics for their stage
- Unique value proposition

## Funder Generation Rules

Generate diverse funders covering:
- **Types**: VC firms, angels, climate-focused, generalist
- **Stage preferences**: Various combinations
- **Check sizes**: Aligned with stage preferences
- **Sectors**: Various combinations (some focused, some broad)
- **Geographic focus**: Some restricted, some global (empty array)

## Test Coverage Requirements

Ensure data covers these edge cases:
- Exact stage match scenarios
- Adjacent stage match scenarios  
- Check size at boundaries
- Multi-sector overlap
- Single sector specialists
- High and low completeness profiles

## Argument Handling

- `founders [count]` - Generate N founders (default 10)
- `funders [count]` - Generate N funders (default 5)
- No argument - Generate both (10 founders, 5 funders)

Also create `scripts/seed-database.ts` to insert the data into Supabase.

Generate the seed data now.
