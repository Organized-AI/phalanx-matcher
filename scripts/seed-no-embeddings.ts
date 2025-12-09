#!/usr/bin/env tsx

/**
 * Seed database WITHOUT embeddings (for demo purposes)
 * Matching will use rule-based scoring only (industry, stage, check size, geography)
 */

import { createClient } from '@supabase/supabase-js';
import foundersData from './seeds/founders.json';
import fundersData from './seeds/funders.json';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedFounders() {
  console.log('\n📊 Seeding founders (without embeddings)...');

  let successCount = 0;

  for (const founder of foundersData) {
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
      profile_completeness: founder.profile_completeness,
      is_active: true,
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log(`   ⏭️  ${founder.name} already exists, skipping`);
      } else {
        console.error(`   ❌ ${founder.name}: ${error.message}`);
      }
    } else {
      console.log(`   ✅ ${founder.name} (${founder.company_name})`);
      successCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount}/${foundersData.length} founders`);
}

async function seedFunders() {
  console.log('\n💼 Seeding funders (without embeddings)...');

  let successCount = 0;

  for (const funder of fundersData) {
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
      is_active: true,
      total_matches_generated: 0,
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log(`   ⏭️  ${funder.name} already exists, skipping`);
      } else {
        console.error(`   ❌ ${funder.name}: ${error.message}`);
      }
    } else {
      console.log(`   ✅ ${funder.name} (${funder.firm_name})`);
      successCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount}/${fundersData.length} funders`);
}

async function verifyData() {
  console.log('\n🔍 Verifying database...');

  const { data: founders } = await supabase.from('founders').select('id, name, industry, stage').limit(20);
  const { data: funders } = await supabase.from('funders').select('id, name, firm_name, preferred_industries').limit(20);

  console.log(`\n📊 Founders in database: ${founders?.length || 0}`);
  founders?.forEach(f => console.log(`   - ${f.name} | ${f.industry} | ${f.stage}`));

  console.log(`\n💼 Funders in database: ${funders?.length || 0}`);
  funders?.forEach(f => console.log(`   - ${f.name} (${f.firm_name}) | ${f.preferred_industries?.join(', ')}`));

  if (founders && founders.length > 0) {
    console.log(`\n🎯 Test with: curl http://localhost:8787/match/${founders[0].id}`);
  }
}

async function main() {
  console.log('🚀 Phalanx Matching Engine - Seed (No Embeddings)');
  console.log('═'.repeat(50));
  console.log('⚠️  Note: Semantic matching (40%) will be disabled');
  console.log('   Rule-based + Stage matching (60%) will work');

  await seedFounders();
  await seedFunders();
  await verifyData();

  console.log('\n✅ Seeding complete!');
}

main().catch(console.error);
