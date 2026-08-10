# AI Trading Research Server Implementation Plan

Status: Revised for Next.js and Vercel  
Date: 2026-08-05  
Source of truth: `BACKEND_SPEC.md`

## 1. Delivery objective

Implement the complete server-side analysis flow inside one Next.js TypeScript project:

```text
validated request
-> resolved instrument
-> Business Quant data
-> normalized snapshot
-> deterministic metrics
-> quality gate
-> one Gemini analysis
-> validated final report
-> HTTP response
```

The plan intentionally excludes Python, FastAPI, Azure, Supabase, authentication, persistence, queues, background workers, AI debate, and multi-model orchestration.

## 2. Implementation principles

1. Build the smallest complete vertical slice before adding optional metrics.
2. Keep calculations pure and testable without Next.js or network access.
3. Keep provider and AI integrations behind typed interfaces.
4. Use fixtures and fakes by default; live calls are opt-in.
5. Keep secrets and external calls server-only.
6. Make one successful analysis use one model request.
7. Treat all AI output as untrusted until validated.
8. Stop before AI when source quality is insufficient.
9. Do not preserve obsolete Python architecture merely for compatibility; it is reference material, not the target runtime.

## 3. Target structure

```text
app/
  api/analyze/route.ts
  ...frontend
lib/
  domain/
    contracts.ts
    errors.ts
    versions.ts
  market-data/
    business-quant.ts
    business-quant-parsers.ts
    normalize.ts
    resolve-instrument.ts
    types.ts
  metrics/
    calculate.ts
    formulas.ts
    types.ts
  quality/
    assess.ts
  ai/
    evidence-packet.ts
    gemini.ts
    gemini-schema.ts
    prompt.ts
    report-schema.ts
  server/
    config.ts
    logger.ts
    analyze.ts
tests/
  fixtures/
  unit/
  integration/
checklists/
```

The final frontend structure may add components and routes, but it must consume the same public `POST /api/analyze` contract.

## 4. Milestone 0 — reset foundation and freeze contracts

### Deliverables

- Create or confirm a Next.js App Router project with TypeScript.
- Pin the Node.js version used by both developers and Vercel.
- Add scripts for development, build, lint, type-check, and test.
- Install only the initial dependencies needed for schemas and tests.
- Keep `.env*`, provider keys, build output, coverage, and local reference material ignored.
- Define the public request, response, error, metric, quality, evidence, and report contracts.
- Define schema and policy version constants.
- Add deterministic serialization and hashing utilities only where required.
- Mark the existing Python package and `.venv` as superseded local artifacts; do not import them into the web application.
- Replace the old milestone checklist scheme with the revised Next.js milestone names before implementation logging resumes.

### Tests and validation

- TypeScript compiles with strict mode.
- Domain modules import without React, Next.js runtime, provider SDKs, or AI SDKs.
- Request and report schemas accept valid fixtures and reject invalid fixtures.
- Exactly three risk profiles are required.
- Equivalent inputs serialize and hash consistently.
- `npm run lint`, `npm run typecheck`, and the M0 test command pass.

### Gate

The project boots locally, contracts are frozen for the first vertical slice, and no server secret can enter a client bundle.

## 5. Milestone 1 — market-data adapter and instrument resolution

### Deliverables

- Implement a small `MarketDataProvider` interface.
- Implement the Business Quant adapter using server-side `fetch`.
- Resolve company names from the `security_type=Equity` universe with a 24-hour bounded cache.
- Fetch profile, quarterly IS/BS/CF, `mode=eod` prices, and Corporate Actions with no more than six uncached-ticker calls.
- Parse `/corporate_actions` using `period=1y`, `action=all`, and `limit=100`; keep it as optional structured enrichment with explicit unavailable status.
- Accept only the `general` statement template and parse nested sections using `reportedValue.raw`.
- Add timeouts with `AbortController`.
- Add at most one retry for transient transport or upstream server failures.
- Classify invalid key, rate limit, timeout, malformed payload, not found, and upstream errors.
- Implement ticker verification and company-name search.
- Return candidates rather than guessing ambiguous companies.
- Fetch the minimum source set needed by the metric engine.
- Redact provider keys and sensitive query values from logs.
- Add recorded, minimal, sanitized Business Quant fixtures for every required response.
- Preserve only matching-ticker Corporate Actions rows, map raw action variants to canonical kinds, bound untrusted notes, and retain related counterparty fields.

### Tests

- Exact ticker resolution succeeds.
- Company name resolves only when one strong supported match exists.
- Ambiguous input returns candidates.
- Unsupported instruments are rejected.
- Valid, missing, malformed, timeout, invalid-key, and rate-limit fixtures map to stable results.
- No test makes an accidental live network call.
- Captured logs contain no fake provider key.

### Gate

A fixture-backed request can produce a typed set of raw provider records without React, Gemini, or live network access.

## 6. Milestone 2 — normalization, metrics, evidence, and quality

### Deliverables

- Parse provider numbers, dates, currencies, and fiscal periods.
- Convert unsupported values to `null` and reject non-finite numbers.
- Sort, deduplicate, and select the latest valid periods.
- Build an immutable `MarketSnapshot`.
- Assign stable evidence IDs and effective dates.
- Implement pure formulas for the required first-release metrics.
- Attach units, formula IDs, statuses, warnings, and evidence IDs.
- Implement invalid-calculation behavior for zero denominators, negative equity, negative EPS, partial periods, missing prices, and currency mismatches.
- Implement deterministic data-quality assessment.
- Produce a bounded evidence document for later AI use.
- Include at most 20 newest Corporate Actions events in the evidence packet and state that they are structured events rather than news.

### Metric priority

Implement in this order:

1. DER, current ratio, ROA, ROE.
2. EPS TTM, P/E, P/BV.
3. gross, operating, and net margin.
4. free cash flow and FCF margin.
5. ROIC, price return, and volatility.

Lower-priority metrics may be omitted from the first vertical slice if their source data is unreliable, provided the omission is explicit and does not change existing formula semantics.

### Tests

- Formula fixtures are independently hand-calculated.
- Missing and malformed values never become zero silently.
- `NaN` and infinity never enter serialized output.
- Negative equity and EPS have explicit statuses.
- Future rows cannot enter the selected snapshot.
- Equivalent snapshots produce stable evidence IDs.
- Corporate Actions events sort/deduplicate deterministically, retain stable evidence IDs, and do not alter historical prices.
- A split without verified adjusted prices adds warnings to relevant price metrics; unavailable Corporate Actions do not stop the main pipeline.
- Quality boundaries deterministically stop, degrade, or permit analysis.

### Gate

Fixtures can produce a complete snapshot, metric set, evidence set, and quality decision with zero AI calls.

## 7. Milestone 3 — one-model analysis pipeline

### Deliverables

- Configure one explicit Gemini GA model ID from a server-only variable.
- Build a deterministic, size-bounded evidence packet.
- Clearly delimit user focus and provider text as untrusted input.
- Define one system instruction and one versioned prompt contract.
- Request one structured final report containing all three risk perspectives.
- Keep the Gemini provider schema flat with one basic `items` array and string references; move section cardinality, profile/rating rules, metric availability, and evidence membership into local validation before constructing the public report.
- Validate model output before it enters the public response.
- Reject unknown evidence IDs, unsupported ratings, missing profiles, and invalid confidence.
- Use granular `{ text, metricIds }` claims for summary, strengths, risks, uncertainties, thesis, and considerations; only available metric IDs are allowed.
- Enforce one central metric policy for valuation, leverage, liquidity, earnings, profitability, cash flow, and market risk; reject unsupported external claims.
- Compare numeric literals in grounded prose with the cited canonical metric value and unit before accepting the report.
- Reject corporate-action terminology in ordinary grounded prose; reserve it for the structured Corporate Action claim or limitations.
- Keep Corporate Action citations separate with short aliases mapped back to canonical evidence IDs, and allow no claims when no Corporate Action evidence exists.
- Apply the `0.40`–`0.85` confidence rubric and cap degraded reports at `0.70` with required limitations.
- Ensure model prose cannot replace canonical metric values.
- Return a safe typed failure for malformed model output without making an automatic repair call.
- Capture request ID, model ID, latency, token usage when available, and typed failure without storing secrets or hidden reasoning.

### Tests

- A valid fake response produces one final report.
- The flat provider schema uses only basic scalar/array/object types without nested profile sections or request-specific enums.
- Flat items are grouped and normalized to the public conservative/moderate/aggressive profile object.
- Normal success invokes the model adapter exactly once.
- Malformed JSON and invalid schemas are rejected.
- A schema failure makes no follow-up model call and returns a controlled error.
- Missing, duplicate, and unknown profiles are rejected.
- Unknown evidence IDs are rejected.
- Unknown, unavailable, or policy-incompatible metric IDs are rejected.
- Claims about external facts and Corporate Actions without their dedicated evidence are rejected.
- Confidence boundaries and degraded-quality caps are enforced.
- Numeric claims match canonical metric values and percentage units.
- Earnings-per-share claims are grounded by `eps_ttm`, and ordinary corporate-action prose is rejected.
- Natural number formatting, scale suffixes, dates/years, and `ticker_change` prose variants are covered by regression tests.
- Degraded quality caps confidence and preserves limitations.
- Prompts contain bounded evidence and no raw provider payload.
- No path contains debate, consensus, tool-calling, or model memory.

### Gate

One fixture-backed snapshot produces one validated report with conservative, moderate, and aggressive sections through one normal model call.

## 8. Milestone 4 — analysis service and Route Handler

### Deliverables

- Implement an `analyze` application service that composes resolution, data, metrics, quality, AI, and validation.
- Add `POST /api/analyze` using the Node.js runtime.
- Validate body size, query, focus, and content type.
- Generate and return a request ID.
- Add lightweight per-instance throttling for accidental repeat requests.
- Apply an overall request deadline shorter than the Vercel Function maximum.
- Return stable status codes and user-safe error bodies.
- Keep provider and AI modules unreachable from Client Components.
- Return source effective dates, metric warnings, quality limitations, and disclaimer.
- Do not add polling endpoints, job IDs, cancellation routes, or background loops.

### Tests

- Handler contract tests cover valid request, invalid body, ambiguity, insufficient data, provider limit, provider timeout, model failure, invalid model output, and success.
- Insufficient quality makes zero model calls.
- Normal success makes the bounded provider calls and one model call.
- Responses contain no provider keys, authorization headers, raw prompts, or stack traces.
- A slow dependency is aborted before the application deadline.

### Gate

The complete fixture-backed workflow runs through `POST /api/analyze` and returns the public response contract.

## 9. Milestone 5 — hardening and acceptance

### Deliverables

- Add strict configuration validation.
- Add structured, redacted server logging.
- Add response security headers where appropriate.
- Add dependency audit and secret scan commands.
- Add deterministic fixture-only end-to-end coverage.
- Add opt-in live smoke tests with explicit call ceilings.
- Document common errors: provider quota, invalid ticker, insufficient data, model unavailable, malformed model output, and Function timeout.
- Verify that browser code cannot reference server-only configuration.

### Required acceptance scenarios

1. Exact ticker returns a report with three perspectives.
2. Company-name ambiguity returns candidates without an AI call.
3. Invalid provider data stops before metrics or AI as appropriate.
4. Insufficient quality makes zero AI calls.
5. Normal success makes exactly one AI call.
6. Invalid AI output is never returned as a successful report.
7. Unknown evidence IDs are rejected.
8. Metric edge cases never emit invalid JSON numbers.
9. Provider and model failures return safe, typed errors.
10. Fake secrets never appear in logs or HTTP responses.

### Gate

All required scenarios pass repeatedly with fixtures and fake model responses. One controlled live request succeeds when quota is available.

## 10. Milestone 6 — Vercel deployment and verification

### Deliverables

- Connect the Next.js repository to one Vercel project.
- Pin the supported Node.js runtime version.
- Configure Business Quant and Gemini keys as server-side environment variables.
- Configure one explicit Gemini GA model ID.
- Verify Function runtime and duration settings.
- Run build, type-check, tests, and secret scan before deployment.
- Deploy Preview and Production environments.
- Perform fixture-backed and controlled live verification.
- Document environment setup, deployment, rollback, key rotation, and quota troubleshooting.

### Deployment verification

- The production page loads successfully.
- Browser source and network responses expose no secret.
- A known ticker completes end to end.
- An ambiguous company is handled explicitly.
- A provider quota error is understandable and retryable where appropriate.
- The report contains source dates, metrics, quality limitations, three perspectives, and disclaimer.
- Runtime duration stays within the configured Vercel limit.

### Gate

The same acceptance flow passes locally and on Vercel without Python, Azure, or a separately deployed backend.

## 11. Seven-day delivery map

| Day | Primary target |
|---:|---|
| 1 | M0: Next.js foundation, contracts, schemas, and test setup |
| 2 | M1: Business Quant adapter, resolution, errors, and fixtures |
| 3 | M2: normalization, core metrics, evidence, and quality gate |
| 4 | M3: Gemini prompt, one-call report, and output validation |
| 5 | M4: analysis service, Route Handler, and frontend contract support |
| 6 | M5: integration tests, failure paths, redaction, and live smoke check |
| 7 | M6: Vercel deployment, end-to-end verification, and bug fixing |

If time becomes constrained, prioritize one verified ticker path, core metrics, deterministic quality checks, one AI call, three report perspectives, and safe deployment. Authentication, persistence, extra metrics, and durable caching remain deferred.

## 12. CI order

1. Install from the lockfile.
2. Format check and lint.
3. TypeScript type-check.
4. Unit tests for schemas, normalization, metrics, quality, and AI validation.
5. Integration tests for provider, AI adapter, service, and Route Handler using fixtures.
6. Production build.
7. Dependency audit and secret scan.

Live provider tests are opt-in and never run for an ordinary pull request.

## 13. Environment contract

Required:

```text
BUSINESS_QUANT_API_KEY
GEMINI_API_KEY
GEMINI_MODEL_ID
```

Optional:

```text
ANALYSIS_OUTPUT_LANGUAGE=id
MARKET_DATA_TIMEOUT_MS
GEMINI_TIMEOUT_MS
GEMINI_MAX_OUTPUT_TOKENS
ANALYZE_MAX_DURATION_SECONDS
```

No server key may use a `NEXT_PUBLIC_` prefix. Tests inject fake configuration and never read real credentials.

## 14. Definition of done

- The runtime is Next.js and TypeScript only.
- Frontend and server-side analysis deploy as one Vercel project.
- `POST /api/analyze` completes synchronously.
- Market data is normalized and metrics are deterministic.
- Insufficient data stops before the model call.
- Normal success uses one explicitly configured model call.
- The final report has exactly three risk perspectives.
- Output schemas, evidence IDs, and metric ownership are enforced.
- Fixture-backed tests pass without network access.
- One controlled live analysis passes on Vercel.
- Secrets are absent from client bundles, responses, and logs.

## 15. Immediate next implementation slice

Implement only revised M0:

1. Create or confirm the Next.js TypeScript project at the workspace root.
2. Pin Node.js and package-manager versions.
3. Add strict scripts and test tooling.
4. Implement the new TypeScript domain contracts and schemas.
5. Add contract, profile, serialization, and hashing tests.
6. Replace obsolete milestone checklist names and create the revised M0 checklist.
7. Append one development-log entry only after implementation files change.

Do not implement Alpha Vantage, Gemini, or the Route Handler until the revised M0 gate passes.

## 16. Existing Python artifacts

The existing `.venv`, `backend/`, `tests/`, and prior Python M0 records document an abandoned architecture. They are not runtime dependencies and should not be copied into the Next.js application.

Removal or archival is a separate implementation decision because those files contain completed user work. Until explicitly approved, leave them in place and keep the new TypeScript code isolated from them.

## 17. Future extension path

Add persistence only when a real product requirement needs it:

- Supabase for authentication, saved analyses, and durable cache;
- a durable rate-limit store for public access;
- a queue only if synchronous Function duration becomes insufficient;
- additional data providers only behind the existing provider interface;
- additional AI stages only if measurable report quality justifies their latency and complexity.

These extensions must preserve canonical TypeScript metrics, evidence validation, and the public report contract.
