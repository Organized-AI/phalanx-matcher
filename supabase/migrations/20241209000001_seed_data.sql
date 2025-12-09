-- ============================================================================
-- PHALANX MATCHING ENGINE - SEED DATA
-- ============================================================================
-- 10 Synthetic Founders + 5 Synthetic Funders for testing
-- ============================================================================

-- ============================================================================
-- FOUNDERS (10 profiles representing diverse industries and stages)
-- ============================================================================

INSERT INTO founders (
    id, name, email, linkedin_url,
    company_name, company_url, company_founded_year,
    industry_sector, company_stage, geographic_location, country_code,
    tagline, problem_statement, solution_description, unique_value_prop, target_customer, business_model, competitive_advantage,
    raise_amount, use_of_funds, funding_timeline, previous_funding,
    team_size, founders_count, team_background,
    key_metrics, traction_summary, customer_count, mrr, arr, growth_rate_percent,
    pitch_deck_url, profile_completeness_score, raise_hand_eligible, is_active
) VALUES

-- Founder 1: Sarah Chen - MediSync AI (Healthcare/AI - Seed)
(
    'f1000001-0000-0000-0000-000000000001',
    'Sarah Chen', 'sarah.chen@medisync.ai', 'https://linkedin.com/in/sarahchen',
    'MediSync AI', 'https://medisync.ai', 2023,
    'healthcare', 'seed', 'San Francisco', 'US',
    'AI-powered clinical documentation that writes itself',
    'Healthcare providers waste 40% of their time on administrative documentation tasks, leading to physician burnout and reduced patient care quality. The average doctor spends 2+ hours daily on EHR documentation.',
    'MediSync AI uses advanced speech recognition and medical NLP to automatically generate clinical notes from patient conversations. Our AI understands medical terminology, extracts key information, and formats documentation to meet compliance requirements - all in real-time.',
    'Only solution with 94% accuracy on medical terminology and HIPAA-compliant from day one. Built by physicians, for physicians.',
    'Hospitals, clinics, and private practices with 10+ physicians',
    'SaaS subscription per provider seat, $200-500/month depending on specialty',
    'Proprietary medical NLP model trained on 2M+ clinical encounters; founding team includes former Epic and Cerner engineers',
    2500000.00, 'Product development (40%), team expansion - 3 engineers (35%), sales/marketing (25%)', 'actively_raising', 500000.00,
    8, 2, '[{"name": "Sarah Chen", "role": "CEO", "linkedin": "linkedin.com/in/sarahchen", "background": "MD Stanford, 8 years clinical practice, MBA Wharton"}, {"name": "Michael Park", "role": "CTO", "linkedin": "linkedin.com/in/michaelpark", "background": "Ex-Epic Engineering Lead, MS Computer Science CMU"}]',
    '{"mrr": 25000, "arr": 300000, "pilots": 15, "accuracy_rate": 0.94, "nps": 72, "churn_rate": 0.02}',
    '15 pilot hospitals with paid contracts, $300K ARR, 94% accuracy rate on medical documentation, NPS of 72',
    15, 25000.00, 300000.00, 45.00, 'https://drive.google.com/medisync-deck', 92, TRUE, TRUE
),

-- Founder 2: Marcus Johnson - SupplyChainOS (Logistics - Series A)
(
    'f1000002-0000-0000-0000-000000000002',
    'Marcus Johnson', 'marcus@supplychainos.com', 'https://linkedin.com/in/marcusjohnson',
    'SupplyChainOS', 'https://supplychainos.com', 2022,
    'logistics', 'series_a', 'Austin', 'US',
    'Real-time supply chain intelligence for the mid-market',
    'Mid-market manufacturers ($50M-500M revenue) lack visibility into their tier-2 and tier-3 suppliers. When disruptions occur, they learn about them weeks later, causing costly production delays and lost revenue averaging $2M per incident.',
    'SupplyChainOS provides a real-time supply chain intelligence platform that maps your entire supplier network, monitors global risk signals, and delivers predictive alerts before disruptions impact your operations. Our AI analyzes 10,000+ data sources including shipping data, news, weather, and financial signals.',
    'First platform to provide predictive disruption alerts with 72-hour average advance warning and 89% accuracy',
    'Manufacturing companies with $50M-500M revenue, particularly automotive, electronics, and consumer goods',
    'Annual SaaS contracts based on supply chain complexity, $50K-200K/year',
    'Proprietary risk scoring algorithm validated against 3 years of historical disruption data',
    8000000.00, 'Enterprise sales team (40%), platform expansion (30%), international markets (30%)', 'actively_raising', 3500000.00,
    22, 3, '[{"name": "Marcus Johnson", "role": "CEO", "background": "Ex-McKinsey Supply Chain Practice, MBA Harvard"}, {"name": "Jennifer Wu", "role": "CTO", "background": "Ex-Amazon Supply Chain Tech Lead"}, {"name": "David Kim", "role": "COO", "background": "Former VP Operations at Tesla"}]',
    '{"arr": 1200000, "customers": 45, "growth_yoy": 3.0, "net_revenue_retention": 1.35, "avg_contract_value": 85000}',
    '$1.2M ARR, 45 enterprise customers, 3x YoY growth, 135% net revenue retention',
    45, 100000.00, 1200000.00, 200.00, 'https://drive.google.com/supplychainos-deck', 95, TRUE, TRUE
),

-- Founder 3: Priya Patel - FinLit (FinTech/EdTech - Pre-seed)
(
    'f1000003-0000-0000-0000-000000000003',
    'Priya Patel', 'priya@finlit.app', 'https://linkedin.com/in/priyapatel',
    'FinLit', 'https://finlit.app', 2024,
    'fintech', 'pre_seed', 'New York', 'US',
    'Gamified investing education for Gen Z',
    'Gen Z lacks accessible financial education - 72% report feeling anxious about money, and 65% have never invested. Traditional financial education is boring, complex, and disconnected from how young people learn.',
    'FinLit is a gamified micro-learning app that teaches investing through simulation. Users build virtual portfolios, compete with friends, earn rewards for learning milestones, and gradually transition to real investing with small amounts.',
    'Only platform combining education, simulation, and real investing in one seamless journey',
    'Gen Z ages 18-25, starting with college students and recent graduates',
    'Freemium model with premium subscription ($9.99/month) and revenue share on brokerage referrals',
    'Viral TikTok presence with 500K followers, partnerships with 3 university finance clubs',
    750000.00, 'Product development (50%), user acquisition (30%), team (20%)', 'actively_raising', 150000.00,
    3, 2, '[{"name": "Priya Patel", "role": "CEO", "background": "Ex-Robinhood Product Manager, CS Stanford"}, {"name": "Alex Rivera", "role": "CTO", "background": "Ex-TikTok Engineer, self-taught developer"}]',
    '{"downloads": 50000, "mau": 18000, "d7_retention": 0.40, "d30_retention": 0.25, "tiktok_followers": 500000}',
    '50K downloads, 40% D7 retention, 500K TikTok followers, featured in TechCrunch',
    18000, NULL, NULL, NULL, 'https://drive.google.com/finlit-deck', 78, TRUE, TRUE
),

-- Founder 4: David Kim - CarbonTrack (Climate - Seed)
(
    'f1000004-0000-0000-0000-000000000004',
    'David Kim', 'david@carbontrack.io', 'https://linkedin.com/in/davidkim',
    'CarbonTrack', 'https://carbontrack.io', 2023,
    'climate', 'seed', 'Seattle', 'US',
    'Automated carbon accounting for enterprises',
    'Companies struggle to measure Scope 3 emissions accurately - which represent 70%+ of most companies carbon footprint. Manual data collection is slow, expensive, and error-prone, making compliance with upcoming regulations nearly impossible.',
    'CarbonTrack automates carbon accounting through direct integrations with ERP systems, supplier databases, and financial platforms. Our AI categorizes spending, calculates emissions using industry-specific factors, and generates audit-ready reports for CDP, SEC, and EU CSRD compliance.',
    'Only platform with automated supplier emissions data collection and SEC-ready reporting',
    'Mid-market and enterprise companies with ESG reporting requirements, particularly in retail, manufacturing, and financial services',
    'Annual SaaS based on company revenue size, $30K-150K/year',
    'Direct integrations with SAP, Oracle, and Workday; SOC 2 Type II certified',
    3000000.00, 'Engineering team expansion (40%), enterprise sales (35%), compliance certifications (25%)', 'actively_raising', 1000000.00,
    12, 2, '[{"name": "David Kim", "role": "CEO", "background": "Ex-McKinsey Sustainability Practice, MBA MIT Sloan"}, {"name": "Emma Thompson", "role": "CTO", "background": "Ex-Salesforce Principal Engineer, Climate Tech PhD"}]',
    '{"arr": 500000, "customers": 18, "fortune500_pilots": 3, "data_points_processed": 50000000}',
    '$500K ARR, 18 customers including 3 Fortune 500 pilots, SOC 2 certified, processing 50M data points monthly',
    18, 42000.00, 500000.00, 120.00, 'https://drive.google.com/carbontrack-deck', 90, TRUE, TRUE
),

-- Founder 5: Emma Rodriguez - CreatorStack (Creator Economy - Seed)
(
    'f1000005-0000-0000-0000-000000000005',
    'Emma Rodriguez', 'emma@creatorstack.com', 'https://linkedin.com/in/emmarodriguez',
    'CreatorStack', 'https://creatorstack.com', 2023,
    'creator_economy', 'seed', 'Los Angeles', 'US',
    'All-in-one business platform for content creators',
    'Content creators spend 60% of their time on business operations instead of creating - invoicing clients, managing contracts, tracking taxes, and scheduling content. This leads to burnout, missed revenue opportunities, and financial mistakes.',
    'CreatorStack is the all-in-one platform for creator businesses: invoicing, contracts, tax tracking, content scheduling, brand deal management, and financial analytics. We integrate with all major platforms (YouTube, TikTok, Instagram, Twitch) to automate the business side of creating.',
    'First platform built specifically for multi-platform creators with integrated tax optimization',
    'Content creators with 10K+ followers earning $1K+/month from their content',
    'Freemium with Pro ($19/month) and Business ($49/month) tiers, plus payment processing fees',
    'Built by creators, for creators - founding team includes YouTubers with 2M+ combined subscribers',
    4000000.00, 'Platform expansion (35%), creator acquisition (35%), team growth (30%)', 'actively_raising', 800000.00,
    15, 2, '[{"name": "Emma Rodriguez", "role": "CEO", "background": "Former creator with 800K YouTube subscribers, Ex-Google PM"}, {"name": "Tyler Chen", "role": "CTO", "background": "Ex-Stripe Engineer, built creator tools at Patreon"}]',
    '{"creators": 25000, "gmv_processed": 2000000, "mrr": 65000, "nps": 85, "premium_conversion": 0.12}',
    '25K creators, $2M GMV processed, $65K MRR, 85 NPS, 12% free-to-paid conversion',
    25000, 65000.00, 780000.00, 35.00, 'https://drive.google.com/creatorstack-deck', 88, TRUE, TRUE
),

-- Founder 6: Alex Thompson - SecureEdge (Cybersecurity - Series A)
(
    'f1000006-0000-0000-0000-000000000006',
    'Alex Thompson', 'alex@secureedge.io', 'https://linkedin.com/in/alexthompson',
    'SecureEdge', 'https://secureedge.io', 2021,
    'cybersecurity', 'series_a', 'Boston', 'US',
    'Enterprise-grade managed security for the mid-market',
    'SMBs are the primary targets of ransomware attacks (43% of all attacks) but lack the budget and expertise for enterprise security solutions. The average cost of a breach for SMBs is $2.98M, often forcing them out of business.',
    'SecureEdge provides enterprise-grade managed security for mid-market companies at SMB prices. Our AI-powered platform combines endpoint protection, network monitoring, email security, and 24/7 SOC services in one integrated solution.',
    'Only managed security platform with AI-driven threat detection achieving <2hr mean response time',
    'Companies with 50-500 employees in regulated industries (healthcare, finance, legal)',
    'Annual subscription per employee, $15-25/employee/month based on package',
    'Proprietary threat intelligence network spanning 500+ customers; former NSA and CrowdStrike team',
    12000000.00, 'Sales team expansion (40%), platform development (30%), SOC capacity (30%)', 'actively_raising', 5000000.00,
    35, 3, '[{"name": "Alex Thompson", "role": "CEO", "background": "Ex-CrowdStrike VP Sales, 15 years cybersecurity"}, {"name": "Maria Santos", "role": "CTO", "background": "Ex-NSA, PhD Computer Science MIT"}, {"name": "James Wilson", "role": "COO", "background": "Ex-Palo Alto Networks Operations"}]',
    '{"arr": 3000000, "customers": 200, "mrt_hours": 1.8, "threat_blocked": 50000, "nps": 78}',
    '$3M ARR, 200 customers, <2hr mean response time, 50K threats blocked monthly, 78 NPS',
    200, 250000.00, 3000000.00, 85.00, 'https://drive.google.com/secureedge-deck', 94, TRUE, TRUE
),

-- Founder 7: Nina Kowalski - FarmSense (AgTech - Seed)
(
    'f1000007-0000-0000-0000-000000000007',
    'Nina Kowalski', 'nina@farmsense.ag', 'https://linkedin.com/in/ninakowalski',
    'FarmSense', 'https://farmsense.ag', 2023,
    'agtech', 'seed', 'Denver', 'US',
    'Precision agriculture for small and mid-size farms',
    'Small farms (under 500 acres) lack access to precision agriculture technology that large agribusiness uses. This technology could increase yields 15-25% and reduce water/fertilizer usage by 20%, but costs $50K+ to implement.',
    'FarmSense provides low-cost IoT sensors ($200/acre) paired with AI-driven crop recommendations. Farmers get real-time soil, weather, and crop health data through a simple mobile app, with actionable recommendations that dont require technical expertise.',
    'First precision ag solution under $500/acre with recommendations in plain English',
    'Small and mid-size farms (50-500 acres) growing commodity crops in the US Midwest',
    'Hardware sale plus $10/acre/month subscription for recommendations and support',
    'Sensors manufactured at 1/10th competitor cost; partnerships with 3 agricultural extension services',
    2000000.00, 'Manufacturing scale-up (40%), field sales team (35%), R&D (25%)', 'actively_raising', 500000.00,
    10, 2, '[{"name": "Nina Kowalski", "role": "CEO", "background": "4th generation farmer, MS Agricultural Engineering Iowa State"}, {"name": "Robert Chen", "role": "CTO", "background": "Ex-John Deere IoT Platform Lead"}]',
    '{"farms_deployed": 500, "acres_monitored": 75000, "avg_yield_improvement": 0.18, "water_savings": 0.22}',
    '500 farms deployed, 75K acres monitored, 18% average yield improvement, 22% water savings',
    500, 45000.00, 540000.00, 60.00, 'https://drive.google.com/farmsense-deck', 85, TRUE, TRUE
),

-- Founder 8: James Wilson - LegalPilot (LegalTech - Pre-seed)
(
    'f1000008-0000-0000-0000-000000000008',
    'James Wilson', 'james@legalpilot.ai', 'https://linkedin.com/in/jameswilson',
    'LegalPilot', 'https://legalpilot.ai', 2024,
    'legaltech', 'pre_seed', 'Chicago', 'US',
    'AI-powered legal documents for startups',
    'Startups overpay for basic legal work - spending $5K-15K on standard documents like terms of service, privacy policies, and contractor agreements. This is money that should go to product development, not commoditized legal paperwork.',
    'LegalPilot uses AI to generate customized legal documents in minutes for a fraction of traditional costs. Our platform asks simple questions, generates documents tailored to your business, and includes optional attorney review for complex situations.',
    'Only AI legal platform with built-in attorney review network for quality assurance',
    'Early-stage startups (pre-seed through Series A) and small businesses',
    'Pay-per-document ($50-200) with subscription option ($99/month unlimited)',
    'Partnership with 2 AmLaw 100 firms for attorney review network',
    500000.00, 'Product development (50%), attorney network expansion (30%), marketing (20%)', 'actively_raising', 75000.00,
    4, 2, '[{"name": "James Wilson", "role": "CEO", "background": "Former BigLaw associate, JD Harvard Law"}, {"name": "Sarah Park", "role": "CTO", "background": "Ex-Docusign Engineer, NLP specialist"}]',
    '{"documents_generated": 200, "law_firm_partners": 2, "avg_document_time_minutes": 15, "attorney_review_rate": 0.20}',
    '200 documents generated, 2 law firm partnerships, 15-minute average generation time',
    85, NULL, NULL, NULL, 'https://drive.google.com/legalpilot-deck', 72, TRUE, TRUE
),

-- Founder 9: Lisa Chang - EduPath (EdTech - Series A)
(
    'f1000009-0000-0000-0000-000000000009',
    'Lisa Chang', 'lisa@edupath.io', 'https://linkedin.com/in/lisachang',
    'EduPath', 'https://edupath.io', 2021,
    'edtech', 'series_a', 'San Francisco', 'US',
    'Adaptive corporate learning that actually works',
    'Corporate L&D programs have less than 20% completion rates, wasting billions in training budgets. Employees find training boring and irrelevant, while companies cant measure actual skill development or business impact.',
    'EduPath is an adaptive learning platform that personalizes training to each employees role, learning style, and pace. Using spaced repetition, social learning, and gamification, we achieve 78% completion rates and measurable skill improvement.',
    'Only platform with proven 4x improvement in completion rates and direct integration with performance management systems',
    'Enterprise companies (1000+ employees) with significant L&D budgets, particularly in tech, finance, and consulting',
    'Per-employee annual subscription ($50-80/employee/year) with implementation services',
    'Proprietary adaptive learning algorithm validated in peer-reviewed research; integrations with Workday and SAP SuccessFactors',
    10000000.00, 'Enterprise sales expansion (40%), product development (35%), international markets (25%)', 'actively_raising', 4000000.00,
    28, 2, '[{"name": "Lisa Chang", "role": "CEO", "background": "Ex-LinkedIn Learning GM, MBA Stanford"}, {"name": "Kevin Patel", "role": "CTO", "background": "Ex-Coursera Principal Engineer, PhD Learning Sciences"}]',
    '{"arr": 2500000, "enterprise_customers": 50, "completion_rate": 0.78, "employees_trained": 150000, "nps": 72}',
    '$2.5M ARR, 50 enterprise clients, 78% completion rate (vs 20% industry average), 150K employees trained',
    50, 210000.00, 2500000.00, 75.00, 'https://drive.google.com/edupath-deck', 93, TRUE, TRUE
),

-- Founder 10: Robert Martinez - PropFlow (PropTech - Seed)
(
    'f1000010-0000-0000-0000-000000000010',
    'Robert Martinez', 'robert@propflow.io', 'https://linkedin.com/in/robertmartinez',
    'PropFlow', 'https://propflow.io', 2023,
    'proptech', 'seed', 'Miami', 'US',
    'Digital closing platform for commercial real estate',
    'Commercial real estate transactions take 6+ months to close, with thousands of pages of documents, dozens of stakeholders, and manual due diligence processes. This friction costs billions in delayed deals and failed transactions.',
    'PropFlow is a digital closing platform that automates due diligence, centralizes document management, and streamlines communication between all parties. Our AI extracts key terms from leases and contracts, flags issues, and generates closing checklists.',
    'Only CRE platform with AI-powered due diligence automation and real-time deal tracking',
    'Commercial real estate brokers, investors, and lenders handling $10M+ transactions',
    'Per-transaction fee (0.1% of deal value, capped at $5K) plus optional subscription for high-volume users',
    '25 broker partnerships including 2 top-10 national firms; patent-pending AI document analysis',
    3500000.00, 'Product development (40%), broker partnerships (35%), team expansion (25%)', 'actively_raising', 1200000.00,
    14, 2, '[{"name": "Robert Martinez", "role": "CEO", "background": "15 years CRE investment, Former CBRE Director"}, {"name": "Amanda Foster", "role": "CTO", "background": "Ex-DocuSign Engineering Lead, real estate tech veteran"}]',
    '{"transaction_volume": 400000000, "broker_partners": 25, "avg_time_savings_percent": 0.40, "deals_closed": 85}',
    '$400M transaction volume, 25 broker partnerships, 40% average time savings on closings, 85 deals closed',
    85, 75000.00, 900000.00, 55.00, 'https://drive.google.com/propflow-deck', 89, TRUE, TRUE
);

-- ============================================================================
-- FUNDERS (5 diverse investor profiles)
-- ============================================================================

INSERT INTO funders (
    id, name, email, linkedin_url, title,
    firm_name, firm_url, firm_type, firm_description, aum,
    investment_thesis, sectors_of_interest, stage_preferences,
    check_size_min, check_size_max, typical_check_size, follow_on_capacity,
    geographic_focus, lead_or_follow, board_seat_requirement,
    portfolio_count, investments_per_year,
    avg_response_time_hours, response_rate,
    is_active, accepting_intros
) VALUES

-- Funder 1: Jennifer Wu - Horizon Ventures (Enterprise/AI focus)
(
    'u1000001-0000-0000-0000-000000000001',
    'Jennifer Wu', 'jennifer@horizonventures.com', 'https://linkedin.com/in/jenniferwu', 'Partner',
    'Horizon Ventures', 'https://horizonventures.com', 'vc',
    'Horizon Ventures backs technical founders solving enterprise problems with AI-first approaches. We lead seed and Series A rounds in healthcare, fintech, cybersecurity, and logistics.',
    250000000.00,
    'We back technical founders solving enterprise problems with AI-first approaches. We look for companies with strong technical differentiation, clear path to $100M ARR, and founders with deep domain expertise. We are hands-on partners who help with enterprise sales, recruiting, and follow-on fundraising.',
    ARRAY['healthcare', 'fintech', 'cybersecurity', 'logistics']::industry_sector[],
    ARRAY['seed', 'series_a']::company_stage[],
    1000000.00, 5000000.00, 2500000.00, TRUE,
    ARRAY['San Francisco', 'New York', 'Boston'], 'lead', TRUE,
    45, 12, 24, 0.65, TRUE, TRUE
),

-- Funder 2: Michael Torres - Climate Capital Partners (Climate/Sustainability focus)
(
    'u1000002-0000-0000-0000-000000000002',
    'Michael Torres', 'michael@climatecapital.vc', 'https://linkedin.com/in/michaeltorres', 'Managing Partner',
    'Climate Capital Partners', 'https://climatecapital.vc', 'vc',
    'Climate Capital Partners invests in technology solutions that decarbonize hard-to-abate sectors. We focus on early-stage companies with breakthrough potential in climate tech.',
    150000000.00,
    'Investing in technology solutions that decarbonize hard-to-abate sectors. We focus on companies addressing agriculture, manufacturing, transportation, and buildings emissions with innovative technology. We value founders with deep technical expertise and a long-term commitment to climate impact.',
    ARRAY['climate', 'agtech', 'logistics']::industry_sector[],
    ARRAY['pre_seed', 'seed']::company_stage[],
    500000.00, 3000000.00, 1500000.00, TRUE,
    ARRAY[]::TEXT[], 'either', FALSE,
    28, 10, 36, 0.55, TRUE, TRUE
),

-- Funder 3: Amanda Foster - Amplify VC (Consumer/Creator focus)
(
    'u1000003-0000-0000-0000-000000000003',
    'Amanda Foster', 'amanda@amplifyvc.co', 'https://linkedin.com/in/amandafoster', 'General Partner',
    'Amplify VC', 'https://amplifyvc.co', 'vc',
    'Amplify VC invests in consumer-first companies that change how people live, work, and play. We back founders building the next generation of consumer products and services.',
    100000000.00,
    'Consumer-first companies that change how people live, work, and play. We invest in founders who deeply understand their users and have unique insights into consumer behavior. We especially love companies at the intersection of content, community, and commerce.',
    ARRAY['creator_economy', 'edtech', 'fintech', 'consumer']::industry_sector[],
    ARRAY['pre_seed', 'seed', 'series_a']::company_stage[],
    250000.00, 4000000.00, 1000000.00, TRUE,
    ARRAY['Los Angeles', 'New York', 'Austin', 'Miami'], 'either', FALSE,
    52, 15, 18, 0.70, TRUE, TRUE
),

-- Funder 4: David Park - Enterprise Growth Fund (Growth Stage B2B)
(
    'u1000004-0000-0000-0000-000000000004',
    'David Park', 'david@egfund.com', 'https://linkedin.com/in/davidpark', 'Partner',
    'Enterprise Growth Fund', 'https://egfund.com', 'vc',
    'Enterprise Growth Fund invests in growth-stage B2B SaaS companies with proven product-market fit. We help companies scale from $2M to $20M+ ARR.',
    500000000.00,
    'Growth-stage B2B SaaS with proven product-market fit and expansion potential. We invest in companies with $1M+ ARR, strong unit economics, and clear path to market leadership. We bring operational expertise in enterprise sales, customer success, and international expansion.',
    ARRAY['cybersecurity', 'healthcare', 'legaltech', 'proptech', 'saas', 'enterprise']::industry_sector[],
    ARRAY['series_a', 'series_b']::company_stage[],
    5000000.00, 15000000.00, 8000000.00, TRUE,
    ARRAY['San Francisco', 'Boston', 'Seattle', 'New York'], 'lead', TRUE,
    35, 8, 48, 0.45, TRUE, TRUE
),

-- Funder 5: Rachel Green - Seed Studio (Generalist Early Stage)
(
    'u1000005-0000-0000-0000-000000000005',
    'Rachel Green', 'rachel@seedstudio.vc', 'https://linkedin.com/in/rachelgreen', 'Founding Partner',
    'Seed Studio', 'https://seedstudio.vc', 'vc',
    'Seed Studio backs exceptional founders at the earliest stages. We write small checks and provide hands-on support to help founders find product-market fit.',
    50000000.00,
    'Backing exceptional founders at the earliest stages across all sectors. We are founder-first investors who believe great people can build great companies in any market. We write first checks and provide hands-on support with product development, early customers, and seed-stage challenges.',
    ARRAY['healthcare', 'fintech', 'edtech', 'climate', 'creator_economy', 'proptech', 'agtech', 'legaltech', 'saas', 'ai_ml']::industry_sector[],
    ARRAY['pre_seed', 'seed']::company_stage[],
    100000.00, 1500000.00, 500000.00, TRUE,
    ARRAY[]::TEXT[], 'either', FALSE,
    78, 25, 12, 0.80, TRUE, TRUE
);

-- ============================================================================
-- SAMPLE MATCHES (demonstrating various match scenarios)
-- ============================================================================

INSERT INTO matches (
    founder_id, funder_id,
    semantic_score, rule_score, stage_score,
    score_breakdown, match_reasoning,
    match_status, algorithm_version
) VALUES

-- Match 1: MediSync AI + Horizon Ventures (Excellent Match - 87.2%)
(
    'f1000001-0000-0000-0000-000000000001',  -- MediSync AI
    'u1000001-0000-0000-0000-000000000001',  -- Horizon Ventures
    85.00, 92.00, 75.00,
    '{"semantic": {"score": 85, "explanation": "Strong thesis alignment: AI-first healthcare solution matches Horizon enterprise AI focus"}, "rules": {"industry_match": {"score": 100, "matched": true, "detail": "Healthcare is a preferred sector"}, "check_size_fit": {"score": 100, "in_range": true, "detail": "$2.5M raise within $1-5M range"}, "geographic_match": {"score": 100, "matched": true, "detail": "San Francisco is preferred location"}, "completeness_bonus": {"score": 68, "profile_score": 92}}, "stage": {"score": 75, "explanation": "Seed stage matches investor preference"}}',
    '{"summary": "Excellent match - strong thesis alignment with AI-powered healthcare", "strengths": ["AI-first approach aligns with Horizon thesis", "Healthcare vertical is preferred sector", "$2.5M raise fits $1-5M sweet spot", "San Francisco location preferred", "Strong profile completeness (92%)"], "considerations": ["Seed stage - may want to see more traction before leading"]}',
    'pending', '1.0.0'
),

-- Match 2: CarbonTrack + Climate Capital (Excellent Match - 91.0%)
(
    'f1000004-0000-0000-0000-000000000004',  -- CarbonTrack
    'u1000002-0000-0000-0000-000000000002',  -- Climate Capital Partners
    95.00, 85.00, 100.00,
    '{"semantic": {"score": 95, "explanation": "Outstanding thesis alignment: carbon accounting directly addresses decarbonization mission"}, "rules": {"industry_match": {"score": 100, "matched": true, "detail": "Climate tech is core focus"}, "check_size_fit": {"score": 100, "in_range": true, "detail": "$3M raise within $500K-3M range"}, "geographic_match": {"score": 100, "matched": true, "detail": "No geographic restrictions"}, "completeness_bonus": {"score": 40, "profile_score": 90}}, "stage": {"score": 100, "explanation": "Seed stage is preferred investment stage"}}',
    '{"summary": "Outstanding match - core thesis alignment with climate/carbon focus", "strengths": ["Carbon accounting directly addresses climate mission", "Enterprise customers indicate strong product-market fit", "$500K ARR demonstrates traction", "Seed stage preferred by fund"], "considerations": []}',
    'viewed', '1.0.0'
),

-- Match 3: CreatorStack + Amplify VC (Good Match - 82.4%)
(
    'f1000005-0000-0000-0000-000000000005',  -- CreatorStack
    'u1000003-0000-0000-0000-000000000003',  -- Amplify VC
    88.00, 78.00, 75.00,
    '{"semantic": {"score": 88, "explanation": "Strong alignment: creator economy focus matches Amplify consumer thesis"}, "rules": {"industry_match": {"score": 100, "matched": true, "detail": "Creator economy is target sector"}, "check_size_fit": {"score": 100, "in_range": true, "detail": "$4M raise within $250K-4M range"}, "geographic_match": {"score": 100, "matched": true, "detail": "Los Angeles is preferred location"}, "completeness_bonus": {"score": 12, "profile_score": 88}}, "stage": {"score": 75, "explanation": "Seed stage matches investor preference"}}',
    '{"summary": "Strong match - creator economy focus with LA presence", "strengths": ["Creator economy is core Amplify thesis", "Los Angeles location is preferred", "25K creators shows strong traction", "85 NPS indicates product-market fit"], "considerations": ["$4M raise is at top of fund range"]}',
    'intro_requested', '1.0.0'
),

-- Match 4: SecureEdge + Enterprise Growth (Strong Match - 86.8%)
(
    'f1000006-0000-0000-0000-000000000006',  -- SecureEdge
    'u1000004-0000-0000-0000-000000000004',  -- Enterprise Growth Fund
    82.00, 95.00, 75.00,
    '{"semantic": {"score": 82, "explanation": "Good alignment: enterprise cybersecurity matches B2B SaaS growth thesis"}, "rules": {"industry_match": {"score": 100, "matched": true, "detail": "Cybersecurity is target sector"}, "check_size_fit": {"score": 100, "in_range": true, "detail": "$12M raise within $5-15M range"}, "geographic_match": {"score": 100, "matched": true, "detail": "Boston is preferred location"}, "completeness_bonus": {"score": 80, "profile_score": 94}}, "stage": {"score": 75, "explanation": "Series A matches investor preference"}}',
    '{"summary": "Strong match - enterprise cybersecurity with strong metrics", "strengths": ["$3M ARR demonstrates product-market fit", "200 customers shows scalability", "Enterprise Growth operational expertise valuable", "Boston location preferred"], "considerations": []}',
    'connected', '1.0.0'
),

-- Match 5: FinLit + Seed Studio (Good Match - 76.8%)
(
    'f1000003-0000-0000-0000-000000000003',  -- FinLit
    'u1000005-0000-0000-0000-000000000005',  -- Seed Studio
    78.00, 72.00, 100.00,
    '{"semantic": {"score": 78, "explanation": "Good alignment: fintech meets generalist thesis, consumer focus"}, "rules": {"industry_match": {"score": 100, "matched": true, "detail": "Fintech is covered sector"}, "check_size_fit": {"score": 100, "in_range": true, "detail": "$750K raise within $100K-1.5M range"}, "geographic_match": {"score": 100, "matched": true, "detail": "No geographic restrictions"}, "completeness_bonus": {"score": -28, "profile_score": 78}}, "stage": {"score": 100, "explanation": "Pre-seed is preferred stage"}}',
    '{"summary": "Good match - early stage with strong traction signals", "strengths": ["Pre-seed stage is Seed Studio focus", "50K downloads shows early traction", "Viral TikTok presence is differentiator", "Small check size fits fund model"], "considerations": ["Profile completeness could be improved (78%)", "No revenue yet"]}',
    'pending', '1.0.0'
);

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================

ANALYZE founders;
ANALYZE funders;
ANALYZE matches;
