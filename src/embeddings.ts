/**
 * Phase B: OpenAI Embedding Pipeline
 * Handles embedding generation with retry logic and rate limiting
 */

import OpenAI from 'openai';
import type { Founder, Funder, EmbeddingRequest, EmbeddingResponse } from './types';

// ============================================================================
// Configuration
// ============================================================================

const EMBEDDING_MODEL = 'text-embedding-ada-002';
const EMBEDDING_DIMENSION = 1536;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// OpenAI Client Initialization
// ============================================================================

export function createEmbeddingClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    maxRetries: MAX_RETRIES,
    timeout: 30000, // 30 seconds
  });
}

// ============================================================================
// Embedding Text Generation
// ============================================================================

/**
 * Generate embeddable text from founder profile
 * Format: "{description}. Industry: {industry}. Stage: {stage}."
 */
export function generateFounderEmbeddingText(founder: Partial<Founder>): string {
  const parts: string[] = [];

  // Primary description
  if (founder.company_description) {
    parts.push(founder.company_description);
  } else if (founder.company_name) {
    parts.push(founder.company_name);
  }

  // Industry context
  if (founder.industry) {
    parts.push(`Industry: ${founder.industry}`);
  }

  // Stage context
  if (founder.stage) {
    parts.push(`Stage: ${founder.stage}`);
  }

  // Fundraising context
  if (founder.seeking_amount_min && founder.seeking_amount_max) {
    parts.push(
      `Seeking: $${founder.seeking_amount_min}k-$${founder.seeking_amount_max}k`
    );
  }

  return parts.join('. ') + '.';
}

/**
 * Generate embeddable text from funder profile
 * Format: "{thesis}. {bio}. Focus: {industries}."
 */
export function generateFunderEmbeddingText(funder: Partial<Funder>): string {
  const parts: string[] = [];

  // Investment thesis (primary signal)
  if (funder.investment_thesis) {
    parts.push(funder.investment_thesis);
  }

  // Bio/background
  if (funder.bio) {
    parts.push(funder.bio);
  }

  // Industry focus
  if (funder.preferred_industries && funder.preferred_industries.length > 0) {
    parts.push(`Focus: ${funder.preferred_industries.join(', ')}`);
  }

  // Stage focus
  if (funder.preferred_stages && funder.preferred_stages.length > 0) {
    parts.push(`Stages: ${funder.preferred_stages.join(', ')}`);
  }

  return parts.join('. ') + '.';
}

// ============================================================================
// Single Embedding Generation
// ============================================================================

/**
 * Generate embedding for a single text string
 * Includes retry logic with exponential backoff
 */
export async function generateEmbedding(
  client: OpenAI,
  text: string
): Promise<EmbeddingResponse> {
  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error('Embedding text cannot be empty');
  }

  // Truncate if too long (max ~8000 tokens for ada-002)
  const truncatedText = text.slice(0, 32000); // ~8k tokens max

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedText,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;

    // Verify dimension
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    return {
      embedding,
      tokens_used: response.usage.total_tokens,
    };
  } catch (error: any) {
    // Enhanced error handling
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    }
    throw new Error(`OpenAI embedding generation failed: ${error.message}`);
  }
}

// ============================================================================
// Batch Embedding Generation
// ============================================================================

interface BatchEmbeddingResult {
  embeddings: number[][];
  texts: string[];
  total_tokens: number;
  success_count: number;
  error_count: number;
  errors: Array<{ index: number; text: string; error: string }>;
}

/**
 * Generate embeddings for multiple texts in batch
 * Processes in chunks to avoid rate limits
 */
export async function generateEmbeddingBatch(
  client: OpenAI,
  texts: string[],
  chunkSize: number = 10
): Promise<BatchEmbeddingResult> {
  const result: BatchEmbeddingResult = {
    embeddings: [],
    texts: [],
    total_tokens: 0,
    success_count: 0,
    error_count: 0,
    errors: [],
  };

  // Process in chunks
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);

    // Process chunk sequentially to avoid rate limits
    for (let j = 0; j < chunk.length; j++) {
      const text = chunk[j];
      const globalIndex = i + j;

      try {
        const { embedding, tokens_used } = await generateEmbedding(client, text);
        result.embeddings.push(embedding);
        result.texts.push(text);
        result.total_tokens += tokens_used;
        result.success_count++;
      } catch (error: any) {
        result.error_count++;
        result.errors.push({
          index: globalIndex,
          text: text.slice(0, 100) + '...',
          error: error.message,
        });
        // Push null placeholder to maintain index alignment
        result.embeddings.push([]);
      }

      // Rate limiting: small delay between requests
      if (j < chunk.length - 1) {
        await sleep(100);
      }
    }

    // Delay between chunks
    if (i + chunkSize < texts.length) {
      await sleep(500);
    }
  }

  return result;
}

// ============================================================================
// Profile Embedding Helpers
// ============================================================================

/**
 * Generate embedding for a founder profile
 * Returns both the embedding and the text used
 */
export async function embedFounderProfile(
  client: OpenAI,
  founder: Partial<Founder>
): Promise<{ embedding: number[]; embedding_text: string; tokens_used: number }> {
  const embeddingText = generateFounderEmbeddingText(founder);
  const { embedding, tokens_used } = await generateEmbedding(client, embeddingText);

  return {
    embedding,
    embedding_text: embeddingText,
    tokens_used,
  };
}

/**
 * Generate embedding for a funder profile
 * Returns both the embedding and the text used
 */
export async function embedFunderProfile(
  client: OpenAI,
  funder: Partial<Funder>
): Promise<{ embedding: number[]; embedding_text: string; tokens_used: number }> {
  const embeddingText = generateFunderEmbeddingText(funder);
  const { embedding, tokens_used } = await generateEmbedding(client, embeddingText);

  return {
    embedding,
    embedding_text: embeddingText,
    tokens_used,
  };
}

// ============================================================================
// Embedding Similarity (for verification/testing)
// ============================================================================

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 (opposite) and 1 (identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate cosine distance (0 = identical, 2 = opposite)
 * This matches pgvector's <=> operator
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format embedding for pgvector storage
 * Converts number[] to JSON string
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Parse embedding from pgvector storage
 * Converts JSON string or array to number[]
 */
export function parseEmbeddingFromPostgres(value: any): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// Cost Estimation
// ============================================================================

const EMBEDDING_COST_PER_1K_TOKENS = 0.0001; // $0.0001 per 1k tokens (ada-002)

/**
 * Estimate cost for embedding generation
 */
export function estimateEmbeddingCost(tokenCount: number): number {
  return (tokenCount / 1000) * EMBEDDING_COST_PER_1K_TOKENS;
}

/**
 * Estimate tokens for a text string (rough approximation)
 * Rule of thumb: 1 token ≈ 4 characters
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
