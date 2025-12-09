-- ============================================================================
-- PHALANX MATCHING ENGINE - SEED DATA
-- Run this in Supabase SQL Editor to populate test data
-- https://supabase.com/dashboard/project/pdaycgrzvltucagmvwzv/sql
-- ============================================================================

-- Clear existing data (optional - comment out if you want to keep existing)
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE founders CASCADE;
TRUNCATE TABLE funders CASCADE;

-- ============================================================================
-- FOUNDERS (10 test profiles)
-- ============================================================================

INSERT INTO founders (name, email, company_name, company_description, industry, stage, seeking_amount_min, seeking_amount_max, geography, profile_completeness, is_active) VALUES
('Alice Chen', 'alice@finflow.ai', 'FinFlow AI', 'AI-powered cash flow forecasting platform for SMBs. Uses machine learning to predict revenue, expenses, and cash needs 12 months ahead with 95% accuracy. Integrates with QuickBooks, Stripe, and major banks.', 'Fintech', 'Seed', 500, 1000, 'North America', 1.0, true),
('Bob Martinez', 'bob@healthviz.io', 'HealthViz', 'Real-time patient data visualization dashboard for hospital ICUs. Aggregates data from 20+ medical devices into a single intuitive interface, reducing alarm fatigue by 70%.', 'HealthTech', 'Series A', 2000, 5000, 'North America', 1.0, true),
('Chen Wei', 'chen@learnpath.ai', 'LearnPath', 'Adaptive learning platform for K-12 STEM education. Personalizes curriculum based on student performance and learning style. Currently serving 50,000 students across 200 schools.', 'EdTech', 'Seed', 750, 1500, 'Asia', 1.0, true),
('Diana Okafor', 'diana@carboncap.io', 'CarbonCap', 'Carbon accounting SaaS for enterprise supply chains. Automated emissions tracking and reporting across Scope 1, 2, and 3. Helps companies meet net-zero commitments.', 'CleanTech', 'Series A', 3000, 7000, 'Europe', 1.0, true),
('Ethan Silva', 'ethan@teamflow.co', 'TeamFlow', 'Enterprise collaboration platform combining Slack messaging with Figma real-time collaboration. Built for remote engineering teams. 500+ companies in beta, including 3 Fortune 500s.', 'Enterprise SaaS', 'Seed', 1000, 2000, 'North America', 1.0, true),
('Fatima Hassan', 'fatima@styleai.app', 'StyleAI', 'AI fashion stylist mobile app. Users upload photos of their wardrobe, get personalized outfit recommendations daily. 100k DAU, $5/month subscription model.', 'Consumer', 'Pre-Seed', 300, 500, 'Middle East', 1.0, true),
('Gabriel Torres', 'gabriel@quantumcore.ai', 'QuantumCore', 'Quantum-resistant cryptography for blockchain infrastructure. Developing next-gen encryption algorithms to secure crypto assets against quantum computing threats.', 'DeepTech', 'Seed', 2000, 4000, 'Europe', 1.0, true),
('Hannah Kim', 'hannah@homeviz.co', 'HomeViz', 'Virtual staging and 3D visualization for real estate listings. Increases click-through rates by 3x and reduces time-on-market by 40%. Working with 500+ realtors.', 'PropTech', 'Pre-Seed', 400, 800, 'North America', 1.0, true),
('Ibrahim Yilmaz', 'ibrahim@routeopt.io', 'RouteOptimize', 'AI-powered last-mile delivery optimization for e-commerce. Reduces delivery costs by 25% through dynamic routing and predictive demand modeling. Processing 10k deliveries daily.', 'Logistics', 'Series A', 5000, 10000, 'Europe', 1.0, true),
('Julia Kowalski', 'julia@shieldsec.io', 'ShieldSec', 'Zero-trust network security for distributed teams. Continuous authentication and micro-segmentation. Protects against lateral movement in breaches. SOC 2 Type II certified.', 'Cybersecurity', 'Seed', 1500, 3000, 'North America', 1.0, true);

-- ============================================================================
-- FUNDERS (5 test profiles)
-- ============================================================================

INSERT INTO funders (name, firm_name, bio, investment_thesis, preferred_industries, preferred_stages, check_size_min, check_size_max, geography_focus, is_active, total_matches_generated) VALUES
('Sarah Johnson', 'Catalyst Ventures', 'Former fintech founder who built and sold a B2B payments company for $120M. Now investing in early-stage financial infrastructure and enterprise software.', 'Backing technical founders building picks-and-shovels for the modern financial system. Focus on API-first products, embedded finance, and vertical SaaS with fintech components.', ARRAY['Fintech', 'Enterprise SaaS'], ARRAY['Seed', 'Series A'], 500, 2000, ARRAY['North America', 'Europe'], true, 0),
('Marcus Lee', 'HealthVentures Partners', '20 years in healthcare IT, former CTO at major hospital network. Passionate about technology that improves patient outcomes and reduces clinician burnout.', 'Healthcare deserves the same quality of software that powers consumer tech. Investing in clinical workflow tools, patient engagement platforms, and healthcare data infrastructure. Must demonstrate measurable clinical impact.', ARRAY['HealthTech', 'DeepTech'], ARRAY['Seed', 'Series A'], 1000, 5000, ARRAY['North America', 'Europe', 'Asia'], true, 0),
('Elena Rodriguez', 'GreenTech Capital', 'Environmental engineer turned investor. Led sustainability initiatives at Fortune 100 before starting fund. Climate tech is the opportunity of our generation.', 'Climate change requires both carbon reduction and adaptation solutions. Investing across clean energy, carbon capture, sustainable materials, and climate resilience infrastructure. Looking for 10x impact alongside 10x returns.', ARRAY['CleanTech', 'Logistics', 'Enterprise SaaS'], ARRAY['Series A', 'Series B+'], 3000, 10000, ARRAY['Europe', 'North America'], true, 0),
('David Park', 'Atlas Seed Fund', 'Angel investor and founder of 3 successful startups (2 exits, 1 IPO). Hands-on partner who helps with go-to-market, hiring, and fundraising. Portfolio has 60% follow-on rate.', 'Pre-seed and seed generalist focused on exceptional founders solving real problems. Particularly excited by AI/ML applications in traditional industries, vertical SaaS, and infrastructure software. First check partner.', ARRAY['Enterprise SaaS', 'Fintech', 'DeepTech', 'Cybersecurity'], ARRAY['Pre-Seed', 'Seed'], 250, 1000, ARRAY['North America', 'Asia', 'Europe'], true, 0),
('Amara Okonkwo', 'NextGen Consumer Fund', 'Former product leader at major consumer tech companies. Built products used by 500M+ people. Now backing the next generation of consumer applications.', 'Consumer behavior is fundamentally shifting - Gen Z expects personalization, authenticity, and community. Investing in AI-powered consumer apps, creator economy tools, and new forms of social connection. Mobile-first, viral growth.', ARRAY['Consumer', 'EdTech', 'PropTech'], ARRAY['Pre-Seed', 'Seed'], 300, 1500, ARRAY['Global'], true, 0);

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

SELECT 'Founders:' as table_name, COUNT(*) as count FROM founders
UNION ALL
SELECT 'Funders:' as table_name, COUNT(*) as count FROM funders;

-- Show founder IDs for testing
SELECT id, name, company_name, industry, stage FROM founders LIMIT 5;
