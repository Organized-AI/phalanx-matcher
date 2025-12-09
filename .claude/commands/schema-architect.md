Generate SQL schema migrations for Phalanx.

## Your Task

Based on the specifications in `PLANNING/EXECUTION-PLAN.md`, generate SQL migration files for Supabase with pgvector.

## Steps

1. Read `PLANNING/EXECUTION-PLAN.md` for the data models (founders, funders, matches)
2. Read `.claude/skills/supabase-pgvector.md` for pgvector patterns
3. Create migration files in `scripts/migrations/`:
   - `001_enable_extensions.sql` - Enable pgvector
   - `002_create_founders.sql` - Founders table with vector column
   - `003_create_funders.sql` - Funders table with vector column
   - `004_create_matches.sql` - Matches table with computed score
   - `005_create_functions.sql` - Cosine similarity and match functions
   - `006_create_indexes.sql` - IVFFlat indexes for vectors
   - `007_enable_rls.sql` - Row level security policies

## Requirements

- Use UUID primary keys with `gen_random_uuid()`
- Vector columns: `vector(1536)` for OpenAI ada-002
- Include `created_at` and `updated_at` timestamps
- Add appropriate CHECK constraints
- Include comments explaining complex columns

## Argument Handling

If argument is provided:
- `all` - Generate all migrations
- `founders` - Only founders table
- `funders` - Only funders table
- `matches` - Only matches table
- `functions` - Only SQL functions

Generate the migrations now.
