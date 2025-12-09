# Cloudflare Workers + Hono API Patterns

## Basic Worker Structure

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/*', cors());
app.use('/*', logger());

// Routes
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

## Environment Variables

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "development"

# Set secrets via CLI:
# wrangler secret put SUPABASE_URL
# wrangler secret put SUPABASE_ANON_KEY
# wrangler secret put OPENAI_API_KEY
```

## Error Handling Middleware

```typescript
import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

## Request Validation

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const founderSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company_name: z.string().min(1),
  industry_sector: z.string(),
  raise_amount: z.number().positive(),
});

app.post('/founders', 
  zValidator('json', founderSchema),
  async (c) => {
    const data = c.req.valid('json');
    // Process validated data
  }
);
```

## Async Handler Pattern

```typescript
app.post('/match/:founderId', async (c) => {
  const founderId = c.req.param('founderId');
  
  try {
    const matches = await findMatches(founderId, c.env);
    return c.json({ success: true, matches });
  } catch (error) {
    throw new HTTPException(500, { 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
```

## Response Helpers

```typescript
// Success response
return c.json({
  success: true,
  data: result,
  meta: { count: result.length }
});

// Error response
return c.json({
  success: false,
  error: 'Validation failed',
  details: errors
}, 400);

// No content
return c.body(null, 204);
```

## Deployment Commands

```bash
# Development
wrangler dev

# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Tail logs
wrangler tail
```

## Testing with Miniflare

```typescript
import { unstable_dev } from 'wrangler';

describe('API', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('health check', async () => {
    const resp = await worker.fetch('/health');
    expect(resp.status).toBe(200);
  });
});
```
