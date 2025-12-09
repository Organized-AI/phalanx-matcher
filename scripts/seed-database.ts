#!/usr/bin/env tsx

/**
 * Phalanx Matching Engine - Database Seeding Script
 *
 * Loads founder and funder seed data, generates embeddings via OpenAI,
 * and inserts into Supabase with proper vector formatting.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx OPENAI_API_KEY=xxx tsx scripts/seed-database.ts
 *
 * Or with .dev.vars loaded:
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import foundersData from './seeds/founders.json';
import fundersData from './seeds/funders.json';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
  console.error('');
  console.error('Set them in .dev.vars or as environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ============================================================================
// Embedding Generation
// ============================================================================

interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
      encoding_format: 'float',
    });

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    };
  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    throw error;
  }
}

// ============================================================================
// Founder Seeding
// ============================================================================

async function seedFounders() {
  console.log('\n📊 Seeding founders...');
  console.log('─'.repeat(60));

  let successCount = 0;
  let totalTokens = 0;

  for (const founder of foundersData) {
    try {
      // Create embeddable text
      const embeddingText = `${founder.company_description}. Industry: ${founder.industry}. Stage: ${founder.stage}.`;

      console.log(`\n👤 Processing: ${founder.name} (${founder.company_name})`);
      console.log(`   Generating embedding for: "${embeddingText.substring(0, 80)}..."`);

      const { embedding, tokens } = await generateEmbedding(embeddingText);
      totalTokens += tokens;

      console.log(`   ✓ Generated ${embedding.length}-dim embedding (${tokens} tokens)`);

      // Insert into database
      // Note: pgvector expects embedding as string representation of array
      const { error } = await supabase.from('founders').insert({
        name: founder.name,
        email: founder.email,
        company_name: founder.company_name,
        company_description: founder.company_description,
        industry: founder.industry,
        stage: founder.stage,
        seeking_amount_min: founder.seeking_amount_min,
        seeking_amount_max: founder.seeking_amount_max,
        geography: founder.geography,
        embedding_text: embeddingText,
        embedding: JSON.stringify(embedding), // pgvector format
        profile_completeness: founder.profile_completeness,
        is_active: true,
      });

      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        if (error.message.includes('duplicate key')) {
          console.log(`   ℹ️  Founder already exists, skipping...`);
        }
      } else {
        console.log(`   ✅ Successfully inserted: ${founder.name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${founder.name}:`, error);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Founders seeding complete: ${successCount}/${foundersData.length} succeeded`);
  console.log(`📈 Total tokens used: ${totalTokens}`);
}

// ============================================================================
// Funder Seeding
// ============================================================================

async function seedFunders() {
  console.log('\n💼 Seeding funders...');
  console.log('─'.repeat(60));

  let successCount = 0;
  let totalTokens = 0;

  for (const funder of fundersData) {
    try {
      // Create embeddable text
      const embeddingText = `${funder.investment_thesis}. ${funder.bio}. Focus: ${funder.preferred_industries.join(', ')}.`;

      console.log(`\n🏢 Processing: ${funder.name} (${funder.firm_name})`);
      console.log(`   Generating embedding for: "${embeddingText.substring(0, 80)}..."`);

      const { embedding, tokens } = await generateEmbedding(embeddingText);
      totalTokens += tokens;

      console.log(`   ✓ Generated ${embedding.length}-dim embedding (${tokens} tokens)`);

      // Insert into database
      const { error } = await supabase.from('funders').insert({
        name: funder.name,
        firm_name: funder.firm_name,
        bio: funder.bio,
        investment_thesis: funder.investment_thesis,
        preferred_industries: funder.preferred_industries,
        preferred_stages: funder.preferred_stages,
        check_size_min: funder.check_size_min,
        check_size_max: funder.check_size_max,
        geography_focus: funder.geography_focus,
        embedding_text: embeddingText,
        embedding: JSON.stringify(embedding), // pgvector format
        is_active: true,
        total_matches_generated: 0,
      });

      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        if (error.message.includes('duplicate key')) {
          console.log(`   ℹ️  Funder already exists, skipping...`);
        }
      } else {
        console.log(`   ✅ Successfully inserted: ${funder.name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${funder.name}:`, error);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Funders seeding complete: ${successCount}/${fundersData.length} succeeded`);
  console.log(`📈 Total tokens used: ${totalTokens}`);
}

// ============================================================================
// Database Verification
// ============================================================================

async function verifySeeding() {
  console.log('\n🔍 Verifying database state...');
  console.log('─'.repeat(60));

  try {
    const { data: founders, error: foundersError } = await supabase
      .from('founders')
      .select('id, name, email, industry, stage, embedding')
      .limit(100);

    if (foundersError) throw foundersError;

    const foundersWithEmbeddings = founders?.filter((f) => f.embedding !== null).length || 0;

    console.log(`\n📊 Founders:`);
    console.log(`   Total: ${founders?.length || 0}`);
    console.log(`   With embeddings: ${foundersWithEmbeddings}`);

    const { data: funders, error: fundersError } = await supabase
      .from('funders')
      .select('id, name, firm_name, preferred_industries, embedding')
      .limit(100);

    if (fundersError) throw fundersError;

    const fundersWithEmbeddings = funders?.filter((f) => f.embedding !== null).length || 0;

    console.log(`\n💼 Funders:`);
    console.log(`   Total: ${funders?.length || 0}`);
    console.log(`   With embeddings: ${fundersWithEmbeddings}`);

    console.log('\n✅ Database verification complete');

    if (foundersWithEmbeddings > 0 && fundersWithEmbeddings > 0) {
      console.log('\n🎉 Success! Database is ready for matching.');
      console.log('\nNext steps:');
      console.log('  1. Start dev server: npm run dev');
      console.log('  2. Test health endpoint: curl http://localhost:8787/health');
      console.log('  3. Get a founder ID and test matching:');
      console.log('     curl http://localhost:8787/match/<founder-id>');
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Phalanx Matching Engine - Database Seeding');
  console.log('═'.repeat(60));

  const startTime = Date.now();

  try {
    await seedFounders();
    await seedFunders();
    await verifySeeding();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(60));
    console.log(`✅ All seeding operations completed in ${duration}s`);
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateEmbedding, seedFounders, seedFunders, verifySeeding };
