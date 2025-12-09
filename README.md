# Phalanx Matching Engine

AI-powered founder-funder matching system using hybrid scoring algorithm.

## Quick Start

```bash
claude --dangerously-skip-permissions
```

See `PLANNING/EXECUTION-PLAN.md` for full implementation details.

## Architecture

- **API Layer**: Cloudflare Workers (Hono framework)
- **Database**: Supabase PostgreSQL + pgvector
- **Embeddings**: OpenAI ada-002
- **Matching**: 40% semantic + 40% rules + 20% stage alignment

## Team

- **Jordan** - PM, Matching Algorithm (Phase 4)
- **Jake** - Prompt AI Engineer, Intake (Phase 1, 3, 5)
- **Paul** - Architect, Data Extraction (Phase 2)
