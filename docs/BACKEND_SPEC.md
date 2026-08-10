# AI Trading Research Server Specification

Status: Revised implementation specification  
Date: 2026-08-05  
Scope: server-side analysis logic hosted with the web application  
Out of scope: frontend UI/UX, brokerage execution, portfolio management, and personalized financial advice

## 1. Product objective

The application turns market and company data into a structured AI-assisted equity research report. The application calculates financial metrics deterministically and uses one configured AI model to interpret those values. The model does not fetch market data, execute tools, debate with other models, or replace canonical calculations.

The initial workflow is:

1. The user submits a company or ticker and an optional research focus.
2. The server resolves the supported instrument and fetches market data from Business Quant.
3. TypeScript normalizes the provider response and calculates financial metrics.
4. The server applies deterministic data-quality checks.
5. One Gemini model receives a bounded evidence packet in one request.
6. The model returns one structured report containing conservative, moderate, and aggressive perspectives.
7. The server validates the response and returns it directly to the browser.

The product provides educational research. It does not execute trades, manage funds, determine position size, or guarantee returns.

## 2. Locked architecture decisions

| Concern | Decision |
|---|---|
| Application framework | Next.js App Router |
| Language | TypeScript |
| Frontend | React inside the same Next.js project |
| Server boundary | Next.js Route Handlers running as Vercel Functions |
| Market data | Business Quant |
| AI gateway | Gemini API direct |
| AI execution | One explicit model and one model call per successful analysis |
| Financial calculations | Pure TypeScript functions |
| Hosting | One Vercel project |
| Persistence | None required for the initial version |
| Authentication | None required for the initial version |
| Request model | Synchronous `POST /api/analyze` |
| Secrets | Vercel server-side environment variables |

The initial version does not require Python, FastAPI, Uvicorn, Azure, Docker, a separate backend service, Supabase, a queue, a background runner, multi-agent orchestration, AI debate, AI tool-calling, or model memory.

“No separate backend” means there is no independently deployed backend server. Sensitive work still runs server-side in a Route Handler so provider keys never enter the browser bundle.

## 3. System architecture

```mermaid
flowchart LR
    U[Browser] -->|POST /api/analyze| R[Next.js Route Handler]
    R --> V[Input validation]
    V --> BQ[Business Quant]
    BQ --> N[Normalize market data]
    N --> M[TypeScript metric engine]
    M --> Q[Data-quality gate]
    Q --> O[One Gemini model call]
    O --> X[Output validation]
    X --> U
```

All stages execute within one server request. No analysis job is created and the frontend does not poll for progress. The UI may show local stage labels while waiting, but those labels are presentation state rather than persisted server state.

## 4. Initial product boundaries

Included:

- US-listed common stocks supported by Business Quant.
- Company-name or ticker input with explicit ambiguity handling.
- Latest available market and financial data.
- Indonesian report output by default.
- Deterministic financial metrics and data-quality warnings.
- One final report with conservative, moderate, and aggressive perspectives.
- One server-side AI call per completed analysis.
- Fixture-based tests that do not consume provider quota.
- Deployment as one Next.js project on Vercel.

Deferred:

- User accounts, saved history, shared reports, and database persistence.
- Multiple AI models, debate, review loops, consensus, and autonomous tools.
- Background processing, queues, cancellation, retry jobs, and progress polling.
- News and sentiment feeds as required inputs.
- ETFs, non-US exchanges, crypto, forex, options, and brokerage integration.
- Historical date selection, backtesting, portfolio analysis, and position sizing.
- Production-scale abuse prevention, distributed rate limiting, and paid infrastructure.

## 5. Request and response contract

### 5.1 Request

`POST /api/analyze`

```json
{
  "query": "AAPL",
  "focus": "Periksa fundamental, valuasi, dan risiko utama"
}
```

Rules:

- `query` is trimmed and limited to 1-100 characters.
- `focus` is optional, trimmed, and limited to 500 characters.
- Empty input, unsupported symbols, and ambiguous company matches return typed client errors.
- Ambiguous matches return the complete bounded candidate list so the user can select the intended instrument.
- The request body has a strict size limit.

### 5.2 Successful response

```json
{
  "requestId": "uuid",
  "instrument": {},
  "snapshot": {},
  "metrics": [],
  "quality": {},
  "report": {
    "summary": { "text": "...", "metricIds": ["roa"] },
    "strengths": [{ "text": "...", "metricIds": ["roa"] }],
    "risks": [{ "text": "...", "metricIds": ["der"] }],
    "uncertainties": [{ "text": "...", "metricIds": ["volatility"] }],
    "limitations": [],
    "profiles": {
      "conservative": {},
      "moderate": {},
      "aggressive": {}
    },
    "disclaimer": "..."
  }
}
```

### 5.3 Error response

```json
{
  "requestId": "uuid",
  "error": {
    "code": "PROVIDER_RATE_LIMITED",
    "message": "Data pasar sedang tidak tersedia. Coba lagi nanti.",
    "retryable": true
  }
}
```

Internal provider messages, stack traces, prompts, and credentials must never be returned.

`AMBIGUOUS_INSTRUMENT` responses include `error.candidates`. Local repeat-request throttling uses `REQUEST_RATE_LIMITED`; provider quota exhaustion remains `PROVIDER_RATE_LIMITED`. An application-wide deadline uses `ANALYSIS_TIMEOUT`.

## 6. Domain contracts

Domain contracts are plain TypeScript types and schemas independent of React components and provider SDKs.

| Contract | Responsibility |
|---|---|
| `AnalysisRequest` | Validated user query and focus |
| `Instrument` | Canonical ticker, company name, exchange, currency, and region |
| `Evidence` | Stable ID, source, effective date, and value reference |
| `CorporateAction` | Bounded structured event with canonical kind, optional counterparty/value, and stable evidence ID |
| `CorporateActionEnrichment` | `available`, `empty`, or `unavailable` status plus normalized events and warnings |
| `Metric` | Canonical value, unit, formula ID, status, warnings, and evidence IDs |
| `MarketSnapshot` | Normalized point-in-time market and financial data |
| `QualityAssessment` | Deterministic score, flags, and AI eligibility |
| `ProfileRecommendation` | One risk-profile perspective and rating |
| `FinalReport` | Validated analysis containing exactly three profiles |
| `AnalyzeResponse` | Public response returned by the Route Handler |

Required enums or unions:

- `RiskProfile`: `conservative`, `moderate`, `aggressive`
- `Rating`: `positive`, `neutral`, `negative`
- `MetricStatus`: `available`, `not_available`, `not_meaningful`
- `QualityFlag`
- `ErrorCode`

Required version constants:

- domain schema version;
- market snapshot version;
- metric-policy version;
- AI prompt version;
- report schema version.

### 6.1 Semantic grounding contract

Every grounded report claim uses `{ text, metricIds }`. `metricIds` must contain at least one unique ID from the available canonical metrics in the packet. This applies to `summary`, every item in `strengths`, `risks`, and `uncertainties`, and each profile `thesis` and `considerations` item. `limitations` remain disclosure strings and do not assert new facts.

The allowed metric IDs are `der`, `current_ratio`, `roa`, `roe`, `eps_ttm`, `pe`, `book_value_per_share`, `pbv`, `gross_margin`, `operating_margin`, `net_margin`, `free_cash_flow`, `fcf_margin`, `roic`, `price_return`, and `volatility`. A central policy maps claim categories to the metrics that may support them: valuation, leverage, liquidity, earnings, profitability, cash flow, and market risk. Claims about market share, competition, strategy, innovation, macroeconomics, regulation, sentiment, news, forecasts, or other external facts are rejected.

Numeric literals in grounded claim text must match a cited canonical metric value within a small rounding tolerance; grouped separators, decimal comma, and explicit `ribu/juta/miliar` or `K/M/B/T` scales are normalized before comparison. ISO dates and years are not metric values. Ratio metrics may be written as percentages only when explicitly marked with `%`. Corporate-action terminology, including `ticker changed`, `perubahan ticker`, and `berganti simbol`, is not permitted in ordinary grounded prose, including neutral descriptions. It belongs in `corporateActionClaims` or a limitation field.

Confidence is bounded to `0.40`–`0.85`. The rubric is `0.40`–`0.59` for limited or conflicting evidence, `0.60`–`0.74` for sufficient evidence with limitations, and `0.75`–`0.85` for strong evidence. Degraded quality caps every profile at `0.70` and requires limitations.

Equivalent structured inputs use deterministic serialization and SHA-256 hashing where stable identity is needed for tests, evidence, and future caching.

## 7. Instrument resolution

Resolution behavior:

1. Normalize user input without altering a plausible ticker.
2. If it matches the supported ticker format, verify it against provider data.
3. Otherwise use the cached Business Quant equity universe.
4. Filter unsupported regions and instrument types.
5. Continue only for one strong match.
6. Return explicit candidates when the input remains ambiguous.

The server must never silently select a company when multiple plausible matches remain.

## 8. Market-data acquisition

The minimum useful snapshot may consume:

- Business Quant equity universe for resolution, cached for 24 hours;
- Business Quant stock profile for identity and company metadata;
- quarterly IS, BS, and CF requests in parallel;
- strictly historical EOD OHLCV prices.
- Business Quant Corporate Actions enrichment for structured events in the last year.

Provider rules:

- API keys are read only from server-side environment variables.
- Business Quant origin and endpoint paths are fixed by the adapter; the API key is sent only as a query parameter.
- One uncached ticker uses at most six provider calls: profile, IS, BS, CF, EOD prices, and Corporate Actions. The universe cache is excluded from this limit.
- Corporate Actions uses the fixed `/corporate_actions` endpoint with `ticker`, `period=1y`, `action=all`, and `limit=100`. It is structured event data, not news or articles.
- Corporate Actions rows are validated against the resolved ticker, sorted newest-first, deduplicated deterministically, and normalized to bounded canonical kinds. Empty results are valid; unavailable enrichment keeps the main analysis running with an explicit status and warning.
- Corporate Actions keeps at most 100 normalized events in the snapshot and at most 20 newest events in the AI evidence packet. Notes are untrusted bounded text with control characters removed.
- Only the `general` financial-statement template is supported; other templates produce a typed safe failure.
- Statement values use only `reportedValue.raw`; provider payloads are parsed into normalized records before metrics or Gemini.
- EOD records require finite positive OHLC values, valid dates, and valid OHLC invariants. Identical-date duplicates are collapsed with the largest volume; conflicting OHLC duplicates fail.
- Every call has an abort timeout.
- Retry at most once for a transient network or server failure.
- Do not immediately retry a provider rate-limit response.
- Distinguish invalid key, quota exceeded, symbol not found, timeout, malformed payload, and upstream failure.
- Never log complete request URLs when they contain provider credentials.
- Never send complete raw provider payloads to Gemini.
- Never adjust historical prices automatically for splits, and never describe price return as total shareholder return. If a split is present while adjusted-price status is unverified, affected price metrics carry a warning.
- Provider quota assumptions are configurable and are not hard-coded to a specific commercial plan.

The initial implementation may reuse a completed result in the current browser session. Durable cross-user caching is deferred until persistence is actually needed.

## 9. Normalization and evidence

Normalization must:

- parse numeric strings into finite numbers;
- map provider placeholders and unsupported values to `null`;
- retain currency, fiscal period, and effective date;
- sort and deduplicate periods;
- select the latest valid rows without look-ahead data;
- reject currency-incompatible calculations;
- assign stable evidence IDs;
- prevent `NaN` and infinity from entering JSON.

Every metric references the evidence used to calculate it. The final AI report grounds ordinary claims with available metric IDs; only dedicated Corporate Action claims may cite short aliases that resolve to packet evidence IDs.

## 10. Deterministic metric engine

The AI never supplies or replaces canonical metric values.

| Metric | Formula |
|---|---|
| EPS TTM | Sum of the latest four valid quarterly diluted EPS values |
| P/E | Effective close / EPS TTM |
| Book value per share | Total equity / diluted shares |
| P/BV | Effective close / book value per share |
| DER | Total liabilities / total equity |
| Current ratio | Current assets / current liabilities |
| Gross margin | TTM gross profit / TTM revenue |
| Operating margin | TTM operating income / TTM revenue |
| Net margin | TTM net income / TTM revenue |
| ROA | TTM net income / average total assets |
| ROE | TTM net income / average total equity |
| ROIC | NOPAT / average operating invested capital, where operating invested capital = total assets - total current liabilities |
| Free cash flow | Operating cash flow - capital expenditure |
| FCF margin | TTM free cash flow / TTM revenue |
| Price return | Latest close / comparison close - 1 |
| Volatility | Annualized standard deviation of daily returns |

`ROI` is represented by clearly named measures such as ROIC and price return. `EAR` remains excluded until its intended definition is confirmed.

Invalid calculation rules:

- a zero denominator returns `null`;
- negative equity marks affected metrics as not meaningful;
- negative EPS makes P/E not meaningful;
- partial TTM data is explicitly flagged;
- insufficient prices disable return or volatility metrics;
- currency mismatch returns `null` with a warning.

## 11. Data-quality gate

The server derives a deterministic quality assessment from source completeness, freshness, statement consistency, and metric availability.

| Result | Behavior |
|---|---|
| Insufficient | Stop before Gemini and return `INSUFFICIENT_DATA` |
| Degraded | Continue, disclose limitations, and cap confidence |
| Sufficient | Continue with the full output contract |

The model may explain quality flags but cannot remove or override them.

## 12. Single-model AI analysis

One explicit Gemini GA model ID is configured server-side. A successful analysis makes exactly one model request.

The evidence packet contains only:

- resolved instrument identity;
- effective date;
- normalized company facts needed for interpretation;
- canonical metrics and statuses;
- quality flags;
- bounded Corporate Actions events with their evidence IDs and enrichment status;
- user focus delimited as untrusted text;
- available metric IDs for claim grounding;
- short aliases only for Corporate Action evidence;
- required output schema and policy instructions.

The model returns:

- executive summary;
- fundamental and valuation interpretation;
- strengths, risks, uncertainties, and limitations;
- exactly one conservative perspective;
- exactly one moderate perspective;
- exactly one aggressive perspective;
- metric IDs on every grounded claim;
- Corporate Actions only in `corporateActionClaims`, each tied to a Corporate Action alias that is mapped back to canonical evidence server-side; provider `notes` are bounded context fields, not articles or news.
- educational disclaimer.

The three perspectives are sections of one report, not separate AI agents or separate requests.

The Gemini provider wire contract uses a compact `responseJsonSchema` with one flat `items` array. Each item carries only `kind`, `profile`, `rating`, `confidence`, `text`, and `referenceIds`; it uses no `$defs`, `$ref`, long enums, or repeated nested sections. The adapter validates cardinality and field roles, maps evidence aliases, assembles the public report shape, and then runs `FinalReportSchema` plus semantic validation. This provider shape does not change the public API or the canonical report contract.

Output validation must reject:

- malformed JSON;
- missing or duplicate profiles;
- unsupported ratings;
- confidence outside its bounds;
- unknown or unavailable metric IDs;
- claims whose category is not supported by the cited metric policy;
- Corporate Action claims without Corporate Action evidence;
- model-generated canonical metric replacements;
- personalized trade sizes or guaranteed-return language.

Malformed or schema-invalid model output fails the request with a safe typed error. The server does not perform an automatic repair call, keeping the one-request AI contract explicit.

## 13. Route Handler behavior

`POST /api/analyze` performs:

1. request ID creation;
2. request-size and schema validation;
3. a lightweight per-instance rate-limit check;
4. instrument resolution;
5. market-data retrieval;
6. normalization and metric calculation;
7. data-quality assessment;
8. one Gemini analysis request;
9. final-report validation;
10. safe response serialization.

The handler uses the Node.js runtime, not the Edge runtime, unless all dependencies and time limits are explicitly verified. The request must remain within the configured Vercel Function duration. Every external call has a shorter timeout so the handler can return a controlled error before platform termination.

## 14. Security and privacy

Required controls:

- `BUSINESS_QUANT_API_KEY` and `GEMINI_API_KEY` are server-only variables and never use the `NEXT_PUBLIC_` prefix;
- no provider or AI call is made directly from a Client Component;
- fixed provider origins and methods;
- strict input and output schemas;
- prompt delimiters around all user and provider text;
- no secrets, authorization headers, raw prompts, or provider query strings in logs;
- generic client-facing errors with typed internal causes;
- request body and text-length limits;
- bounded provider calls, model tokens, timeouts, and retries;
- a disclaimer in every successful report.

Client-side throttling is not a security control. The first version may use lightweight per-instance throttling for accidental repetition, but stronger public abuse protection requires a durable rate-limit store or platform protection and is deferred.

## 15. Configuration contract

Required server-side environment variables:

```text
BUSINESS_QUANT_API_KEY
GEMINI_API_KEY
GEMINI_MODEL_ID
```

Optional configuration:

```text
ANALYSIS_OUTPUT_LANGUAGE=id
MARKET_DATA_TIMEOUT_MS
GEMINI_TIMEOUT_MS
GEMINI_MAX_OUTPUT_TOKENS
ANALYZE_MAX_DURATION_SECONDS
```

Local values live in `.env.local`, which must be ignored by Git. Hosted values are configured in Vercel. Startup or request initialization fails safely when required configuration is missing.

## 16. Project structure

```text
app/
  api/
    analyze/
      route.ts
  ...frontend routes
lib/
  domain/
  market-data/
  metrics/
  quality/
  ai/
  server/
tests/
  fixtures/
  unit/
  integration/
checklists/
```

Server-only modules must not be imported by Client Components. Provider adapters, secrets, and Gemini code remain below `lib/server` or explicitly use `server-only` boundaries.

## 17. Testing strategy

Required automated coverage:

- request validation and typed errors;
- instrument resolution and ambiguity;
- provider fixture parsing and malformed responses;
- every metric formula and invalid-calculation rule;
- deterministic quality decisions;
- deterministic evidence-packet construction;
- valid and invalid model outputs;
- exactly three risk profiles;
- unknown evidence rejection;
- Route Handler success and failure contracts;
- secret-redaction checks;
- proof that normal success uses one model request.

Default tests use fixtures and fake model responses. Live Business Quant and Gemini checks are opt-in and never run in normal CI.

## 18. Deployment

The complete application deploys as one Vercel project. The deployment must verify:

- the Next.js build succeeds;
- server-only environment variables are configured;
- `/api/analyze` uses the Node.js runtime;
- external timeouts fit inside the Function duration;
- one known fixture-backed analysis passes;
- one controlled live analysis succeeds when provider quota is available;
- no key appears in browser source, response bodies, or logs.

Vercel Hobby can support personal demonstration within its current usage limits. Business Quant and Gemini retain their own independent quotas and costs.

## 19. Definition of done

The server-side analysis is complete when:

- one Next.js project contains both UI and server logic;
- no Python, FastAPI, Azure, database, queue, or separate backend is required at runtime;
- a valid company or ticker produces normalized market data and deterministic metrics;
- insufficient data stops before the AI call;
- one configured model produces one schema-valid report with exactly three risk perspectives;
- canonical values originate from TypeScript calculations rather than the model;
- provider and model failures return stable, safe errors;
- tests pass without live network calls;
- the Vercel deployment completes one controlled end-to-end analysis without exposing secrets.

## 20. Extension path

If the product later needs login, history, shared reports, durable caching, or public abuse protection, Supabase or another managed database can be added behind repository interfaces. If analyses later exceed synchronous Function limits, the workflow can move to a durable job system. Neither extension is required for the initial application.
