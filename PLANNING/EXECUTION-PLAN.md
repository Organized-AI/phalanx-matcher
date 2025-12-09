# Phalanx Matching Engine: Path B + D Hybrid Execution Plan

> **Project**: AI-Powered Founder-Funder Matching PoC  
> **Owner**: Jordan (PM)  
> **Collaborators**: Jake (Prompt AI Engineer), Paul (Architect)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHALANX MATCHING ENGINE                       │
├─────────────────────────────────────────────────────────────────────┤
│   ┌──────────────┐      ┌───────────────────┐      ┌─────────────┐  │
│   │   INTAKE     │      │  CLOUDFLARE       │      │  SUPABASE   │  │
│   │   (Jake)     │─────▶│  WORKER           │─────▶│  + pgvector │  │
│   └──────────────┘      └─────────┬─────────┘      └─────────────┘  │
│                                   │                                  │
│                         ┌─────────▼─────────┐                       │
│                         │   CLAUDE API      │                       │
│                         │   + OpenAI ada-002│                       │
│                         └───────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| API Layer | Cloudflare Workers (Hono) |
| Database | Supabase PostgreSQL |
| Vector Store | pgvector extension |
| Embeddings | OpenAI ada-002 (1536-dim) |
| AI Extraction | Claude API |

## Matching Algorithm

- **Semantic Similarity (40%)**: pgvector cosine similarity
- **Rule-Based Scoring (40%)**: industry, check size, geography, completeness
- **Stage Alignment (20%)**: exact/adjacent stage matching

## Phased Implementation

### Phase A: Foundation
- Create Supabase project + enable pgvector
- Run schema migrations (founders, funders, matches)
- Seed 10 synthetic founders, 5 synthetic funders

### Phase B: Embedding Pipeline
- Integrate OpenAI ada-002 API
- Generate embeddings for all profiles
- Store vectors in pgvector columns

### Phase C: Matching Logic
- Build semantic_score function
- Build rule_score function with breakdown
- Build stage_score function
- Create hybrid findMatches query

### Phase D: API & Demo
- Create Cloudflare Worker (Hono)
- POST /match/:founderId endpoint
- POST /ingest/founder webhook
- Simple HTML demo page

### Phase E: Integration Prep
- OpenAPI documentation
- Webhook schema for Jake's intake
- Integration guide for Paul

## Claude Code Commands

```bash
# Phase A
claude --dangerously-skip-permissions "Set up Supabase with pgvector, create founders/funders/matches schema, seed synthetic data"

# Phase B  
claude --dangerously-skip-permissions "Add OpenAI ada-002 embedding generation, batch embed all profiles"

# Phase C
claude --dangerously-skip-permissions "Implement 40/40/20 hybrid matching algorithm with explainable scores"

# Phase D
claude --dangerously-skip-permissions "Create Cloudflare Worker API with Hono, deploy and test"
```

## Success Criteria

- API response < 500ms
- Top match relevant in 8/10 tests
- All scores have human-readable reasoning
- Documented webhook for Jake's intake
