# /api-documenter

Generate OpenAPI documentation from TypeScript code.

## Usage

```
/api-documenter [action]
```

## Actions

### generate
Create OpenAPI spec from source code.

```
/api-documenter generate
```

Output: `docs/openapi.yaml`

### validate
Check code matches existing spec.

```
/api-documenter validate
```

### examples
Generate example payloads for each endpoint.

```
/api-documenter examples
```

Output: `docs/examples/`

## Endpoints to Document

### GET /health
Health check endpoint.

### POST /match/:founderId
Get ranked matches for a founder.

Request: None (founder ID in path)

Response:
```json
{
  "success": true,
  "founder_id": "uuid",
  "match_count": 5,
  "matches": [
    {
      "funder_id": "uuid",
      "funder_name": "Jennifer Wu",
      "firm_name": "Horizon Ventures",
      "total_score": 87.5,
      "semantic_score": 82.3,
      "rule_score": 100,
      "stage_score": 75,
      "reasoning": {
        "semantic": "Strong thesis alignment",
        "rules": {
          "industryMatch": 25,
          "checkSizeFit": 25,
          "geographicMatch": 25,
          "completenessBonus": 25
        },
        "stage": "Adjacent stage match"
      }
    }
  ],
  "match_quality": {
    "excellent": 1,
    "good": 3,
    "fair": 1
  }
}
```

### POST /ingest/founder
Ingest new founder profile from intake form.

Request:
```json
{
  "name": "Sarah Chen",
  "email": "sarah@medisync.ai",
  "company_name": "MediSync AI",
  "industry_sector": "healthcare",
  "company_stage": "seed",
  "problem_statement": "...",
  "solution_description": "...",
  "raise_amount": 2500000,
  "geographic_location": "San Francisco"
}
```

Response:
```json
{
  "success": true,
  "founder_id": "uuid",
  "profile_completeness": 85,
  "raise_hand_eligible": true,
  "initial_matches": [...]
}
```

## OpenAPI Template

```yaml
openapi: 3.0.3
info:
  title: Phalanx Matching API
  version: 1.0.0
  description: AI-powered founder-funder matching engine

servers:
  - url: https://phalanx-matcher.workers.dev
    description: Production
  - url: http://localhost:8787
    description: Development

paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
          
  /match/{founderId}:
    post:
      summary: Get matches for founder
      parameters:
        - name: founderId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Match results
          
  /ingest/founder:
    post:
      summary: Ingest new founder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FounderInput'
      responses:
        '200':
          description: Founder created
```

## Integration Guide Output

Also generate `docs/INTEGRATION.md` for Jake and Paul with:
- Webhook payload schema
- Authentication requirements
- Error handling
- Rate limits
- Example curl commands
