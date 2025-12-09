# Phalanx Matcher - Claude Code Context

## Project Overview
AI-powered founder-funder matching engine using hybrid scoring algorithm.

## Tech Stack
- Cloudflare Workers (Hono framework)
- Supabase PostgreSQL + pgvector
- OpenAI ada-002 for embeddings
- Claude API for extraction

## Key Files
- `PLANNING/EXECUTION-PLAN.md` - Full implementation plan
- `src/index.ts` - Worker entry point
- `src/matching.ts` - Matching algorithm
- `src/embeddings.ts` - OpenAI integration
- `src/supabase.ts` - Database client

## Matching Algorithm
- 40% Semantic (pgvector cosine similarity)
- 40% Rule-based (industry, check size, geo, completeness)
- 20% Stage alignment

## Commands
```bash
# Development
npm run dev

# Deploy
npm run deploy
wrangler deploy

# Secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put OPENAI_API_KEY
```

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
