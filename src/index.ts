/**
 * Phase D: Phalanx Matching Engine - Cloudflare Worker API
 * Built with Hono framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import { createSupabaseClient, getFounderById, createFounder, findSimilarFunders, getAllFunders, saveMatchesBatch, healthCheck } from './supabase';
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
 * GET /match-rules/:founderId
 * Find matching funders using ONLY rule-based scoring (no embeddings required)
 * Useful for demo/testing when OpenAI embeddings are not available
 */
app.get('/match-rules/:founderId', async (c) => {
  const founderId = c.req.param('founderId');
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const minScore = parseFloat(c.req.query('minScore') || '0.3');

  // Validation
  if (limit < 1 || limit > 50) {
    throw new HTTPException(400, { message: 'Limit must be between 1 and 50' });
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

  // Get all active funders
  const allFunders = await getAllFunders(supabase);

  if (allFunders.length === 0) {
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

  // Calculate rule-based scores only (semantic = 0)
  const candidates = scoreMatchCandidates(
    founder,
    allFunders.map((funder) => ({
      funder,
      semanticScore: 0, // No semantic score without embeddings
    }))
  );

  // Filter and rank
  const rankedMatches = rankMatches(candidates, minScore, limit);

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
      semantic_score: 0, // No semantic
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
    note: 'Rule-based matching only (semantic score disabled). Max possible score: 0.60',
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
 * GET /api
 * API information endpoint
 */
app.get('/api', (c) => {
  return c.json({
    name: 'Phalanx Matching Engine API',
    version: '0.1.0',
    description: 'AI-powered founder-funder matching with hybrid scoring',
    endpoints: {
      health: 'GET /health',
      match: 'GET /match/:founderId?limit=10&minScore=0.5&qualityTier=Good',
      matchRules: 'GET /match-rules/:founderId?limit=10&minScore=0.3',
      ingest: 'POST /ingest/founder',
    },
    algorithm: {
      semantic: '40% - pgvector cosine similarity',
      rule: '40% - industry, check size, geography, completeness',
      stage: '20% - exact/adjacent stage matching',
    },
    docs: 'https://github.com/Organized-AI/phalanx-matcher',
  });
});

/**
 * GET /
 * Root endpoint - HTML Demo UI
 */
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phalanx Matching Engine</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #00d9ff, #00ff88);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle { color: #888; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
    .card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .card h2 { font-size: 1.2rem; margin-bottom: 15px; color: #00d9ff; }
    .founder-list { list-style: none; }
    .founder-item {
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .founder-item:hover { background: rgba(0,217,255,0.1); border-color: #00d9ff; }
    .founder-item.selected { background: rgba(0,217,255,0.2); border-color: #00d9ff; }
    .founder-name { font-weight: 600; }
    .founder-company { color: #888; font-size: 0.9rem; }
    .founder-meta { display: flex; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
    .tag { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); }
    .tag.industry { background: rgba(0,217,255,0.2); color: #00d9ff; }
    .tag.stage { background: rgba(0,255,136,0.2); color: #00ff88; }
    .matches-container { min-height: 400px; }
    .match-card {
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
      border-left: 4px solid #00ff88;
    }
    .match-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .match-name { font-weight: 600; font-size: 1.1rem; }
    .match-firm { color: #888; }
    .match-score { font-size: 1.5rem; font-weight: 700; color: #00ff88; }
    .match-bio { color: #aaa; margin: 10px 0; font-size: 0.9rem; }
    .score-breakdown { display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
    .score-item { text-align: center; }
    .score-label { font-size: 0.75rem; color: #666; }
    .score-value { font-weight: 600; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .empty { text-align: center; padding: 40px; color: #666; }
    .algorithm-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
    .algo-item { text-align: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .algo-percent { font-size: 1.5rem; font-weight: 700; color: #00d9ff; }
    .algo-label { font-size: 0.8rem; color: #888; }
    .status { padding: 10px; border-radius: 8px; margin-bottom: 20px; }
    .status.ok { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; }
    .status.error { background: rgba(255,0,0,0.1); border: 1px solid #ff4444; }
    .quality-excellent { border-left-color: #00ff88; }
    .quality-good { border-left-color: #00d9ff; }
    .quality-fair { border-left-color: #ffaa00; }
    .quality-poor { border-left-color: #ff4444; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Phalanx Matching Engine</h1>
    <p class="subtitle">AI-powered founder-funder matching with hybrid scoring</p>
    <div id="status" class="status ok">Checking API status...</div>
    <div class="grid">
      <div class="card">
        <h2>Founders</h2>
        <ul id="founders" class="founder-list"><li class="loading">Loading founders...</li></ul>
      </div>
      <div class="card">
        <h2>Matching Funders</h2>
        <div id="matches" class="matches-container"><div class="empty">Select a founder to see matches</div></div>
        <div class="algorithm-info">
          <div class="algo-item"><div class="algo-percent">40%</div><div class="algo-label">Semantic</div></div>
          <div class="algo-item"><div class="algo-percent">40%</div><div class="algo-label">Rule-based</div></div>
          <div class="algo-item"><div class="algo-percent">20%</div><div class="algo-label">Stage</div></div>
        </div>
      </div>
    </div>
  </div>
  <script>
    const API_BASE = '';
    const SUPABASE_URL = 'https://pdaycgrzvltucagmvwzv.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkYXljZ3J6dmx0dWNhZ212d3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDkwMDAsImV4cCI6MjA4MDg4NTAwMH0.R2TjSDe0sgv6sLdGCP3HuqEUxRSfjMwY1A7POjXZ7bI';

    async function checkHealth() {
      try {
        const res = await fetch(API_BASE + '/health');
        const data = await res.json();
        const statusEl = document.getElementById('status');
        if (data.status === 'ok') {
          statusEl.className = 'status ok';
          statusEl.textContent = 'API Status: OK | Version: ' + data.version + ' | Environment: ' + data.environment;
        } else {
          statusEl.className = 'status error';
          statusEl.textContent = 'API Status: ' + data.status;
        }
      } catch (e) {
        document.getElementById('status').className = 'status error';
        document.getElementById('status').textContent = 'API Connection Failed';
      }
    }

    async function loadFounders() {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/founders?select=id,name,company_name,industry,stage&order=name', {
          headers: { 'apikey': SUPABASE_KEY }
        });
        const founders = await res.json();
        const list = document.getElementById('founders');
        if (!founders.length) {
          list.innerHTML = '<li class="empty">No founders found. Run seed script.</li>';
          return;
        }
        list.innerHTML = founders.map(function(f) {
          return '<li class="founder-item" data-id="' + f.id + '" onclick="selectFounder(\\'' + f.id + '\\', this)">' +
            '<div class="founder-name">' + f.name + '</div>' +
            '<div class="founder-company">' + f.company_name + '</div>' +
            '<div class="founder-meta">' +
            '<span class="tag industry">' + f.industry + '</span>' +
            '<span class="tag stage">' + f.stage + '</span>' +
            '</div></li>';
        }).join('');
      } catch (e) {
        document.getElementById('founders').innerHTML = '<li class="empty">Failed to load founders</li>';
      }
    }

    async function selectFounder(id, el) {
      document.querySelectorAll('.founder-item').forEach(function(item) { item.classList.remove('selected'); });
      el.classList.add('selected');
      var matchesEl = document.getElementById('matches');
      matchesEl.innerHTML = '<div class="loading">Finding matches...</div>';
      try {
        var res = await fetch(API_BASE + '/match-rules/' + id + '?limit=5');
        var data = await res.json();
        if (!data.matches || !data.matches.length) {
          matchesEl.innerHTML = '<div class="empty">No matches found</div>';
          return;
        }
        matchesEl.innerHTML = data.matches.map(function(m) {
          var tier = m.scores.quality_tier ? m.scores.quality_tier.toLowerCase() : 'fair';
          return '<div class="match-card quality-' + tier + '">' +
            '<div class="match-header"><div>' +
            '<div class="match-name">' + m.funder.name + '</div>' +
            '<div class="match-firm">' + m.funder.firm_name + '</div>' +
            '</div><div class="match-score">' + Math.round(m.scores.total_score * 100) + '%</div></div>' +
            '<div class="match-bio">' + m.funder.bio + '</div>' +
            '<div class="score-breakdown">' +
            '<div class="score-item"><div class="score-label">Rule Score</div><div class="score-value">' + Math.round(m.scores.rule_score * 100) + '%</div></div>' +
            '<div class="score-item"><div class="score-label">Stage Score</div><div class="score-value">' + Math.round(m.scores.stage_score * 100) + '%</div></div>' +
            '<div class="score-item"><div class="score-label">Quality</div><div class="score-value">' + m.scores.quality_tier + '</div></div>' +
            '</div></div>';
        }).join('');
      } catch (e) {
        matchesEl.innerHTML = '<div class="empty">Failed to load matches: ' + e.message + '</div>';
      }
    }

    checkHealth();
    loadFounders();
  </script>
</body>
</html>`;
  return c.html(html);
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
