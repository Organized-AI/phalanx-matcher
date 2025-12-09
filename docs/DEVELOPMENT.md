# Development Setup Guide

Complete guide to set up and run the Phalanx Matching Engine locally.

## Prerequisites

### Required Software
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **PostgreSQL client** (for running migrations)
  - macOS: `brew install postgresql`
  - Ubuntu/Debian: `sudo apt-get install postgresql-client`
  - Windows: [Download from postgresql.org](https://www.postgresql.org/download/windows/)

### Required Accounts
- **Supabase** account ([sign up](https://supabase.com))
- **OpenAI** API key ([get key](https://platform.openai.com/api-keys))
- **Cloudflare** account (for deployment) ([sign up](https://dash.cloudflare.com/sign-up))

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cp .env.example .dev.vars
# Edit .dev.vars with your credentials

# 3. Run migrations
npm run migrate

# 4. Seed database
npm run seed

# 5. Start dev server
npm run dev
```

---

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd phalanx-matcher
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in project details:
   - Name: `phalanx-matcher-dev`
   - Database Password: (generate strong password)
   - Region: Choose closest to you
4. Wait 2-3 minutes for project creation
5. Once ready, go to **Settings → API**
6. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)
   - **service_role key** (starts with `eyJhbGc...`, keep secret!)

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Navigate to **API Keys** section
3. Click **"Create new secret key"**
4. Name it: `phalanx-matcher-dev`
5. Copy the key (starts with `sk-...`)
6. **Important**: Save it now, you won't see it again!

### 4. Configure Environment

Create `.dev.vars` file in project root:

```bash
cp .env.example .dev.vars
```

Edit `.dev.vars` with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key...

# OpenAI Configuration
OPENAI_API_KEY=sk-...your-api-key...

# Environment
ENVIRONMENT=development
```

**Security Note**: `.dev.vars` is gitignored and should NEVER be committed.

### 5. Run Database Migrations

This creates the schema (tables, indexes, functions) in Supabase:

```bash
npm run migrate
```

**Expected Output**:
```
🚀 Starting Supabase migrations...
📍 Target: https://xxxxx.supabase.co

Found 7 migration files

📝 Running migration: 001_enable_pgvector.sql
✅ Successfully applied: 001_enable_pgvector.sql

📝 Running migration: 002_create_founders_table.sql
✅ Successfully applied: 002_create_founders_table.sql

...

🎉 All migrations completed successfully!
```

**Troubleshooting**:
- If `psql` command not found: Install PostgreSQL client (see Prerequisites)
- If connection fails: Check SUPABASE_URL and SUPABASE_SERVICE_KEY
- If migration fails: Check Supabase dashboard for error details

### 6. Seed Database with Test Data

This inserts 10 founders and 5 funders with embeddings:

```bash
npm run seed
```

**Expected Output**:
```
🚀 Phalanx Matching Engine - Database Seeding
═══════════════════════════════════════════════

📊 Seeding founders...
─────────────────────────────────────────────

👤 Processing: Alice Chen (FinFlow AI)
   Generating embedding for: "AI-powered cash flow forecasting..."
   ✓ Generated 1536-dim embedding (45 tokens)
   ✅ Successfully inserted: Alice Chen

...

✅ Founders seeding complete: 10/10 succeeded
📈 Total tokens used: 428

💼 Seeding funders...
...

🎉 Success! Database is ready for matching.
```

**Note**: This will use ~500 OpenAI tokens (~$0.0001)

### 7. Verify Setup

Check Supabase dashboard:

1. Go to **Table Editor** in Supabase
2. You should see:
   - `founders` table with 10 rows
   - `funders` table with 5 rows
   - `matches` table (empty initially)
3. Click on a founder row and verify `embedding` column is filled

### 8. Start Development Server

```bash
npm run dev
```

**Expected Output**:
```
⛅️ wrangler 3.22.0
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### 9. Test the API

**Health Check**:
```bash
curl http://localhost:8787/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "0.1.0",
  "environment": "development"
}
```

**Get a Founder ID**:
```bash
# Option 1: From Supabase dashboard (Table Editor → founders → copy id)

# Option 2: Via curl
curl "http://localhost:8787/founders" | jq '.[0].id'
```

**Test Matching**:
```bash
# Replace with actual founder ID
curl "http://localhost:8787/match/550e8400-e29b-41d4-a716-446655440000"
```

Response:
```json
{
  "founder": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Chen",
    "company_name": "FinFlow AI"
  },
  "matches": [
    {
      "funder": {
        "id": "...",
        "name": "Sarah Johnson",
        "firm_name": "Catalyst Ventures"
      },
      "scores": {
        "total_score": 0.94,
        "semantic_score": 0.85,
        "rule_score": 1.0,
        "stage_score": 1.0,
        "quality_tier": "Excellent"
      },
      "reasoning": { ... }
    }
  ],
  "total_results": 5,
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

## Development Workflow

### Making Code Changes

1. Edit files in `src/`
2. Wrangler automatically reloads (watch mode)
3. Test changes via `curl` or browser
4. Check console for errors

### Updating Database Schema

1. Create new migration file in `scripts/migrations/`
2. Name it with next number: `008_add_new_column.sql`
3. Run: `npm run migrate`

### Adding More Seed Data

1. Edit `scripts/seeds/founders.json` or `funders.json`
2. Run: `npm run seed`
3. It will skip existing records (based on email)

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npx tsc --noEmit
```

---

## Project Structure

```
phalanx-matcher/
├── src/                      # Source code
│   ├── index.ts             # Worker entry point
│   ├── types.ts             # TypeScript types
│   ├── matching.ts          # Matching algorithm (Phase C)
│   ├── embeddings.ts        # OpenAI integration (Phase B)
│   └── supabase.ts          # Database client
├── scripts/
│   ├── migrations/          # SQL migration files
│   │   ├── 001_enable_pgvector.sql
│   │   └── ...
│   ├── seeds/               # Seed data
│   │   ├── founders.json
│   │   └── funders.json
│   ├── run-migrations.sh    # Migration runner
│   └── seed-database.ts     # Seeding script
├── docs/
│   ├── SCORING-RUBRIC.md    # Algorithm documentation
│   ├── openapi.yaml         # API specification
│   └── DEVELOPMENT.md       # This file
├── tests/                    # Test files
├── .dev.vars                # Local secrets (gitignored)
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
├── wrangler.toml            # Cloudflare config
└── README.md
```

---

## Common Tasks

### View Database Records

Using Supabase Dashboard:
1. Go to **Table Editor**
2. Select table (founders, funders, matches)
3. Browse, search, edit directly

Using SQL Editor (Supabase):
```sql
-- Count records
SELECT COUNT(*) FROM founders;
SELECT COUNT(*) FROM funders;

-- View sample founders
SELECT id, name, company_name, industry, stage
FROM founders
LIMIT 10;

-- Check embedding dimensions
SELECT id, name, array_length(embedding, 1) as dim
FROM founders
WHERE embedding IS NOT NULL;

-- Find matches for a founder
SELECT * FROM find_matching_funders(
  'founder-uuid-here',
  5  -- limit
);
```

### Reset Database

**Option 1: Drop and recreate tables**:
```sql
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS funders CASCADE;
DROP TABLE IF EXISTS founders CASCADE;
```
Then run `npm run migrate` again.

**Option 2: Delete all data**:
```sql
TRUNCATE founders, funders, matches CASCADE;
```
Then run `npm run seed` again.

### Check OpenAI Token Usage

```bash
# View recent API usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Update Dependencies

```bash
npm update
npm outdated  # Check for newer versions
```

---

## Deployment

### Production Deployment

1. **Set Production Secrets**:
```bash
wrangler secret put SUPABASE_URL
# Paste production Supabase URL

wrangler secret put SUPABASE_ANON_KEY
# Paste production anon key

wrangler secret put OPENAI_API_KEY
# Paste OpenAI API key
```

2. **Deploy**:
```bash
npm run deploy
```

3. **Test Production**:
```bash
curl https://phalanx-matcher.workers.dev/health
```

### Environment-Specific Configuration

For staging environment, update `wrangler.toml`:

```toml
[env.staging]
name = "phalanx-matcher-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "phalanx-matcher"
vars = { ENVIRONMENT = "production" }
```

Deploy to staging:
```bash
wrangler deploy --env staging
```

---

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Wrangler doesn't start

```bash
# Check Node version (must be 18+)
node --version

# Reinstall wrangler
npm install -D wrangler@latest
```

### Migrations fail with permission errors

Make sure you're using `SUPABASE_SERVICE_KEY`, not `SUPABASE_ANON_KEY` for migrations.

### Embeddings not generating

Check OpenAI API key is valid:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Slow query performance

Vector indexes need tuning as data grows. Update `lists` parameter in `005_create_vector_indexes.sql`:
- 1-100 profiles: lists = 10
- 100-1000 profiles: lists = 30
- 1000-10000 profiles: lists = 50

Then recreate indexes:
```sql
DROP INDEX founders_embedding_idx;
DROP INDEX funders_embedding_idx;
-- Re-run migration 005
```

---

## Performance Targets

- **API Response Time**: < 500ms (p95)
- **Semantic Search**: < 100ms
- **Rule + Stage Scoring**: < 50ms
- **Full Match (10 funders)**: < 200ms

Monitor via Cloudflare Workers Analytics dashboard.

---

## Next Steps

After setup is complete:

1. **Phase B**: Implement OpenAI embedding pipeline (`src/embeddings.ts`)
2. **Phase C**: Build matching algorithm (`src/matching.ts`)
3. **Phase D**: Create API endpoints (`src/index.ts`, routes)
4. **Phase E**: Integration documentation for team

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourorg/phalanx-matcher/issues)
- **Docs**: [Full Documentation](./README.md)
- **API Spec**: [OpenAPI](./openapi.yaml)
- **Scoring**: [Scoring Rubric](./SCORING-RUBRIC.md)

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
