# Pre-Deploy Hook

Runs before deploying to Cloudflare Workers.

## Checklist

1. **Environment Secrets** - Verify all secrets are set
2. **API Contract** - Validate OpenAPI spec matches code
3. **Database Migration** - Check schema is up to date
4. **Health Endpoint** - Verify /health returns 200

## Secret Verification

```bash
# Check secrets exist (won't show values)
wrangler secret list

# Required secrets:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - OPENAI_API_KEY
```

## Smoke Test

Run quick smoke test against staging:

```bash
# Deploy to staging first
wrangler deploy --env staging

# Health check
curl https://phalanx-matcher-staging.workers.dev/health

# Test match endpoint with known good founder
curl -X POST https://phalanx-matcher-staging.workers.dev/match/test-founder-1
```

## Rollback Plan

If deploy fails:
1. `wrangler rollback` to previous version
2. Check logs: `wrangler tail`
3. Fix issue and redeploy

## Production Checklist

Before production deploy:
- [ ] All tests passing
- [ ] Staging smoke test passed
- [ ] No console.log statements
- [ ] Error handling complete
- [ ] Rate limiting configured
