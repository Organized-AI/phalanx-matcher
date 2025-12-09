# Phalanx Matcher - Claude Code Settings

## Project Context

AI-powered founder-funder matching engine with hybrid scoring algorithm.

## Available Skills

Reference these for implementation patterns:

- `.claude/skills/supabase-pgvector.md` - Database + vector patterns
- `.claude/skills/cloudflare-hono-api.md` - API layer patterns
- `.claude/skills/hybrid-matching.md` - Matching algorithm (40/40/20)

## Available Hooks

Automation triggers:

- `.claude/hooks/pre-commit.md` - Type check before commits
- `.claude/hooks/post-build.md` - Run tests after build
- `.claude/hooks/pre-deploy.md` - Validate before deployment

## Available Commands (Subagents)

Custom commands for specialized tasks:

- `/schema-architect` - Generate SQL schemas
- `/seed-generator` - Create synthetic test data
- `/api-documenter` - Generate OpenAPI docs
- `/match-tester` - Test match quality

## Build Order

1. **Phase A**: Run `/schema-architect generate all`, then `/seed-generator founders 10` + `/seed-generator funders 5`
2. **Phase B**: Implement embeddings using `supabase-pgvector.md` patterns
3. **Phase C**: Implement matching using `hybrid-matching.md` patterns
4. **Phase D**: Build API using `cloudflare-hono-api.md` patterns, then `/api-documenter generate`
5. **Phase E**: Run `/match-tester run` to validate

## Key Directories

```
src/
├── index.ts       # Worker entry (Hono)
├── matching.ts    # Hybrid algorithm
├── embeddings.ts  # OpenAI integration
├── supabase.ts    # Database client
└── types.ts       # TypeScript interfaces

scripts/
├── migrations/    # SQL migrations
├── seeds/         # JSON seed data
└── *.ts           # Utility scripts

docs/
├── openapi.yaml   # API spec
├── INTEGRATION.md # For Jake/Paul
└── examples/      # Request/response examples
```

## Environment

Required secrets:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY

## Team

- Jordan (PM) - Matching algorithm owner
- Jake - Intake form, will webhook to /ingest/founder
- Paul - Architecture, database layer
