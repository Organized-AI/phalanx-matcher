/**
 * Phase D: Phalanx Matching Engine - Cloudflare Worker API
 * Built with Hono framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import { createSupabaseClient, getFounderById, createFounder, findSimilarFunders, saveMatchesBatch, healthCheck } from './supabase';
import { createEmbeddingClient, embedFounderProfile } from './embeddings';
import { scoreMatchCandidates, rankMatches } from './matching';
import { calculateProfileCompleteness } from './types';

import type { Env, FounderProfileInput, MatchResponse, MatchResult, HealthResponse, ErrorResponse } from './types';

// ============================================================================
// App Initialization
// ============================================================================

const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// Middleware
// ============================================================================

// CORS
app.use('/*', cors({
  origin: '*', // In production, restrict to specific domains
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Logging
app.use('/*', logger());

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    const errorResponse: ErrorResponse = {
      error: err.name,
      message: err.message,
      status: err.status,
    };
    return c.json(errorResponse, err.status);
  }

  const errorResponse: ErrorResponse = {
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    status: 500,
  };
  return c.json(errorResponse, 500);
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (c) => {
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_ANON_KEY || c.env.SUPABASE_SERVICE_KEY
  );

  const dbHealthy = await healthCheck(supabase);

  const response: HealthResponse = {
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: c.env.ENVIRONMENT || 'production',
  };

  return c.json(response, dbHealthy ? 200 : 503);
});

/**
 * GET /match/:founderId
 * Find matching funders for a founder
 */
app.get('/match/:founderId', async (c) => {
  const founderId = c.req.param('founderId');
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const minScore = parseFloat(c.req.query('minScore') || '0.5');
  const qualityTier = c.req.query('qualityTier');

  // Validation
  if (limit < 1 || limit > 50) {
    throw new HTTPException(400, { message: 'Limit must be between 1 and 50' });
  }
  if (minScore < 0 || minScore > 1) {
    throw new HTTPException(400, { message: 'minScore must be between 0.0 and 1.0' });
  }

  // Initialize clients
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY || c.env.SUPABASE_ANON_KEY
  );

  // Get founder
  const founder = await getFounderById(supabase, founderId);
  if (!founder) {
    throw new HTTPException(404, { message: `Founder with ID ${founderId} not found` });
  }

  // Check if founder has embedding
  if (!founder.embedding) {
    throw new HTTPException(400, {
      message: 'Founder profile does not have an embedding. Please regenerate embedding.',
    });
  }

  // Find similar funders using pgvector
  const similarFunders = await findSimilarFunders(supabase, founderId, limit * 2); // Get 2x for filtering

  if (similarFunders.length === 0) {
    const response: MatchResponse = {
      founder: {
        id: founder.id,
        name: founder.name,
        company_name: founder.company_name,
      },
      matches: [],
      total_results: 0,
      generated_at: new Date().toISOString(),
    };
    return c.json(response);
  }

  // Calculate hybrid scores
  const candidates = scoreMatchCandidates(
    founder,
    similarFunders.map((sf) => ({
      funder: sf.funder,
      semanticScore: sf.semantic_score,
    }))
  );

  // Filter and rank
  let rankedMatches = rankMatches(candidates, minScore, limit);

  // Filter by quality tier if specified
  if (qualityTier) {
    rankedMatches = rankedMatches.filter(
      (m) => m.scoreBreakdown.quality_tier === qualityTier
    );
  }

  // Save matches to database (async, don't block response)
  const matchesToSave = rankedMatches.map((m) => ({
    founderId: founder.id,
    funderId: m.funder.id,
    scoreBreakdown: m.scoreBreakdown,
  }));

  // Fire and forget - don't await
  saveMatchesBatch(supabase, matchesToSave).catch((err) => {
    console.error('Failed to save matches:', err);
  });

  // Format response
  const matches: MatchResult[] = rankedMatches.map((m) => ({
    funder: {
      id: m.funder.id,
      name: m.funder.name,
      firm_name: m.funder.firm_name,
      bio: m.funder.bio,
    },
    scores: {
      total_score: m.scoreBreakdown.total_score,
      semantic_score: m.scoreBreakdown.semantic.score,
      rule_score: m.scoreBreakdown.rule.score,
      stage_score: m.scoreBreakdown.stage.score,
      quality_tier: m.scoreBreakdown.quality_tier,
    },
    reasoning: m.scoreBreakdown,
  }));

  const response: MatchResponse = {
    founder: {
      id: founder.id,
      name: founder.name,
      company_name: founder.company_name,
    },
    matches,
    total_results: matches.length,
    generated_at: new Date().toISOString(),
  };

  return c.json(response);
});

/**
 * POST /ingest/founder
 * Ingest new founder profile (webhook endpoint)
 */
app.post('/ingest/founder', async (c) => {
  const body = await c.req.json<FounderProfileInput>();

  // Validation
  if (!body.name || !body.email || !body.industry || !body.stage) {
    throw new HTTPException(400, {
      message: 'Missing required fields: name, email, industry, stage',
    });
  }

  // Initialize clients
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY || c.env.SUPABASE_ANON_KEY
  );

  const openai = createEmbeddingClient(c.env.OPENAI_API_KEY);

  // Calculate profile completeness
  const completeness = calculateProfileCompleteness({
    ...body,
    id: '', // placeholder
    created_at: '',
    updated_at: '',
    is_active: true,
    profile_completeness: 0,
  });

  // Generate embedding
  let embedding: number[] | undefined;
  let embeddingText: string | undefined;
  let embeddingGenerated = false;

  try {
    const embeddingResult = await embedFounderProfile(openai, body);
    embedding = embeddingResult.embedding;
    embeddingText = embeddingResult.embedding_text;
    embeddingGenerated = true;
  } catch (error: any) {
    console.error('Failed to generate embedding:', error);
    // Continue without embedding - can be regenerated later
  }

  // Create founder in database
  try {
    const newFounder = await createFounder(supabase, {
      name: body.name,
      email: body.email,
      company_name: body.company_name,
      company_description: body.company_description,
      industry: body.industry,
      stage: body.stage,
      seeking_amount_min: body.seeking_amount_min,
      seeking_amount_max: body.seeking_amount_max,
      geography: body.geography,
      embedding,
      embedding_text: embeddingText,
      profile_completeness: completeness,
      is_active: true,
    });

    return c.json(
      {
        id: newFounder.id,
        embedding_generated: embeddingGenerated,
        profile_completeness: completeness,
        created_at: newFounder.created_at,
      },
      201
    );
  } catch (error: any) {
    // Check for duplicate email
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new HTTPException(409, {
        message: `Founder with email ${body.email} already exists`,
      });
    }
    throw new HTTPException(500, { message: `Failed to create founder: ${error.message}` });
  }
});

/**
 * GET /
 * Root endpoint - API information
 */
app.get('/', (c) => {
  return c.json({
    name: 'Phalanx Matching Engine API',
    version: '0.1.0',
    description: 'AI-powered founder-funder matching with hybrid scoring',
    endpoints: {
      health: 'GET /health',
      match: 'GET /match/:founderId?limit=10&minScore=0.5&qualityTier=Good',
      ingest: 'POST /ingest/founder',
    },
    algorithm: {
      semantic: '40% - pgvector cosine similarity',
      rule: '40% - industry, check size, geography, completeness',
      stage: '20% - exact/adjacent stage matching',
    },
    docs: 'https://github.com/yourorg/phalanx-matcher/blob/main/docs/openapi.yaml',
  });
});

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) => {
  const errorResponse: ErrorResponse = {
    error: 'NotFound',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    status: 404,
  };
  return c.json(errorResponse, 404);
});

// ============================================================================
// Export
// ============================================================================

export default app;
