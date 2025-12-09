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
