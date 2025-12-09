Generate API documentation for the Phalanx Matching API.

## Your Task

Create comprehensive API documentation from the source code.

## Steps

1. Read all files in `src/` to understand the API endpoints
2. Read `PLANNING/EXECUTION-PLAN.md` for expected request/response shapes
3. Generate documentation in `docs/`:
   - `openapi.yaml` - OpenAPI 3.0 specification
   - `INTEGRATION.md` - Integration guide for Jake and Paul
   - `examples/` - Example request/response payloads

## OpenAPI Spec Requirements

Include for each endpoint:
- Summary and description
- Request parameters (path, query, body)
- Request body schema with examples
- Response schemas for all status codes
- Error response formats

## Endpoints to Document

### GET /health
Health check endpoint.

### POST /match/:founderId  
Get ranked matches for a founder.
- Path param: `founderId` (UUID)
- Response: Match results with scores and reasoning

### POST /ingest/founder
Ingest new founder profile (webhook from Jake's intake).
- Request body: Founder profile fields
- Response: Created founder with completeness score and initial matches

## Integration Guide Requirements

Write `docs/INTEGRATION.md` for Jake and Paul including:
- Authentication requirements
- Webhook payload schema for `/ingest/founder`
- Example curl commands for each endpoint
- Error handling guide
- Rate limiting info
- How to test locally vs production

## Example Payloads

Create `docs/examples/` with:
- `ingest-founder-request.json`
- `ingest-founder-response.json`
- `match-response.json`
- `error-response.json`

Generate the documentation now.
