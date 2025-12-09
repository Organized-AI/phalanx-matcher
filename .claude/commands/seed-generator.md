# /seed-generator

Generate realistic synthetic data for testing.

## Usage

```
/seed-generator <type> [count]
```

## Types

### founders
Generate founder profiles with realistic data.

```
/seed-generator founders 10
```

Output: `scripts/seeds/founders.json`

### funders
Generate funder profiles with investment criteria.

```
/seed-generator funders 5
```

Output: `scripts/seeds/funders.json`

### matches
Generate match records between existing founders/funders.

```
/seed-generator matches
```

Output: `scripts/seeds/matches.json`

## Data Quality Rules

### Founders
- Mix of industries: healthcare, fintech, climate, edtech, etc.
- Mix of stages: pre_seed, seed, series_a, series_b
- Realistic raise amounts per stage:
  - pre_seed: $250K - $1M
  - seed: $1M - $5M
  - series_a: $5M - $15M
  - series_b: $15M - $50M
- Coherent problem/solution pairs
- Realistic traction metrics for stage

### Funders
- Mix of fund types: VC, angels, family offices
- Realistic check sizes per type
- Coherent thesis + sector alignment
- Geographic diversity

### Test Coverage

Ensure synthetic data covers edge cases:
- [ ] Exact stage match
- [ ] Adjacent stage match
- [ ] No stage overlap
- [ ] Check size at boundaries
- [ ] Multiple sector overlaps
- [ ] No sector overlap
- [ ] High/low completeness scores

## Seed Script

```typescript
// scripts/seed-database.ts
import founders from './seeds/founders.json';
import funders from './seeds/funders.json';

async function seed() {
  // Insert founders
  for (const founder of founders) {
    await supabase.from('founders').insert(founder);
  }
  
  // Insert funders
  for (const funder of funders) {
    await supabase.from('funders').insert(funder);
  }
  
  console.log(`Seeded ${founders.length} founders, ${funders.length} funders`);
}
```

## Run Seeding

```bash
npx ts-node scripts/seed-database.ts
```
